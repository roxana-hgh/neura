import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";

/**
 * NOTE: field names below (title, priority, dueDate, completed, taskListId)
 * are assumed to match your Task model in schema.prisma. Adjust if yours differ.
 */

// ---- Tool schemas sent to Gemini (camelCase per the REST API's JSON mapping) ----
export const TASK_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_tasks",
        description:
          "Look up the user's tasks. Always call this before editing or completing a task, to get its real id.",
        parameters: {
          type: "object",
          properties: {
            scope: {
              type: "string",
              enum: ["today", "week", "overdue", "all"],
              description: "Which tasks to return.",
            },
          },
          required: ["scope"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task for the user.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The task title." },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: {
              type: "string",
              description: "ISO 8601 date, e.g. 2026-07-20. Omit if not specified.",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description:
          "Edit an existing task (title, priority, due date) or mark it complete/incomplete. Requires the task's real id from list_tasks.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            title: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", description: "ISO 8601 date." },
            completed: { type: "boolean" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "delete_task",
        description:
          "Permanently delete a task. Requires the task's real id from list_tasks. Use only when the user clearly asks to remove/delete a task, not just complete it.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
      },
    ],
  },
];

// ---- Execution, always scoped to the authenticated user ----
export async function executeTaskTool(name: string, args: any, userId: string) {
  switch (name) {
    case "list_tasks":
      return listTasks(args.scope, userId);
    case "create_task":
      return createTask(args, userId);
    case "update_task":
      return updateTask(args, userId);
    case "delete_task":
      return deleteTask(args, userId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function listTasks(scope: string, userId: string) {
  const now = new Date();
  const where: any = { userId };

  if (scope === "today") {
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  } else if (scope === "week") {
    where.dueDate = { gte: startOfDay(now), lte: addDays(now, 7) };
    where.completed = false;
  } else if (scope === "overdue") {
    where.dueDate = { lt: startOfDay(now) };
    where.completed = false;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    select: { id: true, title: true, priority: true, dueDate: true, completed: true },
  });

  return { tasks };
}

async function createTask(args: any, userId: string) {
  const task = await prisma.task.create({
    data: {
      title: args.title,
      priority: args.priority ?? "medium",
      dueDate: args.dueDate ? new Date(args.dueDate) : null,
      userId,
    },
    select: { id: true, title: true, priority: true, dueDate: true, completed: true },
  });

  return { created: task };
}

async function updateTask(args: any, userId: string) {
  // Ownership check — never trust an id the model produced without verifying it's this user's task
  const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
  if (!existing) {
    return { error: "Task not found for this user." };
  }

  const data: any = {};
  if (args.title !== undefined) data.title = args.title;
  if (args.priority !== undefined) data.priority = args.priority;
  if (args.dueDate !== undefined) data.dueDate = new Date(args.dueDate);
  if (args.completed !== undefined) data.completed = args.completed;

  const task = await prisma.task.update({
    where: { id: args.taskId },
    data,
    select: { id: true, title: true, priority: true, dueDate: true, completed: true },
  });

  return { updated: task };
}

async function deleteTask(args: any, userId: string) {
  // Ownership check — same reasoning as updateTask: never delete on an unverified id
  const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
  if (!existing) {
    return { error: "Task not found for this user." };
  }

  // If your schema has SubTasks with a required FK to Task, delete those first
  // (matches the SubTask → Task deletion order noted in your project conventions).
  await prisma.subTask.deleteMany({ where: { taskId: args.taskId } }).catch(() => {});

  await prisma.task.delete({ where: { id: args.taskId } });

  return { deleted: { id: existing.id, title: existing.title } };
}