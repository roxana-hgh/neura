import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, addDays, subDays, format } from "date-fns";

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export async function buildTaskContext(userId: string) {
  const now = new Date();

  const [todayTasks, weekTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      orderBy: { priority: "desc" },
      select: { title: true, priority: true, completed: true, dueDate: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: startOfDay(now), lte: addDays(now, 7) },
        completed: false,
      },
      orderBy: { dueDate: "asc" },
      select: { title: true, priority: true, dueDate: true },
    }),
  ]);

  return { today: todayTasks, upcomingWeek: weekTasks };
}

export async function buildHabitContext(userId: string) {
  const now = new Date();

  const activeHabits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, durationDays: true },
  });

  if (activeHabits.length === 0) return { habits: [] };

  const habitIds = activeHabits.map((h) => h.id);
  // 60-day lookback is plenty for a meaningful streak without pulling full history
  const lookback = subDays(startOfDay(now), 60);
  const entries = await prisma.habitEntry.findMany({
    where: { habitId: { in: habitIds }, date: { gte: lookback } },
    select: { habitId: true, date: true },
  });

  const entriesByHabit = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!entriesByHabit.has(e.habitId)) entriesByHabit.set(e.habitId, new Set());
    entriesByHabit.get(e.habitId)!.add(dayKey(e.date));
  }

  const todayKey = dayKey(now);

  const habits = activeHabits.map((h) => {
    const doneDates = entriesByHabit.get(h.id) ?? new Set<string>();
    const doneToday = doneDates.has(todayKey);

    let streak = 0;
    let cursor = doneToday ? now : subDays(now, 1);
    while (doneDates.has(dayKey(cursor))) {
      streak++;
      cursor = subDays(cursor, 1);
    }

    return {
      title: h.title,
      doneToday,
      currentStreak: streak,
      durationDays: h.durationDays,
    };
  });

  return { habits };
}

export async function buildUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, age: true, job: true, gender: true },
  });
  return user;
}