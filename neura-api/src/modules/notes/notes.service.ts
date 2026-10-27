import { prisma } from "@/lib/prisma";
import { notFound } from "@/utils/http-error";

export interface NoteInput {
  title: string;
  description?: string | null; // HTML from the TipTap editor
  color?: string;
}

const toNoteData = ({ title, description, color }: NoteInput) => ({
  title,
  description: description ?? null,
  color: color ?? "default",
});

export function listNotes(userId: string) {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getNote(userId: string, id: string) {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw notFound("Note not found");
  return note;
}

export function createNote(userId: string, input: NoteInput) {
  return prisma.note.create({
    data: { ...toNoteData(input), userId },
  });
}

export function updateNote(userId: string, id: string, input: NoteInput) {
  return prisma.note
    .update({ where: { id, userId }, data: toNoteData(input) })
    .catch(() => {
      throw notFound("Note not found");
    });
}

export async function deleteNote(userId: string, id: string) {
  await prisma.note.delete({ where: { id, userId } }).catch(() => {
    throw notFound("Note not found");
  });
}
