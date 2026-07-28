import { describe, expect, it } from "vitest";
import {
    ExecutionStatus,
    TaskStatus,
} from "@prisma/client";

import {
    createOrderExecution,
    db,
    executeWorkflowViaApi,
    startOrderWorkflowViaApi,
    waitForExecutionStatus,
    waitForTaskCount,
    waitForTaskStatus,
} from "../helpers/index.js";
import { recoverExecutions } from "../../src/engine/recovery.manager.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { startWorkflow } from "../../src/services/workflow.service.js";
import {
    assertDatabaseConsistency,
    assertSingleActiveTask,
    assertUniqueTaskPerStep,
    getExecutionSnapshot,
} from "./helpers/index.js";

describe("Reliability / Recovery", () => {
    it("resumes workflow after crash immediately after execution creation", async () => {
        const execution = await startWorkflow("order");

        await recoverExecutions();
        await executeWorkflow(execution.id);

        await waitForExecutionStatus(execution.id, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertUniqueTaskPerStep(execution.id);
        await assertDatabaseConsistency(execution.id);
    });

    it("resumes workflow from payment after crash following inventory completion", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);

        const { stopWorkers } = await import("../helpers/workers.js");
        await stopWorkers();

        await recoverExecutions();
        const { startWorkers } = await import("../helpers/workers.js");
        await startWorkers();
        await executeWorkflow(executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        const snapshot = await getExecutionSnapshot(executionId);
        expect(snapshot?.tasks.map(task => task.stepName)).toEqual([
            "inventory",
            "payment",
            "invoice",
            "email",
        ]);
    });

    it("resumes workflow from invoice after payment completion crash", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "payment", TaskStatus.COMPLETED);

        const { stopWorkers } = await import("../helpers/workers.js");
        await stopWorkers();

        await executeWorkflow(executionId);
        await recoverExecutions();

        const { startWorkers } = await import("../helpers/workers.js");
        await startWorkers();

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertDatabaseConsistency(executionId);
    });

    it("resumes email dispatch after crash before email dispatch", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "invoice", TaskStatus.COMPLETED);

        const { stopWorkers } = await import("../helpers/workers.js");
        await stopWorkers();

        await executeWorkflow(executionId);
        await recoverExecutions();

        const { startWorkers } = await import("../helpers/workers.js");
        await startWorkers();

        await waitForTaskStatus(executionId, "email", TaskStatus.COMPLETED);
        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });
    });

    it("dispatches pending task after crash between task creation and dispatch", async () => {
        const execution = await startWorkflow("order");
        await executeWorkflow(execution.id);

        await waitForTaskCount(execution.id, 1);

        const task = await db.task.findFirst({
            where: { executionId: execution.id },
        });

        await db.task.update({
            where: { id: task!.id },
            data: { status: TaskStatus.PENDING },
        });

        await recoverExecutions();

        await waitForTaskStatus(execution.id, "inventory", TaskStatus.COMPLETED, {
            timeoutMs: 90_000,
        });
    });

    it("recovers stalled running task after worker crash", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.RUNNING);

        const { stopWorker, startWorker } = await import("../helpers/workers.js");
        await stopWorker("inventory");
        await startWorker("inventory");

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertDatabaseConsistency(executionId);
    });

    it("continues all running workflows after restart with fifty executions", async () => {
        const executionIds = await Promise.all(
            Array.from({ length: 50 }, () => createOrderExecution())
        );

        const { stopWorkers, startWorkers } = await import("../helpers/workers.js");
        await stopWorkers();
        await recoverExecutions();
        await startWorkers();

        await Promise.all(
            executionIds.map(executionId =>
                waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
                    timeoutMs: 180_000,
                })
            )
        );

        const completedCount = await db.execution.count({
            where: {
                id: { in: executionIds },
                status: ExecutionStatus.COMPLETED,
            },
        });

        expect(completedCount).toBe(50);
    });
});

describe("Reliability / Idempotency", () => {
    it("creates a single task path when executeWorkflow is called twenty times concurrently", async () => {
        const execution = await startWorkflow("order");

        await Promise.all(
            Array.from({ length: 20 }, () => executeWorkflow(execution.id))
        );

        await waitForExecutionStatus(execution.id, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        const tasks = await db.task.findMany({
            where: { executionId: execution.id },
        });

        expect(tasks).toHaveLength(4);

        const events = await db.event.findMany({
            where: { executionId: execution.id },
        });
        const taskCreatedEvents = events.filter(
            event => event.event === "TASK_CREATED"
        );

        expect(taskCreatedEvents).toHaveLength(4);
        await assertSingleActiveTask(execution.id);
        await assertUniqueTaskPerStep(execution.id);
    });

    it("remains idempotent when started concurrently through the API", async () => {
        const executionId = await startOrderWorkflowViaApi();

        await Promise.all(
            Array.from({ length: 20 }, () => executeWorkflowViaApi(executionId))
        );

        await waitForExecutionStatus(executionId, ExecutionStatus.COMPLETED, {
            timeoutMs: 90_000,
        });

        await assertUniqueTaskPerStep(executionId);
    });
});
