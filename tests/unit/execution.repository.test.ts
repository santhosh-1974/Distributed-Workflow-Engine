import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as executionRepository from "../../src/db/repositories/execution.repository";
import { db } from "../../src/db/prisma";
import { ExecutionStatus } from "@prisma/client";

vi.mock("../../src/db/prisma");

describe("ExecutionRepository", () => {
  const mockExecutionId = "exec-123";
  const mockWorkflowId = "workflow-456";

  const mockExecution = {
    id: mockExecutionId,
    workflowId: mockWorkflowId,
    status: ExecutionStatus.CREATED,
    currentStep: 0,
    startedAt: new Date(),
    completedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createExecution", () => {
    it("should call Prisma create with correct data", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      vi.mocked(db.execution.create).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.createExecution(createData);

      // Assert
      expect(db.execution.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should return created execution", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      vi.mocked(db.execution.create).mockResolvedValue(mockExecution);

      // Act
      const result = await executionRepository.createExecution(createData);

      // Assert
      expect(result).toEqual(mockExecution);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      const error = new Error("Prisma error");
      vi.mocked(db.execution.create).mockRejectedValue(error);

      // Act & Assert
      await expect(executionRepository.createExecution(createData)).rejects.toThrow(
        "Prisma error"
      );
    });

    it("should handle unique constraint violations", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      const error = new Error("Unique constraint failed");
      (error as any).code = "P2002";
      vi.mocked(db.execution.create).mockRejectedValue(error);

      // Act & Assert
      await expect(executionRepository.createExecution(createData)).rejects.toThrow(
        "Unique constraint failed"
      );
    });

    it("should handle foreign key constraint violations", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      const error = new Error("Foreign key constraint failed");
      (error as any).code = "P2003";
      vi.mocked(db.execution.create).mockRejectedValue(error);

      // Act & Assert
      await expect(executionRepository.createExecution(createData)).rejects.toThrow(
        "Foreign key constraint failed"
      );
    });
  });

  describe("getExecutionById", () => {
    it("should call Prisma findUnique with correct where clause", async () => {
      // Arrange
      vi.mocked(db.execution.findUnique).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.getExecutionById(mockExecutionId);

      // Assert
      expect(db.execution.findUnique).toHaveBeenCalledWith({
        where: { id: mockExecutionId },
      });
    });

    it("should return execution when found", async () => {
      // Arrange
      vi.mocked(db.execution.findUnique).mockResolvedValue(mockExecution);

      // Act
      const result = await executionRepository.getExecutionById(mockExecutionId);

      // Assert
      expect(result).toEqual(mockExecution);
    });

    it("should return null when not found", async () => {
      // Arrange
      vi.mocked(db.execution.findUnique).mockResolvedValue(null);

      // Act
      const result = await executionRepository.getExecutionById(mockExecutionId);

      // Assert
      expect(result).toBeNull();
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(db.execution.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.getExecutionById(mockExecutionId)
      ).rejects.toThrow("Database error");
    });

    it("should handle connection errors", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(db.execution.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.getExecutionById(mockExecutionId)
      ).rejects.toThrow("Connection timeout");
    });
  });

  describe("updateExecution", () => {
    it("should call Prisma update with correct where clause", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
      };
      vi.mocked(db.execution.update).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.updateExecution(mockExecutionId, updateData);

      // Assert
      expect(db.execution.update).toHaveBeenCalledWith({
        where: { id: mockExecutionId },
        data: updateData,
      });
    });

    it("should call Prisma update with correct update payload", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
        currentStep: {
          increment: 1,
        },
      };
      vi.mocked(db.execution.update).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.updateExecution(mockExecutionId, updateData);

      // Assert
      expect(db.execution.update).toHaveBeenCalledWith({
        where: { id: mockExecutionId },
        data: updateData,
      });
    });

    it("should return updated execution", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
      };
      const updatedExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
      };
      vi.mocked(db.execution.update).mockResolvedValue(updatedExecution);

      // Act
      const result = await executionRepository.updateExecution(
        mockExecutionId,
        updateData
      );

      // Assert
      expect(result).toEqual(updatedExecution);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
      };
      const error = new Error("Update failed");
      vi.mocked(db.execution.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.updateExecution(mockExecutionId, updateData)
      ).rejects.toThrow("Update failed");
    });

    it("should handle record not found errors", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
      };
      const error = new Error("Record not found");
      (error as any).code = "P2025";
      vi.mocked(db.execution.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.updateExecution(mockExecutionId, updateData)
      ).rejects.toThrow("Record not found");
    });

    it("should handle validation errors", async () => {
      // Arrange
      const updateData = {
        status: "INVALID_STATUS" as any,
      };
      const error = new Error("Validation error");
      (error as any).code = "P2007";
      vi.mocked(db.execution.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.updateExecution(mockExecutionId, updateData)
      ).rejects.toThrow("Validation error");
    });
  });

  describe("getRunningExecutions", () => {
    it("should call Prisma findMany with correct where clause", async () => {
      // Arrange
      vi.mocked(db.execution.findMany).mockResolvedValue([mockExecution]);

      // Act
      await executionRepository.getRunningExecutions();

      // Assert
      expect(db.execution.findMany).toHaveBeenCalledWith({
        where: { status: ExecutionStatus.RUNNING },
      });
    });

    it("should return array of running executions", async () => {
      // Arrange
      const runningExecutions = [
        mockExecution,
        {
          ...mockExecution,
          id: "exec-456",
        },
      ];
      vi.mocked(db.execution.findMany).mockResolvedValue(runningExecutions);

      // Act
      const result = await executionRepository.getRunningExecutions();

      // Assert
      expect(result).toEqual(runningExecutions);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no running executions", async () => {
      // Arrange
      vi.mocked(db.execution.findMany).mockResolvedValue([]);

      // Act
      const result = await executionRepository.getRunningExecutions();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(db.execution.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(executionRepository.getRunningExecutions()).rejects.toThrow(
        "Database error"
      );
    });

    it("should handle connection timeout", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(db.execution.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(executionRepository.getRunningExecutions()).rejects.toThrow(
        "Connection timeout"
      );
    });
  });

  describe("Prisma method call verification", () => {
    it("should call create method exactly once", async () => {
      // Arrange
      const createData = {
        workflow: {
          connect: {
            id: mockWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      };
      vi.mocked(db.execution.create).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.createExecution(createData);

      // Assert
      expect(db.execution.create).toHaveBeenCalledTimes(1);
    });

    it("should call findUnique method exactly once", async () => {
      // Arrange
      vi.mocked(db.execution.findUnique).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.getExecutionById(mockExecutionId);

      // Assert
      expect(db.execution.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should call update method exactly once", async () => {
      // Arrange
      const updateData = {
        status: ExecutionStatus.RUNNING,
      };
      vi.mocked(db.execution.update).mockResolvedValue(mockExecution);

      // Act
      await executionRepository.updateExecution(mockExecutionId, updateData);

      // Assert
      expect(db.execution.update).toHaveBeenCalledTimes(1);
    });

    it("should call findMany method exactly once", async () => {
      // Arrange
      vi.mocked(db.execution.findMany).mockResolvedValue([mockExecution]);

      // Act
      await executionRepository.getRunningExecutions();

      // Assert
      expect(db.execution.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error propagation", () => {
    it("should propagate network errors", async () => {
      // Arrange
      const error = new Error("ECONNREFUSED");
      vi.mocked(db.execution.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.createExecution({
          workflow: { connect: { id: mockWorkflowId } },
          status: ExecutionStatus.CREATED,
        })
      ).rejects.toThrow("ECONNREFUSED");
    });

    it("should propagate timeout errors", async () => {
      // Arrange
      const error = new Error("ETIMEDOUT");
      vi.mocked(db.execution.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.getExecutionById(mockExecutionId)
      ).rejects.toThrow("ETIMEDOUT");
    });

    it("should propagate authentication errors", async () => {
      // Arrange
      const error = new Error("Authentication failed");
      vi.mocked(db.execution.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        executionRepository.updateExecution(mockExecutionId, {
          status: ExecutionStatus.RUNNING,
        })
      ).rejects.toThrow("Authentication failed");
    });
  });

  describe("Returned values", () => {
    it("should return execution with all fields", async () => {
      // Arrange
      vi.mocked(db.execution.create).mockResolvedValue(mockExecution);

      // Act
      const result = await executionRepository.createExecution({
        workflow: { connect: { id: mockWorkflowId } },
        status: ExecutionStatus.CREATED,
      });

      // Assert
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("workflowId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("currentStep");
      expect(result).toHaveProperty("startedAt");
      expect(result).toHaveProperty("completedAt");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should preserve execution status type", async () => {
      // Arrange
      vi.mocked(db.execution.create).mockResolvedValue(mockExecution);

      // Act
      const result = await executionRepository.createExecution({
        workflow: { connect: { id: mockWorkflowId } },
        status: ExecutionStatus.CREATED,
      });

      // Assert
      expect(result.status).toBe(ExecutionStatus.CREATED);
    });
  });
});
