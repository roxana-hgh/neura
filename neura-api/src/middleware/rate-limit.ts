import type { Request, Response } from "express";
import { rateLimit, ipKeyGenerator, type Options } from "express-rate-limit";

// In-memory stores: fine for the single Render instance. Several instances would each count
// separately, so a shared store (e.g. rate-limit-redis) would be needed then.

const MINUTE = 60_000;

/** Per signed-in user (falls back to the IP); use after requireAuth. */
const byUser = (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? "");

/** 429 `{ error, message, retryAfterSec }`, the same shape as the assistant's 503 busy answer. */
function limited(message: string): Options["handler"] {
  return (req: Request, res: Response, _next, options) => {
    const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
    const retryAfterSec = Math.max(1, Math.ceil(((resetTime?.getTime() ?? Date.now() + options.windowMs) - Date.now()) / 1000));
    res.set("Retry-After", String(retryAfterSec));
    res.status(429).json({ error: "Too many requests", message, retryAfterSec });
  };
}

const base = { standardHeaders: "draft-8", legacyHeaders: false } as const;

/** Every /api request, per IP. A ceiling against floods; normal use stays far below it. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTE,
  limit: 1500,
  handler: limited("Too many requests. Slow down and try again in a few minutes."),
});

/** All of /api/auth (session checks included), per IP. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTE,
  limit: 300,
  handler: limited("Too many requests. Try again in a few minutes."),
});

/**
 * Password guessing: sign-in, sign-up and password endpoints, per IP.
 * Only failed attempts count, so a user who signs in fine is never locked out.
 */
export const credentialsLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: limited("Too many attempts. Try again in 15 minutes."),
});

/** Sign-ups that succeed, per IP (stops mass account creation). */
export const signUpLimiter = rateLimit({
  ...base,
  windowMs: 60 * MINUTE,
  limit: 5,
  handler: limited("Too many sign-ups from this network. Try again later."),
});

/** Assistant: every request costs Groq tokens. Burst limit per user… */
export const assistantBurstLimiter = rateLimit({
  ...base,
  windowMs: MINUTE,
  limit: 8,
  keyGenerator: byUser,
  handler: limited("You're sending messages very fast. Wait a moment and try again."),
});

/** …and a daily quota per user. */
export const assistantDailyLimiter = rateLimit({
  ...base,
  windowMs: 24 * 60 * MINUTE,
  limit: 150,
  keyGenerator: byUser,
  handler: limited("You've reached today's assistant limit. Try again tomorrow."),
});

/** Link previews make outbound requests, per user. */
export const unfurlLimiter = rateLimit({
  ...base,
  windowMs: MINUTE,
  limit: 30,
  keyGenerator: byUser,
  handler: limited("Too many link previews. Try again in a minute."),
});

/** Public push-button actions (signed token, no session), per IP. */
export const notificationActionLimiter = rateLimit({
  ...base,
  windowMs: MINUTE,
  limit: 30,
  handler: limited("Too many requests. Try again in a minute."),
});

/** Public cron endpoint (secret header), per IP. */
export const dispatchLimiter = rateLimit({
  ...base,
  windowMs: MINUTE,
  limit: 6,
  handler: limited("Too many requests."),
});
