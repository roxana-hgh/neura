import { Router, Request, Response } from "express";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears,
  format, min as minDate, max as maxDate, differenceInCalendarDays,
} from "date-fns";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/get-session";


const router = Router();

type ViewType = "week" | "month" | "year" | "all";
type HabitRow = { startDate: Date; durationDays: number | null };

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function habitDueDate(h: HabitRow): Date | null {
  return h.durationDays != null ? addDays(h.startDate, h.durationDays) : null;
}

function getRange(view: ViewType, dateStr: string | undefined, earliest: Date | null) {
  const base = dateStr ? new Date(dateStr) : new Date();
  switch (view) {
    case "week": return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
    case "month": return { start: startOfMonth(base), end: endOfMonth(base) };
    case "year": return { start: startOfYear(base), end: endOfYear(base) };
    case "all": return { start: earliest ?? new Date(), end: new Date() };
  }
}

function shiftRange(view: ViewType, date: Date, direction: 1 | -1) {
  switch (view) {
    case "week": return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month": return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case "year": return direction === 1 ? addYears(date, 1) : subYears(date, 1);
    case "all": return date;
  }
}

// GET /api/habits?view=week&date=2026-02-04
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const view = (req.query.view as ViewType) || "week";
  const dateParam = req.query.date as string | undefined;

  const allHabits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  // lazy auto-archive: anything past its due date gets flipped on read.
  // habits with durationDays === null never get archived (they track forever).
  const now = new Date();
  const toArchive = allHabits.filter((h) => {
    if (h.isArchived) return false;
    const due = habitDueDate(h);
    return due !== null && due < now;
  });
  if (toArchive.length) {
    await prisma.habit.updateMany({ where: { id: { in: toArchive.map((h) => h.id) } }, data: { isArchived: true } });
    toArchive.forEach((h) => (h.isArchived = true));
  }

  const activeHabits = view === "all" ? allHabits : allHabits.filter((h) => !h.isArchived);
  const earliest = allHabits.length
    ? allHabits.reduce((min, h) => (h.startDate < min ? h.startDate : min), allHabits[0].startDate)
    : null;

  const { start, end } = getRange(view, dateParam, earliest)!;
  const habitIds = activeHabits.map((h) => h.id);

  const entries = habitIds.length
    ? await prisma.habitEntry.findMany({ where: { habitId: { in: habitIds }, date: { gte: start, lte: end } } })
    : [];

  const entriesByHabit = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!entriesByHabit.has(e.habitId)) entriesByHabit.set(e.habitId, new Set());
    entriesByHabit.get(e.habitId)!.add(dayKey(e.date));
  }

  const buildStats = (habit: (typeof activeHabits)[number], rangeStart: Date, rangeEnd: Date) => {
    const due = habitDueDate(habit);
    const cellStart = maxDate([rangeStart, habit.startDate]);
    const cellEndCandidates = [rangeEnd, now];
    if (due) cellEndCandidates.push(due);
    const cellEnd = minDate(cellEndCandidates);

    const total = Math.max(0, differenceInCalendarDays(cellEnd, cellStart) + 1);
    const doneSet = entriesByHabit.get(habit.id) ?? new Set<string>();
    let completed = 0;
    for (const d of doneSet) {
      const dd = new Date(d);
      if (dd >= cellStart && dd <= cellEnd) completed++;
    }
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const habitsPayload = activeHabits.map((h) => ({
    id: h.id, title: h.title, color: h.color, startDate: h.startDate, durationDays: h.durationDays,
    isArchived: h.isArchived, entries: Array.from(entriesByHabit.get(h.id) ?? []), stats: buildStats(h, start, end),
  }));

  const currentTotal = habitsPayload.reduce((s, h) => s + h.stats.total, 0);
  const currentCompleted = habitsPayload.reduce((s, h) => s + h.stats.completed, 0);
  const currentPercent = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0;

  let previousPercent = 0;
  if (view !== "all") {
    const prevBase = shiftRange(view, start, -1)!;
    const prevRange = getRange(view, prevBase.toISOString(), earliest)!;
    const prevEntries = habitIds.length
      ? await prisma.habitEntry.findMany({ where: { habitId: { in: habitIds }, date: { gte: prevRange.start, lte: prevRange.end } } })
      : [];
    const prevByHabit = new Map<string, Set<string>>();
    for (const e of prevEntries) {
      if (!prevByHabit.has(e.habitId)) prevByHabit.set(e.habitId, new Set());
      prevByHabit.get(e.habitId)!.add(dayKey(e.date));
    }
    let pTotal = 0, pCompleted = 0;
    for (const h of activeHabits) {
      const due = habitDueDate(h);
      const cellStart = maxDate([prevRange.start, h.startDate]);
      const cellEndCandidates = [prevRange.end, now];
      if (due) cellEndCandidates.push(due);
      const cellEnd = minDate(cellEndCandidates);
      pTotal += Math.max(0, differenceInCalendarDays(cellEnd, cellStart) + 1);
      pCompleted += Array.from(prevByHabit.get(h.id) ?? []).filter((d) => {
        const dd = new Date(d);
        return dd >= cellStart && dd <= cellEnd;
      }).length;
    }
    previousPercent = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;
  }

  res.json({ habits: habitsPayload, rangeStart: start, rangeEnd: end, currentPercent, previousPercent });
});

// POST /api/habits — create a habit. durationDays: number | null (null = no due date)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { title, color, durationDays = null } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const habit = await prisma.habit.create({
    data: { title: title.trim(), color, startDate: new Date(), durationDays, userId },
  });

  res.status(201).json(habit);
});

// PATCH /api/habits/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { title, color } = req.body;

  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (color !== undefined) data.color = color;
  // distinguish "not provided" (leave unchanged) from "explicitly null" (clear due date)
  if (Object.prototype.hasOwnProperty.call(req.body, "durationDays")) {
    data.durationDays = req.body.durationDays; // number | null
    data.isArchived = false; // changing duration brings it back to active
  }

  try {
    const habit = await prisma.habit.update({ where: { id, userId }, data });
    res.json(habit);
  } catch {
    res.status(404).json({ error: "Habit not found" });
  }
});

// DELETE /api/habits/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  try {
    await prisma.habit.delete({ where: { id, userId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Habit not found" });
  }
});

// POST /api/habits/:id/toggle  { date: "2026-02-04" }
router.post("/:id/toggle", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { date } = req.body;

  if (!date) {
    res.status(400).json({ error: "date is required" });
    return;
  }

  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const day = new Date(date);
  const existingEntry = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId: habit.id, date: day } },
  });

  if (existingEntry) {
    await prisma.habitEntry.delete({ where: { id: existingEntry.id } });
    res.json({ checked: false });
    return;
  }

  await prisma.habitEntry.create({ data: { habitId: habit.id, date: day } });
  res.json({ checked: true });
});

export default router;