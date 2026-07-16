import { ExecutionStatus } from "@prisma/client";
import { createExecution } from "../db/repositories/execution.repository.js";
import {createWorkflow,getWorkflowByName,} from "../db/repositories/workflow.repository.js";
import { loadWorkflow } from "../engine/loader/WorkFlowLoader.js";

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

  return execution;
}