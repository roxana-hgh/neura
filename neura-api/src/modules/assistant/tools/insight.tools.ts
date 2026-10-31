import { TZDate } from "@date-fns/tz";
import { format, parseISO, subDays, subMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createSession, isValidTag } from "@/modules/focus-sessions/focus-sessions.service";
import { groupEntriesByHabit, habitPeriodStats, keyToStoredDate, toPercent } from "@/modules/habits/habits.utils";
import { zonedTime } from "@/modules/reminders/reminders.utils";
import { localMoment } from "@/modules/assistant/tools/reminder.tools";
import { dayArg, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { HttpError } from "@/utils/http-error";

/** Assistant tools for analysis: real numbers to base feedback on, plus logging focus time. */

const MAX_DAYS = 90;

export const INSIGHT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_insights",
        description:
          "Numbers for the last N days: tasks finished (and by weekday), focus time by tag and day, each habit's consistency. Use it to give honest, specific feedback.",
        parameters: {
          type: "object",
          properties: { days: { type: "integer", description: "1–90. Default 7." } },
        },
      },
      {
        name: "log_focus_session",
        description: "Record focus time the user did outside the timer.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            minutes: { type: "integer" },
            tag: { type: "string", enum: ["work", "personal", "study", "break", "other"] },
            date: { type: "string", description: "yyyy-MM-dd. Omit if it just ended." },
            time: { type: "string", description: "Local end time, HH:mm." },
          },
          required: ["name", "minutes"],
        },
      },
    ],
  },
];

export async function executeInsightTool(name: string, args: any, ctx: ToolContext) {
  switch (name) {
    case "get_insights":
      return getInsights(args, ctx);
    case "log_focus_session":
      return logFocusSession(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const weekdayIn = (date: Date, timeZone: string) => format(new TZDate(date.getTime(), timeZone), "EEEE");
const dayIn = (date: Date, timeZone: string) => format(new TZDate(date.getTime(), timeZone), "yyyy-MM-dd");

function countBy<T>(items: T[], key: (item: T) => string, weight: (item: T) => number = () => 1) {
  const totals: Record<string, number> = {};
  for (const item of items) totals[key(item)] = (totals[key(item)] ?? 0) + weight(item);
  return totals;
}

async function getInsights({ days }: any, { userId, todayKey, timeZone }: ToolContext) {
  const span = Number.isInteger(days) ? Math.min(Math.max(days, 1), MAX_DAYS) : 7;
  const fromKey = format(subDays(parseISO(todayKey), span - 1), "yyyy-MM-dd");
  const from = zonedTime(fromKey, 0, 0, timeZone);

  const [completedTasks, createdCount, overdueCount, sessions, habits] = await Promise.all([
    prisma.task.findMany({
      where: { userId, completed: true, completedAt: { gte: from } },
      select: { completedAt: true },
    }),
    prisma.task.count({ where: { userId, createdAt: { gte: from } } }),
    prisma.task.count({
      where: { userId, completed: false, dueDate: { lt: keyToStoredDate(todayKey) } },
    }),
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: from } },
      select: { duration: true, tag: true, startTime: true },
    }),
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { id: true, title: true, startDate: true, durationDays: true },
    }),
  ]);

  const entries = await prisma.habitEntry.findMany({
    where: { habitId: { in: habits.map((h) => h.id) }, date: { gte: keyToStoredDate(fromKey) } },
    select: { habitId: true, date: true },
  });
  const entriesByHabit = groupEntriesByHabit(entries);

  const minutes = (s: { duration: number }) => Math.round(s.duration / 60);
  const focusByDay = countBy(sessions, (s) => dayIn(s.startTime, timeZone), minutes);
  const [bestDay] = Object.entries(focusByDay).sort((a, b) => b[1] - a[1]);

  return {
    range: { from: fromKey, to: todayKey, days: span },
    tasks: {
      completed: completedTasks.length,
      created: createdCount,
      overdueNow: overdueCount,
      completedByWeekday: countBy(completedTasks, (t) => weekdayIn(t.completedAt!, timeZone)),
    },
    focus: {
      totalMinutes: sessions.reduce((sum, s) => sum + minutes(s), 0),
      sessions: sessions.length,
      byTag: countBy(sessions, (s) => s.tag ?? "untagged", minutes),
      bestDay: bestDay && { day: bestDay[0], minutes: bestDay[1] },
    },
    habits: habits.map((h) => {
      const { completed, total } = habitPeriodStats(
        h, entriesByHabit.get(h.id) ?? new Set(), fromKey, todayKey, todayKey,
      );
      return { title: h.title, completed, of: total, percent: toPercent(completed, total) };
    }),
  };
}

async function logFocusSession(args: any, { userId, timeZone }: ToolContext) {
  const { minutes, tag } = args;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) throw new HttpError(400, "minutes must be 1–720");
  if (tag !== undefined && !isValidTag(tag)) throw new HttpError(400, "Invalid tag");

  const endTime = args.date ? localMoment(dayArg(args.date, "date"), args.time ?? "12:00", timeZone) : new Date();
  if (endTime.getTime() > Date.now()) throw new HttpError(400, "Can't log a session in the future");

  const session = await createSession(userId, {
    name: requiredText(args.name, "Name", 120),
    tag,
    duration: minutes * 60,
    startTime: subMinutes(endTime, minutes),
    endTime,
  });
  return { created: { id: session.id, title: session.name, meta: `${minutes} min` } };
}
