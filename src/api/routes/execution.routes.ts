import { Router } from "express";
import { getExecutionController } from "../controllers/execution.controller.js";

const router = Router();

router.get("/:id", getExecutionController);

export default router;