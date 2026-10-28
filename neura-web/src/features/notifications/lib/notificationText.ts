import { differenceInMinutes, format, isToday } from "date-fns";
import type { Reminder } from "@/features/reminders/types/reminder";

/** Second line under a due reminder: what it's about, or how late it is. */
export function reminderSubtitle(r: Reminder, now = new Date()): string {
  if (r.description?.trim()) return r.description.trim();
  if (r.task) return `Task · ${r.task.title}`;
  if (r.goal) return `Goal · ${r.goal.title}`;
  if (r.note) return `Note · ${r.note.title}`;
  return dueLabel(r.nextAt, now);
}

/** "Due now", "12 min late", "2 h late", "Since 9:30 AM", "Since Oct 26" */
export function dueLabel(iso: string, now = new Date()): string {
  const at = new Date(iso);
  const mins = differenceInMinutes(now, at);
  if (mins < 1) return "Due now";
  if (mins < 60) return `${mins} min late`;
  if (mins < 6 * 60) return `${Math.floor(mins / 60)} h late`;
  return isToday(at) ? `Since ${format(at, "h:mm a")}` : `Since ${format(at, "MMM d")}`;
}

// Reminders already announced in this browser, as "id@nextAt" (a snooze or the next
// occurrence of a series is a new key, so it's announced again).
const SEEN_KEY = "neura-announced-reminders";

export const announceKey = (r: Pick<Reminder, "id" | "nextAt">) => `${r.id}@${r.nextAt}`;

export function loadAnnounced(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function saveAnnounced(keys: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...keys].slice(-200)));
  } catch {
    // storage blocked: worst case a toast shows again after reload
  }
}
