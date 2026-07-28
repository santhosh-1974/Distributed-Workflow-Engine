import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { dispatchTask } from "../../src/engine/task.dispatcher";
import { queues } from "../../src/queues/workflow.queue";

vi.mock("../../src/queues/workflow.queue");

describe("TaskDispatcher", () => {
  const mockExecutionId = "exec-123";
  const mockTaskId = "task-456";
  const mockStepId = "step-1";

  const mockJob = {
    id: "job-789",
    name: mockStepId,
    data: {
      executionId: mockExecutionId,
      taskId: mockTaskId,
    },
    opts: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Dispatch inventory task", () => {
    it("should dispatch inventory task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to inventory queue");
    });
  });

  describe("Dispatch payment task", () => {
    it("should dispatch payment task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.payment).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "payment",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to payment queue");
    });
  });

  describe("Dispatch invoice task", () => {
    it("should dispatch invoice task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.invoice).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "invoice",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to invoice queue");
    });
  });

  describe("Dispatch email task", () => {
    it("should dispatch email task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.email).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "email",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to email queue");
    });
  });

  describe("Dispatch user task", () => {
    it("should dispatch user task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.user).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "user",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to user queue");
    });
  });

  describe("Dispatch profile task", () => {
    it("should dispatch profile task successfully", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.profile).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "profile",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Adding job to profile queue");
    });
  });

  describe("Dispatch unknown worker", () => {
    it("should throw error when worker is unknown", async () => {
      // Act & Assert
      await expect(
        dispatchTask({
          worker: "unknown-worker" as any,
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow();
    });
  });

  describe("BullMQ add() throws", () => {
    it("should propagate error when BullMQ add() throws", async () => {
      // Arrange
      const error = new Error("Queue connection failed");
      const mockAdd = vi.fn().mockRejectedValue(error);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act & Assert
      await expect(
        dispatchTask({
          worker: "inventory",
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow("Queue connection failed");
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("Queue unavailable", () => {
    it("should throw error when queue is undefined", async () => {
      // Arrange
      vi.mocked(queues.inventory).add = undefined as any;

      // Act & Assert
      await expect(
        dispatchTask({
          worker: "inventory",
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow();
    });
  });

  describe("Invalid task payload", () => {
    it("should handle empty executionId", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: "",
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: "",
          taskId: mockTaskId,
        },
        expect.any(Object)
      );
    });

    it("should handle empty taskId", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: "",
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        {
          executionId: mockExecutionId,
          taskId: "",
        },
        expect.any(Object)
      );
    });

    it("should handle empty stepId", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: "",
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        "",
        {
          executionId: mockExecutionId,
          taskId: mockTaskId,
        },
        expect.any(Object)
      );
    });
  });

  describe("Dispatch returns job id", () => {
    it("should return job id when dispatch succeeds", async () => {
      // Arrange
      const mockJobWithId = {
        ...mockJob,
        id: "job-returned-id",
      };
      const mockAdd = vi.fn().mockResolvedValue(mockJobWithId);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      const result = await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  describe("Queue options verification", () => {
    it("should use correct retry attempts", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.any(Object),
        expect.objectContaining({
          attempts: 3,
        })
      );
    });

    it("should use exponential backoff", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.any(Object),
        expect.objectContaining({
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        })
      );
    });

    it("should set removeOnComplete", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.any(Object),
        expect.objectContaining({
          removeOnComplete: 100,
        })
      );
    });

    it("should set removeOnFail", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.any(Object),
        expect.objectContaining({
          removeOnFail: 100,
        })
      );
    });
  });

  describe("Correct queue selection", () => {
    it("should select inventory queue for inventory worker", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(queues.inventory.add).toHaveBeenCalled();
      expect(queues.payment.add).not.toHaveBeenCalled();
      expect(queues.invoice.add).not.toHaveBeenCalled();
      expect(queues.email.add).not.toHaveBeenCalled();
    });

    it("should select payment queue for payment worker", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.payment).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "payment",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(queues.payment.add).toHaveBeenCalled();
      expect(queues.inventory.add).not.toHaveBeenCalled();
      expect(queues.invoice.add).not.toHaveBeenCalled();
      expect(queues.email.add).not.toHaveBeenCalled();
    });

    it("should select invoice queue for invoice worker", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.invoice).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "invoice",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(queues.invoice.add).toHaveBeenCalled();
      expect(queues.inventory.add).not.toHaveBeenCalled();
      expect(queues.payment.add).not.toHaveBeenCalled();
      expect(queues.email.add).not.toHaveBeenCalled();
    });

    it("should select email queue for email worker", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.email).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "email",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(queues.email.add).toHaveBeenCalled();
      expect(queues.inventory.add).not.toHaveBeenCalled();
      expect(queues.payment.add).not.toHaveBeenCalled();
      expect(queues.invoice.add).not.toHaveBeenCalled();
    });
  });

  describe("Correct payload", () => {
    it("should include executionId in payload", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.objectContaining({
          executionId: mockExecutionId,
        }),
        expect.any(Object)
      );
    });

    it("should include taskId in payload", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.objectContaining({
          taskId: mockTaskId,
        }),
        expect.any(Object)
      );
    });

    it("should include stepId as job name", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(
        mockStepId,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Queue called once", () => {
    it("should call queue add exactly once per dispatch", async () => {
      // Arrange
      const mockAdd = vi.fn().mockResolvedValue(mockJob);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act
      await dispatchTask({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });

      // Assert
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("Errors propagated", () => {
    it("should propagate network errors", async () => {
      // Arrange
      const error = new Error("ECONNREFUSED");
      const mockAdd = vi.fn().mockRejectedValue(error);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act & Assert
      await expect(
        dispatchTask({
          worker: "inventory",
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow("ECONNREFUSED");
    });

    it("should propagate timeout errors", async () => {
      // Arrange
      const error = new Error("ETIMEDOUT");
      const mockAdd = vi.fn().mockRejectedValue(error);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act & Assert
      await expect(
        dispatchTask({
          worker: "inventory",
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow("ETIMEDOUT");
    });

    it("should propagate authentication errors", async () => {
      // Arrange
      const error = new Error("Authentication failed");
      const mockAdd = vi.fn().mockRejectedValue(error);
      vi.mocked(queues.inventory).add = mockAdd;

      // Act & Assert
      await expect(
        dispatchTask({
          worker: "inventory",
          stepId: mockStepId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
        })
      ).rejects.toThrow("Authentication failed");
    });
  });
});
