import { format, formatDistanceToNowStrict, isSameWeek, isToday, isYesterday } from "date-fns";
import type { WeekStartsOn } from "@/lib/weekStart";
import type { Brainstorm, ReviewMode } from "@/features/brainstorms/types/brainstorm";

/** Field limits of the task and reminder forms */
const LIMITS = {
  task: { title: 100, description: 500 },
  reminder: { title: 200, description: 1000 },
} as const;

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

/**
 * Splits a jotted thought into a suggested title (first line) and description (the rest).
 * If the first line is too long for a title, the whole text goes into the description.
 */
export function suggestFields(content: string, kind: keyof typeof LIMITS) {
  const { title: maxTitle, description: maxDesc } = LIMITS[kind];
  const text = content.trim();
  const [first, ...rest] = text.split(/\r?\n/);
  const firstLine = first.trim();
  const remainder = rest.join("\n").trim();

  if (firstLine.length <= maxTitle) {
    return { title: firstLine, description: clip(remainder, maxDesc) };
  }
  return { title: clip(firstLine, maxTitle), description: clip(text, maxDesc) };
}

export const isNew = (b: Brainstorm) => !b.reviewedAt;

/** Daily reset goes through what's new since the last one; weekly goes through everything */
export const reviewQueue = (inbox: Brainstorm[], mode: ReviewMode) =>
  mode === "daily" ? inbox.filter(isNew) : inbox;

export function timeAgo(iso: string) {
  const date = new Date(iso);
  if (Date.now() - date.getTime() < 60_000) return "just now";
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Exact time for tooltips */
export const exactTime = (iso: string) => format(new Date(iso), "EEE, MMM d · HH:mm");

export interface BrainstormGroup {
  label: string;
  items: Brainstorm[];
}

/** Inbox sections by capture day: Today / Yesterday / Earlier this week / Older */
export function groupByCaptureDay(items: Brainstorm[], weekStartsOn: WeekStartsOn): BrainstormGroup[] {
  const groups: BrainstormGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier this week", items: [] },
    { label: "Older", items: [] },
  ];
  const now = new Date();
  for (const item of items) {
    const at = new Date(item.createdAt);
    const i = isToday(at) ? 0 : isYesterday(at) ? 1 : isSameWeek(at, now, { weekStartsOn }) ? 2 : 3;
    groups[i].items.push(item);
  }
  return groups.filter((g) => g.items.length);
}

export function matchesSearch(item: Brainstorm, q: string) {
  if (!q.trim()) return true;
  return item.content.toLowerCase().includes(q.trim().toLowerCase());
}
