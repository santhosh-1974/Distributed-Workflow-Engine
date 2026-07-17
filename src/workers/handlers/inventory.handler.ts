import { TaskStatus } from "@prisma/client";
import { updateTask } from "../../db/repositories/task.repository.js";
import {workerHandlerInput} from "../../types/workflow.js"

export async function inventoryHandler({taskId,executionId}:workerHandlerInput) {
    console.log(`Starting inventory task: ${taskId}`);
    await updateTask(taskId, {
        status: TaskStatus.RUNNING
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Inventory reserved for execution: ${executionId}`);
    await updateTask(taskId, {
        status: TaskStatus.COMPLETED
    });
}