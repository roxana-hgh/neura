import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";

export const TAG_COLORS = ["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"] as const;
export const TAG_NAME_MAX = 30;

export interface TagInput {
  name: string;
  color: string;
}

/** Unique (userId, name) violation → readable 409 instead of a 500. */
function duplicateName(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new HttpError(409, "A tag with this name already exists");
  }
  throw err;
}

/** Tags with how many tasks (shown on the Tasks page) use each one. */
export async function listTags(userId: string) {
  const tags = await prisma.taskTag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: { where: { showInTasks: true } } } } },
  });
  return tags.map(({ _count, ...tag }) => ({ ...tag, taskCount: _count.tasks }));
}

export function createTag(userId: string, { name, color }: TagInput) {
  return prisma.taskTag.create({ data: { name, color, userId } }).catch(duplicateName);
}

export async function updateTag(userId: string, id: string, { name, color }: TagInput) {
  const tag = await prisma.taskTag.findFirst({ where: { id, userId } });
  if (!tag) throw notFound("Tag not found");
  return prisma.taskTag.update({ where: { id }, data: { name, color } }).catch(duplicateName);
}

export async function deleteTag(userId: string, id: string) {
  const { count } = await prisma.taskTag.deleteMany({ where: { id, userId } });
  if (!count) throw notFound("Tag not found");
}

/** Keeps only ids of tags the user owns (never trust ids from the client or the LLM). */
export async function ownedTagIds(userId: string, ids: string[]) {
  if (!ids.length) return [];
  const tags = await prisma.taskTag.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  return tags.map((t) => t.id);
}
