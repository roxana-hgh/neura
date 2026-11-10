import type { Request, Response } from "express";
import { z } from "zod";
import * as tagsService from "@/modules/tasks/tags.service";
import { parse } from "@/utils/validate";

type IdParams = { id: string };

const tagBody = z.object({
  name: z.string({ error: "Tag name is required" })
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(z.string()
      .min(1, "Tag name is required")
      .max(tagsService.TAG_NAME_MAX, `Tag name must be ${tagsService.TAG_NAME_MAX} characters or less`)),
  color: z.enum(tagsService.TAG_COLORS, { error: "Invalid tag color" }),
});

// GET /api/tasks/tags
export async function listTags(req: Request, res: Response) {
  res.json(await tagsService.listTags(req.userId!));
}

// POST /api/tasks/tags  { name, color }
export async function createTag(req: Request, res: Response) {
  const input = parse(tagBody, req.body);
  res.status(201).json(await tagsService.createTag(req.userId!, input));
}

// PUT /api/tasks/tags/:id  { name, color }
export async function updateTag(req: Request<IdParams>, res: Response) {
  const input = parse(tagBody, req.body);
  res.json(await tagsService.updateTag(req.userId!, req.params.id, input));
}

// DELETE /api/tasks/tags/:id (tasks keep existing, they just lose the tag)
export async function deleteTag(req: Request<IdParams>, res: Response) {
  await tagsService.deleteTag(req.userId!, req.params.id);
  res.status(204).send();
}
