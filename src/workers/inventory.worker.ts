
import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { inventoryHandler } from "./handlers/inventory.handler.js";
import { ExecutionStatus, TaskStatus } from "@prisma/client";

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
        return;
    }
    await updateTask(job.data.taskId, {
        status: TaskStatus.FAILED
    });
    await updateExecution(job.data.executionId, {
        status: ExecutionStatus.FAILED
    });
    console.log("Inventory retries exhausted");
});