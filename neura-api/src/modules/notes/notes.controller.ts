import type { Request, Response } from "express";
import { z } from "zod";
import * as notesService from "@/modules/notes/notes.service";
import { unfurl } from "@/modules/notes/notes.unfurl";
import { COLORS, id, optionalId, parse, requiredText } from "@/utils/validate";

type IdParams = { id: string };

/** Link ids: absent = unchanged, null / "" = unlink. */
const linksBody = z.object({
  folder_id: optionalId.optional(),
  goal_id: optionalId.optional(),
  task_id: optionalId.optional(),
  list_id: optionalId.optional(),
});

const parseLinks = (body: unknown): notesService.NoteLinks => {
  const links = parse(linksBody, body);
  return { folderId: links.folder_id, goalId: links.goal_id, taskId: links.task_id, listId: links.list_id };
};

const noteBody = z.object({
  title: requiredText(300),
  // TipTap HTML with inline images (data URLs); the JSON body limit (10 MB) caps it
  description: z.string({ error: "must be text" }).nullish(),
  // older notes may carry "default"
  color: z.string({ error: "must be text" }).max(30).optional(),
});

const listQuery = z.object({ task_id: id.optional().catch(undefined), list_id: id.optional().catch(undefined) });

const unfurlQuery = z.object({
  url: z.url({ protocol: /^https?$/, error: "must be an http(s) URL" }).max(2000, "is too long"),
});

const folderBody = z.object({
  name: requiredText(60),
  color: z.enum(COLORS, { error: "Invalid color" }),
  goal_id: optionalId,
});

// GET /api/notes?task_id=&list_id=
export async function listNotes(req: Request, res: Response) {
  const { task_id: taskId, list_id: listId } = parse(listQuery, req.query);
  res.json(await notesService.listNotes(req.userId!, { taskId, listId }));
}

// GET /api/notes/:id
export async function getNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.getNote(req.userId!, req.params.id));
}

// POST /api/notes  { title, description, color, folder_id?, goal_id?, task_id?, list_id? }
export async function createNote(req: Request, res: Response) {
  const note = await notesService.createNote(req.userId!, parse(noteBody, req.body), parseLinks(req.body));
  res.status(201).json(note);
}

// PUT /api/notes/:id  (content only; links go through PATCH /:id/links)
export async function updateNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.updateNote(req.userId!, req.params.id, parse(noteBody, req.body)));
}

// PATCH /api/notes/:id/links  { folder_id?, goal_id?, task_id?, list_id? }  (null unlinks, omitted = unchanged)
export async function setLinks(req: Request<IdParams>, res: Response) {
  res.json(await notesService.setLinks(req.userId!, req.params.id, parseLinks(req.body)));
}

// DELETE /api/notes/:id
export async function deleteNote(req: Request<IdParams>, res: Response) {
  await notesService.deleteNote(req.userId!, req.params.id);
  res.status(204).send();
}

// GET /api/notes/link-options
export async function getLinkOptions(req: Request, res: Response) {
  res.json(await notesService.getLinkOptions(req.userId!));
}

// GET /api/notes/unfurl?url=
export async function unfurlLink(req: Request, res: Response) {
  const { url } = parse(unfurlQuery, req.query);
  res.json(await unfurl(url));
}

// ── Folders ─────────────────────────────────────────────────────────────

/** Create needs a name; on PATCH every field is optional (absent = unchanged). */
function parseFolder(body: unknown, isCreate: boolean): notesService.FolderInput {
  const schema = isCreate ? folderBody.partial().extend({ name: folderBody.shape.name }) : folderBody.partial();
  const { name, color, goal_id } = parse(schema, body);
  return { name, color, goalId: goal_id };
}

// GET /api/notes/folders
export async function listFolders(req: Request, res: Response) {
  res.json(await notesService.listFolders(req.userId!));
}

// POST /api/notes/folders  { name, color?, goal_id? }
export async function createFolder(req: Request, res: Response) {
  const input = parseFolder(req.body, true);
  res.status(201).json(await notesService.createFolder(req.userId!, { ...input, name: input.name! }));
}

// PATCH /api/notes/folders/:id  { name?, color?, goal_id? }
export async function updateFolder(req: Request<IdParams>, res: Response) {
  res.json(await notesService.updateFolder(req.userId!, req.params.id, parseFolder(req.body, false)));
}

// DELETE /api/notes/folders/:id?notes=keep|delete
export async function deleteFolder(req: Request<IdParams>, res: Response) {
  await notesService.deleteFolder(req.userId!, req.params.id, req.query.notes === "delete");
  res.status(204).send();
}
