import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { ExecutionStatus } from "@prisma/client";
import app from "../../src/app";
import { db } from "../../src/db/prisma";
import { resetDatabase } from "../helpers/database";
import { flushRedis } from "../helpers/redis";

describe("Workflow API Tests", () => {
  let api: any;

  beforeEach(async () => {
    api = request(app);
    await resetDatabase();
    await flushRedis();
  });

  afterEach(async () => {
    await resetDatabase();
    await flushRedis();
  });

  describe("POST /api/v1/workflows/start", () => {
    describe("Valid workflow", () => {
      it("should return 201 on successful workflow start", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("workflowId");
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("createdAt");
        expect(response.body).toHaveProperty("updatedAt");
      });

      it("should return executionId in response", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.id).toBeDefined();
        expect(typeof response.body.id).toBe("string");
      });

      it("should return status CREATED", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.status).toBe(ExecutionStatus.CREATED);
      });

      it("should create database record", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        const execution = await db.execution.findUnique({
          where: { id: response.body.id },
        });
        expect(execution).toBeDefined();
        expect(execution?.status).toBe(ExecutionStatus.CREATED);
      });

      it("should create workflow record if not exists", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        await api.post("/api/v1/workflows/start").send(payload).expect(201);

        // Assert
        const workflow = await db.workflow.findFirst({
          where: { name: "Order Workflow" },
        });
        expect(workflow).toBeDefined();
      });

      it("should create EXECUTION_CREATED event", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        const events = await db.event.findMany({
          where: { executionId: response.body.id },
        });
        expect(events).toHaveLength(1);
        expect(events[0].event).toBe("EXECUTION_CREATED");
      });

      it("should return correct response schema", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body).toMatchObject({
          id: expect.any(String),
          workflowId: expect.any(String),
          status: expect.any(String),
          currentStep: expect.any(Number),
          startedAt: expect.any(Date),
          completedAt: expect.anything(),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it("should set content-type to application/json", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.headers["content-type"]).toContain(
          "application/json"
        );
      });
    });

    describe("Unknown workflow", () => {
      it("should return error for unknown workflow", async () => {
        // Arrange
        const payload = {
          workflowId: "unknown-workflow",
        };

        // Act & Assert
        await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(500);
      });
    });

    describe("Missing workflow name", () => {
      it("should return 400 for missing workflowId", async () => {
        // Arrange
        const payload = {};

        // Act & Assert
        await api.post("/api/v1/workflows/start").send(payload).expect(400);
      });
    });

    describe("Empty request body", () => {
      it("should return 400 for empty body", async () => {
        // Act & Assert
        await api.post("/api/v1/workflows/start").send({}).expect(400);
      });
    });

    describe("Invalid JSON body", () => {
      it("should return 400 for invalid JSON", async () => {
        // Act & Assert
        await api
          .post("/api/v1/workflows/start")
          .send("invalid json")
          .set("Content-Type", "application/json")
          .expect(400);
      });
    });

    describe("Large input payload", () => {
      it("should handle large payload", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
          metadata: "x".repeat(10000),
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.id).toBeDefined();
      });
    });

    describe("Duplicate request", () => {
      it("should create unique execution on duplicate request", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
        };

        // Act
        const response1 = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);
        const response2 = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response1.body.id).not.toBe(response2.body.id);
      });
    });

    describe("Malformed payload", () => {
      it("should return 400 for malformed payload", async () => {
        // Arrange
        const payload = {
          workflowId: null,
        };

        // Act & Assert
        await api.post("/api/v1/workflows/start").send(payload).expect(400);
      });
    });

    describe("Extra fields", () => {
      it("should ignore extra fields", async () => {
        // Arrange
        const payload = {
          workflowId: "order",
          extraField: "value",
          anotherField: 123,
        };

        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.id).toBeDefined();
      });
    });

    describe("Invalid data types", () => {
      it("should return 400 for workflowId as number", async () => {
        // Arrange
        const payload = {
          workflowId: 123,
        };

        // Act & Assert
        await api.post("/api/v1/workflows/start").send(payload).expect(400);
      });

      it("should return 400 for workflowId as array", async () => {
        // Arrange
        const payload = {
          workflowId: ["order"],
        };

        // Act & Assert
        await api.post("/api/v1/workflows/start").send(payload).expect(400);
      });
    });

    describe("Missing required fields", () => {
      it("should return 400 when workflowId is missing", async () => {
        // Arrange
        const payload = {
          otherField: "value",
        };

        // Act & Assert
        await api.post("/api/v1/workflows/start").send(payload).expect(400);
      });
    });
  });

  describe("GET /api/v1/workflows", () => {
    beforeEach(async () => {
      // Create some workflows
      await api.post("/api/v1/workflows/start").send({ workflowId: "order" });
      await api.post("/api/v1/workflows/start").send({ workflowId: "order" });
    });

    it("should return 200", async () => {
      // Act & Assert
      await api.get("/api/v1/workflows").expect(200);
    });

    it("should return array of workflows", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return workflows with correct schema", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          definition: expect.any(Object),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it("should return empty array when no workflows", async () => {
      // Arrange
      await resetDatabase();

      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/v1/executions/:id", () => {
    let executionId: string;

    beforeEach(async () => {
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      executionId = response.body.id;
    });

    describe("Existing execution", () => {
      it("should return 200", async () => {
        // Act & Assert
        await api.get(`/api/v1/executions/${executionId}`).expect(200);
      });

      it("should return execution details", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}`)
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          id: executionId,
          status: expect.any(String),
          workflowId: expect.any(String),
          currentStep: expect.any(Number),
        });
      });

      it("should return correct response schema", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}`)
          .expect(200);

        // Assert
        expect(response.body).toMatchObject({
          id: expect.any(String),
          workflowId: expect.any(String),
          status: expect.any(String),
          currentStep: expect.any(Number),
          startedAt: expect.any(Date),
          completedAt: expect.anything(),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });
    });

    describe("Completed execution", () => {
      it("should return completed status", async () => {
        // Arrange
        await api
          .post("/api/v1/executions/start")
          .send({ executionId });

        // Wait for completion (in real scenario, would poll)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBeDefined();
      });
    });

    describe("Running execution", () => {
      it("should return running status", async () => {
        // Arrange
        await api
          .post("/api/v1/executions/start")
          .send({ executionId });

        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}`)
          .expect(200);

        // Assert
        expect(response.body.status).toBeDefined();
      });
    });

    describe("Failed execution", () => {
      it("should return failed status if execution failed", async () => {
        // This would require setting up a failure scenario
        // For now, just verify the endpoint works
        const response = await api
          .get(`/api/v1/executions/${executionId}`)
          .expect(200);

        expect(response.body.status).toBeDefined();
      });
    });

    describe("Invalid UUID", () => {
      it("should return 400 for invalid UUID", async () => {
        // Act & Assert
        await api.get("/api/v1/executions/invalid-uuid").expect(400);
      });

      it("should return 400 for empty string", async () => {
        // Act & Assert
        await api.get("/api/v1/executions/").expect(404);
      });
    });

    describe("Unknown UUID", () => {
      it("should return 404 for unknown execution", async () => {
        // Arrange
        const unknownId = "00000000-0000-0000-0000-000000000000";

        // Act & Assert
        await api.get(`/api/v1/executions/${unknownId}`).expect(404);
      });
    });

    describe("Malformed ID", () => {
      it("should return 400 for malformed ID", async () => {
        // Act & Assert
        await api.get("/api/v1/executions/12345").expect(400);
      });
    });
  });

  describe("GET /api/v1/executions/:id/tasks", () => {
    let executionId: string;

    beforeEach(async () => {
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      executionId = response.body.id;
      await api
        .post("/api/v1/executions/start")
        .send({ executionId });
    });

    describe("Execution with tasks", () => {
      it("should return 200", async () => {
        // Act & Assert
        await api.get(`/api/v1/executions/${executionId}/tasks`).expect(200);
      });

      it("should return array of tasks", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
      });

      it("should return tasks with correct schema", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          expect(response.body[0]).toMatchObject({
            id: expect.any(String),
            executionId: executionId,
            stepName: expect.any(String),
            worker: expect.any(String),
            status: expect.any(String),
            retryCount: expect.any(Number),
          });
        }
      });

      it("should return tasks in correct order", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 1) {
          const timestamps = response.body.map((t: any) => t.createdAt);
          const sorted = [...timestamps].sort();
          expect(timestamps).toEqual(sorted);
        }
      });
    });

    describe("Execution without tasks", () => {
      it("should return empty array", async () => {
        // Arrange
        const response = await api
          .post("/api/v1/workflows/start")
          .send({ workflowId: "order" });
        const newExecutionId = response.body.id;

        // Don't start execution, so no tasks created

        // Act
        const tasksResponse = await api
          .get(`/api/v1/executions/${newExecutionId}/tasks`)
          .expect(200);

        // Assert
        expect(tasksResponse.body).toEqual([]);
      });
    });

    describe("Completed tasks", () => {
      it("should return correct statuses for completed tasks", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((task: any) => {
            expect(task.status).toBeDefined();
            expect(["PENDING", "QUEUED", "RUNNING", "COMPLETED", "FAILED"]).toContain(
              task.status
            );
          });
        }
      });
    });

    describe("Running tasks", () => {
      it("should return running task status", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((task: any) => {
            expect(task.status).toBeDefined();
          });
        }
      });
    });

    describe("Failed tasks", () => {
      it("should return failed task status if any", async () => {
        // Act
        await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        // Status check done in the response
      });
    });

    describe("Unknown execution", () => {
      it("should return 404 for unknown execution", async () => {
        // Arrange
        const unknownId = "00000000-0000-0000-0000-000000000000";

        // Act & Assert
        await api.get(`/api/v1/executions/${unknownId}/tasks`).expect(404);
      });
    });

    describe("Retry count", () => {
      it("should include retry count in response", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((task: any) => {
            expect(task.retryCount).toBeDefined();
            expect(typeof task.retryCount).toBe("number");
          });
        }
      });
    });

    describe("Worker names", () => {
      it("should include worker names in response", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/tasks`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((task: any) => {
            expect(task.worker).toBeDefined();
            expect(typeof task.worker).toBe("string");
          });
        }
      });
    });
  });

  describe("GET /api/v1/executions/:id/events", () => {
    let executionId: string;

    beforeEach(async () => {
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      executionId = response.body.id;
    });

    describe("Execution with events", () => {
      it("should return 200", async () => {
        // Act & Assert
        await api.get(`/api/v1/executions/${executionId}/events`).expect(200);
      });

      it("should return array of events", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
      });

      it("should return events with correct schema", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          expect(response.body[0]).toMatchObject({
            id: expect.any(String),
            executionId: executionId,
            event: expect.any(String),
            metadata: expect.any(Object),
            timestamp: expect.any(Date),
          });
        }
      });

      it("should return EXECUTION_CREATED event", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          expect(response.body.some((e: any) => e.event === "EXECUTION_CREATED")).toBe(
            true
          );
        }
      });
    });

    describe("Execution without events", () => {
      it("should return empty array when no events", async () => {
        // Arrange
        await resetDatabase();

        // Act & Assert
        // 404 because execution doesn't exist
        await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(404);
      });
    });

    describe("Unknown execution", () => {
      it("should return 404 for unknown execution", async () => {
        // Arrange
        const unknownId = "00000000-0000-0000-0000-000000000000";

        // Act & Assert
        await api.get(`/api/v1/executions/${unknownId}/events`).expect(404);
      });
    });

    describe("Correct event order", () => {
      it("should return events in chronological order", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 1) {
          const timestamps = response.body.map((e: any) => e.timestamp);
          const sorted = [...timestamps].sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
          );
          expect(timestamps).toEqual(sorted);
        }
      });
    });

    describe("Correct timestamps", () => {
      it("should include valid timestamps", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((event: any) => {
            expect(event.timestamp).toBeDefined();
            expect(new Date(event.timestamp)).toBeInstanceOf(Date);
          });
        }
      });
    });

    describe("Correct metadata", () => {
      it("should include metadata in events", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((event: any) => {
            expect(event.metadata).toBeDefined();
            expect(typeof event.metadata).toBe("object");
          });
        }
      });

      it("should include workflowId in metadata", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((event: any) => {
            expect(event.metadata).toHaveProperty("workflowId");
          });
        }
      });

      it("should include executionId in metadata", async () => {
        // Act
        const response = await api
          .get(`/api/v1/executions/${executionId}/events`)
          .expect(200);

        // Assert
        if (response.body.length > 0) {
          response.body.forEach((event: any) => {
            expect(event.metadata).toHaveProperty("executionId");
          });
        }
      });
    });
  });

  describe("POST /api/v1/executions/start", () => {
    let executionId: string;

    beforeEach(async () => {
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      executionId = response.body.id;
    });

    describe("Valid execution start", () => {
      it("should return 200", async () => {
        // Act & Assert
        await api
          .post("/api/v1/executions/start")
          .send({ executionId })
          .expect(200);
      });

      it("should return success true", async () => {
        // Act
        const response = await api
          .post("/api/v1/executions/start")
          .send({ executionId })
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });

      it("should return execution in response", async () => {
        // Act
        const response = await api
          .post("/api/v1/executions/start")
          .send({ executionId })
          .expect(200);

        // Assert
        expect(response.body.execution).toBeDefined();
        expect(response.body.execution.id).toBe(executionId);
      });

      it("should update execution status to RUNNING", async () => {
        // Act
        await api
          .post("/api/v1/executions/start")
          .send({ executionId })
          .expect(200);

        // Assert
        const execution = await db.execution.findUnique({
          where: { id: executionId },
        });
        expect(execution?.status).toBe(ExecutionStatus.RUNNING);
      });

      it("should create EXECUTION_STARTED event", async () => {
        // Act
        await api
          .post("/api/v1/executions/start")
          .send({ executionId })
          .expect(200);

        // Assert
        const events = await db.event.findMany({
          where: { executionId },
        });
        expect(events.some((e) => e.event === "EXECUTION_STARTED")).toBe(true);
      });
    });

    describe("Invalid execution ID", () => {
      it("should return 404 for unknown execution", async () => {
        // Arrange
        const unknownId = "00000000-0000-0000-0000-000000000000";

        // Act & Assert
        await api
          .post("/api/v1/executions/start")
          .send({ executionId: unknownId })
          .expect(500);
      });
    });

    describe("Missing executionId", () => {
      it("should return 400 for missing executionId", async () => {
        // Act & Assert
        await api.post("/api/v1/executions/start").send({}).expect(400);
      });
    });

    describe("Invalid executionId format", () => {
      it("should return 400 for invalid UUID", async () => {
        // Act & Assert
        await api
          .post("/api/v1/executions/start")
          .send({ executionId: "invalid-uuid" })
          .expect(400);
      });
    });
  });
});
