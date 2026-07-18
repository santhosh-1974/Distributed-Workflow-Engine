import { Request, Response } from "express";
import { getExecutionById } from "../../db/repositories/execution.repository.js";
import {executeWorkflow} from "../../engine/workflow.executor.js"
import {startExecutionSchema} from "../validators/execution.validator"

export async function getExecutionController(req: Request, res: Response) {
    const execution = await getExecutionById(req.params.id as string)
    res.status(200).json(execution);
}

export async function startExecution(req:Request,res:Response){
    const body=startExecutionSchema.parse(req.body)
    await executeWorkflow(body.executionId)
    const execution = await getExecutionById(body.executionId)
    res.status(200).json({success:true,execution:execution});
}
