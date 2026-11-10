import { Router } from "express";
import * as assistant from "@/modules/assistant/assistant.controller";
import { assistantBurstLimiter, assistantDailyLimiter } from "@/middleware/rate-limit";

// Mounted at /api/assistant (behind requireAuth).
const router = Router();

// every request spends Groq tokens: limited per user, per minute and per day
router.post("/", assistantBurstLimiter, assistantDailyLimiter, assistant.postMessage);

export default router;
