import { TaskStatus } from "@prisma/client";

import { getExecutionById } from "../db/repositories/execution.repository.js";
import { getTasksByExecutionId } from "../db/repositories/task.repository.js";
import { loadWorkflow } from "./WorkFlowLoader";
import { compensationRegistry } from "../compensations/compensation.registry.js";

export async function runSaga(executionId: string) {
    console.log(`Running saga for execution: ${executionId}`);
    const execution = await getExecutionById(executionId);

    if(!execution)throw new Error("Execution not found");

    const workflow = await loadWorkflow(execution.workflowId);
    const tasks = await getTasksByExecutionId(executionId);
    const completedTasks = tasks
        .filter(task => task.status === TaskStatus.COMPLETED)
        .reverse();

    for (const task of completedTasks) {
        const workflowStep = workflow.steps.find(
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

        await compensation({
            executionId,
            taskId: task.id
        });
    }

    console.log("Saga completed");
}