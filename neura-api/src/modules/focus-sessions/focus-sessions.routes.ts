import { Router } from "express";
import * as focus from "@/modules/focus-sessions/focus-sessions.controller";

// Mounted at /api/focus-sessions (behind requireAuth).
const router = Router();

router.get("/stats", focus.getStats); // must be registered before /:id
router.get("/", focus.listSessions);
router.post("/", focus.createSession);
router.patch("/:id", focus.updateSession);
router.delete("/:id", focus.deleteSession);

export default router;
