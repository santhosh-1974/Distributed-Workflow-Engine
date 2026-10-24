import { WorkflowDefinition } from "../../types/workflow";
import { db } from "../prisma";
import {Prisma} from "@prisma/client"

export async function createWorkflow(name:string,definition:WorkflowDefinition){
    try {
        return await db.workflow.upsert({
            where: { name },
            update: {},
            create: {
                name,
                definition: definition as unknown as Prisma.InputJsonValue,
            }
        });
    } catch (error) {
        // Concurrent creations can race past the upsert check and both attempt
        // to insert. P2002 is the unique-constraint violation; the winner has
        // already created the row, so just return the existing record.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const existing = await getWorkflowByName(name);
            if (existing) return existing;
        }
        throw error;
    }
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