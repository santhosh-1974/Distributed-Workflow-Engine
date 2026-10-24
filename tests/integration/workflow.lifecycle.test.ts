import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ExecutionStatus, TaskStatus } from "@prisma/client";

import { db, resetDatabase } from "../helpers/database.js";
import { drainAllQueues } from "../helpers/bullmq.js";
import { waitForExecutionStatus, waitForTaskStatus } from "../helpers/polling.js";
import { startWorkers, stopWorkers } from "../helpers/workers.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { startWorkflow } from "../../src/services/workflow.service.js";

describe("workflow persistence and first-step dispatch", () => {
    beforeAll(startWorkers);
    beforeEach(async () => {
        await drainAllQueues();
        await resetDatabase();
    });
    afterAll(stopWorkers);

    it("persists creation and dispatches the first inventory task", async () => {
        const execution = await startWorkflow("order");
        await executeWorkflow(execution.id);

        // Small delay to allow worker to pick up the job
        await new Promise(resolve => setTimeout(resolve, 100));

        await waitForExecutionStatus(execution.id, ExecutionStatus.RUNNING, { timeoutMs: 10_000 });
        await waitForTaskStatus(execution.id, "inventory", TaskStatus.RUNNING, { timeoutMs: 10_000 });

        const [task, events] = await Promise.all([
            db.task.findFirst({ where: { executionId: execution.id } }),
            db.event.findMany({ where: { executionId: execution.id }, orderBy: { timestamp: "asc" } }),
        ]);
        expect(task).toMatchObject({ stepName: "inventory", worker: "inventory", status: TaskStatus.RUNNING });
        expect(events.map(event => event.event)).toEqual(["EXECUTION_CREATED", "EXECUTION_STARTED", "TASK_CREATED", "TASK_STARTED"]);
    });

    it("creates independent execution records for repeated starts", async () => {
        const [first, second] = await Promise.all([startWorkflow("order"), startWorkflow("order")]);
        expect(first.id).not.toBe(second.id);
        expect(await db.execution.count({ where: { workflowId: first.workflowId } })).toBe(2);
    });
});
