import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";
import { ownedTagIds } from "@/modules/tasks/tags.service";

/** Subtasks, tags + the goal (and parent goal, for sub-goals) the task belongs to, for the "from goal" badge. */
const taskInclude = {
  subtasks: true,
  tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } },
  goal: { select: { id: true, title: true, parent: { select: { id: true, title: true } } } },
} as const;

export interface TaskFilters {
  search?: string;
  priorities?: string[];
  listId?: string;
  unassigned?: boolean;
}

/** Request body shape — the web app sends snake_case for these fields. */
export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: string;
  due_date?: string | null;
  list_id?: string | null;
  /** Omitted = leave the task's tags unchanged (other callers of PUT don't know about tags). */
  tag_ids?: string[];
}

const toTaskData = ({ title, description, priority, due_date, list_id }: TaskInput) => ({
  title,
  description: description ?? null,
  priority,
  dueDate: due_date ? new Date(due_date) : null,
  listId: list_id ?? null,
});

export function listTasks(userId: string, { search, priorities, listId, unassigned }: TaskFilters) {
  return prisma.task.findMany({
    where: {
      userId,
      showInTasks: true,
      ...(listId && { listId }),
      ...(unassigned && { listId: null }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
      ...(priorities?.length && {
        priority: { in: priorities },
      }),
    },
    include: taskInclude,
    orderBy: { dueDate: { sort: "asc", nulls: "last" } },
  });
}

/** Tasks due in the given month (`month` is 0-indexed). */
export function listTasksForMonth(userId: string, year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return prisma.task.findMany({
    where: {
      userId,
      showInTasks: true,
      dueDate: { gte: start, lte: end },
    },
    include: taskInclude,
    orderBy: { dueDate: "asc" },
  });
}

export async function getTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: taskInclude,
  });
  if (!task) throw notFound("Task not found");
  return task;
}

/** Throws 404 unless the task exists and belongs to the user. */
export async function assertTaskOwner(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw notFound("Task not found");
}

/** `{ set: [...] }` with only the user's own tags, or undefined when tags aren't being changed. */
async function tagsSet(userId: string, tagIds: unknown) {
  if (!Array.isArray(tagIds)) return undefined;
  const ids = await ownedTagIds(userId, tagIds.filter((id): id is string => typeof id === "string"));
  return { set: ids.map((id) => ({ id })) };
}

export async function createTask(userId: string, input: TaskInput) {
  const tags = await tagsSet(userId, input.tag_ids);
  return prisma.task.create({
    data: {
      ...toTaskData(input),
      userId,
      ...(tags?.set.length && { tags: { connect: tags.set } }),
    },
    include: taskInclude,
  });
}

export async function updateTask(userId: string, id: string, input: TaskInput) {
  const tags = await tagsSet(userId, input.tag_ids);
  return prisma.task.update({
    where: { id, userId },
    data: { ...toTaskData(input), ...(tags && { tags }) },
    include: taskInclude,
  });
}

/** Replaces only the task's tags (used by the quick tag picker in the task detail). */
export async function setTaskTags(userId: string, id: string, tagIds: string[]) {
  return prisma.task.update({
    where: { id, userId },
    data: { tags: await tagsSet(userId, tagIds) },
    include: taskInclude,
  });
}

export function setTaskCompleted(userId: string, id: string, completed: boolean) {
  return prisma.task.update({
    where: { id, userId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
    include: taskInclude,
  });
}

export async function deleteTask(userId: string, id: string) {
  await prisma.task.delete({ where: { id, userId } });
}
