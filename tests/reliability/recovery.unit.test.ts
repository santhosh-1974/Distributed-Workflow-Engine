import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({ getRunningExecutions: vi.fn() }));
const executor = vi.hoisted(() => ({ executeWorkflow: vi.fn() }));

vi.mock("../../src/db/repositories/execution.repository.js", () => repository);
vi.mock("../../src/engine/workflow.executor.js", () => executor);

import { recoverExecutions } from "../../src/engine/recovery.manager.js";

describe("recovery manager", () => {
    beforeEach(() => vi.clearAllMocks());

    it("does nothing when no executions are running", async () => {
        repository.getRunningExecutions.mockResolvedValue([]);
        await recoverExecutions();
        expect(executor.executeWorkflow).not.toHaveBeenCalled();
    });

    it("resumes every running execution", async () => {
        repository.getRunningExecutions.mockResolvedValue([{ id: "one" }, { id: "two" }]);
        await recoverExecutions();
        expect(executor.executeWorkflow).toHaveBeenNthCalledWith(1, "one");
        expect(executor.executeWorkflow).toHaveBeenNthCalledWith(2, "two");
    });

    it("surfaces an execution failure to the caller", async () => {
        repository.getRunningExecutions.mockResolvedValue([{ id: "one" }]);
        executor.executeWorkflow.mockRejectedValue(new Error("database unavailable"));
        await expect(recoverExecutions()).rejects.toThrow("database unavailable");
    });
});
