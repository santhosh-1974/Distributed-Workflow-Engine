import Redis from "ioredis";

import { config } from "../../src/config/env.js";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            maxRetriesPerRequest: null,
        });
    }

    return redisClient;
}

export async function flushRedis(): Promise<void> {
    const client = getRedisClient();
    await client.flushdb();
}

export async function disconnectRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}

export async function pauseRedis(): Promise<void> {
    if (redisClient) {
        redisClient.disconnect(false);
    }
}

export async function resumeRedis(): Promise<void> {
    const client = getRedisClient();

    if (client.status === "end" || client.status === "close") {
        redisClient = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            maxRetriesPerRequest: null,
        });
        return;
    }

    if (client.status !== "ready") {
        await new Promise<void>((resolve, reject) => {
            client.once("ready", () => resolve());
            client.once("error", reject);
        });
    }
}
