import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { invoiceHandler } from "./handlers/invoice.handler.js";

import { EventType, ExecutionStatus, TaskStatus } from "@prisma/client";
import { createEvent } from "../db/repositories/event.repository.js";
import { runSaga } from "../engine/saga.executors.js";
import { updateExecution } from "../db/repositories/execution.repository.js";
import { updateTask } from "../db/repositories/task.repository.js";
import { executeWorkflow } from "../engine/workflow.executor.js";

export const invoiceWorker = new Worker(
    QUEUE_NAMES.INVOICE,
    async job => {
        const { taskId, executionId } = job.data;

        await updateTask(taskId, {
            status: TaskStatus.RUNNING
        });
        await createEvent({
            execution: { connect: { id: executionId } },
            event: EventType.TASK_STARTED,
            metadata: { executionId, taskId, worker: "invoice" }
        });
        await invoiceHandler({
            executionId,
            attempt: job.attemptsMade + 1,
        });

        await updateTask(taskId, {
                status: TaskStatus.COMPLETED
            });
            await createEvent({
                execution: { connect: { id: executionId } },
                event: EventType.TASK_COMPLETED,
                metadata: { executionId, taskId, worker: "invoice" }
            });
            await updateExecution(executionId, {
                currentStep: {
                    increment: 1
                }
            });
            await executeWorkflow(executionId);
    },
    {
        connection: bullConnection
    }
);

invoiceWorker.on("failed", async (job, error) => {
    if (!job) return;

    console.error(error);

    if (job.attemptsMade < (job.opts.attempts ?? 1)) {
        await updateTask(job.data.taskId, { retryCount: job.attemptsMade });
        await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.TASK_RETRY, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "invoice", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1 } });
        return;
    }

    await updateTask(job.data.taskId, {
        status: TaskStatus.FAILED
    });
    await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.TASK_FAILED, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "invoice", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1, reason: "retries_exhausted" } });

    await updateExecution(job.data.executionId, {
        status: ExecutionStatus.FAILED
    });
    await createEvent({ execution: { connect: { id: job.data.executionId } }, event: EventType.EXECUTION_FAILED, metadata: { executionId: job.data.executionId, taskId: job.data.taskId, worker: "invoice", error: error.message, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1, reason: "task_retries_exhausted" } });
    await runSaga(job.data.executionId);

    console.log("Invoice retries exhausted");
});
