import { TaskStatus } from "@prisma/client";

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
    console.log("Reserving inventory...");

    // Simulate inventory reservation
    await new Promise(resolve => setTimeout(resolve, 2000));

    await updateTask(taskId, {
        status: TaskStatus.COMPLETED
    });
    await updateExecution(executionId, {
        currentStep: {
            increment: 1
        }
    });
    console.log("Inventory Completed");
    await executeWorkflow(executionId);
}