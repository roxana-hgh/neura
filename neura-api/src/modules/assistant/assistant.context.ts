import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { currentStreak, groupEntriesByHabit, keyToStoredDate } from "@/modules/habits/habits.utils";
import { listGoals } from "@/modules/goals/goals.service";
import { clip, localDateTime } from "@/modules/assistant/tools/tool.utils";

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
    select: { name: true, age: true, job: true, gender: true, assistantInstructions: true },
  });
  return user;
}

/**
 * A small view of the rest of the app, so the assistant notices what's going on without a tool
 * call. It's sent with every request, so it stays short and leaves out anything that's empty.
 */
export async function buildWorkspaceContext(userId: string, todayKey: string, timeZone: string) {
  const now = new Date();
  const [overdueTasks, goals, reminders, overdueReminders, inboxCount, inbox, noteCount, focus] = await Promise.all([
    prisma.task.count({
      where: { userId, completed: false, dueDate: { lt: keyToStoredDate(todayKey) } },
    }),
    listGoals(userId, false, todayKey),
    prisma.reminder.findMany({
      where: { userId, status: "active" },
      orderBy: { nextAt: "asc" },
      take: 4,
      select: { title: true, nextAt: true },
    }),
    prisma.reminder.count({ where: { userId, status: "active", nextAt: { lte: now } } }),
    prisma.brainstorm.count({ where: { userId, status: "inbox" } }),
    prisma.brainstorm.findMany({
      where: { userId, status: "inbox" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { content: true },
    }),
    prisma.note.count({ where: { userId } }),
    prisma.focusSession.aggregate({
      where: { userId, startTime: { gte: subDays(now, 7) } },
      _sum: { duration: true },
    }),
  ]);

  const openGoals = goals.filter((g) => g.status === "active" || g.status === "paused");

  return {
    overdueTasks,
    goals: openGoals.slice(0, 6).map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      pace: g.pace,
      needsReview: g.needsReview || undefined,
      paused: g.status === "paused" || undefined,
      endDate: g.endDate,
    })),
    moreGoals: Math.max(openGoals.length - 6, 0) || undefined,
    reminders: { overdue: overdueReminders, next: reminders.map((r) => `${r.title} @ ${localDateTime(r.nextAt, timeZone)}`) },
    brainstormInbox: { count: inboxCount, latest: inbox.map((b) => clip(b.content.split("\n")[0], 60)) },
    notes: noteCount,
    focusMinutesLast7Days: Math.round((focus._sum.duration ?? 0) / 60),
  };
}