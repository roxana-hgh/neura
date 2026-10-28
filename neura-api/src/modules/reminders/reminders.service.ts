import type { Prisma, Reminder } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";
import { nextOccurrence, type Repeat } from "@/modules/reminders/reminders.utils";

export const REMINDER_VIEWS = ["upcoming", "snoozed", "done", "all"] as const;
export type ReminderView = (typeof REMINDER_VIEWS)[number];

/** Validated request body (controller has already checked types). */
export interface ReminderInput {
  title?: string;
  description?: string | null;
  scheduledAt?: Date;
  timeZone?: string;
  repeat?: Repeat;
  interval?: number;
  weekdays?: number[];
  repeatUntil?: Date | null;
  goalId?: string | null;
  taskId?: string | null;
  noteId?: string | null;
}

export const reminderInclude = {
  goal: { select: { id: true, title: true, parentId: true, color: true } },
  task: { select: { id: true, title: true, completed: true } },
  note: { select: { id: true, title: true } },
} satisfies Prisma.ReminderInclude;

const ruleOf = (r: Pick<Reminder, "repeat" | "interval" | "weekdays" | "repeatUntil">) => ({
  repeat: r.repeat as Repeat,
  interval: r.interval,
  weekdays: r.weekdays,
  repeatUntil: r.repeatUntil,
});

/** Next occurrence of a reminder's series after `after`, or null when it's over. */
export const nextOf = (r: Reminder, after: Date) => nextOccurrence(ruleOf(r), r.startAt, after, r.timeZone);

/** Throws 404 unless every linked id exists and belongs to the user. */
async function assertLinks(userId: string, { goalId, taskId, noteId }: ReminderInput) {
  if ([goalId, taskId, noteId].filter(Boolean).length > 1) {
    throw new HttpError(400, "A reminder can be linked to one item only");
  }
  if (goalId && !(await prisma.goal.findFirst({ where: { id: goalId, userId } }))) throw notFound("Goal not found");
  if (taskId && !(await prisma.task.findFirst({ where: { id: taskId, userId } }))) throw notFound("Task not found");
  if (noteId && !(await prisma.note.findFirst({ where: { id: noteId, userId } }))) throw notFound("Note not found");
}

export interface ReminderFilters {
  view: ReminderView;
  goalId?: string; // also matches the goal's sub-goals
  taskId?: string;
  noteId?: string;
}

export async function listReminders(userId: string, { view, goalId, taskId, noteId }: ReminderFilters) {
  const now = new Date();
  const link: Prisma.ReminderWhereInput = {
    ...(goalId && { OR: [{ goalId }, { goal: { parentId: goalId } }] }),
    ...(taskId && { taskId }),
    ...(noteId && { noteId }),
  };

  if (view === "done") {
    // every completed occurrence, newest first (recurring series log one row per occurrence)
    const logs = await prisma.reminderLog.findMany({
      where: { action: "done", reminder: { userId, ...link } },
      include: { reminder: { include: reminderInclude } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return logs.map(({ reminder, ...log }) => ({ ...reminder, doneAt: log.createdAt, doneScheduledAt: log.scheduledAt }));
  }

  const where: Prisma.ReminderWhereInput = { userId, ...link };
  if (view === "upcoming") {
    where.status = { in: ["active", "paused"] };
    // not `NOT { snoozedUntil > now }`: in SQL that also drops rows where it's null
    where.AND = [{ OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }] }];
  } else if (view === "snoozed") {
    where.status = "active";
    where.snoozedUntil = { gt: now };
  } else {
    where.status = { in: ["active", "paused"] };
  }

  return prisma.reminder.findMany({ where, include: reminderInclude, orderBy: { nextAt: "asc" } });
}

/** Badge numbers: active reminders that are past due, and the ones still due later today. */
export async function getCounts(userId: string, endOfToday: Date) {
  const now = new Date();
  const [overdue, today, snoozed] = await Promise.all([
    prisma.reminder.count({ where: { userId, status: "active", nextAt: { lte: now } } }),
    prisma.reminder.count({ where: { userId, status: "active", nextAt: { gt: now, lte: endOfToday } } }),
    prisma.reminder.count({ where: { userId, status: "active", snoozedUntil: { gt: now } } }),
  ]);
  return { overdue, today, snoozed };
}

/** Titles of everything a reminder can be linked to, for the link picker. */
export async function getLinkOptions(userId: string, q: string) {
  const title = q ? { contains: q, mode: "insensitive" as const } : undefined;
  const [goals, tasks, notes] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, archivedAt: null, status: { in: ["active", "paused"] }, ...(title && { title }) },
      select: { id: true, title: true, parentId: true, parent: { select: { title: true } } },
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { endDate: "asc" }],
      take: 30,
    }),
    prisma.task.findMany({
      where: { userId, completed: false, ...(title && { title }) },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.note.findMany({
      where: { userId, ...(title && { title }) },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);
  return {
    goals: goals.map((g) => ({ id: g.id, title: g.title, parentTitle: g.parent?.title ?? null })),
    tasks,
    notes,
  };
}

export async function createReminder(userId: string, input: ReminderInput) {
  await assertLinks(userId, input);
  const scheduledAt = input.scheduledAt!;
  return prisma.reminder.create({
    data: {
      userId,
      title: input.title!.trim(),
      titleCustomized: true,
      description: input.description?.trim() || null,
      startAt: scheduledAt,
      scheduledAt,
      nextAt: scheduledAt,
      timeZone: input.timeZone!,
      repeat: input.repeat ?? "none",
      interval: input.interval ?? 1,
      weekdays: input.weekdays ?? [],
      repeatUntil: input.repeatUntil ?? null,
      goalId: input.goalId ?? null,
      taskId: input.taskId ?? null,
      noteId: input.noteId ?? null,
    },
    include: reminderInclude,
  });
}

async function findOwned(userId: string, id: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw notFound("Reminder not found");
  return reminder;
}

/** Edit / reschedule. A new time or rule restarts the series from that time and clears any snooze. */
export async function updateReminder(userId: string, id: string, input: ReminderInput) {
  const existing = await findOwned(userId, id);

  const linkTouched = input.goalId !== undefined || input.taskId !== undefined || input.noteId !== undefined;
  if (linkTouched) {
    await assertLinks(userId, input);
  }

  const data: Prisma.ReminderUncheckedUpdateInput = {};
  if (input.title !== undefined) {
    data.title = input.title.trim();
    data.titleCustomized = true;
  }
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.timeZone !== undefined) data.timeZone = input.timeZone;
  if (input.repeat !== undefined) data.repeat = input.repeat;
  if (input.interval !== undefined) data.interval = input.interval;
  if (input.weekdays !== undefined) data.weekdays = input.weekdays;
  if (input.repeatUntil !== undefined) data.repeatUntil = input.repeatUntil;
  if (linkTouched) {
    data.goalId = input.goalId ?? null;
    data.taskId = input.taskId ?? null;
    data.noteId = input.noteId ?? null;
  }

  const scheduleTouched = input.scheduledAt !== undefined || input.repeat !== undefined
    || input.interval !== undefined || input.weekdays !== undefined || input.repeatUntil !== undefined;
  if (scheduleTouched) {
    const at = input.scheduledAt ?? existing.scheduledAt;
    Object.assign(data, { startAt: at, scheduledAt: at, nextAt: at, snoozedUntil: null, firedAt: null });
    // rescheduling a finished one-off brings it back
    if (existing.status === "completed") Object.assign(data, { status: "active", completedAt: null });
  }

  return prisma.reminder.update({ where: { id }, data, include: reminderInclude });
}

/**
 * Marks the current occurrence done (or skipped). One-off reminders, and series with
 * `scope: "series"` or no further occurrence, become `completed`. A series otherwise moves
 * to its next occurrence after now, so a daily reminder left for a week doesn't leave 7 behind.
 */
export async function completeReminder(
  userId: string, id: string, scope: "occurrence" | "series", action: "done" | "skipped" = "done",
) {
  const reminder = await findOwned(userId, id);
  const now = new Date();
  const next = scope === "series" ? null : nextOf(reminder, new Date(Math.max(now.getTime(), reminder.scheduledAt.getTime())));

  const [, updated] = await prisma.$transaction([
    prisma.reminderLog.create({ data: { reminderId: id, scheduledAt: reminder.scheduledAt, action } }),
    prisma.reminder.update({
      where: { id },
      data: next
        ? { scheduledAt: next, nextAt: next, snoozedUntil: null }
        : { status: "completed", completedAt: now, snoozedUntil: null },
      include: reminderInclude,
    }),
  ]);
  return updated;
}

/** Brings back a completed one-off (Undo / "mark as not done"). */
export async function reopenReminder(userId: string, id: string) {
  const reminder = await findOwned(userId, id);
  if (reminder.status !== "completed") return prisma.reminder.findUnique({ where: { id }, include: reminderInclude });
  const lastLog = await prisma.reminderLog.findFirst({ where: { reminderId: id, action: "done" }, orderBy: { createdAt: "desc" } });
  await prisma.$transaction([
    ...(lastLog ? [prisma.reminderLog.delete({ where: { id: lastLog.id } })] : []),
    prisma.reminder.update({ where: { id }, data: { status: "active", completedAt: null } }),
  ]);
  return prisma.reminder.findUnique({ where: { id }, include: reminderInclude });
}

/** Snoozing only moves `nextAt`; `scheduledAt` (and so the series) stays where it was. */
export async function snoozeReminder(userId: string, id: string, until: Date) {
  const reminder = await findOwned(userId, id);
  if (reminder.status !== "active") throw new HttpError(400, "Only active reminders can be snoozed");
  return prisma.reminder.update({
    where: { id },
    data: { snoozedUntil: until, nextAt: until },
    include: reminderInclude,
  });
}

export async function setPaused(userId: string, id: string, paused: boolean) {
  const reminder = await findOwned(userId, id);
  if (paused) {
    return prisma.reminder.update({
      where: { id }, data: { status: "paused", suspendedBy: null }, include: reminderInclude,
    });
  }
  return prisma.reminder.update({
    where: { id }, data: { status: "active", suspendedBy: null, ...catchUp(reminder) }, include: reminderInclude,
  });
}

/**
 * When a paused series comes back, skip occurrences that passed meanwhile instead of
 * showing it as overdue. One-off reminders keep their time.
 */
export function catchUp(r: Reminder): Prisma.ReminderUncheckedUpdateInput {
  const now = new Date();
  if (r.repeat === "none" || r.scheduledAt.getTime() > now.getTime()) {
    return { snoozedUntil: null, nextAt: r.scheduledAt };
  }
  const next = nextOf(r, now);
  if (!next) return { status: "completed", completedAt: now, snoozedUntil: null };
  return { scheduledAt: next, nextAt: next, snoozedUntil: null };
}

export async function deleteReminder(userId: string, id: string) {
  await prisma.reminder.delete({ where: { id, userId } }).catch(() => {
    throw notFound("Reminder not found");
  });
}
