import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";
import { dayKey, isTimeOfDay } from "@/utils/date";
import { ownedTagIds } from "@/modules/tasks/tags.service";
import { nextOccurrence, REPEATS, type Repeat } from "@/modules/reminders/reminders.utils";

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
  /** "HH:mm" or null for all day. Omitted = unchanged (other callers of PUT don't know about it); cleared with the date. */
  due_time?: string | null;
  list_id?: string | null;
  /** Omitted = leave the task's tags unchanged (other callers of PUT don't know about tags). */
  tag_ids?: string[];
  /** Omitted = leave the rule unchanged; "none" stops repeating. Cleared with the date. */
  repeat?: Repeat;
  repeat_interval?: number;
  /** weekly only: 0 = Sunday … 6 = Saturday */
  repeat_weekdays?: number[];
  /** Last day the series may land on, "yyyy-MM-dd", or null for never */
  repeat_until?: string | null;
}

const NO_REPEAT = {
  repeat: "none" as Repeat,
  repeatInterval: 1,
  repeatWeekdays: [] as number[],
  repeatUntil: null,
  repeatStart: null,
};

const isDayKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** The repeat columns to write, or {} to leave them. A task without a date never repeats. */
function repeatData(input: TaskInput) {
  if (!input.due_date) return NO_REPEAT;
  if (input.repeat === undefined) return {};
  if (!REPEATS.includes(input.repeat)) throw new HttpError(400, `repeat must be one of ${REPEATS.join(", ")}`);
  if (input.repeat === "none") return NO_REPEAT;

  const interval = input.repeat_interval ?? 1;
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
    throw new HttpError(400, "repeat_interval must be a whole number from 1 to 365");
  }
  const weekdays = input.repeat === "weekly" ? input.repeat_weekdays ?? [] : [];
  if (!Array.isArray(weekdays) || weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw new HttpError(400, "repeat_weekdays must be days 0–6");
  }
  const until = input.repeat_until || null;
  if (until !== null && !isDayKey(until)) throw new HttpError(400, "repeat_until must be yyyy-MM-dd");
  if (until !== null && until < input.due_date.slice(0, 10)) {
    throw new HttpError(400, "repeat_until can't be before the due date");
  }

  return {
    repeat: input.repeat,
    repeatInterval: interval,
    repeatWeekdays: [...new Set(weekdays)].sort(),
    repeatUntil: until ? new Date(until) : null,
    repeatStart: new Date(input.due_date),
  };
}

/** `{ dueTime }` to write, or {} to leave it. A task without a date never keeps a time. */
function dueTimeData(due_date: TaskInput["due_date"], due_time: TaskInput["due_time"]) {
  if (!due_date) return { dueTime: null };
  if (due_time === undefined) return {};
  if (due_time !== null && due_time !== "" && !isTimeOfDay(due_time)) {
    throw new HttpError(400, "due_time must be HH:mm");
  }
  return { dueTime: due_time || null };
}

const toTaskData = ({ title, description, priority, due_date, due_time, list_id }: TaskInput) => ({
  title,
  description: description ?? null,
  priority,
  dueDate: due_date ? new Date(due_date) : null,
  ...dueTimeData(due_date, due_time),
  listId: list_id ?? null,
});

const toTaskWriteData = (input: TaskInput) => ({ ...toTaskData(input), ...repeatData(input) });

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
    // tasks with a time come before the all-day ones of the same day
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { dueTime: { sort: "asc", nulls: "last" } }],
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
    orderBy: [{ dueDate: "asc" }, { dueTime: { sort: "asc", nulls: "last" } }],
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

/** 404 unless the list (when one is set) belongs to the user, so a task can't be put in someone else's list. */
async function assertListOwner(userId: string, listId: TaskInput["list_id"]) {
  if (!listId) return;
  const list = await prisma.taskList.findFirst({ where: { id: listId, userId }, select: { id: true } });
  if (!list) throw notFound("List not found");
}

export async function createTask(userId: string, input: TaskInput) {
  await assertListOwner(userId, input.list_id);
  const tags = await tagsSet(userId, input.tag_ids);
  return prisma.task.create({
    data: {
      ...toTaskWriteData(input),
      userId,
      ...(tags?.set.length && { tags: { connect: tags.set } }),
    },
    include: taskInclude,
  });
}

export async function updateTask(userId: string, id: string, input: TaskInput) {
  await assertListOwner(userId, input.list_id);
  const tags = await tagsSet(userId, input.tag_ids);
  return prisma.task.update({
    where: { id, userId },
    data: { ...toTaskWriteData(input), ...(tags && { tags }) },
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

/**
 * Completes / reopens a task. For a repeating task, completing creates the next occurrence
 * (returned as `next`) and reopening right after takes it back. `today` is the user's "yyyy-MM-dd".
 */
export async function setTaskCompleted(userId: string, id: string, completed: boolean, today?: string) {
  // claim the change, so a double click or a second device doesn't create two next occurrences
  const changed = await prisma.task.updateMany({
    where: { id, userId, completed: !completed },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  const next = changed.count ? await rollRepeat(userId, id, completed, today) : null;
  return { ...(await getTask(userId, id)), next };
}

/**
 * Moves a task's repeat rule after its completion changed (the change is already saved).
 * Completed → the next occurrence is created and gets the rule. Reopened → an untouched next
 * occurrence is removed and the rule comes back. Returns the new occurrence, if any.
 */
export async function rollRepeat(userId: string, id: string, completed: boolean, today = dayKey(new Date())) {
  const todayDate = new Date(isDayKey(today) ? today : dayKey(new Date()));

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: { id, userId },
      include: { subtasks: true, tags: { select: { id: true } } },
    });
    if (!task) return null;

    if (!completed) {
      const next = await tx.task.findFirst({
        where: { userId, repeatFromId: id, completed: false },
        include: { subtasks: true },
      });
      // only an occurrence nobody has worked on yet is taken back
      const untouched =
        next &&
        next.updatedAt.getTime() - next.createdAt.getTime() < 2000 &&
        next.subtasks.every((s) => !s.completed);
      if (!next || !untouched || task.repeat !== "none") return null;
      await tx.task.update({
        where: { id },
        data: {
          repeat: next.repeat,
          repeatInterval: next.repeatInterval,
          repeatWeekdays: next.repeatWeekdays,
          repeatUntil: next.repeatUntil,
          repeatStart: next.repeatStart,
        },
      });
      await tx.task.delete({ where: { id: next.id } });
      return null;
    }

    if (task.repeat === "none") return null;
    const due = task.dueDate ?? todayDate;
    const rule = {
      repeat: task.repeat,
      interval: task.repeatInterval,
      weekdays: task.repeatWeekdays,
      repeatUntil: task.repeatUntil,
    };
    // after the current day, but never in the past: a missed daily task comes back today, not as a backlog
    const after = new Date(Math.max(due.getTime(), todayDate.getTime() - 86_400_000));
    // due days are stored as UTC midnight, so the series is computed in UTC
    const nextDue = nextOccurrence(rule, task.repeatStart ?? due, after, "UTC");

    await tx.task.update({ where: { id }, data: NO_REPEAT });
    if (!nextDue) return null; // the series has ended

    return tx.task.create({
      data: {
        userId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: nextDue,
        dueTime: task.dueTime,
        listId: task.listId,
        goalId: task.goalId,
        showInTasks: task.showInTasks,
        repeat: task.repeat,
        repeatInterval: task.repeatInterval,
        repeatWeekdays: task.repeatWeekdays,
        repeatUntil: task.repeatUntil,
        repeatStart: task.repeatStart ?? due,
        repeatFromId: id,
        tags: { connect: task.tags },
        subtasks: { create: task.subtasks.map((s) => ({ title: s.title })) },
      },
      select: { id: true, title: true, dueDate: true, dueTime: true },
    });
  });
}

export async function deleteTask(userId: string, id: string) {
  await prisma.task.delete({ where: { id, userId } });
}
