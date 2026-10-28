import webpush, { WebPushError } from "web-push";
import { env } from "@/config/env";

export const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type PushResult = "sent" | "gone" | "failed";

/** Sends one push. "gone" means the browser dropped the subscription and it should be deleted. */
export async function sendPush(target: PushTarget, payload: unknown, ttlSeconds = 3600): Promise<PushResult> {
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: ttlSeconds, urgency: "high" },
    );
    return "sent";
  } catch (err) {
    if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) return "gone";
    console.error("Push failed:", err instanceof WebPushError ? `${err.statusCode} ${err.body}` : err);
    return "failed";
  }
}
