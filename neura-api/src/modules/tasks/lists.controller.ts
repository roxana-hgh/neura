import type { Request, Response } from "express";
import * as listsService from "@/modules/tasks/lists.service";

type IdParams = { id: string };

// GET /api/tasks/lists
export async function listLists(req: Request, res: Response) {
  res.json(await listsService.listLists(req.userId!));
}

// GET /api/tasks/lists/:id
export async function getList(req: Request<IdParams>, res: Response) {
  res.json(await listsService.getList(req.userId!, req.params.id));
}

// POST /api/tasks/lists
export async function createList(req: Request, res: Response) {
  const list = await listsService.createList(req.userId!, req.body);
  res.status(201).json(list);
}

// PUT /api/tasks/lists/:id
export async function updateList(req: Request<IdParams>, res: Response) {
  res.json(await listsService.updateList(req.userId!, req.params.id, req.body));
}

// DELETE /api/tasks/lists/:id
export async function deleteList(req: Request<IdParams>, res: Response) {
  await listsService.deleteList(req.userId!, req.params.id);
  res.status(204).send();
}
