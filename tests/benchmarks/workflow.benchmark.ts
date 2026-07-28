import { performance } from "node:perf_hooks";

import { connectDatabase, db } from "../../src/db/prisma.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { startWorkflow } from "../../src/services/workflow.service.js";
import { waitForExecutionStatus } from "../helpers/polling.js";
import { measure, measureDatabaseQuery, measureQueueLatency, measureRedisLatency, printResults } from "./helpers.js";

async function main(): Promise<void> {
    await connectDatabase();
    const results = [];
    const created = await measure("workflow creation duration", () => startWorkflow(process.env.BENCHMARK_WORKFLOW_ID ?? "order"));
    results.push(created.metric);

    const workflowStart = performance.now();
    const dispatched = await measure("workflow dispatch duration", () => executeWorkflow(created.result.id));
    results.push(dispatched.metric);
    await waitForExecutionStatus(created.result.id, "COMPLETED", { timeoutMs: 60_000, intervalMs: 100 });
    results.push({ name: "workflow duration", durationMs: Number((performance.now() - workflowStart).toFixed(2)) });

    const tasks = await db.task.findMany({ where: { executionId: created.result.id }, orderBy: { createdAt: "asc" } });
    for (const task of tasks) {
        if (task.startedAt && task.completedAt) {
            results.push({ name: `step duration (${task.stepName})`, durationMs: task.completedAt.getTime() - task.startedAt.getTime() });
            results.push({ name: `queue latency (${task.stepName})`, durationMs: task.startedAt.getTime() - task.createdAt.getTime() });
            results.push({ name: `worker processing time (${task.stepName})`, durationMs: task.completedAt.getTime() - task.startedAt.getTime() });
        }
    }

    results.push(await measureDatabaseQuery(), await measureRedisLatency(), ...(await measureQueueLatency()));
    printResults(results);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
}).finally(async () => {
    await db.$disconnect();
});
