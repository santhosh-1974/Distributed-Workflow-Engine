
export interface WorkflowStep {
  id: string;
  worker: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface workerHandlerInput{
  executionId: string,
  taskId: string
}