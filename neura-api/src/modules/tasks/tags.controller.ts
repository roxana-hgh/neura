import type { Request, Response } from "express";
import * as tagsService from "@/modules/tasks/tags.service";

type IdParams = { id: string };

/** Validates `{ name, color }`; returns an error message or the cleaned input. */
function parseTag(body: unknown): tagsService.TagInput | string {
  const { name, color } = (body ?? {}) as Record<string, unknown>;
  const trimmed = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (!trimmed) return "Tag name is required";
  if (trimmed.length > tagsService.TAG_NAME_MAX) {
    return `Tag name must be ${tagsService.TAG_NAME_MAX} characters or less`;
  }
  if (typeof color !== "string" || !(tagsService.TAG_COLORS as readonly string[]).includes(color)) {
    return "Invalid tag color";
  }
  return { name: trimmed, color };
}

// GET /api/tasks/tags
export async function listTags(req: Request, res: Response) {
  res.json(await tagsService.listTags(req.userId!));
}

// POST /api/tasks/tags  { name, color }
export async function createTag(req: Request, res: Response) {
  const input = parseTag(req.body);
  if (typeof input === "string") return res.status(400).json({ error: input });
  res.status(201).json(await tagsService.createTag(req.userId!, input));
}

// PUT /api/tasks/tags/:id  { name, color }
export async function updateTag(req: Request<IdParams>, res: Response) {
  const input = parseTag(req.body);
  if (typeof input === "string") return res.status(400).json({ error: input });
  res.json(await tagsService.updateTag(req.userId!, req.params.id, input));
}

// DELETE /api/tasks/tags/:id (tasks keep existing, they just lose the tag)
export async function deleteTag(req: Request<IdParams>, res: Response) {
  await tagsService.deleteTag(req.userId!, req.params.id);
  res.status(204).send();
}
