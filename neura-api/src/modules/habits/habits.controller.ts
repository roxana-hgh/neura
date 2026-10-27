import type { Request, Response } from "express";
import * as habitsService from "@/modules/habits/habits.service";
import { HABIT_VIEWS, isDayKey, type HabitView } from "@/modules/habits/habits.utils";
import { dayKey } from "@/utils/date";

type IdParams = { id: string };

function isValidDuration(v: unknown) {
  return v === null || (Number.isInteger(v) && (v as number) >= 1);
}

// GET /api/habits?view=week&date=2026-02-04&today=2026-02-06
// `today` is the client's calendar day, so "future" and streaks match the user's time zone.
export async function getHabits(req: Request, res: Response) {
  const view = (req.query.view as HabitView) || "week";
  if (!HABIT_VIEWS.includes(view)) {
    res.status(400).json({ error: "Invalid view" });
    return;
  }
  const today = isDayKey(req.query.today) ? req.query.today : dayKey(new Date());
  const date = isDayKey(req.query.date) ? req.query.date : today;
  res.json(await habitsService.getHabitsOverview(req.userId!, view, date, today));
}

// POST /api/habits  { title, color, durationDays: number | null, startDate?: "yyyy-MM-dd" }
export async function createHabit(req: Request, res: Response) {
  if (!req.body.title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (req.body.startDate !== undefined && !isDayKey(req.body.startDate)) {
    res.status(400).json({ error: "startDate must be yyyy-MM-dd" });
    return;
  }
  if (req.body.durationDays !== undefined && !isValidDuration(req.body.durationDays)) {
    res.status(400).json({ error: "durationDays must be a positive integer or null" });
    return;
  }
  const habit = await habitsService.createHabit(req.userId!, req.body);
  res.status(201).json(habit);
}

// PATCH /api/habits/:id  { title?, color?, durationDays?, startDate? }
export async function updateHabit(req: Request<IdParams>, res: Response) {
  if (req.body.title !== undefined && !req.body.title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (req.body.startDate !== undefined && !isDayKey(req.body.startDate)) {
    res.status(400).json({ error: "startDate must be yyyy-MM-dd" });
    return;
  }
  if (req.body.durationDays !== undefined && !isValidDuration(req.body.durationDays)) {
    res.status(400).json({ error: "durationDays must be a positive integer or null" });
    return;
  }
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
  if (!isDayKey(date)) {
    res.status(400).json({ error: "date is required (yyyy-MM-dd)" });
    return;
  }
  res.json(await habitsService.toggleHabitEntry(req.userId!, req.params.id, date));
}
