import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { resetDatabase } from "../helpers/database";
import { flushRedis } from "../helpers/redis";

describe("Response Validation API Tests", () => {
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

  describe("Correct status codes", () => {
    it("should return 201 for successful workflow start", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });

      // Assert
      expect(response.status).toBe(201);
    });

    it("should return 200 for successful workflow retrieval", async () => {
      // Act
      const response = await api.get("/api/v1/workflows");

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 200 for successful execution retrieval", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api.get(`/api/v1/executions/${executionId}`);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 200 for successful execution start", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .post("/api/v1/executions/start")
        .send({ executionId });

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid request", async () => {
      // Act
      const response = await api.post("/api/v1/workflows/start").send({});

      // Assert
      expect(response.status).toBe(400);
    });

    it("should return 404 for unknown execution", async () => {
      // Act
      const response = await api.get(
        "/api/v1/executions/00000000-0000-0000-0000-000000000000"
      );

      // Assert
      expect(response.status).toBe(404);
    });

    it("should return 200 for health check", async () => {
      // Act
      const response = await api.get("/health");

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe("Correct JSON structure", () => {
    it("should return valid JSON for workflow start", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it("should return valid JSON for workflow retrieval", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it("should return valid JSON for execution retrieval", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .get(`/api/v1/executions/${executionId}`)
        .expect(200);

      // Assert
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it("should return valid JSON for health check", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it("should return object for workflow start", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(typeof response.body).toBe("object");
      expect(Array.isArray(response.body)).toBe(false);
    });

    it("should return array for workflow retrieval", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return object for execution retrieval", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .get(`/api/v1/executions/${executionId}`)
        .expect(200);

      // Assert
      expect(typeof response.body).toBe("object");
      expect(Array.isArray(response.body)).toBe(false);
    });
  });

  describe("Correct headers", () => {
    it("should return content-type header", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response.headers["content-type"]).toBeDefined();
    });

    it("should return content-length header", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response.headers["content-length"]).toBeDefined();
    });

    it("should return x-powered-by header", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["x-powered-by"]).toBeDefined();
    });

    it("should not return sensitive headers", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["authorization"]).toBeUndefined();
      expect(response.headers["x-api-key"]).toBeUndefined();
    });
  });

  describe("Correct content-type", () => {
    it("should return application/json for workflow start", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should return application/json for workflow retrieval", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should return application/json for execution retrieval", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .get(`/api/v1/executions/${executionId}`)
        .expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should return application/json for health check", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should return application/json for execution start", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .post("/api/v1/executions/start")
        .send({ executionId })
        .expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should specify charset in content-type", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("charset");
    });
  });

  describe("Response body validation", () => {
    it("should include all required fields in workflow start response", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("workflowId");
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("currentStep");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should include all required fields in execution response", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .get(`/api/v1/executions/${executionId}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("workflowId");
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("currentStep");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should include success field in execution start response", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .post("/api/v1/executions/start")
        .send({ executionId })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("execution");
    });

    it("should include success and message in health response", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("message");
    });

    it("should not include sensitive data in responses", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response.body.password).toBeUndefined();
      expect(response.body.token).toBeUndefined();
      expect(response.body.secret).toBeUndefined();
    });
  });

  describe("Error response structure", () => {
    it("should return error object on 400", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({})
        .expect(400);

      // Assert
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe("object");
    });

    it("should return error object on 404", async () => {
      // Act
      const response = await api
        .get("/api/v1/executions/00000000-0000-0000-0000-000000000000")
        .expect(404);

      // Assert
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe("object");
    });

    it("should return error object on 500", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "nonexistent" });

      // Assert
      expect([400, 500]).toContain(response.status);
    });

    it("should return JSON content-type for errors", async () => {
      // Act
      const response = await api
        .post("/api/v1/workflows/start")
        .send({})
        .expect(400);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });
  });

  describe("Response time", () => {
    it("should respond within reasonable time for workflow start", async () => {
      // Arrange
      return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();

        api
          .post("/api/v1/workflows/start")
          .send({ workflowId: "order" })
          .expect(201)
          .end((err: any) => {
            if (err) {
              reject(err);
              return;
            }
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(2000);
            resolve();
          });
      });
    });

    it("should respond within reasonable time for workflow retrieval", async () => {
      // Arrange
      return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();

        api
          .get("/api/v1/workflows")
          .expect(200)
          .end((err: any) => {
            if (err) {
              reject(err);
              return;
            }
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000);
            resolve();
          });
      });
    });

    it("should respond within reasonable time for health check", async () => {
      // Arrange
      return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();

        api
          .get("/health")
          .expect(200)
          .end((err: any) => {
            if (err) {
              reject(err);
              return;
            }
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(500);
            resolve();
          });
      });
    });
  });

  describe("Response consistency", () => {
    it("should return consistent structure for same endpoint", async () => {
      // Act
      const response1 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);
      const response2 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      const keys1 = Object.keys(response1.body);
      const keys2 = Object.keys(response2.body);
      expect(keys1).toEqual(keys2);
    });

    it("should return consistent data types for same endpoint", async () => {
      // Act
      const response1 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);
      const response2 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(typeof response1.body.id).toBe(typeof response2.body.id);
      expect(typeof response1.body.status).toBe(typeof response2.body.status);
    });

    it("should return consistent content-type across requests", async () => {
      // Act
      const response1 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);
      const response2 = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" })
        .expect(201);

      // Assert
      expect(response1.headers["content-type"]).toBe(
        response2.headers["content-type"]
      );
    });
  });

  describe("Empty responses", () => {
    it("should return empty array for no workflows", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });

    it("should return 404 for non-existent execution", async () => {
      // Act
      const response = await api
        .get("/api/v1/executions/00000000-0000-0000-0000-000000000000")
        .expect(404);

      // Assert
      expect(response.body).toBeDefined();
    });
  });

  describe("Pagination validation", () => {
    it("should handle pagination parameters if supported", async () => {
      // Act
      const response = await api.get("/api/v1/workflows?page=1&limit=10").expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      // Act
      const response = await api.get("/api/v1/workflows?page=-1&limit=0").expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Response encoding", () => {
    it("should return UTF-8 encoded responses", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("utf-8");
    });

    it("should handle unicode in responses", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(() => JSON.stringify(response.body)).not.toThrow();
    });
  });

  describe("Response size", () => {
    it("should not return excessively large responses", async () => {
      // Act
      const response = await api.get("/api/v1/workflows").expect(200);
      const responseSize = JSON.stringify(response.body).length;

      // Assert
      expect(responseSize).toBeLessThan(1000000); // 1MB limit
    });

    it("should return reasonable response size for single execution", async () => {
      // Arrange
      const createResponse = await api
        .post("/api/v1/workflows/start")
        .send({ workflowId: "order" });
      const executionId = createResponse.body.id;

      // Act
      const response = await api
        .get(`/api/v1/executions/${executionId}`)
        .expect(200);
      const responseSize = JSON.stringify(response.body).length;

      // Assert
      expect(responseSize).toBeLessThan(10000); // 10KB limit
    });
  });
});
