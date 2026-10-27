import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { currentStreak, groupEntriesByHabit } from "@/modules/habits/habits.utils";

// Snapshots of the user's data that are embedded in the assistant prompt.

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

  const entriesByHabit = groupEntriesByHabit(entries);

  const habits = activeHabits.map((h) => {
    const { doneToday, streak } = currentStreak(entriesByHabit.get(h.id) ?? new Set(), now);

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