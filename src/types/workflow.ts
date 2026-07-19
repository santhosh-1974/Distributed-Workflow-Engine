
export interface WorkflowStep {
  id: string;
  worker: string;
  compensation:string
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}
