import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";

export interface ListInput {
  name: string;
  color: string;
  description?: string | null;
}

export function listLists(userId: string) {
  return prisma.taskList.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getList(userId: string, id: string) {
  // userId check prevents accessing other users' lists
  const list = await prisma.taskList.findFirst({ where: { id, userId } });
  if (!list) throw notFound("List not found");
  return list;
}

export function createList(userId: string, { name, color, description }: ListInput) {
  return prisma.taskList.create({
    data: { name, color, description: description ?? null, userId },
  });
}

export function updateList(userId: string, id: string, { name, color, description }: ListInput) {
  return prisma.taskList.update({
    where: { id, userId },
    data: { name, color, description: description ?? null },
  });
}

export async function deleteList(userId: string, id: string) {
  await prisma.taskList.delete({ where: { id, userId } });
}
