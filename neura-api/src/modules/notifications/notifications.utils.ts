import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

// ── Action tokens ──────────────────────────────────────────────────────────────
// Buttons on a push ("Done", "Snooze") run in the service worker, which can't rely on
// the cross-origin session cookie. Each button carries a signed token instead; the token
// is only good for that one action on that one item (and, for reminders, that occurrence).

export type ActionKind = "reminder.done" | "reminder.snooze" | "task.done";

export interface ActionClaims {
  u: string; // userId
  k: ActionKind;
  id: string;
  at?: number; // reminders: the nextAt (ms) the push was sent for; a stale button does nothing
  exp: number; // ms
}

const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const sign = (data: string) =>
  createHmac("sha256", `neura-push-action:${env.VAPID_PRIVATE_KEY}`).update(data).digest("base64url");

export function signAction(claims: Omit<ActionClaims, "exp">): string {
  const data = Buffer.from(JSON.stringify({ ...claims, exp: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyAction(token: unknown): ActionClaims | null {
  if (typeof token !== "string") return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(data, "base64url").toString()) as ActionClaims;
    return claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

// ── Payload sent to the service worker (public/sw.js reads these fields) ───────

export interface PushAction {
  action: string; // id the service worker gets on click
  title: string;
  token?: string; // POSTed to /api/notifications/action; no token = just open `url`
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string; // a newer push with the same tag replaces the old one
  url: string; // opened on tap
  kind: "reminder" | "tasks" | "test";
  actions?: PushAction[];
}

// ── Copy ───────────────────────────────────────────────────────────────────────

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** "Finish report · Call mom · +2 more" */
export function titleList(titles: string[], shown = 3) {
  const head = titles.slice(0, shown).map((t) => clip(t, 40));
  const rest = titles.length - head.length;
  return [...head, ...(rest > 0 ? [`+${rest} more`] : [])].join(" · ");
}

interface ReminderCopyInput {
  title: string;
  description: string | null;
  snoozed: boolean;
  goal: { title: string } | null;
  task: { title: string } | null;
  note: { title: string } | null;
}

export function reminderCopy(r: ReminderCopyInput) {
  const link = r.task ? `Task · ${r.task.title}` : r.goal ? `Goal · ${r.goal.title}` : r.note ? `Note · ${r.note.title}` : null;
  const body = r.description?.trim() || link || (r.snoozed ? "Back from snooze. Ready now?" : "It's time.");
  return { title: clip(r.title, 80), body: clip(body, 140) };
}

/** Morning brief: what's due today, plus anything overdue. */
export function digestCopy(today: string[], overdue: string[]) {
  if (today.length === 0) {
    return {
      title: `${plural(overdue.length, "task")} overdue`,
      body: `Clear one before the day takes off: ${titleList(overdue)}`,
    };
  }
  return {
    title: `${plural(today.length, "task")} due today${overdue.length ? ` · ${overdue.length} overdue` : ""}`,
    body: titleList([...today, ...overdue]),
  };
}

/** Evening nudge: today's tasks that are still open. */
export function nudgeCopy(open: string[]) {
  return {
    title: open.length === 1 ? "1 task left for today" : `${open.length} tasks left for today`,
    body: `Still time to wrap up: ${titleList(open)}`,
  };
}
