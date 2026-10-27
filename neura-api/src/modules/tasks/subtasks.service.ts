import { prisma } from "@/lib/prisma";
import { assertTaskOwner } from "@/modules/tasks/tasks.service";

// Every operation verifies the parent task belongs to the user before touching the subtask.

export async function createSubtask(userId: string, taskId: string, title: string) {
  await assertTaskOwner(userId, taskId);
  return prisma.subTask.create({
    data: { title, completed: false, taskId },
  });
}

export async function renameSubtask(userId: string, taskId: string, subtaskId: string, title: string) {
  await assertTaskOwner(userId, taskId);
  return prisma.subTask.update({
    where: { id: subtaskId, taskId },
    data: { title },
  });
}

export async function setSubtaskCompleted(userId: string, taskId: string, subtaskId: string, completed: boolean) {
  await assertTaskOwner(userId, taskId);
  return prisma.subTask.update({
    where: { id: subtaskId, taskId },
    data: { completed },
  });
}

export async function deleteSubtask(userId: string, taskId: string, subtaskId: string) {
  await assertTaskOwner(userId, taskId);
  await prisma.subTask.delete({ where: { id: subtaskId, taskId } });
}
