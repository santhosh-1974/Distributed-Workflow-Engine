import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { paymentHandler } from "./handlers/payment.handler.js";
import { ExecutionStatus, TaskStatus } from "@prisma/client";
import { updateExecution } from "../db/repositories/execution.repository.js";
import { updateTask } from "../db/repositories/task.repository.js";

export const paymentWorker = new Worker(
    QUEUE_NAMES.PAYMENT,
    async job => {
        return paymentHandler(job.data);
    },
    {
        connection: bullConnection
    }
);
paymentWorker.on("failed", async (job, error) => {
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

    console.log("Payment retries exhausted");
});