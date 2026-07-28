import { describe, expect, it } from "vitest";
import { ExecutionStatus, TaskStatus } from "@prisma/client";

import {
    waitForExecutionStatus,
    waitForTaskStatus,
} from "../helpers/index.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { recoverExecutions } from "../../src/engine/recovery.manager.js";
import { startWorkflow } from "../../src/services/workflow.service.js";
import {
    ALL_CRASH_POINTS,
    armCrashAt,
    assertDatabaseConsistency,
    assertUniqueTaskPerStep,
    installCrashHooks,
    SimulatedCrashError,
} from "./helpers/index.js";

describe("Reliability / Crash Recovery", () => {
    for (const crashPoint of ALL_CRASH_POINTS) {
        it(`recovers correctly after simulated crash at ${crashPoint}`, async () => {
            installCrashHooks();
            armCrashAt(crashPoint);

            const execution = await startWorkflow("order");

            try {
                await executeWorkflow(execution.id);
            } catch (error) {
                expect(error).toBeInstanceOf(SimulatedCrashError);
            }

            await recoverExecutions();
            await executeWorkflow(execution.id);

            await waitForExecutionStatus(execution.id, ExecutionStatus.COMPLETED, {
                timeoutMs: 120_000,
            });

            await assertUniqueTaskPerStep(execution.id);
            await assertDatabaseConsistency(execution.id);
        });
    }

    it("recovers after crash during worker execution", async () => {
        installCrashHooks();

        const execution = await startWorkflow("order");
        await executeWorkflow(execution.id);

        armCrashAt("after_worker_starts");

        try {
            await waitForTaskStatus(execution.id, "inventory", TaskStatus.COMPLETED, {
                timeoutMs: 30_000,
            });
        } catch {
            await recoverExecutions();
            await executeWorkflow(execution.id);
        }

        await waitForExecutionStatus(execution.id, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });
    });
});
