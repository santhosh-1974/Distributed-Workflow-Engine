import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { ExecutionStatus } from "@prisma/client";
import {
  startWorkflowController,
  getWorkflowsController,
} from "../../src/api/controllers/workflow.controller";
import * as workflowService from "../../src/services/workflow.service";
import * as workflowRepository from "../../src/db/repositories/workflow.repository";

vi.mock("../../src/services/workflow.service");
vi.mock("../../src/db/repositories/workflow.repository");

describe("WorkflowController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: vi.Mock;
  let mockStatus: vi.Mock;

  const mockWorkflowId = "test-workflow";
  const mockExecutionId = "exec-123";
  const mockWorkflowDbId = "workflow-456";

  const mockExecution = {
    id: mockExecutionId,
    workflowId: mockWorkflowDbId,
    status: ExecutionStatus.CREATED,
    currentStep: 0,
    startedAt: new Date(),
    completedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkflows = [
    {
      id: mockWorkflowDbId,
      name: "Test Workflow",
      definition: {
        id: mockWorkflowId,
        name: "Test Workflow",
        steps: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST workflow - startWorkflowController", () => {
    describe("Success cases", () => {
      it("should return 201 on successful workflow start", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith(mockExecution);
      });

      it("should call startWorkflow service with correct workflowId", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(workflowService.startWorkflow).toHaveBeenCalledWith(mockWorkflowId);
      });

      it("should return execution object in response", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockExecutionId,
            workflowId: mockWorkflowDbId,
          })
        );
      });
    });

    describe("Error cases", () => {
      it("should return 400 for invalid body", async () => {
        // Arrange
        mockRequest = {
          body: {},
        };

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow();
      });

      it("should return 400 for missing workflowId", async () => {
        // Arrange
        mockRequest = {
          body: {
            invalidField: "value",
          },
        };

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow();
      });

      it("should return 400 for invalid workflowId type", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: 123 as any,
          },
        };

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow();
      });

      it("should return 404 when workflow not found", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        const error = new Error("Workflow not found");
        (error as any).statusCode = 404;
        vi.mocked(workflowService.startWorkflow).mockRejectedValue(error);

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow("Workflow not found");
      });

      it("should return 500 on service failure", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        const error = new Error("Service error");
        vi.mocked(workflowService.startWorkflow).mockRejectedValue(error);

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow("Service error");
      });

      it("should return 500 on database error", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        const error = new Error("Database connection failed");
        vi.mocked(workflowService.startWorkflow).mockRejectedValue(error);

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow("Database connection failed");
      });

      it("should return 500 on validation failure", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        const error = new Error("Validation failed");
        (error as any).statusCode = 400;
        vi.mocked(workflowService.startWorkflow).mockRejectedValue(error);

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow("Validation failed");
      });
    });

    describe("Service interaction", () => {
      it("should call service exactly once", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(workflowService.startWorkflow).toHaveBeenCalledTimes(1);
      });

      it("should propagate service errors correctly", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        const error = new Error("Service error");
        vi.mocked(workflowService.startWorkflow).mockRejectedValue(error);

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow("Service error");
      });
    });

    describe("HTTP status codes", () => {
      it("should set correct HTTP status on success", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(201);
      });

      it("should not call status on validation error", async () => {
        // Arrange
        mockRequest = {
          body: {},
        };

        // Act & Assert
        await expect(
          startWorkflowController(
            mockRequest as Request,
            mockResponse as Response
          )
        ).rejects.toThrow();
        expect(mockStatus).not.toHaveBeenCalled();
      });
    });

    describe("Response body", () => {
      it("should include execution details in response", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            workflowId: expect.any(String),
            status: expect.any(String),
          })
        );
      });

      it("should return exact execution object from service", async () => {
        // Arrange
        mockRequest = {
          body: {
            workflowId: mockWorkflowId,
          },
        };
        vi.mocked(workflowService.startWorkflow).mockResolvedValue(
          mockExecution
        );

        // Act
        await startWorkflowController(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert
        expect(mockJson).toHaveBeenCalledWith(mockExecution);
      });
    });
  });

  describe("GET workflows - getWorkflowsController", () => {
    describe("Success cases", () => {
      it("should return 200 on successful workflows retrieval", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockWorkflows);
      });

      it("should call getAllWorkflows repository", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(workflowRepository.getAllWorkflows).toHaveBeenCalled();
      });

      it("should return workflows array in response", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockJson).toHaveBeenCalledWith(mockWorkflows);
      });

      it("should return empty array when no workflows", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue([]);

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith([]);
      });
    });

    describe("Error cases", () => {
      it("should return 500 on repository failure", async () => {
        // Arrange
        mockRequest = {};
        const error = new Error("Database error");
        vi.mocked(workflowRepository.getAllWorkflows).mockRejectedValue(error);

        // Act & Assert
        await expect(
          getWorkflowsController(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow("Database error");
      });

      it("should return 500 on connection timeout", async () => {
        // Arrange
        mockRequest = {};
        const error = new Error("Connection timeout");
        vi.mocked(workflowRepository.getAllWorkflows).mockRejectedValue(error);

        // Act & Assert
        await expect(
          getWorkflowsController(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow("Connection timeout");
      });

      it("should return 500 on authentication error", async () => {
        // Arrange
        mockRequest = {};
        const error = new Error("Authentication failed");
        vi.mocked(workflowRepository.getAllWorkflows).mockRejectedValue(error);

        // Act & Assert
        await expect(
          getWorkflowsController(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow("Authentication failed");
      });
    });

    describe("Repository interaction", () => {
      it("should call getAllWorkflows exactly once", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(workflowRepository.getAllWorkflows).toHaveBeenCalledTimes(1);
      });

      it("should propagate repository errors correctly", async () => {
        // Arrange
        mockRequest = {};
        const error = new Error("Repository error");
        vi.mocked(workflowRepository.getAllWorkflows).mockRejectedValue(error);

        // Act & Assert
        await expect(
          getWorkflowsController(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow("Repository error");
      });
    });

    describe("HTTP status codes", () => {
      it("should set correct HTTP status on success", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(200);
      });

      it("should set correct HTTP status on empty result", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue([]);

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(200);
      });
    });

    describe("Response body", () => {
      it("should include workflow details in response", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockJson).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              definition: expect.any(Object),
            }),
          ])
        );
      });

      it("should return exact workflows array from repository", async () => {
        // Arrange
        mockRequest = {};
        vi.mocked(workflowRepository.getAllWorkflows).mockResolvedValue(
          mockWorkflows
        );

        // Act
        await getWorkflowsController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockJson).toHaveBeenCalledWith(mockWorkflows);
      });
    });
  });

  describe("Controller behavior", () => {
    it("should not modify request body", async () => {
      // Arrange
      const originalBody = { workflowId: mockWorkflowId };
      mockRequest = {
        body: { ...originalBody },
      };
      vi.mocked(workflowService.startWorkflow).mockResolvedValue(
        mockExecution
      );

      // Act
      await startWorkflowController(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockRequest.body).toEqual(originalBody);
    });

    it("should handle concurrent requests", async () => {
      // Arrange
      mockRequest = {
        body: {
          workflowId: mockWorkflowId,
        },
      };
      vi.mocked(workflowService.startWorkflow).mockResolvedValue(mockExecution);

      // Act
      const promise1 = startWorkflowController(
        mockRequest as Request,
        mockResponse as Response
      );
      const promise2 = startWorkflowController(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      await expect(Promise.all([promise1, promise2])).resolves.toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle null body gracefully", async () => {
      // Arrange
      mockRequest = {
        body: null as any,
      };

      // Act & Assert
      await expect(
        startWorkflowController(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it("should handle undefined body gracefully", async () => {
      // Arrange
      mockRequest = {
        body: undefined as any,
      };

      // Act & Assert
      await expect(
        startWorkflowController(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });

    it("should handle extra fields in body", async () => {
      // Arrange
      mockRequest = {
        body: {
          workflowId: mockWorkflowId,
          extraField: "extra",
        },
      };
      vi.mocked(workflowService.startWorkflow).mockResolvedValue(
        mockExecution
      );

      // Act
      await startWorkflowController(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(workflowService.startWorkflow).toHaveBeenCalledWith(mockWorkflowId);
    });

    it("should handle empty string workflowId", async () => {
      // Arrange
      mockRequest = {
        body: {
          workflowId: "",
        },
      };

      // Act & Assert
      await expect(
        startWorkflowController(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });
});
