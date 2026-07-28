import Redis from "ioredis";

import { config } from "../config/env.js";

export type HandlerContext = {
    executionId: string;
    attempt: number;
};

export type FailureMode =
    | { type: "until_attempt"; untilAttempt: number }
    | { type: "always" }
    | { type: "never" };

let client: Redis | null = null;

function getClient(): Redis {
    if (!client) {
        client = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            maxRetriesPerRequest: null,
        });
    }

    return client;
}

export function failureKey(worker: string, executionId: string): string {
    return `test:fail:${worker}:${executionId}`;
}

export async function setFailureMode(
    worker: string,
    executionId: string,
    mode: FailureMode
): Promise<void> {
    await getClient().set(failureKey(worker, executionId), JSON.stringify(mode));
}

export async function clearFailureMode(
    worker: string,
    executionId: string
): Promise<void> {
    await getClient().del(failureKey(worker, executionId));
}

export async function clearAllFailureModes(): Promise<void> {
    const keys = await getClient().keys("test:fail:*");

    if (keys.length > 0) {
        await getClient().del(...keys);
    }
}

export async function assertShouldSucceed(
    worker: string,
    context: HandlerContext
): Promise<void> {
    if (process.env.NODE_ENV !== "test") {
        return;
    }

    const raw = await getClient().get(failureKey(worker, context.executionId));

    if (!raw) {
        return;
    }

    const mode = JSON.parse(raw) as FailureMode;

    if (mode.type === "never") {
        return;
    }

    if (mode.type === "always") {
        throw new Error(`Simulated ${worker} failure (always)`);
    }

    if (mode.type === "until_attempt" && context.attempt < mode.untilAttempt) {
        throw new Error(
            `Simulated ${worker} failure on attempt ${context.attempt}`
        );
    }
}

export async function simulateWork(defaultMs = 2000): Promise<void> {
    const delay = process.env.TEST_FAST_MODE === "true" ? 10 : defaultMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}

export async function disconnectFailureControl(): Promise<void> {
    if (client) {
        await client.quit();
        client = null;
    }
}
