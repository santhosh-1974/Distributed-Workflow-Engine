import { TaskStatus } from "@prisma/client";

import { updateTask } from "../../db/repositories/task.repository.js";
import { updateExecution } from "../../db/repositories/execution.repository.js";
import { executeWorkflow } from "../../engine/workflow.executor.js";

type EmailTask = {
    taskId: string;
    executionId: string;
};

export async function emailHandler({taskId,executionId}:EmailTask) {
    await updateTask(taskId, {
        status: TaskStatus.RUNNING
    });
    console.log("Sending confirmation email...");

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await updateTask(taskId, {
        status: TaskStatus.COMPLETED
    });
    await updateExecution(executionId, {
        currentStep: {
            increment: 1
        }
    });
    await executeWorkflow(executionId);
}