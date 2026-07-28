import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as eventRepository from "../../src/db/repositories/event.repository";
import { db } from "../../src/db/prisma";
import { EventType } from "@prisma/client";

vi.mock("../../src/db/prisma");

describe("EventRepository", () => {
  const mockExecutionId = "exec-123";
  const mockEventId = "event-456";

  const mockEvent = {
    id: mockEventId,
    executionId: mockExecutionId,
    event: EventType.EXECUTION_CREATED,
    metadata: {
      workflowId: "workflow-789",
      executionId: mockExecutionId,
    },
    timestamp: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createEvent", () => {
    it("should call Prisma create with correct data", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      vi.mocked(db.event.create).mockResolvedValue(mockEvent);

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should return created event", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      vi.mocked(db.event.create).mockResolvedValue(mockEvent);

      // Act
      const result = await eventRepository.createEvent(createData);

      // Assert
      expect(result).toEqual(mockEvent);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      const error = new Error("Prisma error");
      vi.mocked(db.event.create).mockRejectedValue(error);

      // Act & Assert
      await expect(eventRepository.createEvent(createData)).rejects.toThrow(
        "Prisma error"
      );
    });

    it("should handle unique constraint violations", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      const error = new Error("Unique constraint failed");
      (error as any).code = "P2002";
      vi.mocked(db.event.create).mockRejectedValue(error);

      // Act & Assert
      await expect(eventRepository.createEvent(createData)).rejects.toThrow(
        "Unique constraint failed"
      );
    });

    it("should handle foreign key constraint violations", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      const error = new Error("Foreign key constraint failed");
      (error as any).code = "P2003";
      vi.mocked(db.event.create).mockRejectedValue(error);

      // Act & Assert
      await expect(eventRepository.createEvent(createData)).rejects.toThrow(
        "Foreign key constraint failed"
      );
    });

    it("should handle null metadata", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: null as any,
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        metadata: null,
      });

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe("getEventsByExecutionId", () => {
    it("should call Prisma findMany with correct where clause", async () => {
      // Arrange
      vi.mocked(db.event.findMany).mockResolvedValue([mockEvent]);

      // Act
      await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(db.event.findMany).toHaveBeenCalledWith({
        where: { executionId: mockExecutionId },
        orderBy: { timestamp: "asc" },
      });
    });

    it("should call Prisma findMany with correct orderBy", async () => {
      // Arrange
      vi.mocked(db.event.findMany).mockResolvedValue([mockEvent]);

      // Act
      await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(db.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { timestamp: "asc" },
        })
      );
    });

    it("should return array of events", async () => {
      // Arrange
      const events = [
        mockEvent,
        {
          ...mockEvent,
          id: "event-789",
          event: EventType.EXECUTION_STARTED,
        },
      ];
      vi.mocked(db.event.findMany).mockResolvedValue(events);

      // Act
      const result = await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(result).toEqual(events);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no events", async () => {
      // Arrange
      vi.mocked(db.event.findMany).mockResolvedValue([]);

      // Act
      const result = await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(db.event.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        eventRepository.getEventsByExecutionId(mockExecutionId)
      ).rejects.toThrow("Database error");
    });

    it("should handle connection timeout", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(db.event.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        eventRepository.getEventsByExecutionId(mockExecutionId)
      ).rejects.toThrow("Connection timeout");
    });

    it("should handle invalid execution ID", async () => {
      // Arrange
      const invalidId = "invalid-id";
      vi.mocked(db.event.findMany).mockResolvedValue([]);

      // Act
      const result = await eventRepository.getEventsByExecutionId(invalidId);

      // Assert
      expect(result).toEqual([]);
      expect(db.event.findMany).toHaveBeenCalledWith({
        where: { executionId: invalidId },
        orderBy: { timestamp: "asc" },
      });
    });
  });

  describe("Prisma method call verification", () => {
    it("should call create method exactly once", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: "workflow-789",
          executionId: mockExecutionId,
        },
      };
      vi.mocked(db.event.create).mockResolvedValue(mockEvent);

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledTimes(1);
    });

    it("should call findMany method exactly once", async () => {
      // Arrange
      vi.mocked(db.event.findMany).mockResolvedValue([mockEvent]);

      // Act
      await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(db.event.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error propagation", () => {
    it("should propagate network errors", async () => {
      // Arrange
      const error = new Error("ECONNREFUSED");
      vi.mocked(db.event.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        eventRepository.createEvent({
          execution: { connect: { id: mockExecutionId } },
          event: EventType.EXECUTION_CREATED,
          metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
        })
      ).rejects.toThrow("ECONNREFUSED");
    });

    it("should propagate timeout errors", async () => {
      // Arrange
      const error = new Error("ETIMEDOUT");
      vi.mocked(db.event.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        eventRepository.getEventsByExecutionId(mockExecutionId)
      ).rejects.toThrow("ETIMEDOUT");
    });

    it("should propagate authentication errors", async () => {
      // Arrange
      const error = new Error("Authentication failed");
      vi.mocked(db.event.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        eventRepository.createEvent({
          execution: { connect: { id: mockExecutionId } },
          event: EventType.EXECUTION_CREATED,
          metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
        })
      ).rejects.toThrow("Authentication failed");
    });
  });

  describe("Returned values", () => {
    it("should return event with all fields", async () => {
      // Arrange
      vi.mocked(db.event.create).mockResolvedValue(mockEvent);

      // Act
      const result = await eventRepository.createEvent({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      });

      // Assert
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("executionId");
      expect(result).toHaveProperty("event");
      expect(result).toHaveProperty("metadata");
      expect(result).toHaveProperty("timestamp");
    });

    it("should preserve event type", async () => {
      // Arrange
      vi.mocked(db.event.create).mockResolvedValue(mockEvent);

      // Act
      const result = await eventRepository.createEvent({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      });

      // Assert
      expect(result.event).toBe(EventType.EXECUTION_CREATED);
    });

    it("should preserve metadata structure", async () => {
      // Arrange
      const metadata = {
        workflowId: "workflow-789",
        executionId: mockExecutionId,
        customField: "custom-value",
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        metadata,
      });

      // Act
      const result = await eventRepository.createEvent({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata,
      });

      // Assert
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe("Event type handling", () => {
    it("should handle EXECUTION_CREATED event", async () => {
      // Arrange
      const createData = {
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        event: EventType.EXECUTION_CREATED,
      });

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should handle EXECUTION_STARTED event", async () => {
      // Arrange
      const createData = {
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_STARTED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        event: EventType.EXECUTION_STARTED,
      });

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should handle EXECUTION_COMPLETED event", async () => {
      // Arrange
      const createData = {
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_COMPLETED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        event: EventType.EXECUTION_COMPLETED,
      });

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should handle TASK_CREATED event", async () => {
      // Arrange
      const createData = {
        execution: { connect: { id: mockExecutionId } },
        event: EventType.TASK_CREATED,
        metadata: { workflowId: "workflow-789", executionId: mockExecutionId },
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        event: EventType.TASK_CREATED,
      });

      // Act
      await eventRepository.createEvent(createData);

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe("Query ordering", () => {
    it("should order events by timestamp ascending", async () => {
      // Arrange
      vi.mocked(db.event.findMany).mockResolvedValue([mockEvent]);

      // Act
      await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(db.event.findMany).toHaveBeenCalledWith({
        where: { executionId: mockExecutionId },
        orderBy: { timestamp: "asc" },
      });
    });

    it("should return events in chronological order", async () => {
      // Arrange
      const event1 = {
        ...mockEvent,
        id: "event-1",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };
      const event2 = {
        ...mockEvent,
        id: "event-2",
        timestamp: new Date("2024-01-01T11:00:00Z"),
      };
      const event3 = {
        ...mockEvent,
        id: "event-3",
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };
      vi.mocked(db.event.findMany).mockResolvedValue([event1, event2, event3]);

      // Act
      const result = await eventRepository.getEventsByExecutionId(mockExecutionId);

      // Assert
      expect(result[0].timestamp < result[1].timestamp).toBe(true);
      expect(result[1].timestamp < result[2].timestamp).toBe(true);
    });
  });

  describe("Metadata handling", () => {
    it("should handle complex nested metadata", async () => {
      // Arrange
      const complexMetadata = {
        workflowId: "workflow-789",
        executionId: mockExecutionId,
        nested: {
          level1: {
            level2: {
              value: "deep",
            },
          },
        },
        array: [1, 2, 3],
      };
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        metadata: complexMetadata,
      });

      // Act
      await eventRepository.createEvent({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: complexMetadata,
      });

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: complexMetadata,
        }),
      });
    });

    it("should handle empty metadata object", async () => {
      // Arrange
      const emptyMetadata = {};
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        metadata: emptyMetadata,
      });

      // Act
      await eventRepository.createEvent({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: emptyMetadata,
      });

      // Assert
      expect(db.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: emptyMetadata,
        }),
      });
    });
  });
});
