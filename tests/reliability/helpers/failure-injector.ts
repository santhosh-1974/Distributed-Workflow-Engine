import {
    clearAllFailureModes,
    setFailureMode,
    type FailureMode,
} from "../../../src/testing/failure-control.js";

export type WorkerName = "inventory" | "payment" | "invoice" | "email";

export async function failWorkerUntilAttempt(
    worker: WorkerName,
    executionId: string,
    untilAttempt: number
): Promise<void> {
    await setFailureMode(worker, executionId, {
        type: "until_attempt",
        untilAttempt,
    });
}

export async function failWorkerAlways(
    worker: WorkerName,
    executionId: string
): Promise<void> {
    await setFailureMode(worker, executionId, { type: "always" });
}

export async function allowWorker(
    worker: WorkerName,
    executionId: string
): Promise<void> {
    await setFailureMode(worker, executionId, { type: "never" });
}

export async function clearFailureInjection(): Promise<void> {
    await clearAllFailureModes();
}

export type { FailureMode };
