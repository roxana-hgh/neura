import type { Request, Response } from "express";
import { z } from "zod";
import * as remindersService from "@/modules/reminders/reminders.service";
import { REMINDER_VIEWS, type ReminderInput } from "@/modules/reminders/reminders.service";
import { REPEATS } from "@/modules/reminders/reminders.utils";
import { dateTime, has, id, optionalId, parse, requiredText, timeZone } from "@/utils/validate";

type IdParams = { id: string };

const link = optionalId.optional().transform((v) => v ?? null);

/** Every field optional; `parseBody` decides which ones are required and which were sent. */
const reminderBody = z.object({
  title: requiredText(200),
  description: z.string().max(2000, "must be 2000 characters or less").nullish(),
  scheduled_at: dateTime,
  time_zone: timeZone,
  repeat: z.enum(REPEATS, { error: "Invalid repeat" }),
  interval: z.number({ error: "must be 1–365" }).int("must be 1–365").min(1, "must be 1–365").max(365, "must be 1–365"),
  weekdays: z.array(z.number().int().min(0).max(6), { error: "must be numbers 0–6" }).max(7)
    .transform((days) => [...new Set(days)].sort()),
  repeat_until: z.union([dateTime, z.null()], { error: "must be an ISO date-time or null" }),
  goal_id: link,
  task_id: link,
  note_id: link,
}).partial();

/**
 * Turns the snake_case request body into a ReminderInput. Only keys that are present
 * are set, so PATCH can send a partial body. Throws 400 on invalid values.
 */
export function parseBody(body: Record<string, unknown>, isCreate: boolean): ReminderInput {
  const schema = isCreate ? reminderBody.extend({ title: requiredText(200), scheduled_at: dateTime, time_zone: timeZone }) : reminderBody;
  const b = parse(schema, body);
  const input: ReminderInput = {};

  if (b.title !== undefined) input.title = b.title;
  if (has(body, "description")) input.description = b.description ?? null;
  if (b.scheduled_at !== undefined) input.scheduledAt = b.scheduled_at;
  if (b.time_zone !== undefined) input.timeZone = b.time_zone;
  if (b.repeat !== undefined) input.repeat = b.repeat;
  if (b.interval !== undefined) input.interval = b.interval;
  if (b.weekdays !== undefined) input.weekdays = b.weekdays;
  if (has(body, "repeat_until")) input.repeatUntil = b.repeat_until ?? null;

  // links: sending any of them replaces the link (the others are cleared)
  if (has(body, "goal_id") || has(body, "task_id") || has(body, "note_id")) {
    input.goalId = b.goal_id ?? null;
    input.taskId = b.task_id ?? null;
    input.noteId = b.note_id ?? null;
  }
  return input;
}

const listQuery = z.object({
  view: z.enum(REMINDER_VIEWS, { error: "Invalid view" }).default("upcoming"),
  goal_id: id.optional().catch(undefined),
  task_id: id.optional().catch(undefined),
  note_id: id.optional().catch(undefined),
});

const countsQuery = z.object({ end_of_today: dateTime.optional().catch(undefined) });

const linkOptionsQuery = z.object({ q: z.string().trim().max(100).catch("") });

const completeBody = z.object({ scope: z.enum(["occurrence", "series"]).catch("occurrence") });

const snoozeBody = z.object({
  until: dateTime.refine((d) => d.getTime() > Date.now(), "must be a future ISO date-time"),
});

// GET /api/reminders?view=upcoming|snoozed|done|all&goal_id=&task_id=&note_id=
export async function listReminders(req: Request, res: Response) {
  const { view, goal_id, task_id, note_id } = parse(listQuery, req.query);
  res.json(await remindersService.listReminders(req.userId!, { view, goalId: goal_id, taskId: task_id, noteId: note_id }));
}

// GET /api/reminders/counts?end_of_today=<ISO>  (the client's local end of day)
export async function getCounts(req: Request, res: Response) {
  const endOfToday = parse(countsQuery, req.query).end_of_today ?? new Date(new Date().setHours(23, 59, 59, 999));
  res.json(await remindersService.getCounts(req.userId!, endOfToday));
}

// GET /api/reminders/link-options?q=
export async function getLinkOptions(req: Request, res: Response) {
  const { q } = parse(linkOptionsQuery, req.query);
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
  const { scope } = parse(completeBody, req.body);
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
  const { until } = parse(snoozeBody, req.body);
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
