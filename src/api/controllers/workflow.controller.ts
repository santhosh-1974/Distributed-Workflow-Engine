import { Request, Response } from "express";

import { getAllWorkflows } from "../../db/repositories/workflow.repository.js";
import { startWorkflow } from "../../services/workflow.service.js";
import { startWorkflowSchema } from "../validators/workflow.validator";

export async function startWorkflowController(req: Request, res: Response) {
    const body = startWorkflowSchema.parse(req.body);
    const execution = await startWorkflow(body.workflowId);
    res.status(201).json(execution);
}

export async function getWorkflowsController(_req: Request, res: Response) {
    const workflows = await getAllWorkflows();
    res.status(200).json(workflows);
}
