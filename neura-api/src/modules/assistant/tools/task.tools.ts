import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { assertTaskOwner, getTask } from "@/modules/tasks/tasks.service";
import { requiredText } from "@/modules/assistant/tools/tool.utils";
import { HttpError, notFound } from "@/utils/http-error";

/**
 * Assistant tools for tasks: schemas the model can call + their execution,
 * always scoped to the authenticated user.
 */

const PRIORITIES = ["low", "medium", "high"];
const MAX_LISTED_TASKS = 50;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;
const MAX_SUBTASKS = 20;
const TASK_SELECT = { id: true, title: true, priority: true, dueDate: true, completed: true };

// ---- Tool schemas (`functionDeclarations` groups; converted to OpenAI format by toGroqTools in lib/groq.ts) ----
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
              enum: ["today", "week", "upcoming", "overdue", "all"],
              description: "Which tasks to return.",
            },
            query: { type: "string", description: "Only tasks whose title contains this." },
          },
          required: ["scope"],
        },
      },
      {
        name: "create_task",
        description: "Create a task, optionally with a description, list and subtasks.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: PRIORITIES },
            dueDate: { type: "string", description: "yyyy-MM-dd. Omit if not specified." },
            listId: { type: "string" },
            subtasks: { type: "array", items: { type: "string" }, description: "Subtask titles." },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description:
          "Edit a task or mark it complete/incomplete. Requires its real id from list_tasks.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: PRIORITIES },
            dueDate: { type: "string", description: "yyyy-MM-dd, or \"\" to clear." },
            listId: { type: "string", description: "List id, or \"\" to remove it from its list." },
            completed: { type: "boolean" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "delete_task",
        description:
          "Permanently delete a task. Use only when the user clearly asks to remove it, not just complete it.",
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

/** Loaded on demand: subtasks, lists, and changes to many tasks at once. */
export const TASK_DETAIL_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_task",
        description: "One task in full: description, subtasks (with ids), list and goal.",
        parameters: {
          type: "object",
          properties: { taskId: { type: "string" } },
          required: ["taskId"],
        },
      },
      {
        name: "add_subtasks",
        description: "Break a task down: add subtasks to it.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            titles: { type: "array", items: { type: "string" } },
          },
          required: ["taskId", "titles"],
        },
      },
      {
        name: "update_subtask",
        description: "Rename, check/uncheck or delete a subtask. Subtask ids come from get_task.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            subtaskId: { type: "string" },
            title: { type: "string" },
            completed: { type: "boolean" },
            delete: { type: "boolean" },
          },
          required: ["taskId", "subtaskId"],
        },
      },
      {
        name: "bulk_update_tasks",
        description:
          "Apply one change to many tasks in a single call. Only after the user agreed to the change.",
        parameters: {
          type: "object",
          properties: {
            taskIds: { type: "array", items: { type: "string" } },
            dueDate: { type: "string", description: "yyyy-MM-dd." },
            priority: { type: "string", enum: PRIORITIES },
            listId: { type: "string" },
            completed: { type: "boolean" },
          },
          required: ["taskIds"],
        },
      },
      {
        name: "list_task_lists",
        description: "The user's task lists, with how many open tasks each has.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "create_task_list",
        description: "Create a task list.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            color: {
              type: "string",
              enum: ["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"],
            },
          },
          required: ["name"],
        },
      },
    ],
  },
];

// ---- Execution, always scoped to the authenticated user ----
export async function executeTaskTool(name: string, args: any, userId: string) {
  switch (name) {
    case "list_tasks":
      return listTasks(args, userId);
    case "create_task":
      return createTask(args, userId);
    case "update_task":
      return updateTask(args, userId);
    case "delete_task":
      return deleteTask(args, userId);
    case "get_task":
      return readTask(args, userId);
    case "add_subtasks":
      return addSubtasks(args, userId);
    case "update_subtask":
      return updateSubtask(args, userId);
    case "bulk_update_tasks":
      return bulkUpdateTasks(args, userId);
    case "list_task_lists":
      return listTaskLists(userId);
    case "create_task_list":
      return createTaskList(args, userId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function assertListOwner(userId: string, listId: string) {
  const list = await prisma.taskList.findFirst({ where: { id: listId, userId }, select: { id: true } });
  if (!list) throw notFound("List not found");
}

function subtaskTitles(titles: unknown) {
  if (!Array.isArray(titles) || titles.length === 0) throw new HttpError(400, "titles is required");
  if (titles.length > MAX_SUBTASKS) throw new HttpError(400, `At most ${MAX_SUBTASKS} subtasks at once`);
  return titles.map((t) => requiredText(t, "Subtask title", MAX_TITLE));
}

async function listTasks({ scope, query }: any, userId: string) {
  const now = new Date();
  const where: any = { userId };

  if (scope === "today") {
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(now) };
  } else if (scope === "week") {
    where.dueDate = { gte: startOfDay(now), lte: addDays(now, 7) };
    where.completed = false;
  } else if (scope === "upcoming") {
    where.dueDate = { gte: startOfDay(now) };
    where.completed = false;
  } else if (scope === "overdue") {
    where.dueDate = { lt: startOfDay(now) };
    where.completed = false;
  }
  if (typeof query === "string" && query.trim()) {
    where.title = { contains: query.trim(), mode: "insensitive" };
  }

  const tasks = await prisma.task.findMany({
    where,
    // the cap must not push open or undated tasks out of the result
    orderBy: [{ completed: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
    take: MAX_LISTED_TASKS,
    select: TASK_SELECT,
  });

  return { tasks };
}

async function createTask(args: any, userId: string) {
  const subtasks = args.subtasks?.length ? subtaskTitles(args.subtasks) : [];
  if (args.listId) await assertListOwner(userId, args.listId);

  const task = await prisma.task.create({
    data: {
      title: requiredText(args.title, "Title", MAX_TITLE),
      description: args.description ? requiredText(args.description, "Description", MAX_DESCRIPTION) : null,
      priority: PRIORITIES.includes(args.priority) ? args.priority : "medium",
      dueDate: args.dueDate ? new Date(args.dueDate) : null,
      listId: args.listId || null,
      userId,
      subtasks: { create: subtasks.map((title) => ({ title })) },
    },
    select: TASK_SELECT,
  });

  return { created: task };
}

async function updateTask(args: any, userId: string) {
  // Ownership check — never trust an id the model produced without verifying it's this user's task
  const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
  if (!existing) {
    return { error: "Task not found for this user." };
  }
  if (args.listId) await assertListOwner(userId, args.listId);

  const data: any = {};
  if (args.title !== undefined) data.title = requiredText(args.title, "Title", MAX_TITLE);
  if (args.description !== undefined) data.description = args.description?.trim() || null;
  if (args.priority !== undefined) data.priority = args.priority;
  if (args.dueDate !== undefined) data.dueDate = args.dueDate ? new Date(args.dueDate) : null;
  if (args.listId !== undefined) data.listId = args.listId || null;
  // Keep completedAt in sync (same as setTaskCompleted) — dashboard charts bucket by it
  if (args.completed !== undefined && args.completed !== existing.completed) {
    data.completed = args.completed;
    data.completedAt = args.completed ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id: args.taskId },
    data,
    select: TASK_SELECT,
  });

  return { updated: task };
}

async function deleteTask(args: any, userId: string) {
  // Ownership check — same reasoning as updateTask: never delete on an unverified id
  const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
  if (!existing) {
    return { error: "Task not found for this user." };
  }

  // Subtasks cascade on delete in the schema; clearing them first is kept as a safeguard.
  await prisma.subTask.deleteMany({ where: { taskId: args.taskId } }).catch(() => {});

  await prisma.task.delete({ where: { id: args.taskId } });

  return { deleted: { id: existing.id, title: existing.title } };
}

async function readTask({ taskId }: any, userId: string) {
  const { id, title, description, priority, dueDate, completed, listId, goal, subtasks } =
    await getTask(userId, taskId);
  return {
    task: {
      id, title, description, priority, dueDate, completed, listId,
      goal: goal && { id: goal.id, title: goal.title },
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed })),
    },
  };
}

async function addSubtasks({ taskId, titles }: any, userId: string) {
  await assertTaskOwner(userId, taskId);
  const data = subtaskTitles(titles).map((title) => ({ title, taskId }));
  await prisma.subTask.createMany({ data });

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { id: true, title: true } });
  return { updated: { ...task, meta: `+${data.length} subtasks` } };
}

async function updateSubtask(args: any, userId: string) {
  await assertTaskOwner(userId, args.taskId);
  const subtask = await prisma.subTask.findFirst({ where: { id: args.subtaskId, taskId: args.taskId } });
  if (!subtask) throw notFound("Subtask not found");

  if (args.delete) {
    await prisma.subTask.delete({ where: { id: subtask.id } });
    return { deleted: { id: subtask.id, title: subtask.title } };
  }

  const updated = await prisma.subTask.update({
    where: { id: subtask.id },
    data: {
      ...(args.title !== undefined && { title: requiredText(args.title, "Title", MAX_TITLE) }),
      ...(typeof args.completed === "boolean" && { completed: args.completed }),
    },
  });
  return { updated: { id: args.taskId, title: updated.title, meta: updated.completed ? "done" : undefined } };
}

async function bulkUpdateTasks(args: any, userId: string) {
  const { taskIds } = args;
  if (!Array.isArray(taskIds) || taskIds.length === 0) throw new HttpError(400, "taskIds is required");
  if (taskIds.length > MAX_LISTED_TASKS) throw new HttpError(400, `At most ${MAX_LISTED_TASKS} tasks at once`);
  if (args.listId) await assertListOwner(userId, args.listId);

  const data: any = {};
  if (args.dueDate) data.dueDate = new Date(args.dueDate);
  if (PRIORITIES.includes(args.priority)) data.priority = args.priority;
  if (args.listId) data.listId = args.listId;

  // the userId filter drops any id that isn't this user's
  const where = { id: { in: taskIds as string[] }, userId };
  const counts = await prisma.$transaction(async (tx) => {
    const changed = Object.keys(data).length ? await tx.task.updateMany({ where, data }) : { count: 0 };
    if (typeof args.completed !== "boolean") return changed.count;
    const toggled = await tx.task.updateMany({
      where: { ...where, completed: !args.completed },
      data: { completed: args.completed, completedAt: args.completed ? new Date() : null },
    });
    return Math.max(changed.count, toggled.count);
  });

  return { updated: { title: `${counts} tasks` } };
}

async function listTaskLists(userId: string) {
  const lists = await prisma.taskList.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { tasks: { where: { completed: false } } } },
    },
  });
  return { lists: lists.map(({ _count, ...list }) => ({ ...list, openTasks: _count.tasks })) };
}

async function createTaskList({ name, color }: any, userId: string) {
  const list = await prisma.taskList.create({
    data: { name: requiredText(name, "Name", 60), color: color || "blue", userId },
  });
  return { created: { id: list.id, title: list.name } };
}
