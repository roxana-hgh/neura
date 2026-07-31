import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import type { AuthedRequest } from "../middleware/requireAuth";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

const router = Router();

const VALID_TAGS = ["work", "personal", "study", "break", "other"] as const;
type Tag = (typeof VALID_TAGS)[number];
type RangeFilter = "today" | "week" | "month" | "all";


function getRangeStart(range: RangeFilter): Date | null {
  const now = new Date();
  if (range === "today") return startOfDay(now);
  if (range === "week") return startOfWeek(now, { weekStartsOn: 1 });
  if (range === "month") return startOfMonth(now);
  return null;
}

router.use(requireAuth);

// IMPORTANT: /stats must be registered before /:id
router.get("/stats", async (req: AuthedRequest, res: Response) => {
  const range = (req.query.range as RangeFilter) || "week";
  const rangeStart = getRangeStart(range);

  const where = {
    userId: req.userId!,
    ...(rangeStart ? { startTime: { gte: rangeStart } } : {}),
  };

  const [sessions, grouped] = await Promise.all([
    prisma.focusSession.findMany({ where, select: { duration: true } }),
    prisma.focusSession.groupBy({ by: ["tag"], where, _sum: { duration: true } }),
  ]);

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const byTag: Record<string, number> = {};
  grouped.forEach((g) => {
    byTag[g.tag ?? "untagged"] = g._sum.duration ?? 0;
  });

  res.json({ totalDuration, sessionCount: sessions.length, byTag });
});


router.get("/", async (req: AuthedRequest, res: Response) => {
  const range = (req.query.range as RangeFilter) || "today";
  const tag = req.query.tag as Tag | undefined;
  const rangeStart = getRangeStart(range);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 12));

  const where = {
    userId: req.userId!,
    ...(rangeStart ? { startTime: { gte: rangeStart } } : {}),
    ...(tag && VALID_TAGS.includes(tag) ? { tag } : {}),
  };

  const [sessions, total] = await Promise.all([
    prisma.focusSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.focusSession.count({ where }),
  ]);

  res.json({ sessions, total, hasMore: page * pageSize < total });
});

router.post("/", async (req: AuthedRequest, res: Response) => {
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
  if (tag && !VALID_TAGS.includes(tag)) {
    return res.status(400).json({ error: "invalid tag" });
  }

  const session = await prisma.focusSession.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      tag: tag || null,
      duration: Math.round(duration),
      startTime,
      endTime,
      userId: req.userId!,
    },
  });

  res.status(201).json(session);
});

router.patch("/:id", async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, tag } = req.body;

  if (tag && !VALID_TAGS.includes(tag)) {
    return res.status(400).json({ error: "invalid tag" });
  }

  const existing = await prisma.focusSession.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: "Session not found" });

  const updated = await prisma.focusSession.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(tag !== undefined ? { tag: tag || null } : {}),
    },
  });

  res.json(updated);
});

router.delete("/:id", async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.focusSession.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: "Session not found" });

  await prisma.focusSession.delete({ where: { id } });
  res.status(204).send();
});

export default router;