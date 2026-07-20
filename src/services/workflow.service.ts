import { EventType, ExecutionStatus } from "@prisma/client";
import { createEvent } from "../db/repositories/event.repository.js";
import { createExecution } from "../db/repositories/execution.repository.js";
import { createWorkflow, getWorkflowByName, } from "../db/repositories/workflow.repository.js";
import { loadWorkflow } from "../engine/WorkFlowLoader.js";

export async function startWorkflow(workflowId: string) {
  const workflowDefinition = await loadWorkflow(workflowId);
  let workflow = await getWorkflowByName(workflowDefinition.name);

  if (!workflow) {
    workflow = await createWorkflow(workflowDefinition.name, workflowDefinition);
  }

  const execution = await createExecution({
    workflow: {
      connect: {
        id: workflow.id,
      },
    },
    status: ExecutionStatus.CREATED,
  });

  await createEvent({
    execution: { connect: { id: execution.id } },
    event: EventType.EXECUTION_CREATED,
    metadata: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      executionId: execution.id,
    },
  });

  return execution;
}
