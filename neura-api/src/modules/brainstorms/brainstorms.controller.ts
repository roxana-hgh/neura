import type { Request, Response } from "express";
import * as brainstormsService from "@/modules/brainstorms/brainstorms.service";
import { BRAINSTORM_STATUSES, type BrainstormStatus } from "@/modules/brainstorms/brainstorms.service";
import { HttpError } from "@/utils/http-error";

type IdParams = { id: string };

const MAX_CONTENT = 5000;

function parseContent(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, "Content is required");
  const content = value.trim();
  if (content.length > MAX_CONTENT) throw new HttpError(400, `Content must be ${MAX_CONTENT} characters or less`);
  return content;
}

const optionalId = (v: unknown) => (typeof v === "string" && v ? v : null);

// GET /api/brainstorms?status=inbox|processed
export async function listBrainstorms(req: Request, res: Response) {
  const status = (req.query.status ?? "inbox") as BrainstormStatus;
  if (!BRAINSTORM_STATUSES.includes(status)) {
    res.status(400).json({ error: "status must be inbox or processed" });
    return;
  }
  res.json(await brainstormsService.listBrainstorms(req.userId!, status));
}

// POST /api/brainstorms
export async function createBrainstorm(req: Request, res: Response) {
  const item = await brainstormsService.createBrainstorm(req.userId!, parseContent(req.body?.content));
  res.status(201).json(item);
}

// PATCH /api/brainstorms/:id
export async function updateBrainstorm(req: Request<IdParams>, res: Response) {
  res.json(await brainstormsService.updateBrainstorm(req.userId!, req.params.id, parseContent(req.body?.content)));
}

// POST /api/brainstorms/:id/keep
export async function keepBrainstorm(req: Request<IdParams>, res: Response) {
  res.json(await brainstormsService.keepBrainstorm(req.userId!, req.params.id));
}

// POST /api/brainstorms/:id/process — body { task_id } | { reminder_id } | {} (dismiss)
export async function processBrainstorm(req: Request<IdParams>, res: Response) {
  const item = await brainstormsService.processBrainstorm(req.userId!, req.params.id, {
    taskId: optionalId(req.body?.task_id),
    reminderId: optionalId(req.body?.reminder_id),
  });
  res.json(item);
}

// POST /api/brainstorms/:id/restore
export async function restoreBrainstorm(req: Request<IdParams>, res: Response) {
  res.json(await brainstormsService.restoreBrainstorm(req.userId!, req.params.id));
}

// DELETE /api/brainstorms/:id
export async function deleteBrainstorm(req: Request<IdParams>, res: Response) {
  await brainstormsService.deleteBrainstorm(req.userId!, req.params.id);
  res.status(204).send();
}

// DELETE /api/brainstorms/processed
export async function clearProcessed(req: Request, res: Response) {
  res.json(await brainstormsService.clearProcessed(req.userId!));
}
