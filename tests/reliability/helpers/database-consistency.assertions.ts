import { EventType, ExecutionStatus, TaskStatus } from "@prisma/client";

import { db } from "../../helpers/database.js";

export async function assertExecutionStateMatchesTasks(
    executionId: string
): Promise<void> {
    const execution = await db.execution.findUnique({
        where: { id: executionId },
        include: {
            tasks: { orderBy: { createdAt: "asc" } },
        },
    });

    expect(execution).not.toBeNull();

    if (execution!.status === ExecutionStatus.COMPLETED) {
        expect(execution!.tasks.every(task => task.status === TaskStatus.COMPLETED)).toBe(
            true
        );
    }

    if (execution!.status === ExecutionStatus.FAILED) {
        expect(
            execution!.tasks.some(task => task.status === TaskStatus.FAILED)
        ).toBe(true);
    }
}

export async function assertNoOrphanTasks(): Promise<void> {
    const orphanTasks = await db.$queryRaw<Array<{ id: string }>>`
        SELECT t.id
        FROM tasks t
        LEFT JOIN executions e ON e.id = t."executionId"
        WHERE e.id IS NULL
    `;

    expect(orphanTasks).toHaveLength(0);
}

export async function assertNoOrphanEvents(): Promise<void> {
    const orphanEvents = await db.$queryRaw<Array<{ id: string }>>`
        SELECT ev.id
        FROM events ev
        LEFT JOIN executions e ON e.id = ev."executionId"
        WHERE e.id IS NULL
    `;

    expect(orphanEvents).toHaveLength(0);
}

export async function assertCompletedTasksBelongToExecution(
    executionId: string
): Promise<void> {
    const tasks = await db.task.findMany({
        where: {
            executionId,
            status: TaskStatus.COMPLETED,
        },
    });

    for (const task of tasks) {
        expect(task.executionId).toBe(executionId);
    }
}

export async function assertDatabaseConsistency(
    executionId?: string
): Promise<void> {
    await assertNoOrphanTasks();
    await assertNoOrphanEvents();

    if (executionId) {
        await assertExecutionStateMatchesTasks(executionId);
        await assertCompletedTasksBelongToExecution(executionId);
    }
}

export async function assertUniqueTaskPerStep(
    executionId: string
): Promise<void> {
    const tasks = await db.task.findMany({ where: { executionId } });
    const stepNames = tasks.map(task => task.stepName);
    const uniqueSteps = new Set(stepNames);

    expect(uniqueSteps.size).toBe(stepNames.length);
}

export async function assertSingleActiveTask(
    executionId: string
): Promise<void> {
    const activeTasks = await db.task.findMany({
        where: {
            executionId,
            status: {
                in: [
                    TaskStatus.PENDING,
                    TaskStatus.QUEUED,
                    TaskStatus.RUNNING,
                ],
            },
        },
    });

    expect(activeTasks.length).toBeLessThanOrEqual(1);
}

export async function getExecutionSnapshot(executionId: string) {
    return db.execution.findUnique({
        where: { id: executionId },
        include: {
            tasks: { orderBy: { createdAt: "asc" } },
            events: { orderBy: { timestamp: "asc" } },
            workflow: true,
        },
    });
}

export async function assertEventExists(
    executionId: string,
    eventType: EventType
): Promise<void> {
    const event = await db.event.findFirst({
        where: { executionId, event: eventType },
    });

    expect(event).not.toBeNull();
}

export async function assertEventMetadataContains(
    executionId: string,
    eventType: EventType,
    keys: string[]
): Promise<void> {
    const event = await db.event.findFirst({
        where: { executionId, event: eventType },
        orderBy: { timestamp: "desc" },
    });

    expect(event).not.toBeNull();

    const metadata = event!.metadata as Record<string, unknown>;

    for (const key of keys) {
        expect(metadata).toHaveProperty(key);
    }
}

export async function assertCompensationOrder(
    executionId: string,
    expectedOrder: string[]
): Promise<void> {
    const events = await db.event.findMany({
        where: {
            executionId,
            event: EventType.COMPENSATION_STARTED,
        },
        orderBy: { timestamp: "asc" },
    });

    const compensations = events.map(event => {
        const metadata = event.metadata as Record<string, unknown>;
        return metadata.compensation as string;
    });

    expect(compensations).toEqual(expectedOrder);
}

export async function assertCompensationExecutedOnce(
    executionId: string,
    compensation: string
): Promise<void> {
    const events = await db.event.findMany({
        where: {
            executionId,
            event: EventType.COMPENSATION_STARTED,
        },
    });

    const matching = events.filter(event => {
        const metadata = event.metadata as Record<string, unknown>;
        return metadata.compensation === compensation;
    });

    expect(matching).toHaveLength(1);
}
