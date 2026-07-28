import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/db/prisma";
import { resetDatabase } from "../helpers/database";
import { flushRedis } from "../helpers/redis";

describe("Concurrency API Tests", () => {
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

  describe("10 simultaneous requests", () => {
    it("should handle 10 simultaneous workflow start requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
      });
    });

    it("should return unique execution ids for 10 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);
      const executionIds = responses.map((r) => r.body.id);

      // Assert
      const uniqueIds = new Set(executionIds);
      expect(uniqueIds.size).toBe(10);
    });

    it("should not create duplicate workflows for 10 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);

      // Assert
      const workflows = await db.workflow.findMany({
        where: { name: "Order Workflow" },
      });
      expect(workflows.length).toBe(1);
    });

    it("should maintain database consistency for 10 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      const executionIds = responses.map((r) => r.body.id);
      const executions = await db.execution.findMany({
        where: { id: { in: executionIds } },
      });
      expect(executions.length).toBe(10);
    });
  });

  describe("20 simultaneous requests", () => {
    it("should handle 20 simultaneous workflow start requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
      });
    });

    it("should return unique execution ids for 20 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);
      const executionIds = responses.map((r) => r.body.id);

      // Assert
      const uniqueIds = new Set(executionIds);
      expect(uniqueIds.size).toBe(20);
    });

    it("should not create duplicate workflows for 20 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);

      // Assert
      const workflows = await db.workflow.findMany({
        where: { name: "Order Workflow" },
      });
      expect(workflows.length).toBe(1);
    });

    it("should maintain database consistency for 20 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      const executionIds = responses.map((r) => r.body.id);
      const executions = await db.execution.findMany({
        where: { id: { in: executionIds } },
      });
      expect(executions.length).toBe(20);
    });
  });

  describe("50 simultaneous requests", () => {
    it("should handle 50 simultaneous workflow start requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 50 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
      });
    });

    it("should return unique execution ids for 50 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 50 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);
      const executionIds = responses.map((r) => r.body.id);

      // Assert
      const uniqueIds = new Set(executionIds);
      expect(uniqueIds.size).toBe(50);
    });

    it("should not create duplicate workflows for 50 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 50 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);

      // Assert
      const workflows = await db.workflow.findMany({
        where: { name: "Order Workflow" },
      });
      expect(workflows.length).toBe(1);
    });

    it("should maintain database consistency for 50 requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 50 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      const executionIds = responses.map((r) => r.body.id);
      const executions = await db.execution.findMany({
        where: { id: { in: executionIds } },
      });
      expect(executions.length).toBe(50);
    });
  });

  describe("Mixed concurrent operations", () => {
    it("should handle concurrent POST and GET requests", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const postRequests = Array.from({ length: 5 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const getRequests = Array.from({ length: 5 }, () =>
        api.get("/api/v1/workflows")
      );

      const responses = await Promise.all([...postRequests, ...getRequests]);

      // Assert
      const postResponses = responses.slice(0, 5);
      const getResponses = responses.slice(5);

      postResponses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      getResponses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should handle concurrent execution starts", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send(payload)
        .expect(201);

      const executionId = createResponse.body.id;

      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/executions/start").send({ executionId })
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Race conditions", () => {
    it("should not have race conditions on workflow creation", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);

      // Assert
      const workflows = await db.workflow.findMany();
      expect(workflows.length).toBe(1);
    });

    it("should not have race conditions on execution creation", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      const executionIds = responses.map((r) => r.body.id);
      const executions = await db.execution.findMany({
        where: { id: { in: executionIds } },
      });
      expect(executions.length).toBe(20);
    });
  });

  describe("Performance under concurrency", () => {
    it("should complete 10 requests within reasonable time", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const startTime = Date.now();
      const requests = Array.from({ length: 10 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000);
    });

    it("should complete 20 requests within reasonable time", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const startTime = Date.now();
      const requests = Array.from({ length: 20 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(10000);
    });

    it("should complete 50 requests within reasonable time", async () => {
      // Arrange
      const payload = {
        workflowId: "order",
      };

      // Act
      const startTime = Date.now();
      const requests = Array.from({ length: 50 }, () =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(20000);
    });
  });

  describe("Concurrent read operations", () => {
    it("should handle concurrent GET requests for workflows", async () => {
      // Arrange
      await api.post("/api/v1/workflows/start").send({ workflowId: "order" });

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.get("/api/v1/workflows")
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should handle concurrent GET requests for executions", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const requests = Array.from({ length: 20 }, () =>
        api.get(`/api/v1/executions/${executionId}`)
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Concurrent mixed workflows", () => {
    it("should handle concurrent requests for different workflows", async () => {
      // Arrange
      const payloads = [
        { workflowId: "order" },
        { workflowId: "order" },
        { workflowId: "order" },
      ];

      // Act
      const requests = payloads.map((payload) =>
        api.post("/api/v1/workflows/start").send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });
  });
});
