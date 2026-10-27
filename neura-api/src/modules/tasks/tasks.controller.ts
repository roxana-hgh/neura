import type { Request, Response } from "express";
import * as tasksService from "@/modules/tasks/tasks.service";

type IdParams = { id: string };

// GET /api/tasks?search=&priorities=low,high&listId=&unassigned=true
export async function listTasks(req: Request, res: Response) {
  const { search, priorities, listId, unassigned } = req.query;

  const tasks = await tasksService.listTasks(req.userId!, {
    search: search as string | undefined,
    priorities: priorities ? (priorities as string).split(",") : undefined,
    listId: listId as string | undefined,
    unassigned: unassigned === "true",
  });

  res.json(tasks);
}

// GET /api/tasks/calendar?year=2026&month=1 (month is 0-indexed, defaults to current)
export async function listCalendarTasks(req: Request, res: Response) {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth();

  res.json(await tasksService.listTasksForMonth(req.userId!, year, month));
}

// GET /api/tasks/:id
export async function getTask(req: Request<IdParams>, res: Response) {
  res.json(await tasksService.getTask(req.userId!, req.params.id));
}

// POST /api/tasks
export async function createTask(req: Request, res: Response) {
  const task = await tasksService.createTask(req.userId!, req.body);
  res.status(201).json(task);
}

// PUT /api/tasks/:id
export async function updateTask(req: Request<IdParams>, res: Response) {
  res.json(await tasksService.updateTask(req.userId!, req.params.id, req.body));
}

// PATCH /api/tasks/:id/toggle  { completed }
export async function toggleTask(req: Request<IdParams>, res: Response) {
  res.json(await tasksService.setTaskCompleted(req.userId!, req.params.id, req.body.completed));
}

// DELETE /api/tasks/:id
export async function deleteTask(req: Request<IdParams>, res: Response) {
  await tasksService.deleteTask(req.userId!, req.params.id);
  res.status(204).send();
}
