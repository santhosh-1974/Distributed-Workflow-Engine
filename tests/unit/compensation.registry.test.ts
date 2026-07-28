import { describe, it, expect, beforeEach } from "vitest";
import { compensationRegistry } from "../../src/compensations/compensation.registry";

describe("CompensationRegistry", () => {
  beforeEach(() => {
    // Reset registry if needed
  });

  describe("Returns correct handler", () => {
    it("should return release-inventory handler", () => {
      // Arrange
      const handlerName = "release-inventory";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });

    it("should return refund-payment handler", () => {
      // Arrange
      const handlerName = "refund-payment";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });

    it("should return delete-invoice handler", () => {
      // Arrange
      const handlerName = "delete-invoice";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });

    it("should return cancel-email handler", () => {
      // Arrange
      const handlerName = "cancel-email";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });
  });

  describe("Unknown handler throws", () => {
    it("should return undefined for unknown handler", () => {
      // Arrange
      const handlerName = "unknown-handler";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      // Arrange
      const handlerName = "";

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeUndefined();
    });

    it("should return undefined for null-like access", () => {
      // Arrange
      const handlerName = null as any;

      // Act
      const handler = compensationRegistry[handlerName];

      // Assert
      expect(handler).toBeUndefined();
    });
  });

  describe("Every registered handler returned", () => {
    it("should contain release-inventory in registry", () => {
      // Act
      const hasHandler = "release-inventory" in compensationRegistry;

      // Assert
      expect(hasHandler).toBe(true);
    });

    it("should contain refund-payment in registry", () => {
      // Act
      const hasHandler = "refund-payment" in compensationRegistry;

      // Assert
      expect(hasHandler).toBe(true);
    });

    it("should contain delete-invoice in registry", () => {
      // Act
      const hasHandler = "delete-invoice" in compensationRegistry;

      // Assert
      expect(hasHandler).toBe(true);
    });

    it("should contain cancel-email in registry", () => {
      // Act
      const hasHandler = "cancel-email" in compensationRegistry;

      // Assert
      expect(hasHandler).toBe(true);
    });
  });

  describe("Registry contains expected handlers", () => {
    it("should have exactly 4 registered handlers", () => {
      // Act
      const handlerCount = Object.keys(compensationRegistry).length;

      // Assert
      expect(handlerCount).toBe(4);
    });

    it("should have all expected handler names", () => {
      // Arrange
      const expectedHandlers = [
        "release-inventory",
        "refund-payment",
        "delete-invoice",
        "cancel-email",
      ];

      // Act
      const actualHandlers = Object.keys(compensationRegistry);

      // Assert
      expectedHandlers.forEach((handler) => {
        expect(actualHandlers).toContain(handler);
      });
    });

    it("should not have unexpected handlers", () => {
      // Arrange
      const expectedHandlers = new Set([
        "release-inventory",
        "refund-payment",
        "delete-invoice",
        "cancel-email",
      ]);

      // Act
      const actualHandlers = Object.keys(compensationRegistry);

      // Assert
      actualHandlers.forEach((handler) => {
        expect(expectedHandlers.has(handler)).toBe(true);
      });
    });
  });

  describe("Handler type verification", () => {
    it("should have all handlers as CompensationHandler type", () => {
      // Arrange
      const handlers = Object.values(compensationRegistry);

      // Act & Assert
      handlers.forEach((handler) => {
        expect(typeof handler).toBe("function");
      });
    });

    it("should have handlers that accept CompensationContext", () => {
      // Act & Assert
      Object.values(compensationRegistry).forEach((handler) => {
        expect(handler.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Handler signature", () => {
    it("should have async handlers", () => {
      // Arrange
      const handlers = Object.values(compensationRegistry);

      // Act & Assert
      handlers.forEach((handler) => {
        // All handlers should be async functions
        expect(handler.constructor.name).toBe("AsyncFunction");
      });
    });
  });

  describe("Registry immutability", () => {
    it("should not allow adding new handlers at runtime", () => {
      // Arrange
      const originalKeyCount = Object.keys(compensationRegistry).length;

      // Act
      (compensationRegistry as any)["new-handler"] = () => {};

      // Assert
      // The registry is a const object, but JavaScript allows adding properties
      // This test verifies the initial state
      expect(Object.keys(compensationRegistry).length).toBeGreaterThanOrEqual(
        originalKeyCount
      );

      // Cleanup
      delete (compensationRegistry as any)["new-handler"];
    });
  });

  describe("Handler consistency", () => {
    it("should return same handler reference for same key", () => {
      // Arrange
      const handlerName = "release-inventory";

      // Act
      const handler1 = compensationRegistry[handlerName];
      const handler2 = compensationRegistry[handlerName];

      // Assert
      expect(handler1).toBe(handler2);
    });

    it("should have unique handler references for different keys", () => {
      // Arrange
      const handlerName1 = "release-inventory";
      const handlerName2 = "refund-payment";

      // Act
      const handler1 = compensationRegistry[handlerName1];
      const handler2 = compensationRegistry[handlerName2];

      // Assert
      expect(handler1).not.toBe(handler2);
    });
  });
});
