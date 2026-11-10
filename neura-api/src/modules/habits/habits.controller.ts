import type { Request, Response } from "express";
import { z } from "zod";
import * as habitsService from "@/modules/habits/habits.service";
import { HABIT_VIEWS, isDayKey } from "@/modules/habits/habits.utils";
import { DEFAULT_WEEK_STARTS_ON, dayKey, isWeekStartsOn } from "@/utils/date";
import { dayKey as dayKeySchema, parse, queryInt, requiredText } from "@/utils/validate";

type IdParams = { id: string };

const overviewQuery = z.object({
  view: z.enum(HABIT_VIEWS as ["week", "month", "year", "all"], { error: "Invalid view" }).default("week"),
  today: z.unknown(),
  date: z.unknown(),
  weekStartsOn: queryInt.transform((n) => (isWeekStartsOn(n) ? n : DEFAULT_WEEK_STARTS_ON)),
});

const habitFields = {
  title: requiredText(200),
  color: z.string({ error: "is required" }).min(1, "is required").max(30),
  // 100 years at most; null = tracked forever
  durationDays: z.number({ error: "must be a positive integer or null" })
    .int("must be a positive integer or null").min(1, "must be a positive integer or null").max(36_500).nullable(),
  startDate: dayKeySchema,
};

const createBody = z.object({
  ...habitFields,
  durationDays: habitFields.durationDays.optional(),
  startDate: habitFields.startDate.optional(),
});

const updateBody = z.object(habitFields).partial();

const toggleBody = z.object({ date: dayKeySchema });

// GET /api/habits?view=week&date=2026-02-04&today=2026-02-06&weekStartsOn=1
// `today` is the client's calendar day, so "future" and streaks match the user's time zone.
// `weekStartsOn` (6 | 0 | 1) is the user's week-start setting; defaults to Monday.
export async function getHabits(req: Request, res: Response) {
  const query = parse(overviewQuery, req.query);
  const today = isDayKey(query.today) ? query.today : dayKey(new Date());
  const date = isDayKey(query.date) ? query.date : today;
  res.json(await habitsService.getHabitsOverview(req.userId!, query.view, date, today, query.weekStartsOn));
}

// POST /api/habits  { title, color, durationDays: number | null, startDate?: "yyyy-MM-dd" }
export async function createHabit(req: Request, res: Response) {
  const habit = await habitsService.createHabit(req.userId!, parse(createBody, req.body));
  res.status(201).json(habit);
}

// PATCH /api/habits/:id  { title?, color?, durationDays?, startDate? }
export async function updateHabit(req: Request<IdParams>, res: Response) {
  res.json(await habitsService.updateHabit(req.userId!, req.params.id, parse(updateBody, req.body)));
}

// DELETE /api/habits/:id
export async function deleteHabit(req: Request<IdParams>, res: Response) {
  await habitsService.deleteHabit(req.userId!, req.params.id);
  res.status(204).send();
}

// POST /api/habits/:id/toggle  { date: "2026-02-04" }
export async function toggleHabitEntry(req: Request<IdParams>, res: Response) {
  const { date } = parse(toggleBody, req.body);
  res.json(await habitsService.toggleHabitEntry(req.userId!, req.params.id, date));
}
