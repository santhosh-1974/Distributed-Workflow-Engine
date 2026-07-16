import { z } from "zod";

export const startWorkflowSchema = z.object({
  workflowId: z.string().min(1),
});

export type StartWorkflowRequest = z.infer<typeof startWorkflowSchema>;