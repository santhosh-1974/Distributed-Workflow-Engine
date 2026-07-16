import { WorkflowDefinition } from "../../types/workflow";
import { db } from "../prisma";
import {Prisma} from "@prisma/client"

export async function createWorkflow(name:string,definition:WorkflowDefinition){
    return db.workflow.create({data:{
        name,
        definition:definition as unknown as Prisma.InputJsonValue,
    }});
}

export async function getWorkflowById(id:string){
    return db.workflow.findUnique({where:{id}})
}

export async function getWorkflowByName(name: string) {
  return db.workflow.findUnique({where: { name }});
}

export async function getAllWorkflows() {
  return db.workflow.findMany();
}