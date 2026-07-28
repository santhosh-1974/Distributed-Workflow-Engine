import { ExecutionStatus, TaskStatus } from "@prisma/client";

import { db } from "./database.js";

type PollOptions = {
    timeoutMs?: number;
    intervalMs?: number;
};

export async function waitForCondition(
    predicate: () => Promise<boolean>,
    options: PollOptions = {}
): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 60_000;
    const intervalMs = options.intervalMs ?? 100;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (await predicate()) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error("Timed out waiting for condition");
}

export async function waitForExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const execution = await db.execution.findUnique({
            where: { id: executionId },
        });

        return execution?.status === status;
    }, options);
}

export async function waitForTaskStatus(
    executionId: string,
    stepName: string,
    status: TaskStatus,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const task = await db.task.findFirst({
            where: { executionId, stepName },
            orderBy: { createdAt: "desc" },
        });

        return task?.status === status;
    }, options);
}

export async function waitForTaskCount(
    executionId: string,
    expectedCount: number,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const count = await db.task.count({ where: { executionId } });
        return count === expectedCount;
    }, options);
}

export async function waitForEventType(
    executionId: string,
    eventType: string,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const event = await db.event.findFirst({
            where: { executionId, event: eventType as never },
        });

        return event !== null;
    }, options);
}

export async function waitForRetryCount(
    executionId: string,
    stepName: string,
    retryCount: number,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const task = await db.task.findFirst({
            where: { executionId, stepName },
            orderBy: { createdAt: "desc" },
        });

        return task?.retryCount === retryCount;
    }, options);
}

export async function waitForMinimumEventCount(
    executionId: string,
    minimumCount: number,
    options?: PollOptions
): Promise<void> {
    await waitForCondition(async () => {
        const count = await db.event.count({ where: { executionId } });
        return count >= minimumCount;
    }, options);
}
