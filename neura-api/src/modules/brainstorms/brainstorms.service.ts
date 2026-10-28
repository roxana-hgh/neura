import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";

export const BRAINSTORM_STATUSES = ["inbox", "processed"] as const;
export type BrainstormStatus = (typeof BRAINSTORM_STATUSES)[number];

/** What an item turned into; neither = dismissed */
export interface ProcessInput {
  taskId?: string | null;
  reminderId?: string | null;
}

const include = {
  task: { select: { id: true, title: true, completed: true } },
  reminder: { select: { id: true, title: true, nextAt: true, status: true } },
} as const;

// keeps the processed history bounded; the inbox is always returned whole
const PROCESSED_LIMIT = 200;

export function listBrainstorms(userId: string, status: BrainstormStatus) {
  return prisma.brainstorm.findMany({
    where: { userId, status },
    include,
    orderBy: status === "inbox" ? { createdAt: "desc" } : { processedAt: "desc" },
    take: status === "processed" ? PROCESSED_LIMIT : undefined,
  });
}

export function createBrainstorm(userId: string, content: string) {
  return prisma.brainstorm.create({ data: { userId, content }, include });
}

async function assertOwner(userId: string, id: string) {
  const item = await prisma.brainstorm.findFirst({ where: { id, userId }, select: { id: true } });
  if (!item) throw notFound("Brainstorm not found");
}

export async function updateBrainstorm(userId: string, id: string, content: string) {
  await assertOwner(userId, id);
  return prisma.brainstorm.update({ where: { id }, data: { content }, include });
}

/** "Keep for later" during a review: stays in the inbox but no longer counts as new */
export async function keepBrainstorm(userId: string, id: string) {
  await assertOwner(userId, id);
  return prisma.brainstorm.update({ where: { id }, data: { reviewedAt: new Date() }, include });
}

/** Moves an item out of the inbox, recording the task / reminder it became (if any). */
export async function processBrainstorm(userId: string, id: string, { taskId, reminderId }: ProcessInput) {
  await assertOwner(userId, id);
  if (taskId && reminderId) throw new HttpError(400, "Link a task or a reminder, not both");
  // never trust a client id without checking it belongs to the user
  if (taskId && !(await prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } }))) {
    throw notFound("Task not found");
  }
  if (reminderId && !(await prisma.reminder.findFirst({ where: { id: reminderId, userId }, select: { id: true } }))) {
    throw notFound("Reminder not found");
  }
  const now = new Date();
  return prisma.brainstorm.update({
    where: { id },
    data: {
      status: "processed",
      processedAt: now,
      reviewedAt: now,
      convertedTo: taskId ? "task" : reminderId ? "reminder" : null,
      taskId: taskId ?? null,
      reminderId: reminderId ?? null,
    },
    include,
  });
}

/** Back to the inbox. The task / reminder it became is left alone. */
export async function restoreBrainstorm(userId: string, id: string) {
  await assertOwner(userId, id);
  return prisma.brainstorm.update({
    where: { id },
    data: { status: "inbox", processedAt: null, convertedTo: null, taskId: null, reminderId: null },
    include,
  });
}

export async function deleteBrainstorm(userId: string, id: string) {
  const { count } = await prisma.brainstorm.deleteMany({ where: { id, userId } });
  if (!count) throw notFound("Brainstorm not found");
}

/** Clears the processed history; tasks and reminders made from it stay. */
export async function clearProcessed(userId: string) {
  const { count } = await prisma.brainstorm.deleteMany({ where: { userId, status: "processed" } });
  return { deleted: count };
}
