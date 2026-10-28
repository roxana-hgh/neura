import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { pushEnabled, sendPush } from "@/lib/web-push";
import { env } from "@/config/env";
import { HttpError } from "@/utils/http-error";
import * as remindersService from "@/modules/reminders/reminders.service";
import * as tasksService from "@/modules/tasks/tasks.service";
import { verifyAction, type PushPayload } from "@/modules/notifications/notifications.utils";

export const SNOOZE_MINUTES = 10;

// ── Push delivery ──────────────────────────────────────────────────────────────

/** Sends to every device of the user; drops subscriptions the browser has revoked. */
export async function sendToUser(userId: string, payload: PushPayload, ttlSeconds?: number) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.all(subs.map(async (sub) => ({ sub, result: await sendPush(sub, payload, ttlSeconds) })));
  const gone = results.filter((r) => r.result === "gone").map((r) => r.sub.id);
  if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return results.filter((r) => r.result === "sent").length;
}

// ── Subscriptions ──────────────────────────────────────────────────────────────

export function getPublicKey() {
  if (!pushEnabled) throw new HttpError(503, "Push notifications aren't configured on the server");
  return env.VAPID_PUBLIC_KEY!;
}

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  timeZone: string | null;
}

/** Saves this device. An endpoint is one browser profile, so it moves to whoever signed in last. */
export async function saveSubscription(userId: string, { endpoint, p256dh, auth, userAgent, timeZone }: SubscriptionInput) {
  await prisma.$transaction([
    prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, userAgent },
      update: { userId, p256dh, auth, userAgent },
    }),
    prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...(timeZone && { timeZone }) },
      update: { ...(timeZone && { timeZone }) },
    }),
  ]);
}

export async function deleteSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

// ── Settings ───────────────────────────────────────────────────────────────────

export interface SettingsInput {
  timeZone?: string;
  reminders?: boolean;
  taskDigest?: boolean;
  taskDigestHour?: number;
  taskNudge?: boolean;
  taskNudgeHour?: number;
}

const settingsSelect = {
  timeZone: true, reminders: true, taskDigest: true, taskDigestHour: true, taskNudge: true, taskNudgeHour: true,
} as const;

export async function getSettings(userId: string) {
  const [settings, devices] = await Promise.all([
    prisma.notificationSettings.upsert({ where: { userId }, create: { userId }, update: {}, select: settingsSelect }),
    prisma.pushSubscription.count({ where: { userId } }),
  ]);
  return { ...settings, devices, pushAvailable: pushEnabled };
}

export async function updateSettings(userId: string, input: SettingsInput) {
  await prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    // a new hour may be later today: let it send again
    update: {
      ...input,
      ...(input.taskDigestHour !== undefined && { digestSentOn: null }),
      ...(input.taskNudgeHour !== undefined && { nudgeSentOn: null }),
    },
  });
  return getSettings(userId);
}

export async function sendTest(userId: string) {
  if (!pushEnabled) throw new HttpError(503, "Push notifications aren't configured on the server");
  const sent = await sendToUser(userId, {
    kind: "test",
    title: "You're all set 🎉",
    body: "Reminders and task nudges will show up right here.",
    tag: "neura-test",
    url: "/settings",
  }, 300);
  if (!sent) throw new HttpError(404, "No device is subscribed");
  return { sent };
}

// ── In-app inbox (header bell + toasts) ────────────────────────────────────────

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const byPriority = <T extends { priority: string; title: string }>(a: T, b: T) =>
  (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) || a.title.localeCompare(b.title);

/** Open tasks due on `day` ("yyyy-MM-dd") or before it. Due dates are stored as UTC midnight. */
export async function dueTasks(userId: string, day: string) {
  const dayStart = new Date(`${day}T00:00:00.000Z`);
  const tasks = await prisma.task.findMany({
    where: { userId, completed: false, dueDate: { lte: dayStart } },
    select: { id: true, title: true, priority: true, dueDate: true, goalId: true, showInTasks: true },
    orderBy: { dueDate: "desc" },
    take: 100,
  });
  const today = tasks.filter((t) => t.dueDate!.getTime() === dayStart.getTime()).sort(byPriority);
  const overdue = tasks.filter((t) => t.dueDate!.getTime() < dayStart.getTime()).sort(byPriority);
  return { today, overdue };
}

export async function getInbox(userId: string, day: string) {
  const [reminders, tasks] = await Promise.all([
    prisma.reminder.findMany({
      where: { userId, status: "active", nextAt: { lte: new Date() } },
      include: remindersService.reminderInclude,
      orderBy: { nextAt: "desc" },
      take: 30,
    }),
    dueTasks(userId, day),
  ]);
  return { reminders, tasks };
}

// ── Buttons on a push (no session: the token is the proof) ─────────────────────

export async function runAction(token: unknown) {
  const claims = verifyAction(token);
  if (!claims) throw new HttpError(401, "This action has expired");
  const { u: userId, k: kind, id, at } = claims;

  if (kind === "task.done") {
    await tasksService.setTaskCompleted(userId, id, true).catch(() => undefined);
    return;
  }

  // only act on the occurrence the notification was about (no double "done" on a series)
  const reminder = await prisma.reminder.findFirst({ where: { id, userId, status: "active" } });
  if (!reminder || reminder.nextAt.getTime() !== at) return;

  if (kind === "reminder.done") await remindersService.completeReminder(userId, id, "occurrence");
  else await remindersService.snoozeReminder(userId, id, addMinutes(new Date(), SNOOZE_MINUTES));
}
