import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/utils/http-error";

export interface NoteInput {
  title: string;
  description?: string | null; // HTML from the TipTap editor
  color?: string;
}

/** undefined = leave unchanged, null = unlink */
export interface NoteLinks {
  folderId?: string | null;
  goalId?: string | null;
  taskId?: string | null;
  listId?: string | null;
}

export interface FolderInput {
  name?: string;
  color?: string;
  goalId?: string | null;
}

const toNoteData = ({ title, description, color }: NoteInput) => ({
  title,
  description: description ?? null,
  color: color ?? "default",
});

/** Every note response carries its links, so a cached note never loses them after a save. */
const noteInclude = {
  folder: { select: { id: true, name: true, color: true } },
  goal: { select: { id: true, title: true } },
  task: { select: { id: true, title: true, completed: true } },
  list: { select: { id: true, name: true, color: true } },
} satisfies Prisma.NoteInclude;

// ── Links ───────────────────────────────────────────────────────────────

/** Checks that every id being linked belongs to the user. */
async function assertLinks(userId: string, links: NoteLinks) {
  const checks: Promise<void>[] = [];
  const check = (found: Promise<unknown>, message: string) =>
    checks.push(found.then((row) => { if (!row) throw notFound(message); }));

  if (links.folderId) check(prisma.noteFolder.findFirst({ where: { id: links.folderId, userId }, select: { id: true } }), "Folder not found");
  if (links.goalId) check(prisma.goal.findFirst({ where: { id: links.goalId, userId }, select: { id: true } }), "Goal not found");
  if (links.taskId) check(prisma.task.findFirst({ where: { id: links.taskId, userId }, select: { id: true } }), "Task not found");
  if (links.listId) check(prisma.taskList.findFirst({ where: { id: links.listId, userId }, select: { id: true } }), "List not found");
  await Promise.all(checks);
}

const linkData = (links: NoteLinks) => ({
  ...(links.folderId !== undefined && { folderId: links.folderId }),
  ...(links.goalId !== undefined && { goalId: links.goalId }),
  ...(links.taskId !== undefined && { taskId: links.taskId }),
  ...(links.listId !== undefined && { listId: links.listId }),
});

// ── Notes ───────────────────────────────────────────────────────────────

export function listNotes(userId: string, filter: { taskId?: string; listId?: string } = {}) {
  return prisma.note.findMany({
    where: { userId, ...(filter.taskId && { taskId: filter.taskId }), ...(filter.listId && { listId: filter.listId }) },
    include: noteInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getNote(userId: string, id: string) {
  const note = await prisma.note.findFirst({ where: { id, userId }, include: noteInclude });
  if (!note) throw notFound("Note not found");
  return note;
}

export async function createNote(userId: string, input: NoteInput, links: NoteLinks = {}) {
  await assertLinks(userId, links);
  return prisma.note.create({
    data: { ...toNoteData(input), ...linkData(links), userId },
    include: noteInclude,
  });
}

export function updateNote(userId: string, id: string, input: NoteInput) {
  return prisma.note
    .update({ where: { id, userId }, data: toNoteData(input), include: noteInclude })
    .catch(() => {
      throw notFound("Note not found");
    });
}

/** Moves a note to a folder and/or links it to a goal / task. Only the fields that are sent change. */
export async function setLinks(userId: string, id: string, links: NoteLinks) {
  await assertLinks(userId, links);
  const result = await prisma.note.updateMany({ where: { id, userId }, data: linkData(links) });
  if (!result.count) throw notFound("Note not found");
  return getNote(userId, id);
}

export async function deleteNote(userId: string, id: string) {
  await prisma.note.delete({ where: { id, userId } }).catch(() => {
    throw notFound("Note not found");
  });
}

/** Goals, open tasks and task lists a note can be linked to. */
export async function getLinkOptions(userId: string) {
  const [goals, tasks, lists] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, archivedAt: null, status: { in: ["active", "paused"] } },
      select: { id: true, title: true, color: true, parent: { select: { title: true } } },
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { endDate: "asc" }],
      take: 100,
    }),
    prisma.task.findMany({
      where: { userId, completed: false },
      select: { id: true, title: true, dueDate: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.taskList.findMany({
      where: { userId },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    goals: goals.map(({ parent, ...g }) => ({ ...g, parentTitle: parent?.title ?? null })),
    tasks,
    lists,
  };
}

// ── Folders ─────────────────────────────────────────────────────────────

/** Unique (userId, name) violation → readable 409 instead of a 500. */
function duplicateName(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new HttpError(409, "A folder with this name already exists");
  }
  throw err;
}

const folderInclude = {
  goal: { select: { id: true, title: true } },
  _count: { select: { notes: true } },
} satisfies Prisma.NoteFolderInclude;

const serializeFolder = ({ _count, ...f }: Prisma.NoteFolderGetPayload<{ include: typeof folderInclude }>) => ({
  ...f,
  noteCount: _count.notes,
});

export async function listFolders(userId: string) {
  const folders = await prisma.noteFolder.findMany({
    where: { userId },
    include: folderInclude,
    orderBy: { name: "asc" },
  });
  return folders.map(serializeFolder);
}

export async function createFolder(userId: string, input: Required<Pick<FolderInput, "name">> & FolderInput) {
  await assertLinks(userId, { goalId: input.goalId });
  const folder = await prisma.noteFolder
    .create({
      data: { userId, name: input.name, color: input.color ?? "gray", goalId: input.goalId ?? null },
      include: folderInclude,
    })
    .catch(duplicateName);
  return serializeFolder(folder);
}

export async function updateFolder(userId: string, id: string, input: FolderInput) {
  await assertLinks(userId, { goalId: input.goalId });
  const result = await prisma.noteFolder
    .updateMany({
      where: { id, userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.goalId !== undefined && { goalId: input.goalId }),
      },
    })
    .catch(duplicateName);
  if (!result.count) throw notFound("Folder not found");
  return serializeFolder(await prisma.noteFolder.findUniqueOrThrow({ where: { id }, include: folderInclude }));
}

/** Deletes a folder. Its notes are kept (moved out of the folder) unless `deleteNotes` is set. */
export async function deleteFolder(userId: string, id: string, deleteNotes: boolean) {
  const folder = await prisma.noteFolder.findFirst({ where: { id, userId }, select: { id: true } });
  if (!folder) throw notFound("Folder not found");
  await prisma.$transaction([
    ...(deleteNotes ? [prisma.note.deleteMany({ where: { userId, folderId: id } })] : []),
    prisma.noteFolder.delete({ where: { id } }),
  ]);
}
