import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeWorkflow } from "../../src/engine/workflow.executor";
import { ExecutionStatus, TaskStatus, EventType } from "@prisma/client";
import * as executionRepository from "../../src/db/repositories/execution.repository";
import * as taskRepository from "../../src/db/repositories/task.repository";
import * as eventRepository from "../../src/db/repositories/event.repository";
import * as workflowRepository from "../../src/db/repositories/workflow.repository";
import * as taskDispatcher from "../../src/engine/task.dispatcher";

vi.mock("../../src/db/repositories/execution.repository");
vi.mock("../../src/db/repositories/task.repository");
vi.mock("../../src/db/repositories/event.repository");
vi.mock("../../src/db/repositories/workflow.repository");
vi.mock("../../src/engine/task.dispatcher");

describe("WorkflowExecutor", () => {
  const mockExecutionId = "exec-123";
  const mockWorkflowId = "workflow-456";
  const mockTaskId = "task-789";
  const mockStepId = "step-1";

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

  const mockWorkflow = {
    id: mockWorkflowId,
    name: "Test Workflow",
    definition: {
      id: "test-workflow",
      name: "Test Workflow",
      steps: [
        {
          id: "step-1",
          worker: "inventory",
          compensation: "release-inventory",
        },
        {
          id: "step-2",
          worker: "payment",
          compensation: "refund-payment",
        },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask = {
    id: mockTaskId,
    executionId: mockExecutionId,
    stepName: mockStepId,
    worker: "inventory",
    status: TaskStatus.PENDING,
    startedAt: null as Date | null,
    completedAt: null as Date | null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Execution does not exist", () => {
    it("should throw error when execution not found", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(null);

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Execution not found."
      );
      expect(executionRepository.getExecutionById).toHaveBeenCalledWith(
        mockExecutionId
      );
      expect(workflowRepository.getWorkflowById).not.toHaveBeenCalled();
    });
  });

  describe("Workflow does not exist", () => {
    it("should throw error when workflow not found", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(null);

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Workflow not found."
      );
      expect(executionRepository.getExecutionById).toHaveBeenCalledWith(
        mockExecutionId
      );
      expect(workflowRepository.getWorkflowById).toHaveBeenCalledWith(
        mockWorkflowId
      );
    });
  });

  describe("Execution CREATED becomes RUNNING", () => {
    it("should update execution status from CREATED to RUNNING", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          status: ExecutionStatus.RUNNING,
        }
      );
    });
  });

  describe("First task created", () => {
    it("should create first task when no existing task", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskRepository.createTask).toHaveBeenCalledWith({
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        stepName: mockStepId,
        worker: "inventory",
      });
    });
  });

  describe("Task dispatched", () => {
    it("should dispatch task after creation", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).toHaveBeenCalledWith({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });
    });
  });

  describe("Event created", () => {
    it("should create EXECUTION_STARTED event", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledWith({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_STARTED,
        metadata: {
          workflowId: mockWorkflowId,
          executionId: mockExecutionId,
          currentStep: 0,
        },
      });
    });

    it("should create TASK_CREATED event", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledWith({
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        event: EventType.TASK_CREATED,
        metadata: {
          workflowId: mockWorkflowId,
          executionId: mockExecutionId,
          taskId: mockTaskId,
          stepId: mockStepId,
          worker: "inventory",
        },
      });
    });
  });

  describe("Workflow COMPLETED", () => {
    it("should mark workflow as COMPLETED when no more steps", async () => {
      // Arrange
      const completedExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        currentStep: 2,
        startedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        completedExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...completedExecution,
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          status: ExecutionStatus.COMPLETED,
        }
      );
      expect(eventRepository.createEvent).toHaveBeenCalledWith({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_COMPLETED,
        metadata: {
          workflowId: mockWorkflowId,
          executionId: mockExecutionId,
          completedStepCount: 2,
        },
      });
    });
  });

  describe("Current step increments", () => {
    it("should increment current step when task is COMPLETED", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        completedTask
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...runningExecution,
        currentStep: 1,
      });
      vi.mocked(executeWorkflow).mockResolvedValue(undefined);

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          currentStep: {
            increment: 1,
          },
        }
      );
    });
  });

  describe("Existing PENDING task", () => {
    it("should dispatch task for existing PENDING task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const pendingTask = {
        ...mockTask,
        status: TaskStatus.PENDING,
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        pendingTask
      );
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...pendingTask,
        status: TaskStatus.QUEUED,
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).toHaveBeenCalledWith({
        worker: "inventory",
        stepId: mockStepId,
        executionId: mockExecutionId,
        taskId: mockTaskId,
      });
      expect(taskRepository.updateTask).toHaveBeenCalledWith(mockTaskId, {
        status: TaskStatus.QUEUED,
      });
    });
  });

  describe("Existing QUEUED task", () => {
    it("should return early for existing QUEUED task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const queuedTask = {
        ...mockTask,
        status: TaskStatus.QUEUED,
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        queuedTask
      );

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).not.toHaveBeenCalled();
      expect(taskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe("Existing RUNNING task", () => {
    it("should return early for existing RUNNING task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const runningTask = {
        ...mockTask,
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        runningTask
      );

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).not.toHaveBeenCalled();
      expect(taskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe("Existing FAILED task", () => {
    it("should return early for existing FAILED task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const failedTask = {
        ...mockTask,
        status: TaskStatus.FAILED,
        startedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        failedTask
      );

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).not.toHaveBeenCalled();
      expect(taskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe("Existing COMPLETED task", () => {
    it("should increment step and recurse for COMPLETED task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        completedTask
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...runningExecution,
        currentStep: 1,
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          currentStep: {
            increment: 1,
          },
        }
      );
    });
  });

  describe("Completed task resumes next step", () => {
    it("should process next step after completed task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        currentStep: 0,
        startedAt: new Date(),
      };
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById)
        .mockResolvedValueOnce(runningExecution)
        .mockResolvedValueOnce({
          ...runningExecution,
          currentStep: 1,
        });
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep)
        .mockResolvedValueOnce(completedTask)
        .mockResolvedValueOnce(null);
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...runningExecution,
        currentStep: 1,
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.createTask).mockResolvedValue({
        ...mockTask,
        id: "task-2",
      });
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          currentStep: {
            increment: 1,
          },
        }
      );
    });
  });

  describe("Duplicate executeWorkflow() calls", () => {
    it("should handle duplicate calls idempotently for RUNNING execution", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const queuedTask = {
        ...mockTask,
        status: TaskStatus.QUEUED,
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        queuedTask
      );

      // Act
      await executeWorkflow(mockExecutionId);
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).not.toHaveBeenCalled();
      expect(taskRepository.createTask).toHaveBeenCalledTimes(0);
    });
  });

  describe("Dispatch failure", () => {
    it("should propagate dispatch failure", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockRejectedValue(
        new Error("Dispatch failed")
      );

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Dispatch failed"
      );
      expect(taskDispatcher.dispatchTask).toHaveBeenCalled();
    });
  });

  describe("Repository failure", () => {
    it("should propagate execution repository failure", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Database error"
      );
    });

    it("should propagate workflow repository failure", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockRejectedValue(
        new Error("Workflow database error")
      );

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Workflow database error"
      );
    });

    it("should propagate task repository failure", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockRejectedValue(
        new Error("Task database error")
      );

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Task database error"
      );
    });
  });

  describe("Event creation failure", () => {
    it("should propagate event creation failure", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockRejectedValue(
        new Error("Event creation failed")
      );

      // Act & Assert
      await expect(executeWorkflow(mockExecutionId)).rejects.toThrow(
        "Event creation failed"
      );
    });
  });

  describe("Workflow with one step", () => {
    it("should complete workflow with one step", async () => {
      // Arrange
      const singleStepWorkflow = {
        ...mockWorkflow,
        definition: {
          id: "single-step",
          name: "Single Step",
          steps: [
            {
              id: "step-1",
              worker: "inventory",
              compensation: "release-inventory",
            },
          ],
        },
      };
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        currentStep: 1,
        startedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        singleStepWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...runningExecution,
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          status: ExecutionStatus.COMPLETED,
        }
      );
      expect(eventRepository.createEvent).toHaveBeenCalledWith({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_COMPLETED,
        metadata: {
          workflowId: mockWorkflowId,
          executionId: mockExecutionId,
          completedStepCount: 1,
        },
      });
    });
  });

  describe("Workflow with many steps", () => {
    it("should process workflow with many steps", async () => {
      // Arrange
      const multiStepWorkflow = {
        ...mockWorkflow,
        definition: {
          id: "multi-step",
          name: "Multi Step",
          steps: [
            {
              id: "step-1",
              worker: "inventory",
              compensation: "release-inventory",
            },
            {
              id: "step-2",
              worker: "payment",
              compensation: "refund-payment",
            },
            {
              id: "step-3",
              worker: "invoice",
              compensation: "delete-invoice",
            },
            {
              id: "step-4",
              worker: "email",
              compensation: "cancel-email",
            },
          ],
        },
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        multiStepWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskRepository.createTask).toHaveBeenCalledWith({
        execution: {
          connect: {
            id: mockExecutionId,
          },
        },
        stepName: "step-1",
        worker: "inventory",
      });
    });
  });

  describe("Workflow with empty definition", () => {
    it("should complete workflow with empty steps", async () => {
      // Arrange
      const emptyWorkflow = {
        ...mockWorkflow,
        definition: {
          id: "empty",
          name: "Empty",
          steps: [],
        },
      };
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        currentStep: 0,
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        emptyWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...runningExecution,
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).toHaveBeenCalledWith(
        mockExecutionId,
        {
          status: ExecutionStatus.COMPLETED,
        }
      );
      expect(taskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe("Repository calls verification", () => {
    it("should call getExecutionById once", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.getExecutionById).toHaveBeenCalledTimes(1);
    });

    it("should call getWorkflowById once", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(workflowRepository.getWorkflowById).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dispatcher calls verification", () => {
    it("should call dispatch exactly once for new task", async () => {
      // Arrange
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        mockExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.updateExecution).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(taskDispatcher.dispatchTask).toHaveBeenCalledTimes(1);
    });
  });

  describe("Execution status verification", () => {
    it("should not update status when already RUNNING", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        null
      );
      vi.mocked(taskRepository.createTask).mockResolvedValue(mockTask);
      vi.mocked(taskDispatcher.dispatchTask).mockResolvedValue(undefined);
      vi.mocked(taskRepository.updateTask).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.QUEUED,
        startedAt: new Date(),
      });
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await executeWorkflow(mockExecutionId);

      // Assert
      expect(executionRepository.updateExecution).not.toHaveBeenCalledWith(
        mockExecutionId,
        expect.objectContaining({
          status: ExecutionStatus.RUNNING,
        })
      );
    });
  });

  describe("Idempotent behavior", () => {
    it("should be idempotent for QUEUED task", async () => {
      // Arrange
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };
      const queuedTask = {
        ...mockTask,
        status: TaskStatus.QUEUED,
      };
      vi.mocked(executionRepository.getExecutionById).mockResolvedValue(
        runningExecution
      );
      vi.mocked(workflowRepository.getWorkflowById).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(taskRepository.getTaskByExecutionAndStep).mockResolvedValue(
        queuedTask
      );

      // Act
      const result1 = await executeWorkflow(mockExecutionId);
      const result2 = await executeWorkflow(mockExecutionId);

      // Assert
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(taskDispatcher.dispatchTask).not.toHaveBeenCalled();
      expect(taskRepository.createTask).not.toHaveBeenCalled();
    });
  });
});
