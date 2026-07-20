
import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { inventoryHandler } from "./handlers/inventory.handler.js";
import { EventType, ExecutionStatus, TaskStatus } from "@prisma/client";
import { createEvent } from "../db/repositories/event.repository.js";
import { runSaga } from "../engine/saga.executors.js";

import { updateExecution } from "../db/repositories/execution.repository.js";
import { updateTask } from "../db/repositories/task.repository.js";


export const inventoryWorker = new Worker(
    QUEUE_NAMES.INVENTORY,
    async job => {
        console.log(`Inventory Worker received ${job.id}`);
        return inventoryHandler(job.data);
    },
    {
        connection: bullConnection
    }
);

inventoryWorker.on("failed", async (job, error) => {
    if (!job) return;
    console.error(error);
    if (job.attemptsMade < (job.opts.attempts ?? 1)) {
        await updateTask(job.data.taskId, { retryCount: job.attemptsMade });
        await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.TASK_RETRY, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "inventory", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1 } });
        return;
    }
    await updateTask(job.data.taskId, {
        status: TaskStatus.FAILED
    });
    await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.TASK_FAILED, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "inventory", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1, reason: "retries_exhausted" } });
    await updateExecution(job.data.executionId, {
        status: ExecutionStatus.FAILED
    });
    await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.EXECUTION_FAILED, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "inventory", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1, reason: "task_retries_exhausted" } });
    await runSaga(job.data.executionId);
    console.log("Inventory retries exhausted");
});
