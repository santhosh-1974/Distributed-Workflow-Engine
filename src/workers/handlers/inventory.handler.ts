import { EventType, TaskStatus } from "@prisma/client";
import { createEvent } from "../../db/repositories/event.repository.js";

import { updateTask } from "../../db/repositories/task.repository.js";
import { updateExecution } from "../../db/repositories/execution.repository.js";
import { executeWorkflow } from "../../engine/workflow.executor.js";

type InventoryTask = {
    taskId: string;
    executionId: string;
};

export async function inventoryHandler({taskId,executionId}:InventoryTask) {
    console.log("Inventory Started");
    await updateTask(taskId, {
        status: TaskStatus.RUNNING
    });
    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.TASK_STARTED,
        metadata: { executionId, taskId, worker: "inventory" }
    });
    console.log("Reserving inventory...");

    // Simulate inventory reservation
    await new Promise(resolve => setTimeout(resolve, 2000));

    await updateTask(taskId, {
        status: TaskStatus.COMPLETED
    });
    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.TASK_COMPLETED,
        metadata: { executionId, taskId, worker: "inventory" }
    });
    await updateExecution(executionId, {
        currentStep: {
            increment: 1
        }
    });
    console.log("Inventory Completed");
    await executeWorkflow(executionId);
}
