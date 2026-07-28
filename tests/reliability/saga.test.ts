import { describe, expect, it, vi } from "vitest";
import { EventType, ExecutionStatus, TaskStatus } from "@prisma/client";

import {
    createOrderExecution,
    db,
    waitForEventType,
    waitForExecutionStatus,
    waitForTaskStatus,
} from "../helpers/index.js";
import * as inventoryCompensation from "../../src/compensations/inventory.compensation.js";
import * as paymentCompensation from "../../src/compensations/payment.compensation.js";
import { createExecution } from "../../src/db/repositories/execution.repository.js";
import { createEvent } from "../../src/db/repositories/event.repository.js";
import { createWorkflow } from "../../src/db/repositories/workflow.repository.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import {
    assertCompensationExecutedOnce,
    assertCompensationOrder,
    assertDatabaseConsistency,
    assertEventExists,
    failWorkerAlways,
} from "./helpers/index.js";

describe("Reliability / Saga", () => {
    it("executes release inventory compensation when payment fails permanently", async () => {
        const releaseSpy = vi.spyOn(
            inventoryCompensation,
            "releaseInventory"
        );

        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerAlways("payment", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        expect(releaseSpy).toHaveBeenCalledTimes(1);
        await assertCompensationExecutedOnce(executionId, "release-inventory");
        await assertDatabaseConsistency(executionId);

        releaseSpy.mockRestore();
    });

    it("compensates completed steps in reverse order when invoice fails permanently", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "payment", TaskStatus.COMPLETED);
        await failWorkerAlways("invoice", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertCompensationOrder(executionId, [
            "refund-payment",
            "release-inventory",
        ]);
    });

    it("compensates full stack when email fails permanently", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "invoice", TaskStatus.COMPLETED);
        await failWorkerAlways("email", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertCompensationOrder(executionId, [
            "delete-invoice",
            "refund-payment",
            "release-inventory",
        ]);
    });

    it("records COMPENSATION_FAILED when compensation handler throws", async () => {
        const refundSpy = vi
            .spyOn(paymentCompensation, "refundPayment")
            .mockRejectedValue(new Error("Refund gateway unavailable"));

        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "inventory", TaskStatus.COMPLETED);
        await failWorkerAlways("payment", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await waitForEventType(executionId, EventType.COMPENSATION_FAILED);
        await waitForEventType(executionId, EventType.SAGA_FAILED);

        const execution = await db.execution.findUnique({
            where: { id: executionId },
        });

        expect(execution?.status).toBe(ExecutionStatus.FAILED);
        refundSpy.mockRestore();
    });

    it("logs saga start when compensation handler is missing from registry", async () => {
        const workflow = await createWorkflow("Broken Order", {
            id: "broken-order",
            name: "Broken Order",
            steps: [
                {
                    id: "inventory",
                    worker: "inventory",
                    compensation: "release-inventory",
                },
                {
                    id: "payment",
                    worker: "payment",
                    compensation: "unknown-compensation",
                },
            ],
        });

        const execution = await createExecution({
            workflow: { connect: { id: workflow.id } },
            status: ExecutionStatus.CREATED,
        });

        await createEvent({
            execution: { connect: { id: execution.id } },
            event: EventType.EXECUTION_CREATED,
            metadata: { executionId: execution.id, workflowId: workflow.id },
        });

        await executeWorkflow(execution.id);

        await waitForTaskStatus(execution.id, "inventory", TaskStatus.COMPLETED);
        await failWorkerAlways("payment", execution.id);

        await waitForExecutionStatus(execution.id, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertEventExists(execution.id, EventType.SAGA_STARTED);
        await assertEventExists(execution.id, EventType.COMPENSATION_STARTED);
    });

    it("executes each compensation exactly once", async () => {
        const executionId = await createOrderExecution();

        await waitForTaskStatus(executionId, "invoice", TaskStatus.COMPLETED);
        await failWorkerAlways("email", executionId);

        await waitForExecutionStatus(executionId, ExecutionStatus.FAILED, {
            timeoutMs: 90_000,
        });

        await assertCompensationExecutedOnce(executionId, "delete-invoice");
        await assertCompensationExecutedOnce(executionId, "refund-payment");
        await assertCompensationExecutedOnce(executionId, "release-inventory");
    });
});
