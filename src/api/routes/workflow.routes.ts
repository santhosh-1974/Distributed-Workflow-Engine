import { Router } from "express";
import { startWorkflowController,getWorkflowsController} from "../controllers/workflow.controller.js";

const router = Router();

router.post("/start", startWorkflowController);
router.get("/", getWorkflowsController);

export default router;