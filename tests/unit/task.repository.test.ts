import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as taskRepository from "../../src/db/repositories/task.repository";
import { db } from "../../src/db/prisma";
import { TaskStatus } from "@prisma/client";

vi.mock("../../src/db/prisma");

describe("TaskRepository", () => {
  const mockExecutionId = "exec-123";
  const mockTaskId = "task-456";
  const mockStepName = "step-1";
  const mockWorker = "inventory";

  const mockTask = {
    id: mockTaskId,
    executionId: mockExecutionId,
    stepName: mockStepName,
    worker: mockWorker,
    status: TaskStatus.PENDING,
    startedAt: null as Date | null,
    completedAt: null as Date | null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createTask", () => {
    it("should call Prisma create with correct data", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        stepName: mockStepName,
        worker: mockWorker,
      };
      vi.mocked(db.task.create).mockResolvedValue(mockTask);

      // Act
      await taskRepository.createTask(createData);

      // Assert
      expect(db.task.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it("should return created task", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        stepName: mockStepName,
        worker: mockWorker,
      };
      vi.mocked(db.task.create).mockResolvedValue(mockTask);

      // Act
      const result = await taskRepository.createTask(createData);

      // Assert
      expect(result).toEqual(mockTask);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const createData = {
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        stepName: mockStepName,
        worker: mockWorker,
      };
      const error = new Error("Prisma error");
      vi.mocked(db.task.create).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.createTask(createData)).rejects.toThrow(
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
        stepName: mockStepName,
        worker: mockWorker,
      };
      const error = new Error("Unique constraint failed");
      (error as any).code = "P2002";
      vi.mocked(db.task.create).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.createTask(createData)).rejects.toThrow(
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
        stepName: mockStepName,
        worker: mockWorker,
      };
      const error = new Error("Foreign key constraint failed");
      (error as any).code = "P2003";
      vi.mocked(db.task.create).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.createTask(createData)).rejects.toThrow(
        "Foreign key constraint failed"
      );
    });
  });

  describe("updateTask", () => {
    it("should call Prisma update with correct where clause", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.QUEUED,
      };
      vi.mocked(db.task.update).mockResolvedValue(mockTask);

      // Act
      await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: updateData,
      });
    });

    it("should call Prisma update with correct update payload", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      };
      vi.mocked(db.task.update).mockResolvedValue(mockTask);

      // Act
      await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: updateData,
      });
    });

    it("should return updated task", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.QUEUED,
      };
      const updatedTask = {
        ...mockTask,
        status: TaskStatus.QUEUED,
      };
      vi.mocked(db.task.update).mockResolvedValue(updatedTask);

      // Act
      const result = await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(result).toEqual(updatedTask);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.QUEUED,
      };
      const error = new Error("Update failed");
      vi.mocked(db.task.update).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.updateTask(mockTaskId, updateData)).rejects.toThrow(
        "Update failed"
      );
    });

    it("should handle record not found errors", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.QUEUED,
      };
      const error = new Error("Record not found");
      (error as any).code = "P2025";
      vi.mocked(db.task.update).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.updateTask(mockTaskId, updateData)).rejects.toThrow(
        "Record not found"
      );
    });

    it("should handle validation errors", async () => {
      // Arrange
      const updateData = {
        status: "INVALID_STATUS" as any,
      };
      const error = new Error("Validation error");
      (error as any).code = "P2007";
      vi.mocked(db.task.update).mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepository.updateTask(mockTaskId, updateData)).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("getTasksByExecutionId", () => {
    it("should call Prisma findMany with correct where clause", async () => {
      // Arrange
      vi.mocked(db.task.findMany).mockResolvedValue([mockTask]);

      // Act
      await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { executionId: mockExecutionId },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should call Prisma findMany with correct orderBy", async () => {
      // Arrange
      vi.mocked(db.task.findMany).mockResolvedValue([mockTask]);

      // Act
      await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        })
      );
    });

    it("should return array of tasks", async () => {
      // Arrange
      const tasks = [
        mockTask,
        {
          ...mockTask,
          id: "task-789",
        },
      ];
      vi.mocked(db.task.findMany).mockResolvedValue(tasks);

      // Act
      const result = await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(result).toEqual(tasks);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no tasks", async () => {
      // Arrange
      vi.mocked(db.task.findMany).mockResolvedValue([]);

      // Act
      const result = await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(db.task.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.getTasksByExecutionId(mockExecutionId)
      ).rejects.toThrow("Database error");
    });

    it("should handle connection timeout", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(db.task.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.getTasksByExecutionId(mockExecutionId)
      ).rejects.toThrow("Connection timeout");
    });
  });

  describe("getTaskByExecutionAndStep", () => {
    it("should call Prisma findFirst with correct where clause", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(mockTask);

      // Act
      await taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName);

      // Assert
      expect(db.task.findFirst).toHaveBeenCalledWith({
        where: {
          executionId: mockExecutionId,
          stepName: mockStepName,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should call Prisma findFirst with correct orderBy", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(mockTask);

      // Act
      await taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName);

      // Assert
      expect(db.task.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    it("should return task when found", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(mockTask);

      // Act
      const result = await taskRepository.getTaskByExecutionAndStep(
        mockExecutionId,
        mockStepName
      );

      // Assert
      expect(result).toEqual(mockTask);
    });

    it("should return null when not found", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(null);

      // Act
      const result = await taskRepository.getTaskByExecutionAndStep(
        mockExecutionId,
        mockStepName
      );

      // Assert
      expect(result).toBeNull();
    });

    it("should propagate Prisma errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(db.task.findFirst).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName)
      ).rejects.toThrow("Database error");
    });

    it("should handle connection errors", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(db.task.findFirst).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName)
      ).rejects.toThrow("Connection timeout");
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
        stepName: mockStepName,
        worker: mockWorker,
      };
      vi.mocked(db.task.create).mockResolvedValue(mockTask);

      // Act
      await taskRepository.createTask(createData);

      // Assert
      expect(db.task.create).toHaveBeenCalledTimes(1);
    });

    it("should call update method exactly once", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.QUEUED,
      };
      vi.mocked(db.task.update).mockResolvedValue(mockTask);

      // Act
      await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(db.task.update).toHaveBeenCalledTimes(1);
    });

    it("should call findMany method exactly once", async () => {
      // Arrange
      vi.mocked(db.task.findMany).mockResolvedValue([mockTask]);

      // Act
      await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(db.task.findMany).toHaveBeenCalledTimes(1);
    });

    it("should call findFirst method exactly once", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(mockTask);

      // Act
      await taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName);

      // Assert
      expect(db.task.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error propagation", () => {
    it("should propagate network errors", async () => {
      // Arrange
      const error = new Error("ECONNREFUSED");
      vi.mocked(db.task.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.createTask({
          execution: { connect: { id: mockExecutionId } },
          stepName: mockStepName,
          worker: mockWorker,
        })
      ).rejects.toThrow("ECONNREFUSED");
    });

    it("should propagate timeout errors", async () => {
      // Arrange
      const error = new Error("ETIMEDOUT");
      vi.mocked(db.task.findFirst).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName)
      ).rejects.toThrow("ETIMEDOUT");
    });

    it("should propagate authentication errors", async () => {
      // Arrange
      const error = new Error("Authentication failed");
      vi.mocked(db.task.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        taskRepository.updateTask(mockTaskId, { status: TaskStatus.QUEUED })
      ).rejects.toThrow("Authentication failed");
    });
  });

  describe("Returned values", () => {
    it("should return task with all fields", async () => {
      // Arrange
      vi.mocked(db.task.create).mockResolvedValue(mockTask);

      // Act
      const result = await taskRepository.createTask({
        execution: { connect: { id: mockExecutionId } },
        stepName: mockStepName,
        worker: mockWorker,
      });

      // Assert
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("executionId");
      expect(result).toHaveProperty("stepName");
      expect(result).toHaveProperty("worker");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("startedAt");
      expect(result).toHaveProperty("completedAt");
      expect(result).toHaveProperty("retryCount");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should preserve task status type", async () => {
      // Arrange
      vi.mocked(db.task.create).mockResolvedValue(mockTask);

      // Act
      const result = await taskRepository.createTask({
        execution: { connect: { id: mockExecutionId } },
        stepName: mockStepName,
        worker: mockWorker,
      });

      // Assert
      expect(result.status).toBe(TaskStatus.PENDING);
    });
  });

  describe("Complex update scenarios", () => {
    it("should handle increment operation", async () => {
      // Arrange
      const updateData = {
        retryCount: {
          increment: 1,
        },
      };
      vi.mocked(db.task.update).mockResolvedValue({
        ...mockTask,
        retryCount: 1,
      });

      // Act
      await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: updateData,
      });
    });

    it("should handle multiple field updates", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        retryCount: 2,
      };
      vi.mocked(db.task.update).mockResolvedValue({
        ...mockTask,
        ...updateData,
      });

      // Act
      await taskRepository.updateTask(mockTaskId, updateData);

      // Assert
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: updateData,
      });
    });
  });

  describe("Query ordering", () => {
    it("should order tasks by createdAt ascending", async () => {
      // Arrange
      vi.mocked(db.task.findMany).mockResolvedValue([mockTask]);

      // Act
      await taskRepository.getTasksByExecutionId(mockExecutionId);

      // Assert
      expect(db.task.findMany).toHaveBeenCalledWith({
        where: { executionId: mockExecutionId },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should order task query by createdAt descending", async () => {
      // Arrange
      vi.mocked(db.task.findFirst).mockResolvedValue(mockTask);

      // Act
      await taskRepository.getTaskByExecutionAndStep(mockExecutionId, mockStepName);

      // Assert
      expect(db.task.findFirst).toHaveBeenCalledWith({
        where: {
          executionId: mockExecutionId,
          stepName: mockStepName,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });
});
