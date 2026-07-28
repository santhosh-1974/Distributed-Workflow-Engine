import { describe, expect, it } from "vitest";
import {
    EventType,
    ExecutionStatus,
    TaskStatus,
} from "@prisma/client";

import {
    createOrderExecution,
    db,
    waitForEventType,
    waitForExecutionStatus,
    waitForRetryCount,
    waitForTaskStatus,
} from "../helpers/index.js";
import {
    assertDatabaseConsistency,
    assertEventMetadataContains,
    assertRequiredLifecycleEvents,
    assertRetryEventMetadata,
    assertTaskRetryEvents,
    failWorkerAlways,
    failWorkerUntilAttempt,
    getEventsByType,
} from "./helpers/index.js";

describe("Reliability / Retry", () => {
    it("completes workflow when payment fails twice then succeeds on third attempt", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerUntilAttempt("payment", executionId, 3);

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        const paymentTask = await db.task.findFirst({
            where: { executionId, stepName: "payment" },
        });

        expect(paymentTask?.retryCount).toBe(2);
        expect(paymentTask?.status).toBe(TaskStatus.COMPLETED);

        await waitForTaskStatus(executionId, "invoice", TaskStatus.COMPLETED);
        await waitForTaskStatus(executionId, "email", TaskStatus.COMPLETED);

        await assertTaskRetryEvents(executionId, 2);
        await assertRequiredLifecycleEvents(executionId);
        await assertDatabaseConsistency(executionId);
    });

    it("marks execution failed and starts saga when payment fails permanently", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerAlways("payment", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        const paymentTask = await db.task.findFirst({
            where: { executionId, stepName: "payment" },
        });

        expect(paymentTask?.status).toBe(TaskStatus.FAILED);
        expect(paymentTask?.retryCount).toBe(2);

        await waitForEventType(executionId, EventType.SAGA_STARTED);
        await waitForEventType(executionId, EventType.COMPENSATION_STARTED);

        const retryEvents = await getEventsByType(
            executionId,
            EventType.TASK_RETRY
        );
        expect(retryEvents).toHaveLength(2);

        await assertDatabaseConsistency(executionId);
    });

    it("uses increasing exponential backoff between payment retries", async () => {
        process.env.TEST_FAST_MODE = "false";

        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerUntilAttempt("payment", executionId, 3);

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 120_000,
        });

        const retryEvents = await getEventsByType(
            executionId,
            EventType.TASK_RETRY
        );

        expect(retryEvents).toHaveLength(2);

        const firstDelay =
            retryEvents[1]!.timestamp.getTime() -
            retryEvents[0]!.timestamp.getTime();
        const paymentStarted = await db.event.findFirst({
            where: {
                executionId,
                event: EventType.TASK_STARTED,
            },
            orderBy: { timestamp: "desc" },
        });
        const secondDelay =
            paymentStarted!.timestamp.getTime() -
            retryEvents[1]!.timestamp.getTime();

        expect(firstDelay).toBeGreaterThanOrEqual(1500);
        expect(secondDelay).toBeGreaterThan(firstDelay);

        process.env.TEST_FAST_MODE = "true";
    });

    it("continues payment retries after worker restart", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerUntilAttempt("payment", executionId, 3);

        await waitForRetryCount(executionId, "payment", 1);

        const { stopWorker, startWorker } = await import("../helpers/workers.js");
        await stopWorker("payment");
        await startWorker("payment");

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        const paymentTask = await db.task.findFirst({
            where: { executionId, stepName: "payment" },
        });

        expect(paymentTask?.status).toBe(TaskStatus.COMPLETED);
        await assertDatabaseConsistency(executionId);
    });

    it("records TASK_RETRY metadata with attempt, error, and timestamp", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerUntilAttempt("payment", executionId, 3);

        await waitForEventType(executionId, EventType.TASK_RETRY);

        await assertEventMetadataContains(executionId, EventType.TASK_RETRY, [
            "attemptsMade",
            "error",
        ]);
        await assertRetryEventMetadata(executionId);
    });
});
