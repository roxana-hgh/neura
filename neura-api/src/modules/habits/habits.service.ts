import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";
import {
  type HabitView, getRange, shiftRange, groupEntriesByHabit, habitPeriodStats, toPercent,
  habitStartKey, habitLastKey, keyToStoredDate, currentStreak, bestStreak,
} from "@/modules/habits/habits.utils";
import type { WeekStartsOn } from "@/utils/date";

export interface CreateHabitInput {
  title: string;
  color: string;
  durationDays?: number | null; // null = no due date
  startDate?: string; // "yyyy-MM-dd", defaults to today
}

/**
 * Habits for the requested view + period, with per-habit stats and streaks, and
 * the completion percent of this period vs. the previous one.
 * `baseKey` / `todayKey` are the client's calendar days ("yyyy-MM-dd"); `weekStartsOn`
 * is the user's first day of the week (week view).
 */
export async function getHabitsOverview(
  userId: string, view: HabitView, baseKey: string, todayKey: string, weekStartsOn: WeekStartsOn,
) {
  const allHabits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  // lazy auto-archive: anything past its last day gets flipped on read.
  // habits with durationDays === null never get archived (they track forever).
  const toArchive = allHabits.filter((h) => {
    const last = habitLastKey(h);
    return !h.isArchived && last !== null && last < todayKey;
  });
  if (toArchive.length) {
    await prisma.habit.updateMany({ where: { id: { in: toArchive.map((h) => h.id) } }, data: { isArchived: true } });
    toArchive.forEach((h) => (h.isArchived = true));
  }

  const earliest = allHabits.reduce((min, h) => (habitStartKey(h) < min ? habitStartKey(h) : min), todayKey);
  const range = getRange(view, baseKey, earliest, todayKey, weekStartsOn);

  // A habit belongs to a period when its lifetime overlaps it, so past periods
  // still show habits that have been archived since.
  const habits = view === "all"
    ? allHabits
    : allHabits.filter((h) => {
      const last = habitLastKey(h);
      return habitStartKey(h) <= range.end && (last === null || last >= range.start);
    });

  // full history: streaks and lifetime totals need every entry, not just this period's
  const entriesByHabit = groupEntriesByHabit(
    habits.length
      ? await prisma.habitEntry.findMany({
        where: { habitId: { in: habits.map((h) => h.id) } },
        select: { habitId: true, date: true },
      })
      : [],
  );

  const habitsPayload = habits.map((h) => {
    const done = entriesByHabit.get(h.id) ?? new Set<string>();
    const { completed, total } = habitPeriodStats(h, done, range.start, range.end, todayKey);
    const { doneToday, streak } = currentStreak(done, todayKey);
    return {
      id: h.id, title: h.title, color: h.color, startDate: h.startDate, durationDays: h.durationDays,
      isArchived: h.isArchived, startKey: habitStartKey(h), lastKey: habitLastKey(h),
      entries: [...done].filter((d) => d >= range.start && d <= range.end).sort(),
      stats: { completed, total, percent: toPercent(completed, total) },
      streak: { current: streak, best: bestStreak(done) },
      doneToday,
      totalCompleted: done.size,
    };
  });

  const sum = (pick: (s: { completed: number; total: number }) => number) =>
    habitsPayload.reduce((acc, h) => acc + pick(h.stats), 0);
  const currentPercent = toPercent(sum((s) => s.completed), sum((s) => s.total));

  let previousPercent = 0;
  if (view !== "all") {
    const prev = getRange(view, shiftRange(view, range.start, -1), earliest, todayKey, weekStartsOn);
    let pTotal = 0, pCompleted = 0;
    for (const h of habits) {
      const stats = habitPeriodStats(h, entriesByHabit.get(h.id) ?? new Set(), prev.start, prev.end, todayKey);
      pTotal += stats.total;
      pCompleted += stats.completed;
    }
    previousPercent = toPercent(pCompleted, pTotal);
  }

  return {
    habits: habitsPayload, rangeStart: range.start, rangeEnd: range.end, today: todayKey,
    currentPercent, previousPercent,
  };
}

export function createHabit(userId: string, { title, color, durationDays = null, startDate }: CreateHabitInput) {
  return prisma.habit.create({
    data: {
      title: title.trim(), color, durationDays, userId,
      startDate: startDate ? keyToStoredDate(startDate) : new Date(),
    },
  });
}

/** `body` is the raw PATCH body: a missing `durationDays` leaves it unchanged, `null` clears the due date. */
export async function updateHabit(userId: string, id: string, body: Record<string, any>) {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Habit not found");

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.color !== undefined) data.color = body.color;
  if (body.startDate !== undefined) {
    data.startDate = keyToStoredDate(body.startDate);
    data.isArchived = false; // re-evaluated on the next read
  }
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

/** Adds or removes the entry for `date` ("yyyy-MM-dd"). Returns whether the day is now checked. */
export async function toggleHabitEntry(userId: string, id: string, date: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw notFound("Habit not found");

  const day = keyToStoredDate(date);
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
