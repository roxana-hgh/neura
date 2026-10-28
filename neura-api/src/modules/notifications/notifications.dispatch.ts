import { TZDate } from "@date-fns/tz";
import { format, subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { pushEnabled } from "@/lib/web-push";
import { dueTasks, sendToUser, SNOOZE_MINUTES } from "@/modules/notifications/notifications.service";
import {
  digestCopy, nudgeCopy, reminderCopy, signAction, type PushPayload,
} from "@/modules/notifications/notifications.utils";

// Finds what is due and pushes it. Runs every 30 s in-process (startNotificationScheduler)
// and can also be triggered by an external cron (POST /api/notifications/dispatch).
// Every send is claimed first with an atomic updateMany, so several servers / overlapping
// runs never push the same thing twice.

/** A reminder older than this when the dispatcher first sees it (e.g. after downtime) isn't pushed. */
const REMINDER_LOOKBACK_HOURS = 6;
/** A brief that couldn't go out at its hour is still sent within this window, then skipped. */
const BRIEF_WINDOW_HOURS = 3;

async function dispatchReminders(now: Date) {
  const due = await prisma.reminder.findMany({
    where: {
      status: "active",
      nextAt: { lte: now, gte: subHours(now, REMINDER_LOOKBACK_HOURS) },
      OR: [{ firedAt: null }, { NOT: { firedAt: { equals: prisma.reminder.fields.nextAt } } }],
      user: { pushSubscriptions: { some: {} }, notificationSettings: { is: { reminders: true } } },
    },
    include: {
      goal: { select: { title: true } },
      task: { select: { title: true } },
      note: { select: { title: true } },
    },
    take: 200,
  });

  for (const r of due) {
    const claimed = await prisma.reminder.updateMany({
      where: { id: r.id, nextAt: r.nextAt, OR: [{ firedAt: null }, { firedAt: { not: r.nextAt } }] },
      data: { firedAt: r.nextAt },
    });
    if (!claimed.count) continue;

    const at = r.nextAt.getTime();
    const payload: PushPayload = {
      kind: "reminder",
      ...reminderCopy({ ...r, snoozed: r.snoozedUntil !== null }),
      tag: `reminder-${r.id}`,
      url: r.goalId ? `/goal/${r.goalId}` : r.noteId ? `/note/${r.noteId}` : "/reminders",
      actions: [
        { action: "done", title: "Done", token: signAction({ u: r.userId, k: "reminder.done", id: r.id, at }) },
        { action: "snooze", title: `Snooze ${SNOOZE_MINUTES}m`, token: signAction({ u: r.userId, k: "reminder.snooze", id: r.id, at }) },
      ],
    };
    await sendToUser(r.userId, payload, 6 * 3600);
  }
}

type BriefKind = "digest" | "nudge";

/** Sets the "sent on" day for this brief if it isn't set yet; false when another run got it first. */
async function claimBrief(userId: string, kind: BriefKind, day: string) {
  const field = kind === "digest" ? "digestSentOn" : "nudgeSentOn";
  const { count } = await prisma.notificationSettings.updateMany({
    where: { userId, OR: [{ [field]: null }, { NOT: { [field]: day } }] },
    data: { [field]: day },
  });
  return count > 0;
}

async function sendBrief(userId: string, kind: BriefKind, day: string) {
  if (!(await claimBrief(userId, kind, day))) return;

  const { today, overdue } = await dueTasks(userId, day);
  const tasks = kind === "digest" ? [...today, ...overdue] : today;
  if (!tasks.length) return;

  const copy = kind === "digest"
    ? digestCopy(today.map((t) => t.title), overdue.map((t) => t.title))
    : nudgeCopy(today.map((t) => t.title));

  // a single task gets a "Mark done" button and opens where it lives
  const single = tasks.length === 1 ? tasks[0] : null;
  const payload: PushPayload = {
    kind: "tasks",
    ...copy,
    tag: `tasks-${kind}`,
    url: single && !single.showInTasks && single.goalId ? `/goal/${single.goalId}` : "/tasks",
    actions: single
      ? [
          { action: "done", title: "Mark done", token: signAction({ u: userId, k: "task.done", id: single.id }) },
          { action: "open", title: "Open" },
        ]
      : [{ action: "open", title: "View tasks" }],
  };
  await sendToUser(userId, payload, BRIEF_WINDOW_HOURS * 3600);
}

async function dispatchTaskBriefs(now: Date) {
  const users = await prisma.notificationSettings.findMany({
    where: {
      OR: [{ taskDigest: true }, { taskNudge: true }],
      user: { pushSubscriptions: { some: {} } },
    },
  });

  for (const s of users) {
    let local: TZDate;
    try {
      local = new TZDate(now, s.timeZone);
    } catch {
      continue;
    }
    const day = format(local, "yyyy-MM-dd");
    const hour = local.getHours();
    const inWindow = (h: number) => hour >= h && hour < h + BRIEF_WINDOW_HOURS;

    if (s.taskDigest && s.digestSentOn !== day && inWindow(s.taskDigestHour)) await sendBrief(s.userId, "digest", day);
    if (s.taskNudge && s.nudgeSentOn !== day && inWindow(s.taskNudgeHour)) await sendBrief(s.userId, "nudge", day);
  }
}

let running = false;

/** One pass. Overlapping calls in the same process are skipped. */
export async function dispatchDue() {
  if (!pushEnabled || running) return;
  running = true;
  try {
    const now = new Date();
    await dispatchReminders(now);
    await dispatchTaskBriefs(now);
  } catch (err) {
    console.error("Notification dispatch failed:", err);
  } finally {
    running = false;
  }
}

export function startNotificationScheduler(intervalMs = 30_000) {
  if (!pushEnabled) {
    console.log("Push notifications are off (VAPID keys not set)");
    return;
  }
  setInterval(() => void dispatchDue(), intervalMs).unref();
  void dispatchDue();
}
