import { Router } from "express";

import executionRoutes from "./execution.routes.js";
import workflowRoutes from "./workflow.routes.js";

const router = Router();

router.use("/workflows", workflowRoutes);
router.use("/executions", executionRoutes);

export default router;