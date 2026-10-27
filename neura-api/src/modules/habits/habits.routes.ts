import { Router } from "express";
import * as habits from "@/modules/habits/habits.controller";

// Mounted at /api/habits (behind requireAuth).
const router = Router();

router.get("/", habits.getHabits);
router.post("/", habits.createHabit);
router.patch("/:id", habits.updateHabit);
router.delete("/:id", habits.deleteHabit);
router.post("/:id/toggle", habits.toggleHabitEntry);

export default router;
