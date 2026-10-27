import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { dayKey } from "@/utils/date";
import { currentStreak, groupEntriesByHabit } from "@/modules/habits/habits.utils";

/**
 * Assistant tools for habits — mirrors task.tools.ts: tool schemas + execution
 * scoped to the authenticated user.
 */

// ---- Tool schemas (`functionDeclarations` groups; converted to OpenAI format by toGroqTools in lib/groq.ts) ----
export const HABIT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_habits",
        description:
          "Look up the user's habits, including today's completion status and current streak for each. Always call this before logging, editing, or deleting a habit, to get its real id and current state.",
        parameters: {
          type: "object",
          properties: {
            includeArchived: {
              type: "boolean",
              description: "Include archived (finished/expired) habits. Defaults to false.",
            },
          },
        },
      },
      {
        name: "create_habit",
        description: "Create a new habit for the user.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The habit title." },
            color: {
              type: "string",
              description: "A color name for the habit (e.g. 'blue', 'green'). Optional.",
            },
            durationDays: {
              type: "integer",
              description:
                "Number of days to track the habit for, starting today. Omit or leave unset for a habit tracked forever with no end date.",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "update_habit",
        description:
          "Edit an existing habit (title, color, or duration). Requires the habit's real id from list_habits. Changing durationDays reactivates an archived habit.",
        parameters: {
          type: "object",
          properties: {
            habitId: { type: "string" },
            title: { type: "string" },
            color: { type: "string" },
            durationDays: {
              type: "integer",
              description: "Set a new duration in days, or omit to leave unchanged.",
            },
          },
          required: ["habitId"],
        },
      },
      {
        name: "delete_habit",
        description:
          "Permanently delete a habit and all of its logged entries. Requires the habit's real id from list_habits. Use only when the user clearly asks to remove/delete a habit.",
        parameters: {
          type: "object",
          properties: {
            habitId: { type: "string" },
          },
          required: ["habitId"],
        },
      },
      {
        name: "log_habit_completion",
        description:
          "Mark a habit as done or not done for a given date. Requires the habit's real id from list_habits. Defaults to today if no date is given.",
        parameters: {
          type: "object",
          properties: {
            habitId: { type: "string" },
            date: {
              type: "string",
              description: "ISO 8601 date, e.g. 2026-08-14. Omit to use today.",
            },
            completed: {
              type: "boolean",
              description: "true to mark done, false to unmark. Defaults to true.",
            },
          },
          required: ["habitId"],
        },
      },
    ],
  },
];

export const HABIT_TOOL_NAMES = new Set([
  "list_habits",
  "create_habit",
  "update_habit",
  "delete_habit",
  "log_habit_completion",
]);

// ---- Execution, always scoped to the authenticated user ----
export async function executeHabitTool(name: string, args: any, userId: string) {
  switch (name) {
    case "list_habits":
      return listHabits(args, userId);
    case "create_habit":
      return createHabit(args, userId);
    case "update_habit":
      return updateHabit(args, userId);
    case "delete_habit":
      return deleteHabit(args, userId);
    case "log_habit_completion":
      return logHabitCompletion(args, userId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function listHabits(args: any, userId: string) {
  const now = new Date();
  const habits = await prisma.habit.findMany({
    where: args.includeArchived ? { userId } : { userId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  if (habits.length === 0) return { habits: [] };

  const habitIds = habits.map((h) => h.id);
  const lookback = subDays(startOfDay(now), 60);
  const entries = await prisma.habitEntry.findMany({
    where: { habitId: { in: habitIds }, date: { gte: lookback } },
    select: { habitId: true, date: true },
  });

  const entriesByHabit = groupEntriesByHabit(entries);

  const payload = habits.map((h) => {
    const { doneToday, streak } = currentStreak(entriesByHabit.get(h.id) ?? new Set(), now);

    return {
      id: h.id,
      title: h.title,
      color: h.color,
      isArchived: h.isArchived,
      durationDays: h.durationDays,
      doneToday,
      currentStreak: streak,
    };
  });

  return { habits: payload };
}

async function createHabit(args: any, userId: string) {
  const habit = await prisma.habit.create({
    data: {
      title: args.title.trim(),
      color: args.color ?? "blue",
      startDate: new Date(),
      durationDays: args.durationDays ?? null,
      userId,
    },
  });

  return {
    created: { id: habit.id, title: habit.title, durationDays: habit.durationDays },
  };
}

async function updateHabit(args: any, userId: string) {
  const existing = await prisma.habit.findFirst({ where: { id: args.habitId, userId } });
  if (!existing) {
    return { error: "Habit not found for this user." };
  }

  const data: any = {};
  if (args.title !== undefined) data.title = args.title.trim();
  if (args.color !== undefined) data.color = args.color;
  if (args.durationDays !== undefined) {
    data.durationDays = args.durationDays;
    data.isArchived = false; // matches PATCH /api/habits/:id behavior
  }

  const habit = await prisma.habit.update({ where: { id: args.habitId }, data });

  return {
    updated: { id: habit.id, title: habit.title, durationDays: habit.durationDays },
  };
}

async function deleteHabit(args: any, userId: string) {
  const existing = await prisma.habit.findFirst({ where: { id: args.habitId, userId } });
  if (!existing) {
    return { error: "Habit not found for this user." };
  }

  await prisma.habit.delete({ where: { id: args.habitId } });

  return { deleted: { id: existing.id, title: existing.title } };
}

async function logHabitCompletion(args: any, userId: string) {
  const habit = await prisma.habit.findFirst({ where: { id: args.habitId, userId } });
  if (!habit) {
    return { error: "Habit not found for this user." };
  }

  const day = args.date ? new Date(args.date) : new Date(dayKey(new Date()));
  const shouldComplete = args.completed !== false;

  const existingEntry = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId: habit.id, date: day } },
  });

  if (!shouldComplete) {
    if (existingEntry) {
      await prisma.habitEntry.delete({ where: { id: existingEntry.id } });
    }
    return { habit: habit.title, date: dayKey(day), completed: false };
  }

  if (!existingEntry) {
    await prisma.habitEntry.create({ data: { habitId: habit.id, date: day } });
  }
  return { habit: habit.title, date: dayKey(day), completed: true };
}