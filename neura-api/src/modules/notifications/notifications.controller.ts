import type { Request, Response } from "express";
import * as notificationsService from "@/modules/notifications/notifications.service";
import type { SettingsInput } from "@/modules/notifications/notifications.service";
import { dispatchDue } from "@/modules/notifications/notifications.dispatch";
import { isValidTimeZone } from "@/modules/reminders/reminders.utils";
import { env } from "@/config/env";
import { HttpError } from "@/utils/http-error";

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isHour = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 23;

export function getPublicKey(_req: Request, res: Response) {
  res.json({ publicKey: notificationsService.getPublicKey() });
}

export async function saveSubscription(req: Request, res: Response) {
  const { subscription, time_zone } = req.body ?? {};
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) throw new HttpError(400, "Invalid subscription");
  if (typeof p256dh !== "string" || typeof auth !== "string") throw new HttpError(400, "Invalid subscription keys");

  await notificationsService.saveSubscription(req.userId!, {
    endpoint, p256dh, auth,
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
    timeZone: isValidTimeZone(time_zone) ? time_zone : null,
  });
  res.status(201).json({ ok: true });
}

export async function deleteSubscription(req: Request, res: Response) {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== "string") throw new HttpError(400, "endpoint is required");
  await notificationsService.deleteSubscription(req.userId!, endpoint);
  res.status(204).end();
}

export async function getSettings(req: Request, res: Response) {
  res.json(await notificationsService.getSettings(req.userId!));
}

export async function updateSettings(req: Request, res: Response) {
  const body = req.body ?? {};
  const input: SettingsInput = {};
  const bool = (key: string, field: "reminders" | "taskDigest" | "taskNudge") => {
    if (body[key] === undefined) return;
    if (typeof body[key] !== "boolean") throw new HttpError(400, `${key} must be a boolean`);
    input[field] = body[key];
  };
  const hour = (key: string, field: "taskDigestHour" | "taskNudgeHour") => {
    if (body[key] === undefined) return;
    if (!isHour(body[key])) throw new HttpError(400, `${key} must be an hour (0-23)`);
    input[field] = body[key];
  };
  bool("reminders", "reminders");
  bool("task_digest", "taskDigest");
  bool("task_nudge", "taskNudge");
  hour("task_digest_hour", "taskDigestHour");
  hour("task_nudge_hour", "taskNudgeHour");
  if (body.time_zone !== undefined) {
    if (!isValidTimeZone(body.time_zone)) throw new HttpError(400, "time_zone must be an IANA time zone");
    input.timeZone = body.time_zone;
  }
  res.json(await notificationsService.updateSettings(req.userId!, input));
}

export async function sendTest(req: Request, res: Response) {
  res.json(await notificationsService.sendTest(req.userId!));
}

export async function getInbox(req: Request, res: Response) {
  if (!isDay(req.query.today)) throw new HttpError(400, "today must be yyyy-MM-dd");
  res.json(await notificationsService.getInbox(req.userId!, req.query.today));
}

// ── Public (no session) ──

export async function runAction(req: Request, res: Response) {
  await notificationsService.runAction(req.body?.token);
  res.status(204).end();
}

export async function dispatch(req: Request, res: Response) {
  if (!env.CRON_SECRET || req.get("x-cron-secret") !== env.CRON_SECRET) throw new HttpError(401, "Unauthorized");
  await dispatchDue();
  res.status(204).end();
}
