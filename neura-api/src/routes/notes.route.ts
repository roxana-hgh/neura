import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/get-session";

const router = Router();

// GET /api/notes — all notes for the logged-in user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  res.json(notes);
});

// POST /api/notes — create a note
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { title, description, color } = req.body;

  const note = await prisma.note.create({
    data: {
      title,
      description: description ?? null,
      color: color ?? "default",
      userId,
    },
  });

  res.status(201).json(note);
});

// GET /api/notes/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const note = await prisma.note.findFirst({
    where: { id, userId },
  });

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

// PUT /api/notes/:id
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { title, description, color } = req.body;

  try {
    const note = await prisma.note.update({
      where: { id, userId },
      data: { title, description: description ?? null, color: color ?? "default" },
    });
    res.json(note);
  } catch {
    res.status(404).json({ error: "Note not found" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  try {
    await prisma.note.delete({ where: { id, userId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Note not found" });
  }
});

export default router;
