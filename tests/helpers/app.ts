import request from "supertest";

import app from "../../src/app.js";
import { db } from "../../src/db/prisma.js";
import { executeWorkflow } from "../../src/engine/workflow.executor.js";
import { startWorkflow } from "../../src/services/workflow.service.js";

export const api = request(app);

export async function initializeTestApp(): Promise<void> {
    await db.$connect();
}

export async function createOrderExecution(): Promise<string> {
    const execution = await startWorkflow("order");
    await executeWorkflow(execution.id);
    return execution.id;
}

export async function startOrderWorkflowViaApi(): Promise<string> {
    const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

    const executionId = createResponse.body.id as string;

    await api
        .post("/api/v1/executions/start")
        .send({ executionId })
        .expect(200);

    return executionId;
}

export async function executeWorkflowViaApi(executionId: string): Promise<void> {
    await api.post("/api/v1/executions/start").send({ executionId }).expect(200);
}

export { app };
