import { describe, expect, it } from "vitest";

import { startExecutionSchema } from "../../src/api/validators/execution.validator.js";
import { startWorkflowSchema } from "../../src/api/validators/workflow.validator.js";
import { loadWorkflow } from "../../src/engine/WorkFlowLoader.js";

describe("workflow definitions and request validation", () => {
    it("loads the order definition", async () => {
        const definition = await loadWorkflow("order");
        expect(definition.name).toBe("Order Processing");
        expect(definition.steps.length).toBeGreaterThan(0);
    });

    it("loads each shipped workflow definition", async () => {
        const definitions = await Promise.all(["order", "refund", "onboarding"].map(loadWorkflow));
        expect(definitions.map(definition => definition.name)).toEqual([
            "Order Processing",
            "Refund Workflow",
            "Employee Onboarding",
        ]);
    });

    it("accepts a non-empty workflow id", () => {
        expect(startWorkflowSchema.parse({ workflowId: "order" })).toEqual({ workflowId: "order" });
    });

    it("rejects an absent or empty workflow id", () => {
        expect(() => startWorkflowSchema.parse({})).toThrow();
        expect(() => startWorkflowSchema.parse({ workflowId: "" })).toThrow();
    });

    it("validates execution start requests", () => {
        expect(startExecutionSchema.safeParse({ executionId: "execution-1" }).success).toBe(true);
        expect(startExecutionSchema.safeParse({ executionId: null }).success).toBe(false);
    });
});
