import type { Request, Response } from "express";
import { z } from "zod";
import * as listsService from "@/modules/tasks/lists.service";
import { COLORS, optionalText, parse, requiredText } from "@/utils/validate";

type IdParams = { id: string };

const listBody = z.object({
  name: requiredText(100),
  color: z.enum(COLORS, { error: "is not a valid color" }),
  description: optionalText(1000),
});

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
  const list = await listsService.createList(req.userId!, parse(listBody, req.body));
  res.status(201).json(list);
}

// PUT /api/tasks/lists/:id
export async function updateList(req: Request<IdParams>, res: Response) {
  res.json(await listsService.updateList(req.userId!, req.params.id, parse(listBody, req.body)));
}

// DELETE /api/tasks/lists/:id
export async function deleteList(req: Request<IdParams>, res: Response) {
  await listsService.deleteList(req.userId!, req.params.id);
  res.status(204).send();
}
