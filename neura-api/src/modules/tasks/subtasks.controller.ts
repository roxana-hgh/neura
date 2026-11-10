import type { Request, Response } from "express";
import { z } from "zod";
import * as subtasksService from "@/modules/tasks/subtasks.service";
import { parse, requiredText } from "@/utils/validate";

type TaskParams = { taskId: string };
type SubtaskParams = { taskId: string; subtaskId: string };

const titleBody = z.object({ title: requiredText(200) });
const toggleBody = z.object({ completed: z.boolean({ error: "must be a boolean" }) });

// POST /api/tasks/:taskId/subtasks  { title }
export async function createSubtask(req: Request<TaskParams>, res: Response) {
  const subtask = await subtasksService.createSubtask(req.userId!, req.params.taskId, parse(titleBody, req.body).title);
  res.status(201).json(subtask);
}

// PUT /api/tasks/:taskId/subtasks/:subtaskId  { title }
export async function renameSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  res.json(await subtasksService.renameSubtask(req.userId!, taskId, subtaskId, parse(titleBody, req.body).title));
}

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle  { completed }
export async function toggleSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  res.json(await subtasksService.setSubtaskCompleted(req.userId!, taskId, subtaskId, parse(toggleBody, req.body).completed));
}

// DELETE /api/tasks/:taskId/subtasks/:subtaskId
export async function deleteSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  await subtasksService.deleteSubtask(req.userId!, taskId, subtaskId);
  res.status(204).send();
}
