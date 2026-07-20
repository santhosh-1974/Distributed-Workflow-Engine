import { EventType, TaskStatus } from "@prisma/client";
import { createEvent } from "../../db/repositories/event.repository.js";

import { updateTask } from "../../db/repositories/task.repository.js";
import { updateExecution } from "../../db/repositories/execution.repository.js";
import { executeWorkflow } from "../../engine/workflow.executor.js";

type PaymentTask = {
    taskId: string;
    executionId: string;
};

export async function paymentHandler({taskId,executionId}:PaymentTask) {
    await updateTask(taskId, {
        status: TaskStatus.RUNNING
    });
    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.TASK_STARTED,
        metadata: { executionId, taskId, worker: "payment" }
    });
    console.log("Charging payment...");

    // Simulate payment gateway
    await new Promise(resolve => setTimeout(resolve, 2000));

    await updateTask(taskId, {
        status: TaskStatus.COMPLETED
    });
    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.TASK_COMPLETED,
        metadata: { executionId, taskId, worker: "payment" }
    });
    await updateExecution(executionId, {
        currentStep: {
            increment: 1
        }
    });
    await executeWorkflow(executionId);
}
