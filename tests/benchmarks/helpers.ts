import { performance } from "node:perf_hooks";
import { Queue } from "bullmq";

import { db } from "../../src/db/prisma.js";
import { bullConnection } from "../../src/queues/bullmq.js";
import { QUEUE_NAMES } from "../../src/queues/queue.names.js";

export type BenchmarkResult = { name: string; durationMs: number };

export async function measure<T>(name: string, operation: () => Promise<T>): Promise<{ result: T; metric: BenchmarkResult }> {
    const startedAt = performance.now();
    const result = await operation();
    return { result, metric: { name, durationMs: Number((performance.now() - startedAt).toFixed(2)) } };
}

export function printResults(results: BenchmarkResult[]): void {
    console.table(results.map(result => ({ metric: result.name, milliseconds: result.durationMs })));
}

export async function measureDatabaseQuery(): Promise<BenchmarkResult> {
    return (await measure("database query duration", () => db.execution.findMany({ take: 10, orderBy: { createdAt: "desc" } }))).metric;
}

export async function measureRedisLatency(): Promise<BenchmarkResult> {
    const Redis = (await import("ioredis")).default;
    const client = new Redis(bullConnection);
    try {
        return (await measure("redis ping latency", () => client.ping())).metric;
    } finally {
        await client.quit();
    }
}

export async function measureQueueLatency(): Promise<BenchmarkResult[]> {
    const queue = new Queue(QUEUE_NAMES.INVENTORY, { connection: bullConnection });
    const jobId = `benchmark-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
        const enqueue = await measure("bullmq enqueue latency", () => queue.add("benchmark", { benchmark: true }, { jobId, removeOnComplete: true, removeOnFail: true }));
        const dequeue = await measure("bullmq dequeue lookup latency", () => queue.getJob(jobId));
        return [enqueue.metric, dequeue.metric];
    } finally {
        await queue.close();
    }
}
