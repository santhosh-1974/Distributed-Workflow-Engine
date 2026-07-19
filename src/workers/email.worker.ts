import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { emailHandler } from "./handlers/email.handler.js";

import { ExecutionStatus, TaskStatus } from "@prisma/client";

import { updateExecution } from "../db/repositories/execution.repository.js";
import { updateTask } from "../db/repositories/task.repository.js";

export const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL,
    async job => {
        return emailHandler(job.data);
    },
    {
        connection: bullConnection
    }
);

emailWorker.on("failed", async (job, error) => {
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

    console.log("Email retries exhausted");
});