import type { Request, Response } from "express";
import * as notificationsService from "@/modules/notifications/notifications.service";
import type { SettingsInput } from "@/modules/notifications/notifications.service";
import { dispatchDue } from "@/modules/notifications/notifications.dispatch";
import { z } from "zod";
import { env } from "@/config/env";
import { HttpError } from "@/utils/http-error";
import { dayKey, parse, timeZone } from "@/utils/validate";

const subscriptionBody = z.object({
  subscription: z.object({
    endpoint: z.url({ protocol: /^https$/, error: "is not a valid push endpoint" }).max(1000),
    keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }, { error: "is required" }),
  }, { error: "is required" }),
  time_zone: timeZone.optional().catch(undefined),
});

const endpointBody = z.object({ endpoint: z.string({ error: "is required" }).max(1000) });

const hour = z.number({ error: "must be an hour (0-23)" }).int("must be an hour (0-23)").min(0, "must be an hour (0-23)").max(23, "must be an hour (0-23)");
const flag = z.boolean({ error: "must be a boolean" });

const settingsBody = z.object({
  reminders: flag.optional(),
  task_digest: flag.optional(),
  task_digest_hour: hour.optional(),
  task_nudge: flag.optional(),
  task_nudge_hour: hour.optional(),
  time_zone: timeZone.optional(),
});

const inboxQuery = z.object({ today: dayKey });

const actionBody = z.object({ token: z.string({ error: "is required" }).max(2000) });

export function getPublicKey(_req: Request, res: Response) {
  res.json({ publicKey: notificationsService.getPublicKey() });
}

export async function saveSubscription(req: Request, res: Response) {
  const { subscription, time_zone } = parse(subscriptionBody, req.body);
  await notificationsService.saveSubscription(req.userId!, {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
    timeZone: time_zone ?? null,
  });
  res.status(201).json({ ok: true });
}

export async function deleteSubscription(req: Request, res: Response) {
  const { endpoint } = parse(endpointBody, req.body);
  await notificationsService.deleteSubscription(req.userId!, endpoint);
  res.status(204).end();
}

export async function getSettings(req: Request, res: Response) {
  res.json(await notificationsService.getSettings(req.userId!));
}

export async function updateSettings(req: Request, res: Response) {
  const body = parse(settingsBody, req.body);
  const input: SettingsInput = {
    reminders: body.reminders,
    taskDigest: body.task_digest,
    taskDigestHour: body.task_digest_hour,
    taskNudge: body.task_nudge,
    taskNudgeHour: body.task_nudge_hour,
    timeZone: body.time_zone,
  };
  res.json(await notificationsService.updateSettings(req.userId!, input));
}

export async function sendTest(req: Request, res: Response) {
  res.json(await notificationsService.sendTest(req.userId!));
}

export async function getInbox(req: Request, res: Response) {
  const { today } = parse(inboxQuery, req.query);
  res.json(await notificationsService.getInbox(req.userId!, today));
}

// ── Public (no session) ──

export async function runAction(req: Request, res: Response) {
  await notificationsService.runAction(parse(actionBody, req.body).token);
  res.status(204).end();
}

export async function dispatch(req: Request, res: Response) {
  if (!env.CRON_SECRET || req.get("x-cron-secret") !== env.CRON_SECRET) throw new HttpError(401, "Unauthorized");
  await dispatchDue();
  res.status(204).end();
}
