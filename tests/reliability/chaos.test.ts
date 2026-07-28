import { describe, expect, it } from "vitest";
import { ExecutionStatus } from "@prisma/client";

import {
    createOrderExecution,
    db,
    waitForExecutionStatus,
} from "../helpers/index.js";
import { recoverExecutions } from "../../src/engine/recovery.manager.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { startWorkflow } from "../../src/services/workflow.service.js";
import {
    assertDatabaseConsistency,
    assertEventTimestampsIncrease,
    assertNoCorruptedExecutions,
    assertNoDuplicateTasks,
    assertNoInfiniteRetries,
    assertNoMissingEvents,
    assertRequiredLifecycleEvents,
    createChaosEngine,
    failWorkerUntilAttempt,
} from "./helpers/index.js";

describe("Reliability / Chaos", () => {
    it("completes one hundred workflows under random injected failures", async () => {
        const chaos = createChaosEngine({
            failureRate: 0.1,
            redisDisconnectRate: 0.02,
            postgresFailureRate: 0,
            queueFailureRate: 0.02,
            workerCrashRate: 0.02,
        });

        const executionIds: string[] = [];

        for (let index = 0; index < 100; index += 1) {
            const executionId = await createOrderExecution();
            executionIds.push(executionId);

            if (Math.random() < 0.1) {
                await failWorkerUntilAttempt(
                    "payment",
                    executionId,
                    Math.random() > 0.5 ? 2 : 3
                );
            }

            const action = await chaos.maybeInjectFailure(executionId);
            await chaos.recoverFromAction(action);
        }

        await recoverExecutions();

        await Promise.all(
            executionIds.map(executionId =>
                waitForExecutionStatus(
                    executionId,
                    ExecutionStatus.COMPLETED,
                    { timeoutMs: 180_000 }
                ).catch(async () => {
                    const execution = await db.execution.findUnique({
                        where: { id: executionId },
                    });

                    if (execution?.status === ExecutionStatus.FAILED) {
                        return;
                    }

                    throw new Error(
                        `Execution ${executionId} did not reach terminal state`
                    );
                })
            )
        );

        await assertNoCorruptedExecutions();
        await assertNoDuplicateTasks();
        await assertNoInfiniteRetries();
        await assertDatabaseConsistency();
    });
});

describe("Reliability / Concurrency", () => {
    it("maintains database consistency for one hundred concurrent workflows with random payment retries", async () => {
        const executionIds = await Promise.all(
            Array.from({ length: 100 }, async (_, index) => {
                const executionId = await createOrderExecution();

                if (index % 3 === 0) {
                    await failWorkerUntilAttempt("payment", executionId, 2);
                }

                return executionId;
            })
        );

        await Promise.all(
            executionIds.map(executionId =>
                waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
                    timeoutMs: 180_000,
                })
            )
        );

        await assertNoDuplicateTasks();
        await assertDatabaseConsistency();

        const completedCount = await db.execution.count({
            where: {
                id: { in: executionIds },
                status: ExecutionStatus.COMPLETED,
            },
        });

        expect(completedCount).toBe(100);
    });
});

describe("Reliability / Event Store", () => {
    it("preserves ordered timestamps and required lifecycle events for completed workflows", async () => {
        const executionId = await createOrderExecution();

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertEventTimestampsIncrease(executionId);
        await assertRequiredLifecycleEvents(executionId);
        await assertNoMissingEvents(executionId);
    });

    it("records failure lifecycle events for permanently failing workflows", async () => {
        const execution = await startWorkflow("order");
        await executeWorkflow(execution.id);

        const { failWorkerAlways } = await import("./helpers/failure-injector.js");
        await failWorkerAlways("payment", execution.id);

        await waitForExecutionStatus(execution.id, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertRequiredLifecycleEvents(execution.id);
        await assertNoMissingEvents(execution.id);
    });
});

describe("Reliability / Database Consistency", () => {
    it("maintains referential integrity after successful workflow completion", async () => {
        const executionId = await createOrderExecution();

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertDatabaseConsistency(executionId);
    });

    it("maintains referential integrity after saga failure", async () => {
        const executionId = await createOrderExecution();
        const { failWorkerAlways } = await import("./helpers/failure-injector.js");

        const { waitForTaskStatus } = await import("../helpers/polling.js");
        const { TaskStatus } = await import("@prisma/client");

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerAlways("payment", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertDatabaseConsistency(executionId);
    });
});
