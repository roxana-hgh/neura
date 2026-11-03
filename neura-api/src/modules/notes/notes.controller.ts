import type { Request, Response } from "express";
import * as notesService from "@/modules/notes/notes.service";
import { unfurl } from "@/modules/notes/notes.unfurl";
import { HttpError } from "@/utils/http-error";

type IdParams = { id: string };

const FOLDER_COLORS = ["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"];

/** Reads an optional id: absent = unchanged, null / "" = unlink. */
const optionalId = (body: Record<string, unknown>, key: string): string | null | undefined => {
  if (!(key in body)) return undefined;
  const value = body[key];
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new HttpError(400, `${key} must be a string or null`);
  return value;
};

const parseLinks = (body: Record<string, unknown> = {}): notesService.NoteLinks => ({
  folderId: optionalId(body, "folder_id"),
  goalId: optionalId(body, "goal_id"),
  taskId: optionalId(body, "task_id"),
  listId: optionalId(body, "list_id"),
});

// GET /api/notes?task_id=&list_id=
export async function listNotes(req: Request, res: Response) {
  const taskId = typeof req.query.task_id === "string" ? req.query.task_id : undefined;
  const listId = typeof req.query.list_id === "string" ? req.query.list_id : undefined;
  res.json(await notesService.listNotes(req.userId!, { taskId, listId }));
}

// GET /api/notes/:id
export async function getNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.getNote(req.userId!, req.params.id));
}

// POST /api/notes  { title, description, color, folder_id?, goal_id?, task_id?, list_id? }
export async function createNote(req: Request, res: Response) {
  const note = await notesService.createNote(req.userId!, req.body, parseLinks(req.body));
  res.status(201).json(note);
}

// PUT /api/notes/:id  (content only; links go through PATCH /:id/links)
export async function updateNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.updateNote(req.userId!, req.params.id, req.body));
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
  const url = typeof req.query.url === "string" ? req.query.url : "";
  if (!url || url.length > 2000) {
    res.status(400).json({ error: "url is required" });
    return;
  }
  res.json(await unfurl(url));
}

// ── Folders ─────────────────────────────────────────────────────────────

function parseFolder(body: Record<string, unknown> = {}, isCreate: boolean): notesService.FolderInput {
  const input: notesService.FolderInput = {};
  if (isCreate || "name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) throw new HttpError(400, "name is required (max 60 characters)");
    input.name = name;
  }
  if ("color" in body) {
    if (typeof body.color !== "string" || !FOLDER_COLORS.includes(body.color)) throw new HttpError(400, "Invalid color");
    input.color = body.color;
  }
  input.goalId = optionalId(body, "goal_id");
  return input;
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
