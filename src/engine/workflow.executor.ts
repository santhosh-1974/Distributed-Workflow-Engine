import { ExecutionStatus } from "@prisma/client";
import { createTask } from "../db/repositories/task.repository.js";
import {updateExecution,getExecutionById} from "../db/repositories/execution.repository.js";
import { getWorkflowById } from "../db/repositories/workflow.repository.js";
import { dispatchTask } from "./task.dispatcher.js";

export async function executeWorkflow(executionId: string){
    const execution = await getExecutionById(executionId);
    if(!execution)throw new Error("Execution not found.");

    const workflow = await getWorkflowById(execution.workflowId);
    if(!workflow)throw new Error("Workflow not found.");

    console.log(`Executing workflow: ${executionId}`);
    if(execution.status===ExecutionStatus.CREATED) {
        await updateExecution(execution.id, {
            status: ExecutionStatus.RUNNING
        });
    }

    const definition = workflow.definition as any;
    const currentIndex = execution.currentStep ?? 0;

    const step = definition.steps[currentIndex];
    if (!step) {
        await updateExecution(execution.id, {
            status: ExecutionStatus.COMPLETED
        });
        return;
    }

    const task = await createTask({
        execution: {
            connect: {
                id: execution.id
            }
        },
        stepName: step.id,
        worker: step.worker
    });
    console.log(`Dispatching step: ${step.id}`);
    await dispatchTask({
        worker: step.worker,
        stepId: step.id,
        executionId: execution.id,
        taskId: task.id
    });
}
