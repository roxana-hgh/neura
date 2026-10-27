import type { Request, Response } from "express";
import * as goalsService from "@/modules/goals/goals.service";
import type { GoalInput } from "@/modules/goals/goals.service";
import {
  GOAL_METRICS, GOAL_PERIODS, GOAL_STATUSES, REMINDER_PRESETS,
  type GoalMetric, type GoalPeriod, type GoalStatus, type ReminderPreset,
} from "@/modules/goals/goals.utils";
import { isDayKey } from "@/modules/habits/habits.utils";
import { isValidTimeZone } from "@/modules/reminders/reminders.utils";
import { HttpError } from "@/utils/http-error";
import { dayKey } from "@/utils/date";

type IdParams = { id: string };

/** The client's calendar day, so "needs review" and pace match the user's time zone. */
const todayOf = (req: Request) => (isDayKey(req.query.today) ? req.query.today : dayKey(new Date()));

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const optionalText = (v: unknown, field: string, max = 1000): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") throw new HttpError(400, `${field} must be text`);
  if (v.length > max) throw new HttpError(400, `${field} is too long`);
  return v;
};

/**
 * Snake_case body → GoalInput. Only present keys are set, so PATCH can be partial.
 * Throws 400 on invalid values.
 */
function parseBody(body: Record<string, unknown>, isCreate: boolean): GoalInput {
  const input: GoalInput = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (isCreate || has("title")) {
    if (typeof body.title !== "string" || !body.title.trim()) throw new HttpError(400, "Title is required");
    if (body.title.trim().length > 120) throw new HttpError(400, "Title is too long");
    input.title = body.title;
  }
  if (has("success_criteria")) input.successCriteria = optionalText(body.success_criteria, "success_criteria", 300);
  if (has("description")) input.description = optionalText(body.description, "description", 2000);
  if (has("category")) input.category = optionalText(body.category, "category", 40);
  if (has("unit")) input.unit = optionalText(body.unit, "unit", 20);
  if (has("color")) {
    if (typeof body.color !== "string" || !body.color) throw new HttpError(400, "Invalid color");
    input.color = body.color;
  }
  if (has("period")) {
    if (!GOAL_PERIODS.includes(body.period as GoalPeriod)) throw new HttpError(400, "Invalid period");
    input.period = body.period as GoalPeriod;
  }
  if (has("metric")) {
    if (!GOAL_METRICS.includes(body.metric as GoalMetric)) throw new HttpError(400, "Invalid metric");
    input.metric = body.metric as GoalMetric;
  }
  for (const [key, field] of [["start_date", "startDate"], ["end_date", "endDate"]] as const) {
    if (!has(key)) continue;
    if (!isDayKey(body[key])) throw new HttpError(400, `${key} must be yyyy-MM-dd`);
    input[field] = body[key] as string;
  }
  if (has("start_value")) {
    if (!isNumber(body.start_value)) throw new HttpError(400, "start_value must be a number");
    input.startValue = body.start_value;
  }
  if (has("current_value")) {
    if (!isNumber(body.current_value)) throw new HttpError(400, "current_value must be a number");
    input.currentValue = body.current_value;
  }
  if (has("target_value")) {
    if (body.target_value !== null && !isNumber(body.target_value)) throw new HttpError(400, "target_value must be a number or null");
    input.targetValue = body.target_value as number | null;
  }
  if (isCreate && has("parent_id") && body.parent_id) {
    if (typeof body.parent_id !== "string") throw new HttpError(400, "Invalid parent_id");
    input.parentId = body.parent_id;
  }
  if (isCreate && has("reminder_presets")) {
    const presets = body.reminder_presets;
    if (!Array.isArray(presets) || !presets.every((p) => REMINDER_PRESETS.includes(p))) {
      throw new HttpError(400, "Invalid reminder_presets");
    }
    if (presets.length && !isValidTimeZone(body.time_zone)) throw new HttpError(400, "time_zone is required for reminders");
    input.reminderPresets = presets as ReminderPreset[];
    input.timeZone = body.time_zone as string;
  }
  return input;
}

// GET /api/goals?archived=false&today=yyyy-MM-dd
export async function listGoals(req: Request, res: Response) {
  res.json(await goalsService.listGoals(req.userId!, req.query.archived === "true", todayOf(req)));
}

// GET /api/goals/:id?today=
export async function getGoal(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.getGoal(req.userId!, req.params.id, todayOf(req)));
}

// POST /api/goals  { title, period?, start_date?, end_date?, metric?, start_value?, target_value?, unit?,
//                    success_criteria?, description?, category?, color?, parent_id?,
//                    reminder_presets?: ("review" | "checkin" | "deadline")[], time_zone? }
export async function createGoal(req: Request, res: Response) {
  const goal = await goalsService.createGoal(req.userId!, parseBody(req.body ?? {}, true), todayOf(req));
  res.status(201).json(goal);
}

// PATCH /api/goals/:id  (any subset of the create fields except parent_id / reminder_presets)
export async function updateGoal(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.updateGoal(req.userId!, req.params.id, parseBody(req.body ?? {}, false), todayOf(req)));
}

// POST /api/goals/:id/extend  { end_date, note? }
export async function extendGoal(req: Request<IdParams>, res: Response) {
  if (!isDayKey(req.body?.end_date)) {
    res.status(400).json({ error: "end_date must be yyyy-MM-dd" });
    return;
  }
  const note = optionalText(req.body.note, "note", 500);
  res.json(await goalsService.updateGoal(req.userId!, req.params.id, { endDate: req.body.end_date }, todayOf(req), note));
}

// POST /api/goals/:id/progress  { value? | delta?, note? }
export async function recordProgress(req: Request<IdParams>, res: Response) {
  const { value, delta } = req.body ?? {};
  if (!isNumber(value) && !isNumber(delta)) {
    res.status(400).json({ error: "value or delta is required" });
    return;
  }
  const note = optionalText(req.body.note, "note", 500);
  res.json(await goalsService.recordProgress(req.userId!, req.params.id, {
    value: isNumber(value) ? value : undefined,
    delta: isNumber(delta) ? delta : undefined,
    note,
  }, todayOf(req)));
}

// POST /api/goals/:id/notes  { note }
export async function addNote(req: Request<IdParams>, res: Response) {
  const note = optionalText(req.body?.note, "note", 1000);
  if (!note?.trim()) {
    res.status(400).json({ error: "note is required" });
    return;
  }
  res.json(await goalsService.addNote(req.userId!, req.params.id, note.trim(), todayOf(req)));
}

// DELETE /api/goals/:id/logs/:logId
export async function deleteLog(req: Request<{ id: string; logId: string }>, res: Response) {
  await goalsService.deleteLog(req.userId!, req.params.id, req.params.logId);
  res.status(204).send();
}

// GET /api/goals/:id/reminders  (active + paused reminders linked to the goal or its sub-goals)
export async function getLinkedReminders(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.getLinkedReminders(req.userId!, req.params.id));
}

// PATCH /api/goals/:id/status  { status, keep_reminder_ids?: string[], note? }
export async function setStatus(req: Request<IdParams>, res: Response) {
  const { status, keep_reminder_ids: keep = [] } = req.body ?? {};
  if (!GOAL_STATUSES.includes(status as GoalStatus)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  if (!Array.isArray(keep) || !keep.every((k) => typeof k === "string")) {
    res.status(400).json({ error: "keep_reminder_ids must be a list of ids" });
    return;
  }
  const note = optionalText(req.body.note, "note", 500);
  res.json(await goalsService.setStatus(req.userId!, req.params.id, status, keep, note, todayOf(req)));
}

// POST /api/goals/:id/archive  { archived: boolean }
export async function setArchived(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.setArchived(req.userId!, req.params.id, req.body?.archived !== false, todayOf(req)));
}

// DELETE /api/goals/:id?reminders=delete|keep
export async function deleteGoal(req: Request<IdParams>, res: Response) {
  await goalsService.deleteGoal(req.userId!, req.params.id, req.query.reminders === "keep");
  res.status(204).send();
}

// POST /api/goals/:id/tasks  { title, priority?, due_date? }
export async function createTask(req: Request<IdParams>, res: Response) {
  const { title, priority, due_date } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (priority !== undefined && !["low", "medium", "high"].includes(priority)) {
    res.status(400).json({ error: "Invalid priority" });
    return;
  }
  const task = await goalsService.createTask(req.userId!, req.params.id, { title, priority, dueDate: due_date ?? null });
  res.status(201).json(task);
}

// GET /api/goals/:id/link-options
export async function getLinkOptions(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.getLinkOptions(req.userId!, req.params.id));
}

const LINK_TYPES = ["task", "note"] as const;

// POST /api/goals/:id/links  { type: "task" | "note", target_id }
export async function addLink(req: Request<IdParams>, res: Response) {
  const { type, target_id } = req.body ?? {};
  if (!LINK_TYPES.includes(type) || typeof target_id !== "string") {
    res.status(400).json({ error: "type (task | note) and target_id are required" });
    return;
  }
  await goalsService.link(req.userId!, req.params.id, type, target_id, true);
  res.status(204).send();
}

// DELETE /api/goals/:id/links/:type/:targetId
export async function removeLink(req: Request<{ id: string; type: string; targetId: string }>, res: Response) {
  const type = req.params.type as (typeof LINK_TYPES)[number];
  if (!LINK_TYPES.includes(type)) {
    res.status(400).json({ error: "Invalid link type" });
    return;
  }
  await goalsService.link(req.userId!, req.params.id, type, req.params.targetId, false);
  res.status(204).send();
}
