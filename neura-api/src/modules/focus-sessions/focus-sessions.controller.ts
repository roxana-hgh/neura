import type { Request, Response } from "express";
import * as focusService from "@/modules/focus-sessions/focus-sessions.service";
import { isValidTag, type RangeFilter, type Tag } from "@/modules/focus-sessions/focus-sessions.service";

type IdParams = { id: string };

// GET /api/focus-sessions/stats?range=today|week|month|all (default week)
export async function getStats(req: Request, res: Response) {
  const range = (req.query.range as RangeFilter) || "week";
  res.json(await focusService.getStats(req.userId!, range));
}

// GET /api/focus-sessions?range=&tag=&page=&pageSize= (default range today, pageSize 12, max 50)
export async function listSessions(req: Request, res: Response) {
  res.json(
    await focusService.listSessions(req.userId!, {
      range: (req.query.range as RangeFilter) || "today",
      tag: req.query.tag as Tag | undefined,
      page: Math.max(1, Number(req.query.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(req.query.pageSize) || 12)),
    }),
  );
}

// POST /api/focus-sessions  { name, description?, tag?, duration (seconds), startTime, endTime }
export async function createSession(req: Request, res: Response) {
  const { name, description, tag } = req.body;
  const duration = Number(req.body.duration);
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return res.status(400).json({ error: "duration must be a positive number of seconds" });
  }
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return res.status(400).json({ error: "startTime and endTime must be valid dates" });
  }
  if (tag && !isValidTag(tag)) {
    return res.status(400).json({ error: "invalid tag" });
  }

  const session = await focusService.createSession(req.userId!, { name, description, tag, duration, startTime, endTime });
  res.status(201).json(session);
}

// PATCH /api/focus-sessions/:id  { name?, description?, tag? }
export async function updateSession(req: Request<IdParams>, res: Response) {
  const { name, description, tag } = req.body;
  if (tag && !isValidTag(tag)) {
    return res.status(400).json({ error: "invalid tag" });
  }
  res.json(await focusService.updateSession(req.userId!, req.params.id, { name, description, tag }));
}

// DELETE /api/focus-sessions/:id
export async function deleteSession(req: Request<IdParams>, res: Response) {
  await focusService.deleteSession(req.userId!, req.params.id);
  res.status(204).send();
}
