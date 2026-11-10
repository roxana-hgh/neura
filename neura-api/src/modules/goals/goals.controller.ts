import type { Request, Response } from "express";
import { z } from "zod";
import * as goalsService from "@/modules/goals/goals.service";
import type { GoalInput } from "@/modules/goals/goals.service";
import { GOAL_METRICS, GOAL_PERIODS, GOAL_STATUSES, REMINDER_PRESETS } from "@/modules/goals/goals.utils";
import { isDayKey } from "@/modules/habits/habits.utils";
import { HttpError } from "@/utils/http-error";
import { dayKey } from "@/utils/date";
import {
  PRIORITIES, dateString, dayKey as dayKeySchema, has, id, optionalText, parse, requiredText, timeZone,
} from "@/utils/validate";

type IdParams = { id: string };

/** The client's calendar day, so "needs review" and pace match the user's time zone. */
const todayOf = (req: Request) => (isDayKey(req.query.today) ? req.query.today : dayKey(new Date()));

const number = z.number({ error: "must be a number" }).finite("must be a number");
const note = optionalText(500);

/** Every field optional; `parseBody` decides which ones are required and which were sent. */
const goalBody = z.object({
  title: requiredText(120),
  success_criteria: optionalText(300),
  description: optionalText(2000),
  category: optionalText(40),
  unit: optionalText(20),
  color: z.string({ error: "Invalid color" }).min(1, "Invalid color").max(30),
  period: z.enum(GOAL_PERIODS, { error: "Invalid period" }),
  metric: z.enum(GOAL_METRICS, { error: "Invalid metric" }),
  start_date: dayKeySchema,
  end_date: dayKeySchema,
  start_value: number,
  current_value: number,
  target_value: number.nullable(),
  parent_id: z.union([id, z.literal(""), z.null()]),
  reminder_presets: z.array(z.enum(REMINDER_PRESETS), { error: "Invalid reminder_presets" }).max(REMINDER_PRESETS.length),
  time_zone: timeZone,
}).partial();

/**
 * Snake_case body → GoalInput. Only present keys are set, so PATCH can be partial.
 * Throws 400 on invalid values.
 */
export function parseBody(body: Record<string, unknown>, isCreate: boolean): GoalInput {
  const b = parse(isCreate ? goalBody.extend({ title: requiredText(120) }) : goalBody, body);
  const input: GoalInput = {};
  const set = <K extends keyof GoalInput>(key: string, field: K, value: GoalInput[K]) => {
    if (has(body, key)) input[field] = value;
  };

  if (b.title !== undefined) input.title = b.title;
  set("success_criteria", "successCriteria", b.success_criteria ?? null);
  set("description", "description", b.description ?? null);
  set("category", "category", b.category ?? null);
  set("unit", "unit", b.unit ?? null);
  set("color", "color", b.color);
  set("period", "period", b.period);
  set("metric", "metric", b.metric);
  set("start_date", "startDate", b.start_date);
  set("end_date", "endDate", b.end_date);
  set("start_value", "startValue", b.start_value);
  set("current_value", "currentValue", b.current_value);
  set("target_value", "targetValue", b.target_value);
  if (isCreate && b.parent_id) input.parentId = b.parent_id;
  if (isCreate && b.reminder_presets) {
    if (b.reminder_presets.length && !b.time_zone) throw new HttpError(400, "time_zone is required for reminders");
    input.reminderPresets = b.reminder_presets;
    input.timeZone = b.time_zone!;
  }
  return input;
}

const extendBody = z.object({ end_date: dayKeySchema, note });

const progressBody = z.object({ value: number.optional(), delta: number.optional(), note })
  .refine((b) => b.value !== undefined || b.delta !== undefined, "value or delta is required");

const noteBody = z.object({ note: requiredText(1000) });

const statusBody = z.object({
  status: z.enum(GOAL_STATUSES, { error: "Invalid status" }),
  keep_reminder_ids: z.array(id, { error: "must be a list of ids" }).max(500).default([]),
  note,
});

const archiveBody = z.object({ archived: z.boolean({ error: "must be a boolean" }).optional() });

const priority = z.enum(PRIORITIES, { error: "Invalid priority" });
const showInTasks = z.boolean({ error: "must be a boolean" });
const dueDate = z.union([dateString, z.literal(""), z.null()]).transform((v) => v || null);

const createTaskBody = z.object({
  title: requiredText(200),
  priority: priority.optional(),
  due_date: dueDate.optional(),
  show_in_tasks: showInTasks.optional(),
});

const updateTaskBody = z.object({
  title: requiredText(200),
  description: optionalText(5000),
  priority,
  due_date: dueDate,
  show_in_tasks: showInTasks,
}).partial();

const LINK_TYPES = ["task", "note", "folder"] as const;

const linkBody = z.object({
  type: z.enum(LINK_TYPES, { error: "must be task, note or folder" }),
  target_id: id,
});

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
  const { end_date, note } = parse(extendBody, req.body);
  res.json(await goalsService.updateGoal(req.userId!, req.params.id, { endDate: end_date }, todayOf(req), note));
}

// POST /api/goals/:id/progress  { value? | delta?, note? }
export async function recordProgress(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.recordProgress(req.userId!, req.params.id, parse(progressBody, req.body), todayOf(req)));
}

// POST /api/goals/:id/notes  { note }
export async function addNote(req: Request<IdParams>, res: Response) {
  const { note } = parse(noteBody, req.body);
  res.json(await goalsService.addNote(req.userId!, req.params.id, note, todayOf(req)));
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
  const { status, keep_reminder_ids: keep, note } = parse(statusBody, req.body);
  res.json(await goalsService.setStatus(req.userId!, req.params.id, status, keep, note, todayOf(req)));
}

// POST /api/goals/:id/archive  { archived: boolean }
export async function setArchived(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.setArchived(req.userId!, req.params.id, parse(archiveBody, req.body).archived !== false, todayOf(req)));
}

// DELETE /api/goals/:id?reminders=delete|keep
export async function deleteGoal(req: Request<IdParams>, res: Response) {
  await goalsService.deleteGoal(req.userId!, req.params.id, req.query.reminders === "keep");
  res.status(204).send();
}

// POST /api/goals/:id/tasks  { title, priority?, due_date? }
export async function createTask(req: Request<IdParams>, res: Response) {
  const { title, priority, due_date, show_in_tasks } = parse(createTaskBody, req.body);
  const task = await goalsService.createTask(req.userId!, req.params.id, {
    title, priority, dueDate: due_date ?? null, showInTasks: show_in_tasks,
  });
  res.status(201).json(task);
}

type TaskParams = { id: string; taskId: string };

// PATCH /api/goals/:id/tasks/:taskId  { title?, description?, priority?, due_date?, show_in_tasks? }
export async function updateTask(req: Request<TaskParams>, res: Response) {
  const { title, description, priority, due_date, show_in_tasks } = parse(updateTaskBody, req.body);
  await goalsService.updateTask(req.userId!, req.params.id, req.params.taskId, {
    title, description, priority, dueDate: due_date, showInTasks: show_in_tasks,
  });
  res.status(204).send();
}

// DELETE /api/goals/:id/tasks/:taskId
export async function deleteTask(req: Request<TaskParams>, res: Response) {
  await goalsService.deleteTask(req.userId!, req.params.id, req.params.taskId);
  res.status(204).send();
}

// GET /api/goals/:id/link-options
export async function getLinkOptions(req: Request<IdParams>, res: Response) {
  res.json(await goalsService.getLinkOptions(req.userId!, req.params.id));
}

// POST /api/goals/:id/links  { type: "task" | "note" | "folder", target_id }
export async function addLink(req: Request<IdParams>, res: Response) {
  const { type, target_id } = parse(linkBody, req.body);
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
