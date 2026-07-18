import { z } from "zod";

export const startExecutionSchema = z.object({
  executionId: z.string().min(1),
});

export type StartWorkflowRequest = z.infer<typeof startExecutionSchema>;