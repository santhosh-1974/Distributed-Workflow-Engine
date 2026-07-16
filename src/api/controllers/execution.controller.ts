import { Request, Response } from "express";

import { getExecutionById } from "../../db/repositories/execution.repository.js";

export async function getExecutionController(req: Request, res: Response) {
    const execution = await getExecutionById(req.params.id as string)
    res.status(200).json(execution);
}