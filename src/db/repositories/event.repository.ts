import { db } from "../prisma";
import { Prisma } from "@prisma/client";

export async function createEvent(data: Prisma.EventCreateInput){
  return db.event.create({ data });
}

export async function getEventsByExecutionId(executionId: string){
  return db.event.findMany({where: {executionId,},orderBy: {timestamp: "asc",}});
}