import { Router } from "express";
import { getExecutionController,startExecution} from "../controllers/execution.controller.js";

const router = Router();

router.get("/:id", getExecutionController);
router.post("/start", startExecution);
export default router;