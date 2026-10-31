import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { isDayKey } from "@/modules/habits/habits.utils";
import { HttpError } from "@/utils/http-error";

/** What every tool needs besides its arguments. `todayKey` and `timeZone` are the user's, not the server's. */
export interface ToolContext {
  userId: string;
  todayKey: string; // "yyyy-MM-dd"
  timeZone: string; // IANA
}

// Arguments come from the model, so they're validated like a request body.
// HttpErrors are returned to the model as `{ error }`, which lets it correct itself.

export function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${field} is required`);
  const text = value.trim();
  if (text.length > max) throw new HttpError(400, `${field} must be ${max} characters or less`);
  return text;
}

/** Accepts "2026-11-01" or a full ISO date-time; models send both. */
export function dayArg(value: unknown, field: string): string {
  const key = typeof value === "string" ? value.slice(0, 10) : value;
  if (!isDayKey(key)) throw new HttpError(400, `${field} must be yyyy-MM-dd`);
  return key;
}

export const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/** "2026-11-01 09:30" in the user's zone. */
export const localDateTime = (date: Date, timeZone: string) =>
  format(new TZDate(date.getTime(), timeZone), "yyyy-MM-dd HH:mm");
