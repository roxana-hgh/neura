import type { Goal, Prisma } from "@prisma/client";
import { addDays, addMonths, parseISO } from "date-fns";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";
import { dayKey, isWeekStartsOn, DEFAULT_WEEK_STARTS_ON } from "@/utils/date";
import { keyToStoredDate, storedDateToKey } from "@/modules/habits/habits.utils";
import { nextOccurrence, zonedTime } from "@/modules/reminders/reminders.utils";
import { catchUp } from "@/modules/reminders/reminders.service";
import {
  autoReminderTitle, deadlineLeadDays, goalPace, goalProgress, periodRange, subGoalProgress,
  type GoalMetric, type GoalPeriod, type GoalStatus, type ReminderPreset,
} from "@/modules/goals/goals.utils";

/** Validated request body (snake_case already mapped by the controller). */
export interface GoalInput {
  title?: string;
  successCriteria?: string | null;
  description?: string | null;
  category?: string | null;
  color?: string;
  period?: GoalPeriod;
  startDate?: string; // "yyyy-MM-dd"
  endDate?: string;
  metric?: GoalMetric;
  startValue?: number;
  targetValue?: number | null;
  currentValue?: number;
  unit?: string | null;
  parentId?: string | null;
  reminderPresets?: ReminderPreset[];
  timeZone?: string;
}

const progressSelect = {
  metric: true, status: true, startValue: true, targetValue: true, currentValue: true,
} as const;

const listInclude = {
  tasks: { select: { completed: true } },
  subGoals: { select: { ...progressSelect, tasks: { select: { completed: true } } } },
  reminders: {
    where: { status: "active" },
    select: { nextAt: true, title: true },
    orderBy: { nextAt: "asc" },
    take: 1,
  },
} satisfies Prisma.GoalInclude;

type ListGoal = Prisma.GoalGetPayload<{ include: typeof listInclude }>;

/** Goal row → API shape: day keys instead of DateTimes, plus derived progress / pace / review flag. */
function serialize(goal: Goal, progress: number, todayKey: string) {
  const startDate = storedDateToKey(goal.startDate);
  const endDate = storedDateToKey(goal.endDate);
  return {
    ...goal,
    startDate,
    endDate,
    progress,
    ...goalPace(startDate, endDate, todayKey, progress, goal.status),
    // deadline passed while still active: not a failure, the user decides what happened
    needsReview: goal.status === "active" && goal.archivedAt === null && endDate < todayKey,
  };
}

function serializeListGoal(g: ListGoal, todayKey: string) {
  const { tasks, subGoals, reminders, ...goal } = g;
  const allTasks = [...tasks, ...subGoals.flatMap((s) => s.tasks)];
  return {
    ...serialize(goal, goalProgress(goal, tasks, subGoals), todayKey),
    counts: {
      subGoals: subGoals.length,
      subGoalsDone: subGoals.filter((s) => s.status === "completed").length,
      tasks: allTasks.length,
      tasksDone: allTasks.filter((t) => t.completed).length,
    },
    nextReminder: reminders[0] ?? null,
  };
}

async function findOwned(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw notFound("Goal not found");
  return goal;
}

/**
 * The goal plus its sub-goals' ids — reminders linked to any of them follow the goal.
 * `openOnly` leaves out completed / cancelled sub-goals, whose reminders should stay off
 * when the parent comes back.
 */
async function familyIds(goal: Goal, openOnly = false) {
  const subs = await prisma.goal.findMany({
    where: { parentId: goal.id, ...(openOnly && { status: { in: ["active", "paused"] } }) },
    select: { id: true },
  });
  return [goal.id, ...subs.map((s) => s.id)];
}

const log = (goalId: string, type: Prisma.GoalLogCreateInput["type"], extra: { value?: number; note?: string | null; meta?: Prisma.InputJsonValue } = {}) =>
  prisma.goalLog.create({ data: { goalId, type, value: extra.value, note: extra.note || null, meta: extra.meta } });

// ── Read ────────────────────────────────────────────────────────────────

/** Top-level goals (sub-goals are listed inside their parent). */
export async function listGoals(userId: string, archived: boolean, todayKey: string) {
  const goals = await prisma.goal.findMany({
    where: { userId, parentId: null, archivedAt: archived ? { not: null } : null },
    include: listInclude,
    orderBy: [{ endDate: "asc" }, { createdAt: "asc" }],
  });
  return goals.map((g) => serializeListGoal(g, todayKey));
}

export async function getGoal(userId: string, id: string, todayKey: string) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: {
      ...listInclude,
      parent: { select: { id: true, title: true } },
      subGoals: {
        include: { tasks: { select: { completed: true } }, _count: { select: { reminders: true } } },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
      notes: { select: { id: true, title: true, color: true, updatedAt: true }, orderBy: { updatedAt: "desc" } },
      logs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!goal) throw notFound("Goal not found");

  const { subGoals, notes, logs, parent, ...rest } = goal;
  const tasks = await prisma.task.findMany({
    where: { userId, goalId: { in: [goal.id, ...subGoals.map((s) => s.id)] } },
    include: { subtasks: true },
    orderBy: [{ completed: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }],
  });

  return {
    ...serializeListGoal({ ...rest, subGoals }, todayKey),
    parent,
    subGoals: subGoals.map(({ tasks: subTasks, _count, ...s }) => ({
      ...serialize(s, subGoalProgress(s, subTasks), todayKey),
      counts: { tasks: subTasks.length, tasksDone: subTasks.filter((t) => t.completed).length, reminders: _count.reminders },
    })),
    tasks,
    notes,
    logs,
  };
}

// ── Create / update ─────────────────────────────────────────────────────

export async function createGoal(userId: string, input: GoalInput, todayKey: string) {
  let parent: Goal | null = null;
  if (input.parentId) {
    parent = await findOwned(userId, input.parentId);
    if (parent.parentId) throw new HttpError(400, "Sub-goals can't have sub-goals");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { weekStartsOn: true } });
  const weekStartsOn = isWeekStartsOn(user?.weekStartsOn) ? user.weekStartsOn : DEFAULT_WEEK_STARTS_ON;
  const period = input.period ?? parent?.period ?? "monthly";
  const fallback = parent
    ? { start: storedDateToKey(parent.startDate), end: storedDateToKey(parent.endDate) }
    : periodRange(period, todayKey, weekStartsOn);
  const startDate = input.startDate ?? fallback.start;
  const endDate = input.endDate ?? fallback.end;
  if (endDate < startDate) throw new HttpError(400, "End date must be on or after the start date");

  const position = parent ? await prisma.goal.count({ where: { parentId: parent.id } }) : 0;

  const goal = await prisma.goal.create({
    data: {
      userId,
      parentId: parent?.id ?? null,
      position,
      title: input.title!.trim(),
      successCriteria: input.successCriteria?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      color: input.color ?? parent?.color ?? "blue",
      period,
      startDate: keyToStoredDate(startDate),
      endDate: keyToStoredDate(endDate),
      // a sub-goal with no measure is a simple done / not-done milestone
      metric: input.metric ?? (parent ? "milestone" : "manual"),
      startValue: input.startValue ?? 0,
      targetValue: input.targetValue ?? null,
      currentValue: input.currentValue ?? input.startValue ?? 0,
      unit: input.unit?.trim() || null,
    },
  });
  await log(goal.id, "created");

  if (!parent && input.reminderPresets?.length && input.timeZone) {
    const reminders = input.reminderPresets
      .map((kind) => buildAutoReminder(goal, kind, input.timeZone!, weekStartsOn, todayKey))
      .filter((r): r is Prisma.ReminderCreateManyInput => r !== null);
    if (reminders.length) await prisma.reminder.createMany({ data: reminders });
  }

  return getGoal(userId, goal.id, todayKey);
}

/** End of a calendar day in a time zone — the `repeatUntil` of a goal's recurring reminders. */
const endOfDayIn = (key: string, timeZone: string) => zonedTime(key, 23, 59, timeZone);

/** When the goal's deadline reminder fires: N days before the end at 09:00, or null if that's past. */
function deadlineTime(goal: Pick<Goal, "endDate" | "period">, timeZone: string) {
  const endKey = storedDateToKey(goal.endDate);
  const at = zonedTime(dayKey(addDays(parseISO(endKey), -deadlineLeadDays(goal.period))), 9, 0, timeZone);
  return at.getTime() > Date.now() ? at : null;
}

/**
 * A reminder preset for a new goal, owned by the goal (`origin: goal_auto`):
 * - review:   weekly, on the last day of the user's week at 20:00, until the goal ends
 * - checkin:  monthly at 20:00, first one a month after the start, until the goal ends
 * - deadline: once, a few days before the end at 09:00
 * Returns null when it would never fire (e.g. a weekly review for a goal ending tomorrow).
 */
function buildAutoReminder(
  goal: Goal, kind: ReminderPreset, timeZone: string, weekStartsOn: number, todayKey: string,
): Prisma.ReminderCreateManyInput | null {
  const startKey = storedDateToKey(goal.startDate);
  const endKey = storedDateToKey(goal.endDate);
  const repeatUntil = endOfDayIn(endKey, timeZone);
  const base = {
    userId: goal.userId, goalId: goal.id, origin: "goal_auto" as const, autoKind: kind, timeZone,
    title: autoReminderTitle(kind, goal.title, goal.period),
  };

  if (kind === "deadline") {
    const at = deadlineTime(goal, timeZone);
    return at ? { ...base, startAt: at, scheduledAt: at, nextAt: at } : null;
  }

  const fromKey = startKey > todayKey ? startKey : todayKey;
  let first: Date | null;
  let rule: { repeat: "weekly" | "monthly"; weekdays: number[] };
  if (kind === "review") {
    const lastDay = (weekStartsOn + 6) % 7;
    let d = parseISO(fromKey);
    while (d.getDay() !== lastDay) d = addDays(d, 1);
    first = zonedTime(dayKey(d), 20, 0, timeZone);
    rule = { repeat: "weekly", weekdays: [lastDay] };
  } else {
    first = zonedTime(dayKey(addMonths(parseISO(startKey), 1)), 20, 0, timeZone);
    rule = { repeat: "monthly", weekdays: [] };
  }
  // the first slot may already be behind us; move to the next one
  if (first.getTime() <= Date.now()) {
    first = nextOccurrence({ ...rule, interval: 1, repeatUntil }, first, new Date(), timeZone);
  }
  if (!first || first.getTime() > repeatUntil.getTime()) return null;
  return { ...base, ...rule, interval: 1, repeatUntil, startAt: first, scheduledAt: first, nextAt: first };
}

export async function updateGoal(userId: string, id: string, input: GoalInput, todayKey: string, note?: string | null) {
  const existing = await findOwned(userId, id);
  const data: Prisma.GoalUpdateInput = {};

  if (input.title !== undefined) data.title = input.title.trim();
  if (input.successCriteria !== undefined) data.successCriteria = input.successCriteria?.trim() || null;
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.category !== undefined) data.category = input.category?.trim() || null;
  if (input.color !== undefined) data.color = input.color;
  if (input.period !== undefined) data.period = input.period;
  if (input.metric !== undefined) data.metric = input.metric;
  if (input.startValue !== undefined) data.startValue = input.startValue;
  if (input.targetValue !== undefined) data.targetValue = input.targetValue;
  if (input.currentValue !== undefined) data.currentValue = input.currentValue;
  if (input.unit !== undefined) data.unit = input.unit?.trim() || null;

  const oldStart = storedDateToKey(existing.startDate);
  const oldEnd = storedDateToKey(existing.endDate);
  const startDate = input.startDate ?? oldStart;
  const endDate = input.endDate ?? oldEnd;
  if (endDate < startDate) throw new HttpError(400, "End date must be on or after the start date");
  if (input.startDate !== undefined) data.startDate = keyToStoredDate(startDate);
  if (input.endDate !== undefined) data.endDate = keyToStoredDate(endDate);

  const updated = await prisma.goal.update({ where: { id }, data });

  if (input.metric !== undefined && input.metric !== existing.metric) {
    await log(id, "metric_changed", { meta: { from: existing.metric, to: input.metric } });
  }
  if (endDate !== oldEnd) {
    await log(id, "extended", { note, meta: { from: oldEnd, to: endDate } });
    await syncRemindersToEndDate(updated, oldEnd);
  }
  if (input.title !== undefined && updated.title !== existing.title) {
    await renameAutoReminders(updated);
  }

  return getGoal(userId, id, todayKey);
}

/**
 * New end date → move what depended on the old one:
 * - the deadline reminder is recomputed (and comes back if it had already fired)
 * - recurring reminders that ran "until the goal ends" now run until the new end
 * One-off manual reminders are left alone.
 */
async function syncRemindersToEndDate(goal: Goal, oldEndKey: string) {
  const newEndKey = storedDateToKey(goal.endDate);
  const reminders = await prisma.reminder.findMany({ where: { goalId: goal.id } });
  const goalOpen = goal.status === "active";

  for (const r of reminders) {
    if (r.origin === "goal_auto" && r.autoKind === "deadline") {
      const at = deadlineTime(goal, r.timeZone);
      if (!at) continue;
      const revive = r.status === "completed" && goalOpen;
      await prisma.reminder.update({
        where: { id: r.id },
        data: {
          startAt: at, scheduledAt: at, nextAt: at, snoozedUntil: null,
          ...(revive && { status: "active", completedAt: null }),
        },
      });
      continue;
    }

    if (r.repeat === "none" || !r.repeatUntil) continue;
    const tiedToEnd = r.repeatUntil.getTime() === endOfDayIn(oldEndKey, r.timeZone).getTime();
    if (!tiedToEnd && r.origin !== "goal_auto") continue;

    const repeatUntil = endOfDayIn(newEndKey, r.timeZone);
    const moved = { ...r, repeatUntil };
    // a series that had run out comes back when the goal gets more time
    const revive = r.status === "completed" && goalOpen;
    await prisma.reminder.update({
      where: { id: r.id },
      data: { repeatUntil, ...(revive && { status: "active", completedAt: null, ...catchUp(moved) }) },
    });
  }
}

async function renameAutoReminders(goal: Goal) {
  const autos = await prisma.reminder.findMany({
    where: { goalId: goal.id, origin: "goal_auto", titleCustomized: false },
  });
  await Promise.all(autos.map((r) =>
    prisma.reminder.update({ where: { id: r.id }, data: { title: autoReminderTitle(r.autoKind ?? "", goal.title, goal.period) } })));
}

// ── Progress & history ──────────────────────────────────────────────────

/** Numeric and manual goals: set (`value`) or add to (`delta`) the current value. */
export async function recordProgress(
  userId: string, id: string, { value, delta, note }: { value?: number; delta?: number; note?: string | null }, todayKey: string,
) {
  const goal = await findOwned(userId, id);
  if (goal.metric !== "numeric" && goal.metric !== "manual") {
    throw new HttpError(400, "Progress of this goal comes from its sub-goals or tasks");
  }
  let next = value ?? goal.currentValue + (delta ?? 0);
  if (goal.metric === "manual") next = Math.max(0, Math.min(100, next));

  await prisma.goal.update({ where: { id }, data: { currentValue: next } });
  await log(id, "progress", { value: next, note, meta: { from: goal.currentValue, to: next } });
  return getGoal(userId, id, todayKey);
}

export async function addNote(userId: string, id: string, note: string, todayKey: string) {
  await findOwned(userId, id);
  await log(id, "note", { note });
  return getGoal(userId, id, todayKey);
}

export async function deleteLog(userId: string, id: string, logId: string) {
  await findOwned(userId, id);
  await prisma.goalLog.delete({ where: { id: logId, goalId: id } }).catch(() => {
    throw notFound("Entry not found");
  });
}

// ── Lifecycle (status, archive, delete) and reminder sync ───────────────

/**
 * Turns off the reminders of a goal (and its sub-goals) that are about that goal.
 * Automatic ones always; manual ones unless their id is in `keepIds`. They're paused with
 * `suspendedBy: "goal"`, so bringing the goal back restores exactly these.
 * Reminders that aren't linked to the goal — standalone ones, or ones on its tasks — are never touched.
 */
async function suspendReminders(goalIds: string[], keepIds: string[] = []) {
  const result = await prisma.reminder.updateMany({
    where: { goalId: { in: goalIds }, status: "active", id: { notIn: keepIds } },
    data: { status: "paused", suspendedBy: "goal" },
  });
  return result.count;
}

async function restoreReminders(goalIds: string[]) {
  const reminders = await prisma.reminder.findMany({ where: { goalId: { in: goalIds }, suspendedBy: "goal" } });
  for (const r of reminders) {
    const deadlinePassed = r.autoKind === "deadline" && r.scheduledAt.getTime() <= Date.now();
    await prisma.reminder.update({
      where: { id: r.id },
      data: deadlinePassed
        ? { status: "completed", completedAt: new Date(), suspendedBy: null }
        : { status: "active", suspendedBy: null, ...catchUp(r) },
    });
  }
  return reminders.length;
}

/** Reminders a status change would touch, for the confirm dialog. */
export async function getLinkedReminders(userId: string, id: string) {
  const goal = await findOwned(userId, id);
  return prisma.reminder.findMany({
    where: { goalId: { in: await familyIds(goal) }, status: { in: ["active", "paused"] } },
    select: { id: true, title: true, origin: true, repeat: true, nextAt: true, status: true, goalId: true },
    orderBy: { nextAt: "asc" },
  });
}

/**
 * Pause → all of the goal's reminders pause. Complete / cancel → automatic reminders and the
 * manual ones not in `keepReminderIds` turn off. Resume / reopen → whatever the goal turned off
 * comes back (series skip the occurrences that passed meanwhile).
 */
export async function setStatus(
  userId: string, id: string, status: GoalStatus, keepReminderIds: string[], note: string | null, todayKey: string,
) {
  const goal = await findOwned(userId, id);
  if (goal.status === status) return getGoal(userId, id, todayKey);

  await prisma.goal.update({
    where: { id },
    data: { status, completedAt: status === "completed" ? new Date() : null },
  });
  await log(id, "status", { note, meta: { from: goal.status, to: status } });

  const reminders = { paused: 0, restored: 0 };
  if (status === "active") {
    if (!goal.archivedAt) reminders.restored = await restoreReminders(await familyIds(goal, true));
  } else {
    reminders.paused = await suspendReminders(await familyIds(goal), status === "paused" ? [] : keepReminderIds);
  }

  return { ...(await getGoal(userId, id, todayKey)), reminderChanges: reminders };
}

export async function setArchived(userId: string, id: string, archived: boolean, todayKey: string) {
  const goal = await findOwned(userId, id);
  if (!!goal.archivedAt === archived) return getGoal(userId, id, todayKey);

  await prisma.goal.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
  if (archived) await suspendReminders(await familyIds(goal));
  else if (goal.status === "active") await restoreReminders(await familyIds(goal, true));
  return getGoal(userId, id, todayKey);
}

/**
 * Deletes the goal and its sub-goals. Tasks and notes stay (just unlinked). Automatic reminders
 * go with the goal; manual ones are deleted or, with `keepReminders`, kept as standalone reminders.
 */
export async function deleteGoal(userId: string, id: string, keepReminders: boolean) {
  const goal = await findOwned(userId, id);
  if (keepReminders) {
    await prisma.reminder.updateMany({
      where: { goalId: { in: await familyIds(goal) }, origin: "manual" },
      data: { goalId: null, suspendedBy: null },
    });
  }
  await prisma.goal.delete({ where: { id } });
}

// ── Links (tasks, notes) ────────────────────────────────────────────────

/** Creates a task that belongs to this goal (or sub-goal). */
export async function createTask(
  userId: string, id: string, input: { title: string; priority?: string; dueDate?: string | null },
) {
  await findOwned(userId, id);
  return prisma.task.create({
    data: {
      userId, goalId: id, title: input.title.trim(), priority: input.priority ?? "medium",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: { subtasks: true },
  });
}

export async function link(userId: string, id: string, type: "task" | "note", targetId: string, attach: boolean) {
  await findOwned(userId, id);
  const goalId = attach ? id : null;
  // detaching only clears a link that points at this goal
  const where = attach ? { id: targetId, userId } : { id: targetId, userId, goalId: id };
  const result = type === "task"
    ? await prisma.task.updateMany({ where, data: { goalId } })
    : await prisma.note.updateMany({ where, data: { goalId } });
  if (!result.count) throw notFound(type === "task" ? "Task not found" : "Note not found");
}

/** Open tasks and notes that aren't linked to this goal yet, for the "Link existing" picker. */
export async function getLinkOptions(userId: string, id: string) {
  const goal = await findOwned(userId, id);
  const ids = await familyIds(goal);
  const [tasks, notes] = await Promise.all([
    prisma.task.findMany({
      where: { userId, completed: false, OR: [{ goalId: null }, { goalId: { notIn: ids } }] },
      select: { id: true, title: true, dueDate: true, goalId: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.note.findMany({
      where: { userId, OR: [{ goalId: null }, { goalId: { not: id } }] },
      select: { id: true, title: true, goalId: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);
  return { tasks, notes };
}

