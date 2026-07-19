import { queues } from "../queues//workflow.queue";

type DispatchTaskInput = {
    worker: keyof typeof queues;
    stepId: string;
    executionId: string;
    taskId: string;
};

export async function dispatchTask({worker,stepId,executionId,taskId}:DispatchTaskInput) {
    console.log(`Adding job to ${worker} queue`);
    const queue = queues[worker];
    await queue.add(stepId, 
    {
        executionId,
        taskId
    },
    {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 100
    });
}