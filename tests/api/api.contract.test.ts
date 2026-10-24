import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import { resetDatabase } from "../helpers/database.js";

const api = request(app);

describe("HTTP API contract", () => {
    beforeEach(resetDatabase);

    it("reports service health", async () => {
        const response = await api.get("/health").expect(200);
        expect(response.body).toMatchObject({ success: true, message: "Workflow Engine is running" });
    });

    it("creates an execution and exposes it by id", async () => {
        const created = await api.post("/api/v1/workflows/start").send({ workflowId: "order" }).expect(201);
        const fetched = await api.get(`/api/v1/executions/${created.body.id}`).expect(200);
        expect(fetched.body).toMatchObject({ id: created.body.id, status: "CREATED" });
    });

    it("lists workflows created through the API", async () => {
        await api.post("/api/v1/workflows/start").send({ workflowId: "order" }).expect(201);
        const response = await api.get("/api/v1/workflows").expect(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({ name: "Order Processing" });
    });

    it("creates a distinct execution for each start request", async () => {
        const [first, second] = await Promise.all([
            api.post("/api/v1/workflows/start").send({ workflowId: "order" }).expect(201),
            api.post("/api/v1/workflows/start").send({ workflowId: "order" }).expect(201),
        ]);
        expect(first.body.id).not.toBe(second.body.id);
    });
});
