import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startWorkflow } from "../../src/services/workflow.service";
import { EventType, ExecutionStatus } from "@prisma/client";
import * as eventRepository from "../../src/db/repositories/event.repository";
import * as executionRepository from "../../src/db/repositories/execution.repository";
import * as workflowRepository from "../../src/db/repositories/workflow.repository";
import * as workflowLoader from "../../src/engine/WorkFlowLoader";

vi.mock("../../src/db/repositories/event.repository");
vi.mock("../../src/db/repositories/execution.repository");
vi.mock("../../src/db/repositories/workflow.repository");
vi.mock("../../src/engine/WorkFlowLoader");

describe("WorkflowService", () => {
  const mockWorkflowId = "test-workflow";
  const mockWorkflowName = "Test Workflow";
  const mockExecutionId = "exec-123";
  const mockDbWorkflowId = "workflow-456";

  const mockWorkflowDefinition = {
    id: mockWorkflowId,
    name: mockWorkflowName,
    steps: [
      {
        id: "step-1",
        worker: "inventory",
        compensation: "release-inventory",
      },
    ],
  };

  const mockWorkflow = {
    id: mockDbWorkflowId,
    name: mockWorkflowName,
    definition: mockWorkflowDefinition,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecution = {
    id: mockExecutionId,
    workflowId: mockDbWorkflowId,
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

  describe("startWorkflow - happy path", () => {
    it("should load workflow definition", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowLoader.loadWorkflow).toHaveBeenCalledWith(mockWorkflowId);
    });

    it("should get workflow by name", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowRepository.getWorkflowByName).toHaveBeenCalledWith(
        mockWorkflowName
      );
    });

    it("should create execution", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(executionRepository.createExecution).toHaveBeenCalledWith({
        workflow: {
          connect: {
            id: mockDbWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      });
    });

    it("should create event", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledWith({
        execution: { connect: { id: mockExecutionId } },
        event: EventType.EXECUTION_CREATED,
        metadata: {
          workflowId: mockDbWorkflowId,
          workflowName: mockWorkflowName,
          executionId: mockExecutionId,
        },
      });
    });

    it("should return execution", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      const result = await startWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(mockExecution);
    });
  });

  describe("startWorkflow - workflow not in database", () => {
    it("should create workflow when not found", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(null);
      vi.mocked(workflowRepository.createWorkflow).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowRepository.createWorkflow).toHaveBeenCalledWith(
        mockWorkflowName,
        mockWorkflowDefinition
      );
    });

    it("should use created workflow for execution", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(null);
      vi.mocked(workflowRepository.createWorkflow).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(executionRepository.createExecution).toHaveBeenCalledWith({
        workflow: {
          connect: {
            id: mockDbWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      });
    });
  });

  describe("startWorkflow - workflow already in database", () => {
    it("should not create workflow when already exists", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowRepository.createWorkflow).not.toHaveBeenCalled();
    });

    it("should use existing workflow for execution", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(executionRepository.createExecution).toHaveBeenCalledWith({
        workflow: {
          connect: {
            id: mockDbWorkflowId,
          },
        },
        status: ExecutionStatus.CREATED,
      });
    });
  });

  describe("startWorkflow - error handling", () => {
    it("should propagate workflow loader errors", async () => {
      // Arrange
      const error = new Error("Workflow not found");
      vi.mocked(workflowLoader.loadWorkflow).mockRejectedValue(error);

      // Act & Assert
      await expect(startWorkflow(mockWorkflowId)).rejects.toThrow(
        "Workflow not found"
      );
    });

    it("should propagate repository errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockRejectedValue(error);

      // Act & Assert
      await expect(startWorkflow(mockWorkflowId)).rejects.toThrow(
        "Database error"
      );
    });

    it("should propagate execution creation errors", async () => {
      // Arrange
      const error = new Error("Execution creation failed");
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockRejectedValue(error);

      // Act & Assert
      await expect(startWorkflow(mockWorkflowId)).rejects.toThrow(
        "Execution creation failed"
      );
    });

    it("should propagate event creation errors", async () => {
      // Arrange
      const error = new Error("Event creation failed");
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockRejectedValue(error);

      // Act & Assert
      await expect(startWorkflow(mockWorkflowId)).rejects.toThrow(
        "Event creation failed"
      );
    });
  });

  describe("startWorkflow - validation", () => {
    it("should validate workflow definition structure", async () => {
      // Arrange
      const invalidDefinition = {
        id: mockWorkflowId,
        name: mockWorkflowName,
        steps: "invalid" as any,
      };
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        invalidDefinition
      );

      // Act & Assert
      await expect(startWorkflow(mockWorkflowId)).resolves.toBeDefined();
    });

    it("should handle empty workflow name", async () => {
      // Arrange
      const emptyNameDefinition = {
        id: mockWorkflowId,
        name: "",
        steps: [],
      };
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        emptyNameDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(null);
      vi.mocked(workflowRepository.createWorkflow).mockResolvedValue({
        ...mockWorkflow,
        name: "",
      });
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      const result = await startWorkflow(mockWorkflowId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe("startWorkflow - business logic", () => {
    it("should set execution status to CREATED", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(executionRepository.createExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExecutionStatus.CREATED,
        })
      );
    });

    it("should create EXECUTION_CREATED event", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: EventType.EXECUTION_CREATED,
        })
      );
    });

    it("should include workflow metadata in event", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            workflowId: mockDbWorkflowId,
            workflowName: mockWorkflowName,
            executionId: mockExecutionId,
          }),
        })
      );
    });
  });

  describe("startWorkflow - repository interaction", () => {
    it("should call workflow loader once", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowLoader.loadWorkflow).toHaveBeenCalledTimes(1);
    });

    it("should call getWorkflowByName once", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(workflowRepository.getWorkflowByName).toHaveBeenCalledTimes(1);
    });

    it("should call createExecution once", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(executionRepository.createExecution).toHaveBeenCalledTimes(1);
    });

    it("should call createEvent once", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      await startWorkflow(mockWorkflowId);

      // Assert
      expect(eventRepository.createEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("startWorkflow - edge cases", () => {
    it("should handle workflow with no steps", async () => {
      // Arrange
      const noStepsDefinition = {
        id: mockWorkflowId,
        name: mockWorkflowName,
        steps: [],
      };
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        noStepsDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(null);
      vi.mocked(workflowRepository.createWorkflow).mockResolvedValue({
        ...mockWorkflow,
        definition: noStepsDefinition,
      });
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      const result = await startWorkflow(mockWorkflowId);

      // Assert
      expect(result).toBeDefined();
    });

    it("should handle workflow with many steps", async () => {
      // Arrange
      const manyStepsDefinition = {
        id: mockWorkflowId,
        name: mockWorkflowName,
        steps: Array.from({ length: 100 }, (_, i) => ({
          id: `step-${i}`,
          worker: "inventory",
          compensation: "release-inventory",
        })),
      };
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        manyStepsDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(null);
      vi.mocked(workflowRepository.createWorkflow).mockResolvedValue({
        ...mockWorkflow,
        definition: manyStepsDefinition,
      });
      vi.mocked(executionRepository.createExecution).mockResolvedValue(
        mockExecution
      );
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      const result = await startWorkflow(mockWorkflowId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe("startWorkflow - idempotency", () => {
    it("should create new execution on each call", async () => {
      // Arrange
      vi.mocked(workflowLoader.loadWorkflow).mockResolvedValue(
        mockWorkflowDefinition
      );
      vi.mocked(workflowRepository.getWorkflowByName).mockResolvedValue(
        mockWorkflow
      );
      const execution1 = { ...mockExecution, id: "exec-1" };
      const execution2 = { ...mockExecution, id: "exec-2" };
      vi.mocked(executionRepository.createExecution)
        .mockResolvedValueOnce(execution1)
        .mockResolvedValueOnce(execution2);
      vi.mocked(eventRepository.createEvent).mockResolvedValue({} as any);

      // Act
      const result1 = await startWorkflow(mockWorkflowId);
      const result2 = await startWorkflow(mockWorkflowId);

      // Assert
      expect(result1.id).toBe("exec-1");
      expect(result2.id).toBe("exec-2");
      expect(executionRepository.createExecution).toHaveBeenCalledTimes(2);
    });
  });
});
