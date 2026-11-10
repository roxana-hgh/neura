import { z } from "zod";
import { HttpError } from "@/utils/http-error";
import { isTimeOfDay } from "@/utils/date";

/**
 * Parses `data` with a zod schema; throws 400 `{ error }` with the first issue otherwise.
 * Custom messages are lowercase predicates ("is required") and get the field name in front
 * ("title is required"); zod's own messages are prefixed as "field: …".
 */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue.path.join(".");
  const message = !field ? issue.message
    : /^[a-z]/.test(issue.message) ? `${field} ${issue.message}`
    : `${field}: ${issue.message}`;
  throw new HttpError(400, message);
}

/** Whether `key` was sent at all (PATCH bodies: absent = unchanged, null = clear). */
export const has = (body: unknown, key: string) =>
  typeof body === "object" && body !== null && Object.prototype.hasOwnProperty.call(body, key);

// ── Reusable field schemas ───────────────────────────────────────────────

/** Trimmed text of 1..max characters. */
export const requiredText = (max: number) =>
  z.string({ error: "is required" }).trim().min(1, "is required").max(max, `must be ${max} characters or less`);

/** Text of up to max characters; null / "" become null. */
export const optionalText = (max: number) =>
  z.string({ error: "must be text" }).max(max, `must be ${max} characters or less`).nullish()
    .transform((v) => (v ? v : null));

/** A record id (cuid). Rejects anything that isn't a short id-like string. */
export const id = z.string({ error: "must be an id" }).regex(/^[\w-]{1,64}$/, "must be an id");

/** An optional link id: null / "" = unlink. */
export const optionalId = z.union([id, z.literal(""), z.null()], { error: "must be an id or null" })
  .transform((v) => v || null);

export const dayKey = z.string({ error: "must be yyyy-MM-dd" }).regex(/^\d{4}-\d{2}-\d{2}$/, "must be yyyy-MM-dd");

export const timeOfDay = z.string().refine(isTimeOfDay, "must be HH:mm");

/** Any string `new Date()` understands (ISO date or date-time). */
export const dateString = z.string({ error: "must be a date" }).max(40)
  .refine((v) => !Number.isNaN(Date.parse(v)), "must be a valid date");

/** An ISO date-time, as a Date. */
export const dateTime = dateString.transform((v) => new Date(v));

export const COLORS = ["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;

export const timeZone = z.string({ error: "must be an IANA time zone" }).min(1).max(64).refine(
  (v) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  },
  "must be an IANA time zone",
);

/** A query-string flag: "true" → true, anything else → false. */
export const queryFlag = z.unknown().transform((v) => v === "true");

/** A query-string integer, or undefined when missing / not a number. */
export const queryInt = z.unknown().transform((v) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isInteger(n) ? n : undefined;
});
