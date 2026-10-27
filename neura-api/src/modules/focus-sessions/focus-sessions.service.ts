import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";

export const VALID_TAGS = ["work", "personal", "study", "break", "other"] as const;
export type Tag = (typeof VALID_TAGS)[number];
export type RangeFilter = "today" | "week" | "month" | "all";

export const isValidTag = (tag: unknown): tag is Tag => VALID_TAGS.includes(tag as Tag);

function getRangeStart(range: RangeFilter): Date | null {
  const now = new Date();
  if (range === "today") return startOfDay(now);
  if (range === "week") return startOfWeek(now, { weekStartsOn: 1 });
  if (range === "month") return startOfMonth(now);
  return null;
}

const rangeWhere = (userId: string, range: RangeFilter) => {
  const rangeStart = getRangeStart(range);
  return {
    userId,
    ...(rangeStart ? { startTime: { gte: rangeStart } } : {}),
  };
};

/** Total focused seconds, session count and seconds per tag for the range. */
export async function getStats(userId: string, range: RangeFilter) {
  const where = rangeWhere(userId, range);

  const [sessions, grouped] = await Promise.all([
    prisma.focusSession.findMany({ where, select: { duration: true } }),
    prisma.focusSession.groupBy({ by: ["tag"], where, _sum: { duration: true } }),
  ]);

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const byTag: Record<string, number> = {};
  grouped.forEach((g) => {
    byTag[g.tag ?? "untagged"] = g._sum.duration ?? 0;
  });

  return { totalDuration, sessionCount: sessions.length, byTag };
}

export async function listSessions(
  userId: string,
  { range, tag, page, pageSize }: { range: RangeFilter; tag?: Tag; page: number; pageSize: number },
) {
  const where = {
    ...rangeWhere(userId, range),
    ...(tag && isValidTag(tag) ? { tag } : {}),
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

  return { sessions, total, hasMore: page * pageSize < total };
}

export function createSession(
  userId: string,
  data: { name: string; description?: string; tag?: Tag; duration: number; startTime: Date; endTime: Date },
) {
  return prisma.focusSession.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      tag: data.tag || null,
      duration: Math.round(data.duration),
      startTime: data.startTime,
      endTime: data.endTime,
      userId,
    },
  });
}

async function assertSessionOwner(userId: string, id: string) {
  const existing = await prisma.focusSession.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Session not found");
}

export async function updateSession(
  userId: string,
  id: string,
  { name, description, tag }: { name?: string; description?: string | null; tag?: Tag | "" | null },
) {
  await assertSessionOwner(userId, id);
  return prisma.focusSession.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(tag !== undefined ? { tag: tag || null } : {}),
    },
  });
}

export async function deleteSession(userId: string, id: string) {
  await assertSessionOwner(userId, id);
  await prisma.focusSession.delete({ where: { id } });
}
