import { Router } from "express";
import * as goals from "@/modules/goals/goals.controller";

// Mounted at /api/goals (behind requireAuth). Sub-goals are goals with a parent_id,
// so they use the same routes.
const router = Router();

router.get("/", goals.listGoals);
router.post("/", goals.createGoal);

router.get("/:id", goals.getGoal);
router.patch("/:id", goals.updateGoal);
router.delete("/:id", goals.deleteGoal);

router.patch("/:id/status", goals.setStatus);
router.post("/:id/extend", goals.extendGoal);
router.post("/:id/archive", goals.setArchived);
router.post("/:id/progress", goals.recordProgress);
router.post("/:id/notes", goals.addNote);
router.delete("/:id/logs/:logId", goals.deleteLog);
router.get("/:id/reminders", goals.getLinkedReminders);

router.post("/:id/tasks", goals.createTask);
router.get("/:id/link-options", goals.getLinkOptions);
router.post("/:id/links", goals.addLink);
router.delete("/:id/links/:type/:targetId", goals.removeLink);

export default router;
