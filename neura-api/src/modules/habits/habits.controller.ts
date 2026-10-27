import type { Request, Response } from "express";
import * as habitsService from "@/modules/habits/habits.service";
import type { HabitView } from "@/modules/habits/habits.utils";

type IdParams = { id: string };

// GET /api/habits?view=week&date=2026-02-04
export async function getHabits(req: Request, res: Response) {
  const view = (req.query.view as HabitView) || "week";
  const date = req.query.date as string | undefined;
  res.json(await habitsService.getHabitsOverview(req.userId!, view, date));
}

// POST /api/habits  { title, color, durationDays: number | null }
export async function createHabit(req: Request, res: Response) {
  if (!req.body.title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const habit = await habitsService.createHabit(req.userId!, req.body);
  res.status(201).json(habit);
}

// PATCH /api/habits/:id  { title?, color?, durationDays? }
export async function updateHabit(req: Request<IdParams>, res: Response) {
  res.json(await habitsService.updateHabit(req.userId!, req.params.id, req.body));
}

// DELETE /api/habits/:id
export async function deleteHabit(req: Request<IdParams>, res: Response) {
  await habitsService.deleteHabit(req.userId!, req.params.id);
  res.status(204).send();
}

// POST /api/habits/:id/toggle  { date: "2026-02-04" }
export async function toggleHabitEntry(req: Request<IdParams>, res: Response) {
  const { date } = req.body;
  if (!date) {
    res.status(400).json({ error: "date is required" });
    return;
  }
  res.json(await habitsService.toggleHabitEntry(req.userId!, req.params.id, date));
}
