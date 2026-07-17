import { WorkflowDefinition } from "../types/workflow.js";
import path from "node:path"
import { promises as fs } from "node:fs";


const WORKFLOW_DIRECTORY = path.join(
    process.cwd(),
    "src",
    "workflow-definitions"
);

export async function loadWorkflow(workFlowId: string): Promise<WorkflowDefinition> {
    const filePath = path.join(WORKFLOW_DIRECTORY, `${workFlowId}.json`);
    const file = await fs.readFile(filePath, "utf-8");
    return JSON.parse(file) as WorkflowDefinition
}
