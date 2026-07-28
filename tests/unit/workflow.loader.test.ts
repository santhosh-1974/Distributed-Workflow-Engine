import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadWorkflow } from "../../src/engine/WorkFlowLoader";
import { promises as fs } from "node:fs";
import path from "node:path";

vi.mock("node:fs");
vi.mock("node:path");

describe("WorkflowLoader", () => {
  const mockWorkflowId = "test-workflow";
  const mockFilePath = "/mock/path/test-workflow.json";

  const validWorkflowDefinition = {
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
  };

  const multiStepWorkflowDefinition = {
    id: "multi-step-workflow",
    name: "Multi Step Workflow",
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
  };

  const workflowWithCompensation = {
    id: "compensation-workflow",
    name: "Compensation Workflow",
    steps: [
      {
        id: "step-1",
        worker: "inventory",
        compensation: "release-inventory",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(path.join).mockReturnValue(mockFilePath);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Positive scenarios", () => {
    it("should load valid workflow", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(validWorkflowDefinition)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
      expect(result).toEqual(validWorkflowDefinition);
    });

    it("should load workflow with multiple steps", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(multiStepWorkflowDefinition)
      );

      // Act
      const result = await loadWorkflow("multi-step-workflow");

      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
      expect(result).toEqual(multiStepWorkflowDefinition);
      expect(result.steps).toHaveLength(4);
    });

    it("should load workflow with compensation", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithCompensation)
      );

      // Act
      const result = await loadWorkflow("compensation-workflow");

      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
      expect(result).toEqual(workflowWithCompensation);
      expect(result.steps[0].compensation).toBe("release-inventory");
    });
  });

  describe("Negative scenarios", () => {
    it("should throw error when workflow file not found", async () => {
      // Arrange
      const error = new Error("ENOENT: file not found");
      (error as NodeJS.ErrnoException).code = "ENOENT";
      vi.mocked(fs.readFile).mockRejectedValue(error);

      // Act & Assert
      await expect(loadWorkflow(mockWorkflowId)).rejects.toThrow(
        "ENOENT: file not found"
      );
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
    });

    it("should throw error when JSON is invalid", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue("{ invalid json }");

      // Act & Assert
      await expect(loadWorkflow(mockWorkflowId)).rejects.toThrow();
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
    });

    it("should throw error when JSON is malformed", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue('{"id": "test", "name": "test"');

      // Act & Assert
      await expect(loadWorkflow(mockWorkflowId)).rejects.toThrow();
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
    });

    it("should return workflow without workflow name field for validation", async () => {
      // Arrange
      const workflowWithoutName = {
        id: "test-workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "release-inventory",
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithoutName)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithoutName);
      expect(result.name).toBeUndefined();
    });

    it("should return workflow without workflow id field for validation", async () => {
      // Arrange
      const workflowWithoutId = {
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "release-inventory",
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithoutId)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithoutId);
      expect(result.id).toBeUndefined();
    });

    it("should return workflow without steps field for validation", async () => {
      // Arrange
      const workflowWithoutSteps = {
        id: "test-workflow",
        name: "Test Workflow",
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithoutSteps)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithoutSteps);
      expect(result.steps).toBeUndefined();
    });

    it("should return workflow with empty steps array", async () => {
      // Arrange
      const workflowWithEmptySteps = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithEmptySteps)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithEmptySteps);
      expect(result.steps).toEqual([]);
    });

    it("should return workflow with duplicate step ids", async () => {
      // Arrange
      const workflowWithDuplicateIds = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "release-inventory",
          },
          {
            id: "step-1",
            worker: "payment",
            compensation: "refund-payment",
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithDuplicateIds)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithDuplicateIds);
      expect(result.steps).toHaveLength(2);
    });

    it("should return workflow without worker field", async () => {
      // Arrange
      const workflowWithoutWorker = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            compensation: "release-inventory",
          } as any,
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithoutWorker)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithoutWorker);
      expect(result.steps[0].worker).toBeUndefined();
    });

    it("should return workflow without compensation field", async () => {
      // Arrange
      const workflowWithoutCompensation = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
          } as any,
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithoutCompensation)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithoutCompensation);
      expect(result.steps[0].compensation).toBeUndefined();
    });

    it("should return workflow with invalid worker", async () => {
      // Arrange
      const workflowWithInvalidWorker = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "invalid-worker",
            compensation: "release-inventory",
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithInvalidWorker)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithInvalidWorker);
      expect(result.steps[0].worker).toBe("invalid-worker");
    });

    it("should return workflow with invalid compensation", async () => {
      // Arrange
      const workflowWithInvalidCompensation = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "invalid-compensation",
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithInvalidCompensation)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithInvalidCompensation);
      expect(result.steps[0].compensation).toBe("invalid-compensation");
    });

    it("should return workflow with invalid dependency", async () => {
      // Arrange
      const workflowWithInvalidDependency = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "release-inventory",
            dependsOn: ["non-existent-step"] as any,
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithInvalidDependency)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithInvalidDependency);
    });

    it("should return workflow with circular dependency", async () => {
      // Arrange
      const workflowWithCircularDependency = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: [
          {
            id: "step-1",
            worker: "inventory",
            compensation: "release-inventory",
            dependsOn: ["step-2"] as any,
          },
          {
            id: "step-2",
            worker: "payment",
            compensation: "refund-payment",
            dependsOn: ["step-1"] as any,
          },
        ],
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(workflowWithCircularDependency)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(workflowWithCircularDependency);
    });

    it("should return malformed workflow definition", async () => {
      // Arrange
      const malformedWorkflow = {
        id: "test-workflow",
        name: "Test Workflow",
        steps: "not-an-array" as any,
      };
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(malformedWorkflow)
      );

      // Act
      const result = await loadWorkflow(mockWorkflowId);

      // Assert
      expect(result).toEqual(malformedWorkflow);
    });

    it("should throw error when readFile throws unexpected error", async () => {
      // Arrange
      const error = new Error("Unexpected error");
      vi.mocked(fs.readFile).mockRejectedValue(error);

      // Act & Assert
      await expect(loadWorkflow(mockWorkflowId)).rejects.toThrow(
        "Unexpected error"
      );
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
    });
  });

  describe("Path construction", () => {
    it("should construct correct file path", async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(validWorkflowDefinition)
      );

      // Act
      await loadWorkflow(mockWorkflowId);

      // Assert
      expect(path.join).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, "utf-8");
    });
  });
});
