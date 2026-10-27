import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";
import {
  type HabitView, habitDueDate, getRange, shiftRange, groupEntriesByHabit, habitPeriodStats, toPercent,
} from "@/modules/habits/habits.utils";

export interface CreateHabitInput {
  title: string;
  color: string;
  durationDays?: number | null; // null = no due date
}

function entriesInRange(habitIds: string[], start: Date, end: Date) {
  return habitIds.length
    ? prisma.habitEntry.findMany({ where: { habitId: { in: habitIds }, date: { gte: start, lte: end } } })
    : Promise.resolve([]);
}

/**
 * Habits for the requested view + period, with per-habit stats and the
 * completion percent of this period vs. the previous one.
 */
export async function getHabitsOverview(userId: string, view: HabitView, dateParam: string | undefined) {
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
  const entriesByHabit = groupEntriesByHabit(await entriesInRange(habitIds, start, end));

  const habitsPayload = activeHabits.map((h) => {
    const { completed, total } = habitPeriodStats(h, entriesByHabit.get(h.id) ?? new Set(), start, end, now);
    return {
      id: h.id, title: h.title, color: h.color, startDate: h.startDate, durationDays: h.durationDays,
      isArchived: h.isArchived, entries: Array.from(entriesByHabit.get(h.id) ?? []),
      stats: { completed, total, percent: toPercent(completed, total) },
    };
  });

  const currentTotal = habitsPayload.reduce((s, h) => s + h.stats.total, 0);
  const currentCompleted = habitsPayload.reduce((s, h) => s + h.stats.completed, 0);
  const currentPercent = toPercent(currentCompleted, currentTotal);

  let previousPercent = 0;
  if (view !== "all") {
    const prevBase = shiftRange(view, start, -1)!;
    const prevRange = getRange(view, prevBase.toISOString(), earliest)!;
    const prevByHabit = groupEntriesByHabit(await entriesInRange(habitIds, prevRange.start, prevRange.end));

    let pTotal = 0, pCompleted = 0;
    for (const h of activeHabits) {
      const stats = habitPeriodStats(h, prevByHabit.get(h.id) ?? new Set(), prevRange.start, prevRange.end, now);
      pTotal += stats.total;
      pCompleted += stats.completed;
    }
    previousPercent = toPercent(pCompleted, pTotal);
  }

  return { habits: habitsPayload, rangeStart: start, rangeEnd: end, currentPercent, previousPercent };
}

export function createHabit(userId: string, { title, color, durationDays = null }: CreateHabitInput) {
  return prisma.habit.create({
    data: { title: title.trim(), color, startDate: new Date(), durationDays, userId },
  });
}

/** `body` is the raw PATCH body: a missing `durationDays` leaves it unchanged, `null` clears the due date. */
export async function updateHabit(userId: string, id: string, body: Record<string, any>) {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Habit not found");

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.color !== undefined) data.color = body.color;
  if (Object.prototype.hasOwnProperty.call(body, "durationDays")) {
    data.durationDays = body.durationDays; // number | null
    data.isArchived = false; // changing duration brings it back to active
  }

  return prisma.habit.update({ where: { id, userId }, data }).catch(() => {
    throw notFound("Habit not found");
  });
}

export async function deleteHabit(userId: string, id: string) {
  await prisma.habit.delete({ where: { id, userId } }).catch(() => {
    throw notFound("Habit not found");
  });
}

/** Adds or removes the entry for `date`. Returns whether the day is now checked. */
export async function toggleHabitEntry(userId: string, id: string, date: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw notFound("Habit not found");

  const day = new Date(date);
  const existingEntry = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId: habit.id, date: day } },
  });

  if (existingEntry) {
    await prisma.habitEntry.delete({ where: { id: existingEntry.id } });
    return { checked: false };
  }

  await prisma.habitEntry.create({ data: { habitId: habit.id, date: day } });
  return { checked: true };
}
