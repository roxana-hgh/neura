import type { Request, Response } from "express";
import { z } from "zod";
import * as tasksService from "@/modules/tasks/tasks.service";
import { REPEATS } from "@/modules/reminders/reminders.utils";
import {
  PRIORITIES, dateString, dayKey, id, optionalText, parse, queryFlag, queryInt, requiredText, timeOfDay,
} from "@/utils/validate";

type IdParams = { id: string };

const listQuery = z.object({
  search: z.string().max(200).optional().catch(undefined),
  priorities: z.string().optional().catch(undefined).transform((v) =>
    v?.split(",").filter((p) => (PRIORITIES as readonly string[]).includes(p)),
  ),
  listId: id.optional().catch(undefined),
  unassigned: queryFlag,
});

const calendarQuery = z.object({
  year: queryInt.pipe(z.number().min(1970).max(9999).optional()),
  month: queryInt.pipe(z.number().min(0, "must be 0-11").max(11, "must be 0-11").optional()),
});

/** POST / PUT body. Time, tag and repeat fields are optional: omitted = unchanged (see TaskInput). */
const taskBody = z.object({
  title: requiredText(200),
  description: optionalText(5000),
  priority: z.enum(PRIORITIES, { error: `must be one of ${PRIORITIES.join(", ")}` }).optional(),
  due_date: z.union([dateString, z.literal(""), z.null()]).optional().transform((v) => v || null),
  due_time: z.union([timeOfDay, z.literal(""), z.null()]).optional(),
  list_id: z.union([id, z.literal(""), z.null()]).optional().transform((v) => v || null),
  tag_ids: z.array(id).max(50).optional(),
  repeat: z.enum(REPEATS, { error: `must be one of ${REPEATS.join(", ")}` }).optional(),
  repeat_interval: z.number().int("must be a whole number").min(1).max(365).optional(),
  repeat_weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  repeat_until: z.union([dayKey, z.literal(""), z.null()]).optional(),
});

const toggleBody = z.object({
  completed: z.boolean({ error: "must be a boolean" }),
  today: dayKey.optional(),
});

const tagsBody = z.object({ tag_ids: z.array(id, { error: "must be an array" }).max(50) });

// GET /api/tasks?search=&priorities=low,high&listId=&unassigned=true
export async function listTasks(req: Request, res: Response) {
  res.json(await tasksService.listTasks(req.userId!, parse(listQuery, req.query)));
}

// GET /api/tasks/calendar?year=2026&month=1 (month is 0-indexed, defaults to current)
export async function listCalendarTasks(req: Request, res: Response) {
  const now = new Date();
  const query = parse(calendarQuery, req.query);
  const year = query.year ?? now.getFullYear();
  const month = query.month ?? now.getMonth();

  res.json(await tasksService.listTasksForMonth(req.userId!, year, month));
}

// GET /api/tasks/:id
export async function getTask(req: Request<IdParams>, res: Response) {
  res.json(await tasksService.getTask(req.userId!, req.params.id));
}

// POST /api/tasks
export async function createTask(req: Request, res: Response) {
  const task = await tasksService.createTask(req.userId!, parse(taskBody, req.body));
  res.status(201).json(task);
}

// PUT /api/tasks/:id
export async function updateTask(req: Request<IdParams>, res: Response) {
  res.json(await tasksService.updateTask(req.userId!, req.params.id, parse(taskBody, req.body)));
}

// PATCH /api/tasks/:id/toggle  { completed, today? }  → the task + `next` (the new occurrence of a repeating task)
export async function toggleTask(req: Request<IdParams>, res: Response) {
  const { completed, today } = parse(toggleBody, req.body);
  res.json(await tasksService.setTaskCompleted(req.userId!, req.params.id, completed, today));
}

// PATCH /api/tasks/:id/tags  { tag_ids }
export async function setTaskTags(req: Request<IdParams>, res: Response) {
  const { tag_ids } = parse(tagsBody, req.body);
  res.json(await tasksService.setTaskTags(req.userId!, req.params.id, tag_ids));
}

// DELETE /api/tasks/:id
export async function deleteTask(req: Request<IdParams>, res: Response) {
  await tasksService.deleteTask(req.userId!, req.params.id);
  res.status(204).send();
}
