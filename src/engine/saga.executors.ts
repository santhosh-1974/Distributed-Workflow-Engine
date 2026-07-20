import { EventType, TaskStatus } from "@prisma/client";

import { createEvent } from "../db/repositories/event.repository.js";
import { getExecutionById } from "../db/repositories/execution.repository.js";
import { getTasksByExecutionId } from "../db/repositories/task.repository.js";
import { getWorkflowById } from "../db/repositories/workflow.repository.js";
import { compensationRegistry } from "../compensations/compensation.registry.js";

export async function runSaga(executionId: string) {
    console.log(`Running saga for execution: ${executionId}`);
    const execution = await getExecutionById(executionId);

    if(!execution)throw new Error("Execution not found");

    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.SAGA_STARTED,
        metadata: { executionId, workflowId: execution.workflowId }
    });

    const workflow = await getWorkflowById(execution.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const definition = workflow.definition as { steps: Array<{ id: string; compensation?: string }> };
    const tasks = await getTasksByExecutionId(executionId);
    const completedTasks = tasks
        .filter(task => task.status === TaskStatus.COMPLETED)
        .reverse();

    for (const task of completedTasks) {
        const workflowStep = definition.steps.find(
            step => step.id === task.stepName
        );

        if (!workflowStep) {
            console.warn(`Workflow step ${task.stepName} not found`);
            continue;
        }

        if (!workflowStep.compensation) {
            console.warn(`No compensation for ${workflowStep.id}`);
            continue;
        }

        const compensation=compensationRegistry[workflowStep.compensation];

        if (!compensation) {
            console.warn(
                `Compensation handler '${workflowStep.compensation}' not registered`
            );
            continue;
        }

        console.log(
            `Running compensation: ${workflowStep.compensation}`
        );

        await createEvent({
            execution: { connect: { id: executionId } },
            event: EventType.COMPENSATION_STARTED,
            metadata: {
                executionId,
                taskId: task.id,
                stepId: workflowStep.id,
                worker: task.worker,
                compensation: workflowStep.compensation
            }
        });

        try {
            await compensation({
                executionId,
                taskId: task.id
            });
            await createEvent({
                execution: { connect: { id: executionId } },
                event: EventType.COMPENSATION_COMPLETED,
                metadata: {
                    executionId,
                    taskId: task.id,
                    stepId: workflowStep.id,
                    compensation: workflowStep.compensation
                }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const metadata = {
                executionId,
                taskId: task.id,
                stepId: workflowStep.id,
                compensation: workflowStep.compensation,
                error: message
            };
            await createEvent({
                execution: { connect: { id: executionId } },
                event: EventType.COMPENSATION_FAILED,
                metadata
            });
            await createEvent({
                execution: { connect: { id: executionId } },
                event: EventType.SAGA_FAILED,
                metadata: { workflowId: execution.workflowId, ...metadata }
            });
            throw error;
        }
    }

    await createEvent({
        execution: { connect: { id: executionId } },
        event: EventType.SAGA_COMPLETED,
        metadata: {
            executionId,
            workflowId: execution.workflowId,
            compensatedTaskCount: completedTasks.length
        }
    });
    console.log("Saga completed");
}
