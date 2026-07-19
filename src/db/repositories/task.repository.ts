import { db } from "../prisma.js";
import { Prisma } from "@prisma/client";

export async function createTask(data: Prisma.TaskCreateInput){
  return db.task.create({ data });
}

export async function updateTask(id: string,data: Prisma.TaskUpdateInput){
  return db.task.update({where:{id} , data});
}

export async function getTasksByExecutionId(executionId: string){
  return db.task.findMany({where:{executionId} , orderBy:{createdAt:"asc"}});
}