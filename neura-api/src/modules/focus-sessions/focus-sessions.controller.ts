import type { Request, Response } from "express";
import { z } from "zod";
import * as focusService from "@/modules/focus-sessions/focus-sessions.service";
import { VALID_TAGS } from "@/modules/focus-sessions/focus-sessions.service";
import { dateTime, optionalText, parse, queryInt, requiredText } from "@/utils/validate";

type IdParams = { id: string };

const RANGES = ["today", "week", "month", "all"] as const;
const range = z.enum(RANGES, { error: `must be one of ${RANGES.join(", ")}` });
const tag = z.enum(VALID_TAGS, { error: "is not a valid tag" });

const listQuery = z.object({
  range: range.default("today"),
  tag: tag.optional(),
  page: queryInt.transform((n) => Math.max(1, n ?? 1)),
  pageSize: queryInt.transform((n) => Math.min(50, Math.max(1, n ?? 12))),
});

const createBody = z.object({
  name: requiredText(200),
  description: optionalText(2000).transform((v) => v ?? undefined),
  tag: tag.or(z.literal("")).nullish().transform((v) => v || undefined),
  // a day at most, in seconds
  duration: z.coerce.number({ error: "must be a positive number of seconds" })
    .positive("must be a positive number of seconds").max(86_400),
  startTime: dateTime,
  endTime: dateTime,
});

const updateBody = z.object({
  name: requiredText(200).optional(),
  description: optionalText(2000).optional(),
  tag: tag.or(z.literal("")).nullish(),
});

// GET /api/focus-sessions/stats?range=today|week|month|all (default week)
export async function getStats(req: Request, res: Response) {
  const query = parse(z.object({ range: range.default("week") }), req.query);
  res.json(await focusService.getStats(req.userId!, query.range));
}

// GET /api/focus-sessions?range=&tag=&page=&pageSize= (default range today, pageSize 12, max 50)
export async function listSessions(req: Request, res: Response) {
  res.json(await focusService.listSessions(req.userId!, parse(listQuery, req.query)));
}

// POST /api/focus-sessions  { name, description?, tag?, duration (seconds), startTime, endTime }
export async function createSession(req: Request, res: Response) {
  const session = await focusService.createSession(req.userId!, parse(createBody, req.body));
  res.status(201).json(session);
}

// PATCH /api/focus-sessions/:id  { name?, description?, tag? }
export async function updateSession(req: Request<IdParams>, res: Response) {
  res.json(await focusService.updateSession(req.userId!, req.params.id, parse(updateBody, req.body)));
}

// DELETE /api/focus-sessions/:id
export async function deleteSession(req: Request<IdParams>, res: Response) {
  await focusService.deleteSession(req.userId!, req.params.id);
  res.status(204).send();
}
