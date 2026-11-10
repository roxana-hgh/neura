import type { Request, Response } from "express";
import { z } from "zod";
import * as brainstormsService from "@/modules/brainstorms/brainstorms.service";
import { BRAINSTORM_STATUSES } from "@/modules/brainstorms/brainstorms.service";
import { optionalId, parse, requiredText } from "@/utils/validate";

type IdParams = { id: string };

const MAX_CONTENT = 5000;

const listQuery = z.object({
  status: z.enum(BRAINSTORM_STATUSES, { error: "must be inbox or processed" }).default("inbox"),
});

const contentBody = z.object({ content: requiredText(MAX_CONTENT) });

const processBody = z.object({ task_id: optionalId.optional(), reminder_id: optionalId.optional() });

// GET /api/brainstorms?status=inbox|processed
export async function listBrainstorms(req: Request, res: Response) {
  const { status } = parse(listQuery, req.query);
  res.json(await brainstormsService.listBrainstorms(req.userId!, status));
}

// POST /api/brainstorms
export async function createBrainstorm(req: Request, res: Response) {
  const item = await brainstormsService.createBrainstorm(req.userId!, parse(contentBody, req.body).content);
  res.status(201).json(item);
}

// PATCH /api/brainstorms/:id
export async function updateBrainstorm(req: Request<IdParams>, res: Response) {
  res.json(await brainstormsService.updateBrainstorm(req.userId!, req.params.id, parse(contentBody, req.body).content));
}

// POST /api/brainstorms/:id/keep
export async function keepBrainstorm(req: Request<IdParams>, res: Response) {
  res.json(await brainstormsService.keepBrainstorm(req.userId!, req.params.id));
}

// POST /api/brainstorms/:id/process — body { task_id } | { reminder_id } | {} (dismiss)
export async function processBrainstorm(req: Request<IdParams>, res: Response) {
  const body = parse(processBody, req.body);
  const item = await brainstormsService.processBrainstorm(req.userId!, req.params.id, {
    taskId: body.task_id ?? null,
    reminderId: body.reminder_id ?? null,
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
