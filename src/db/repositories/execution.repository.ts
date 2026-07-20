import { db } from "../prisma";
import { Prisma ,ExecutionStatus} from "@prisma/client";

export async function createExecution(data: Prisma.ExecutionCreateInput){
    return db.execution.create({ data });
}

export async function getExecutionById(id: string) {
    return db.execution.findUnique({where:{id}});
}

export async function updateExecution(id: string,data: Prisma.ExecutionUpdateInput){
    return db.execution.update({where: { id },data});
}

export async function getRunningExecutions() {  
    return db.execution.findMany({where: {status:ExecutionStatus.RUNNING}});
}