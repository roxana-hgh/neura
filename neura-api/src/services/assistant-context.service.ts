import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";

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