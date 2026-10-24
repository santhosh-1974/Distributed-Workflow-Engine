import { EventType, ExecutionStatus, TaskStatus } from "@prisma/client";
import { createEvent } from "../db/repositories/event.repository.js";
import { createTask, getTaskByExecutionAndStep,updateTask } from "../db/repositories/task.repository.js"; 
import { updateExecution, getExecutionById } from "../db/repositories/execution.repository.js";
import { getWorkflowById } from "../db/repositories/workflow.repository.js";
import { dispatchTask} from "./task.dispatcher.js";

export async function executeWorkflow(executionId: string) {
    const execution = await getExecutionById(executionId);
    if (!execution) throw new Error("Execution not found.");

    const workflow = await getWorkflowById(execution.workflowId);
    if (!workflow) throw new Error("Workflow not found.");

    console.log(`Executing workflow: ${executionId}`);
    if (execution.status === ExecutionStatus.CREATED) {
        await updateExecution(execution.id, {
            status: ExecutionStatus.RUNNING
        });
        await createEvent({
            execution: { connect: { id: execution.id } },
            event: EventType.EXECUTION_STARTED, 
            metadata: {
                workflowId: execution.workflowId,
                executionId: execution.id,
                currentStep: execution.currentStep ?? 0
            }
        });
    }

    const definition = workflow.definition as any;
    const currentIndex = execution.currentStep ?? 0;

    const step = definition.steps[currentIndex];
    if (!step) {
        await updateExecution(execution.id, {
            status: ExecutionStatus.COMPLETED
        });
        await createEvent({
            execution: { connect: { id: execution.id } },
            event: EventType.EXECUTION_COMPLETED,
            metadata: {
                workflowId: execution.workflowId,
                executionId: execution.id,
                completedStepCount: currentIndex
            }
        });
        return;
    }
    const existingTask = await getTaskByExecutionAndStep(
        execution.id,
        step.id
    );

    if (existingTask) {
        switch (existingTask.status) {
            case TaskStatus.PENDING:
                await dispatchTask({
                    worker: step.worker,
                    stepId: step.id,
                    executionId: execution.id,
                    taskId: existingTask.id
                });

                await updateTask(existingTask.id, {
                    status: TaskStatus.QUEUED
                });

                return;

            case TaskStatus.QUEUED:
            case TaskStatus.RUNNING:
            case TaskStatus.FAILED:
                return;

            case TaskStatus.COMPLETED:
                await updateExecution(execution.id, {
                    currentStep: {
                        increment: 1
                    }
                });

                return executeWorkflow(execution.id);
        }
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

    await createEvent({
        execution: {
            connect: {
                id: execution.id
            }
        },
        event: EventType.TASK_CREATED,
        metadata: {
            workflowId: execution.workflowId,
            executionId: execution.id,
            taskId: task.id,
            stepId: step.id,
            worker: step.worker
        }
    });

    console.log(`Dispatching step: ${step.id}`);

    await dispatchTask({
        worker: step.worker,
        stepId: step.id,
        executionId: execution.id,
        taskId: task.id
    });
    await updateTask(task.id, {
        status: TaskStatus.QUEUED
    });
}
