import type { Request, Response } from "express";
import * as subtasksService from "@/modules/tasks/subtasks.service";

type TaskParams = { taskId: string };
type SubtaskParams = { taskId: string; subtaskId: string };

// POST /api/tasks/:taskId/subtasks  { title }
export async function createSubtask(req: Request<TaskParams>, res: Response) {
  const subtask = await subtasksService.createSubtask(req.userId!, req.params.taskId, req.body.title);
  res.status(201).json(subtask);
}

// PUT /api/tasks/:taskId/subtasks/:subtaskId  { title }
export async function renameSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  res.json(await subtasksService.renameSubtask(req.userId!, taskId, subtaskId, req.body.title));
}

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle  { completed }
export async function toggleSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  res.json(await subtasksService.setSubtaskCompleted(req.userId!, taskId, subtaskId, req.body.completed));
}

// DELETE /api/tasks/:taskId/subtasks/:subtaskId
export async function deleteSubtask(req: Request<SubtaskParams>, res: Response) {
  const { taskId, subtaskId } = req.params;
  await subtasksService.deleteSubtask(req.userId!, taskId, subtaskId);
  res.status(204).send();
}
