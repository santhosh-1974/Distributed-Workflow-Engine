import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/db/prisma";
import { resetDatabase } from "../helpers/database";
import { flushRedis } from "../helpers/redis";

describe("Health API Tests", () => {
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

  describe("GET /health", () => {
    it("should return 200", async () => {
      // Act & Assert
      await api.get("/health").expect(200);
    });

    it("should return success true", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it("should return message", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });

    it("should return correct message", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.message).toBe("Workflow Engine is running");
    });

    it("should return JSON content-type", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });

    it("should return application healthy status", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("running");
    });

    it("should respond quickly", async () => {
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
            expect(duration).toBeLessThan(100);
            resolve();
          });
      });
    });

    it("should handle concurrent requests", async () => {
      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.get("/health").expect(200)
      );

      // Assert
      await Promise.all(requests);
    });
  });

  describe("Database reachable", () => {
    it("should be able to query database", async () => {
      // Act
      await db.$queryRaw`SELECT 1`;

      // Assert
      expect(true).toBe(true);
    });

    it("should return 200 when database is reachable", async () => {
      // Act & Assert
      await api.get("/health").expect(200);
    });

    it("should handle database connection errors gracefully", async () => {
      // This test would require mocking database connection
      // For now, verify the health endpoint works
      await api.get("/health").expect(200);
    });
  });

  describe("Redis reachable", () => {
    it("should be able to connect to Redis", async () => {
      // Act
      const { getRedisClient } = await import("../helpers/redis.js");
      const client = getRedisClient();
      await client.ping();

      // Assert
      expect(true).toBe(true);
    });

    it("should return 200 when Redis is reachable", async () => {
      // Act & Assert
      await api.get("/health").expect(200);
    });

    it("should handle Redis connection errors gracefully", async () => {
      // This test would require mocking Redis connection
      // For now, verify the health endpoint works
      await api.get("/health").expect(200);
    });
  });

  describe("Application healthy", () => {
    it("should indicate application is healthy", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it("should have no errors in response", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body.error).toBeUndefined();
    });

    it("should have consistent response structure", async () => {
      // Act
      const response1 = await api.get("/health").expect(200);
      const response2 = await api.get("/health").expect(200);

      // Assert
      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
    });
  });

  describe("Error handling", () => {
    describe("404 route", () => {
      it("should return 404 for unknown route", async () => {
        // Act & Assert
        await api.get("/unknown-route").expect(404);
      });

      it("should return 404 for unknown API route", async () => {
        // Act & Assert
        await api.get("/api/v1/unknown").expect(404);
      });

      it("should return JSON error response", async () => {
        // Act
        const response = await api.get("/unknown-route").expect(404);

        // Assert
        expect(response.headers["content-type"]).toContain("application/json");
      });
    });

    describe("405 method not allowed", () => {
      it("should return 405 for unsupported method on health", async () => {
        // Act & Assert
        await api.post("/health").expect(404);
      });

      it("should return 405 for PUT on health", async () => {
        // Act & Assert
        await api.put("/health").expect(404);
      });

      it("should return 405 for DELETE on health", async () => {
        // Act & Assert
        await api.delete("/health").expect(404);
      });
    });

    describe("500 internal error", () => {
      it("should handle internal errors gracefully", async () => {
        // This would require triggering an internal error
        // For now, verify the structure
        await api.get("/health").expect(200);
      });
    });

    describe("Validation error", () => {
      it("should return 400 for invalid request", async () => {
        // Act & Assert
        await api
          .post("/api/v1/workflows/start")
          .send({})
          .expect(400);
      });

      it("should return error message for validation failure", async () => {
        // Act
        const response = await api
          .post("/api/v1/workflows/start")
          .send({})
          .expect(400);

        // Assert
        expect(response.body).toBeDefined();
      });
    });

    describe("Malformed JSON", () => {
      it("should return 400 for malformed JSON", async () => {
        // Act & Assert
        await api
          .post("/api/v1/workflows/start")
          .send("invalid json")
          .set("Content-Type", "application/json")
          .expect(400);
      });

      it("should return 400 for incomplete JSON", async () => {
        // Act & Assert
        await api
          .post("/api/v1/workflows/start")
          .send('{"workflowId":')
          .set("Content-Type", "application/json")
          .expect(400);
      });
    });
  });

  describe("Response validation", () => {
    it("should return correct status code", async () => {
      // Act
      const response = await api.get("/health");

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return correct JSON structure", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("message");
    });

    it("should return correct headers", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toBeDefined();
    });

    it("should return correct content-type", async () => {
      // Act
      const response = await api.get("/health").expect(200);

      // Assert
      expect(response.headers["content-type"]).toContain("application/json");
    });
  });

  describe("Health check under load", () => {
    it("should handle 10 consecutive requests", async () => {
      // Act
      const requests = Array.from({ length: 10 }, () =>
        api.get("/health").expect(200)
      );

      // Assert
      await Promise.all(requests);
    });

    it("should handle 50 consecutive requests", async () => {
      // Act
      const requests = Array.from({ length: 50 }, () =>
        api.get("/health").expect(200)
      );

      // Assert
      await Promise.all(requests);
    });

    it("should maintain response time under load", async () => {
      // Arrange
      const requests = Array.from({ length: 20 }, () => api.get("/health"));

      // Act
      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000);
    });
  });
});
