export interface CompensationContext {
    executionId: string;
    taskId: string;
}

export type CompensationHandler = (
    context: CompensationContext
) => Promise<void>;