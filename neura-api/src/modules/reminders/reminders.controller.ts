import type { Request, Response } from "express";
import * as remindersService from "@/modules/reminders/reminders.service";
import { REMINDER_VIEWS, type ReminderInput, type ReminderView } from "@/modules/reminders/reminders.service";
import { REPEATS, isValidTimeZone, type Repeat } from "@/modules/reminders/reminders.utils";
import { HttpError } from "@/utils/http-error";

type IdParams = { id: string };

const parseDate = (v: unknown): Date | null => {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const optionalId = (v: unknown) => (typeof v === "string" && v ? v : null);

/**
 * Turns the snake_case request body into a ReminderInput. Only keys that are present
 * are set, so PATCH can send a partial body. Throws 400 on invalid values.
 */
function parseBody(body: Record<string, unknown>, isCreate: boolean): ReminderInput {
  const input: ReminderInput = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (isCreate || has("title")) {
    if (typeof body.title !== "string" || !body.title.trim()) throw new HttpError(400, "Title is required");
    if (body.title.trim().length > 200) throw new HttpError(400, "Title is too long");
    input.title = body.title;
  }
  if (has("description")) input.description = typeof body.description === "string" ? body.description : null;

  if (isCreate || has("scheduled_at")) {
    const at = parseDate(body.scheduled_at);
    if (!at) throw new HttpError(400, "scheduled_at must be an ISO date-time");
    input.scheduledAt = at;
  }
  if (isCreate || has("time_zone")) {
    if (!isValidTimeZone(body.time_zone)) throw new HttpError(400, "time_zone must be an IANA time zone");
    input.timeZone = body.time_zone;
  }

  if (has("repeat")) {
    if (!REPEATS.includes(body.repeat as Repeat)) throw new HttpError(400, "Invalid repeat");
    input.repeat = body.repeat as Repeat;
  }
  if (has("interval")) {
    const n = body.interval;
    if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 365) throw new HttpError(400, "interval must be 1–365");
    input.interval = n as number;
  }
  if (has("weekdays")) {
    const days = body.weekdays;
    if (!Array.isArray(days) || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      throw new HttpError(400, "weekdays must be numbers 0–6");
    }
    input.weekdays = [...new Set(days as number[])].sort();
  }
  if (has("repeat_until")) {
    if (body.repeat_until === null) input.repeatUntil = null;
    else {
      const until = parseDate(body.repeat_until);
      if (!until) throw new HttpError(400, "repeat_until must be an ISO date-time or null");
      input.repeatUntil = until;
    }
  }

  // links: sending any of them replaces the link (the others are cleared)
  if (has("goal_id") || has("task_id") || has("note_id")) {
    input.goalId = optionalId(body.goal_id);
    input.taskId = optionalId(body.task_id);
    input.noteId = optionalId(body.note_id);
  }
  return input;
}

// GET /api/reminders?view=upcoming|snoozed|done|all&goal_id=&task_id=&note_id=
export async function listReminders(req: Request, res: Response) {
  const view = (req.query.view as ReminderView) || "upcoming";
  if (!REMINDER_VIEWS.includes(view)) {
    res.status(400).json({ error: "Invalid view" });
    return;
  }
  res.json(await remindersService.listReminders(req.userId!, {
    view,
    goalId: optionalId(req.query.goal_id) ?? undefined,
    taskId: optionalId(req.query.task_id) ?? undefined,
    noteId: optionalId(req.query.note_id) ?? undefined,
  }));
}

// GET /api/reminders/counts?end_of_today=<ISO>  (the client's local end of day)
export async function getCounts(req: Request, res: Response) {
  const endOfToday = parseDate(req.query.end_of_today) ?? new Date(new Date().setHours(23, 59, 59, 999));
  res.json(await remindersService.getCounts(req.userId!, endOfToday));
}

// GET /api/reminders/link-options?q=
export async function getLinkOptions(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  res.json(await remindersService.getLinkOptions(req.userId!, q));
}

// POST /api/reminders  { title, description?, scheduled_at, time_zone, repeat?, interval?, weekdays?,
//                        repeat_until?, goal_id? | task_id? | note_id? }
export async function createReminder(req: Request, res: Response) {
  const reminder = await remindersService.createReminder(req.userId!, parseBody(req.body ?? {}, true));
  res.status(201).json(reminder);
}

// PATCH /api/reminders/:id  (any subset of the create fields)
export async function updateReminder(req: Request<IdParams>, res: Response) {
  res.json(await remindersService.updateReminder(req.userId!, req.params.id, parseBody(req.body ?? {}, false)));
}

// POST /api/reminders/:id/complete  { scope?: "occurrence" | "series" }
export async function completeReminder(req: Request<IdParams>, res: Response) {
  const scope = req.body?.scope === "series" ? "series" : "occurrence";
  res.json(await remindersService.completeReminder(req.userId!, req.params.id, scope));
}

// POST /api/reminders/:id/skip  (recurring only: skip this occurrence)
export async function skipReminder(req: Request<IdParams>, res: Response) {
  res.json(await remindersService.completeReminder(req.userId!, req.params.id, "occurrence", "skipped"));
}

// POST /api/reminders/:id/reopen
export async function reopenReminder(req: Request<IdParams>, res: Response) {
  res.json(await remindersService.reopenReminder(req.userId!, req.params.id));
}

// POST /api/reminders/:id/snooze  { until: ISO }
export async function snoozeReminder(req: Request<IdParams>, res: Response) {
  const until = parseDate(req.body?.until);
  if (!until || until.getTime() <= Date.now()) {
    res.status(400).json({ error: "until must be a future ISO date-time" });
    return;
  }
  res.json(await remindersService.snoozeReminder(req.userId!, req.params.id, until));
}

// POST /api/reminders/:id/pause, /api/reminders/:id/resume
export async function pauseReminder(req: Request<IdParams>, res: Response) {
  res.json(await remindersService.setPaused(req.userId!, req.params.id, true));
}

export async function resumeReminder(req: Request<IdParams>, res: Response) {
  res.json(await remindersService.setPaused(req.userId!, req.params.id, false));
}

// DELETE /api/reminders/:id
export async function deleteReminder(req: Request<IdParams>, res: Response) {
  await remindersService.deleteReminder(req.userId!, req.params.id);
  res.status(204).send();
}
