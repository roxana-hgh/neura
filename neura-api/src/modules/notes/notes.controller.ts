import type { Request, Response } from "express";
import * as notesService from "@/modules/notes/notes.service";

type IdParams = { id: string };

// GET /api/notes
export async function listNotes(req: Request, res: Response) {
  res.json(await notesService.listNotes(req.userId!));
}

// GET /api/notes/:id
export async function getNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.getNote(req.userId!, req.params.id));
}

// POST /api/notes
export async function createNote(req: Request, res: Response) {
  const note = await notesService.createNote(req.userId!, req.body);
  res.status(201).json(note);
}

// PUT /api/notes/:id
export async function updateNote(req: Request<IdParams>, res: Response) {
  res.json(await notesService.updateNote(req.userId!, req.params.id, req.body));
}

// DELETE /api/notes/:id
export async function deleteNote(req: Request<IdParams>, res: Response) {
  await notesService.deleteNote(req.userId!, req.params.id);
  res.status(204).send();
}
