import { Router } from "express";
import * as reminders from "@/modules/reminders/reminders.controller";

// Mounted at /api/reminders (behind requireAuth).
// Static paths (/counts, /link-options) must be registered before /:id.
const router = Router();

router.get("/", reminders.listReminders);
router.post("/", reminders.createReminder);
router.get("/counts", reminders.getCounts);
router.get("/link-options", reminders.getLinkOptions);

router.patch("/:id", reminders.updateReminder);
router.delete("/:id", reminders.deleteReminder);
router.post("/:id/complete", reminders.completeReminder);
router.post("/:id/skip", reminders.skipReminder);
router.post("/:id/reopen", reminders.reopenReminder);
router.post("/:id/snooze", reminders.snoozeReminder);
router.post("/:id/pause", reminders.pauseReminder);
router.post("/:id/resume", reminders.resumeReminder);

export default router;
