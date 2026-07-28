import { EventType, ExecutionStatus } from "@prisma/client";

import { db } from "../../helpers/database.js";

const SUCCESS_EVENT_SEQUENCE = [
    EventType.EXECUTION_CREATED,
    EventType.EXECUTION_STARTED,
] as const;

const FAILURE_EVENT_TERMINATORS = [
    EventType.EXECUTION_FAILED,
    EventType.EXECUTION_COMPLETED,
] as const;

export async function assertEventsAreOrdered(executionId: string): Promise<void> {
    const events = await db.event.findMany({
        where: { executionId },
        orderBy: { timestamp: "asc" },
    });

    for (let index = 1; index < events.length; index += 1) {
        expect(events[index]!.timestamp.getTime()).toBeGreaterThanOrEqual(
            events[index - 1]!.timestamp.getTime()
        );
    }
}

export async function assertEventTimestampsIncrease(
    executionId: string
): Promise<void> {
    await assertEventsAreOrdered(executionId);
}

export async function assertRequiredLifecycleEvents(
    executionId: string
): Promise<void> {
    const events = await db.event.findMany({
        where: { executionId },
        orderBy: { timestamp: "asc" },
    });

    const eventTypes = events.map(event => event.event);

    for (const requiredEvent of SUCCESS_EVENT_SEQUENCE) {
        expect(eventTypes).toContain(requiredEvent);
    }

    expect(eventTypes).toContain(EventType.TASK_CREATED);

    const hasTerminalEvent = FAILURE_EVENT_TERMINATORS.some(eventType =>
        eventTypes.includes(eventType)
    );
    expect(hasTerminalEvent).toBe(true);

    const execution = await db.execution.findUnique({
        where: { id: executionId },
    });

    if (execution?.status === ExecutionStatus.COMPLETED) {
        expect(eventTypes).toContain(EventType.EXECUTION_COMPLETED);

        const taskStartedEvents = events.filter(
            event => event.event === EventType.TASK_STARTED
        );
        const taskCompletedEvents = events.filter(
            event => event.event === EventType.TASK_COMPLETED
        );

        expect(taskStartedEvents.length).toBeGreaterThan(0);
        expect(taskCompletedEvents.length).toBe(taskStartedEvents.length);
    }

    if (execution?.status === ExecutionStatus.FAILED) {
        expect(eventTypes).toContain(EventType.EXECUTION_FAILED);
    }
}

export async function assertNoMissingEvents(executionId: string): Promise<void> {
    const events = await db.event.findMany({
        where: { executionId },
    });

    expect(events.length).toBeGreaterThan(0);

    for (const event of events) {
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.metadata).toBeTruthy();
    }
}

export async function assertTaskRetryEvents(
    executionId: string,
    expectedCount: number
): Promise<void> {
    const retryEvents = await db.event.findMany({
        where: {
            executionId,
            event: EventType.TASK_RETRY,
        },
        orderBy: { timestamp: "asc" },
    });

    expect(retryEvents).toHaveLength(expectedCount);
}

export async function assertRetryEventMetadata(executionId: string): Promise<void> {
    const retryEvents = await db.event.findMany({
        where: {
            executionId,
            event: EventType.TASK_RETRY,
        },
    });

    for (const event of retryEvents) {
        const metadata = event.metadata as Record<string, unknown>;
        expect(metadata).toHaveProperty("attemptsMade");
        expect(metadata).toHaveProperty("error");
        expect(metadata.timestamp ?? event.timestamp).toBeTruthy();
    }
}

export async function getEventsByType(
    executionId: string,
    eventType: EventType
) {
    return db.event.findMany({
        where: { executionId, event: eventType },
        orderBy: { timestamp: "asc" },
    });
}
