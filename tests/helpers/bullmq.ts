import { Queue } from "bullmq";

import { bullConnection } from "../../src/queues/bullmq.js";
import { QUEUE_NAMES } from "../../src/queues/queue.names.js";

const ORDER_QUEUE_NAMES = [
    QUEUE_NAMES.INVENTORY,
    QUEUE_NAMES.PAYMENT,
    QUEUE_NAMES.INVOICE,
    QUEUE_NAMES.EMAIL,
] as const;

export async function drainAllQueues(): Promise<void> {
    await Promise.all(
        ORDER_QUEUE_NAMES.map(async queueName => {
            const queue = new Queue(queueName, { connection: bullConnection });
            await queue.obliterate({ force: true });
            await queue.close();
        })
    );
}

export async function getQueueJobCount(queueName: string): Promise<number> {
    const queue = new Queue(queueName, { connection: bullConnection });
    const counts = await queue.getJobCounts(
        "active",
        "completed",
        "delayed",
        "failed",
        "paused",
        "prioritized",
        "wait",
        "waiting"
    );
    await queue.close();

    return Object.values(counts).reduce(
        (total, count) => total + (count ?? 0),
        0
    );
}

export async function getTaskQueueJobCount(
    worker: string,
    taskId: string
): Promise<number> {
    const queue = new Queue(worker, { connection: bullConnection });
    const jobs = await queue.getJobs(["active", "completed", "delayed", "failed", "wait", "waiting"]);
    const matchingJobs = jobs.filter(job => job.data.taskId === taskId);
    await queue.close();

    return matchingJobs.length;
}

export async function pauseAllQueues(): Promise<void> {
    await Promise.all(
        ORDER_QUEUE_NAMES.map(async queueName => {
            const queue = new Queue(queueName, { connection: bullConnection });
            await queue.pause();
            await queue.close();
        })
    );
}

export async function resumeAllQueues(): Promise<void> {
    await Promise.all(
        ORDER_QUEUE_NAMES.map(async queueName => {
            const queue = new Queue(queueName, { connection: bullConnection });
            await queue.resume();
            await queue.close();
        })
    );
}

export { ORDER_QUEUE_NAMES };
