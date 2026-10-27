import { Router } from "express";
import * as assistant from "@/modules/assistant/assistant.controller";

// Mounted at /api/assistant (behind requireAuth).
const router = Router();

router.post("/", assistant.postMessage);

export default router;
