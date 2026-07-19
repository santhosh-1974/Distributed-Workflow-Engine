import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { invoiceHandler } from "./handlers/invoice.handler.js";

import { ExecutionStatus, TaskStatus } from "@prisma/client";
import { updateExecution } from "../db/repositories/execution.repository.js";
import { updateTask } from "../db/repositories/task.repository.js";

export const invoiceWorker = new Worker(
    QUEUE_NAMES.INVOICE,
    async job => {
        return invoiceHandler(job.data);
    },
    {
        connection: bullConnection
    }
);

invoiceWorker.on("failed", async (job, error) => {
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

    console.log("Invoice retries exhausted");
});