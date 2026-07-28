export type CrashPoint =
    | "after_create_execution"
    | "after_create_task"
    | "after_dispatch_task"
    | "after_update_execution"
    | "after_event_creation"
    | "after_worker_starts"
    | "after_worker_completes"
    | "after_task_completion";

export class SimulatedCrashError extends Error {
    constructor(public readonly crashPoint: CrashPoint) {
        super(`Simulated crash at ${crashPoint}`);
        this.name = "SimulatedCrashError";
    }
}

let armedCrashPoint: CrashPoint | null = null;

export function armCrashAt(point: CrashPoint): void {
    armedCrashPoint = point;
}

export function disarmCrash(): void {
    armedCrashPoint = null;
}

export function getArmedCrashPoint(): CrashPoint | null {
    return armedCrashPoint;
}

export function maybeCrash(point: CrashPoint): void {
    if (armedCrashPoint === point) {
        armedCrashPoint = null;
        throw new SimulatedCrashError(point);
    }
}

export const ALL_CRASH_POINTS: CrashPoint[] = [
    "after_create_execution",
    "after_create_task",
    "after_dispatch_task",
    "after_update_execution",
    "after_event_creation",
    "after_worker_starts",
    "after_worker_completes",
    "after_task_completion",
];
