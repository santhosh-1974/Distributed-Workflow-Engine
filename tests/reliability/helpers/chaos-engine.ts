import { EventType, ExecutionStatus } from "@prisma/client";

import { db } from "../../helpers/database.js";
import {
    failWorkerAlways,
    type WorkerName,
} from "./failure-injector.js";
import { pauseRedis, resumeRedis } from "../../helpers/redis.js";
import { pauseAllQueues, resumeAllQueues } from "../../helpers/bullmq.js";
import { stopWorker, startWorker } from "../../helpers/workers.js";

export type ChaosConfig = {
    failureRate: number;
    redisDisconnectRate: number;
    postgresFailureRate: number;
    queueFailureRate: number;
    workerCrashRate: number;
};

export type ChaosAction =
    | { type: "fail_worker"; worker: WorkerName }
    | { type: "redis_disconnect" }
    | { type: "queue_pause" }
    | { type: "worker_crash"; worker: WorkerName }
    | { type: "none" };

export function createChaosEngine(config: ChaosConfig) {
    return {
        maybeInjectFailure(executionId: string): Promise<ChaosAction> {
            const roll = Math.random();

            if (roll < config.failureRate) {
                const workers: WorkerName[] = [
                    "inventory",
                    "payment",
                    "invoice",
                    "email",
                ];
                const worker = workers[Math.floor(Math.random() * workers.length)]!;
                return failWorkerAlways(worker, executionId).then(() => ({
                    type: "fail_worker" as const,
                    worker,
                }));
            }

            if (roll < config.failureRate + config.redisDisconnectRate) {
                return pauseRedis().then(() => ({
                    type: "redis_disconnect" as const,
                }));
            }

            if (
                roll <
                config.failureRate +
                    config.redisDisconnectRate +
                    config.queueFailureRate
            ) {
                return pauseAllQueues().then(() => ({
                    type: "queue_pause" as const,
                }));
            }

            if (
                roll <
                config.failureRate +
                    config.redisDisconnectRate +
                    config.queueFailureRate +
                    config.workerCrashRate
            ) {
                const workers: WorkerName[] = [
                    "inventory",
                    "payment",
                    "invoice",
                    "email",
                ];
                const worker = workers[Math.floor(Math.random() * workers.length)]!;
                return stopWorker(worker).then(() => ({
                    type: "worker_crash" as const,
                    worker,
                }));
            }

            return Promise.resolve({ type: "none" });
        },

        async recoverFromAction(action: ChaosAction): Promise<void> {
            switch (action.type) {
                case "redis_disconnect":
                    await resumeRedis();
                    break;
                case "queue_pause":
                    await resumeAllQueues();
                    break;
                case "worker_crash":
                    await startWorker(action.worker);
                    break;
                default:
                    break;
            }
        },
    };
}

export async function assertNoCorruptedExecutions(): Promise<void> {
    const executions = await db.execution.findMany({
        include: { tasks: true, events: true },
    });

    for (const execution of executions) {
        const taskStatuses = execution.tasks.map(task => task.status);
        const hasRunningTask = taskStatuses.includes("RUNNING");
        const hasQueuedTask = taskStatuses.includes("QUEUED");
        const hasPendingTask = taskStatuses.includes("PENDING");

        if (execution.status === ExecutionStatus.COMPLETED) {
            const incompleteTasks = execution.tasks.filter(
                task => task.status !== "COMPLETED"
            );
            expect(incompleteTasks).toHaveLength(0);
        }

        if (execution.status === ExecutionStatus.FAILED) {
            const failedEvents = execution.events.filter(
                event =>
                    event.event === EventType.EXECUTION_FAILED ||
                    event.event === EventType.TASK_FAILED
            );
            expect(failedEvents.length).toBeGreaterThan(0);
        }

        if (
            execution.status === ExecutionStatus.RUNNING &&
            !hasRunningTask &&
            !hasQueuedTask &&
            !hasPendingTask
        ) {
            throw new Error(
                `Execution ${execution.id} is RUNNING without active tasks`
            );
        }
    }
}

export async function assertNoDuplicateTasks(): Promise<void> {
    const duplicates = await db.$queryRaw<Array<{ executionId: string; stepName: string; count: bigint }>>`
        SELECT "executionId", "stepName", COUNT(*) as count
        FROM tasks
        GROUP BY "executionId", "stepName"
        HAVING COUNT(*) > 1
    `;

    expect(duplicates).toHaveLength(0);
}

export async function assertNoInfiniteRetries(maxRetryCount = 3): Promise<void> {
    const tasks = await db.task.findMany({
        where: {
            retryCount: {
                gt: maxRetryCount,
            },
        },
    });

    expect(tasks).toHaveLength(0);
}
