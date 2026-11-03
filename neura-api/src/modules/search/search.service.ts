import { prisma } from "@/lib/prisma";
import { htmlToText } from "@/modules/assistant/tools/note.tools";

/** One query across every resource. Used by the global search palette and the assistant's search_everything. */

export const SEARCH_TYPES = ["tasks", "goals", "notes", "reminders", "habits", "brainstorms", "lists"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

const SNIPPET_RADIUS = 60;

/** The text around the first match, so the UI can show why an item matched. */
export function snippet(text: string | null | undefined, query: string, radius = SNIPPET_RADIUS) {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const at = flat.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return flat.slice(0, radius * 2);
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.length + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

export async function searchEverything(
  userId: string,
  query: string,
  { perType = 5, types = SEARCH_TYPES as readonly SearchType[] } = {},
) {
  const contains = { contains: query, mode: "insensitive" as const };
  const titleOrDescription = { OR: [{ title: contains }, { description: contains }] };
  const shared = { take: perType, orderBy: { updatedAt: "desc" as const } };
  const want = (type: SearchType) => types.includes(type);
  const none = Promise.resolve([] as never[]);

  const [tasks, goals, notes, reminders, habits, brainstorms, lists] = await Promise.all([
    want("tasks")
      ? prisma.task.findMany({
          ...shared,
          where: { userId, ...titleOrDescription },
          select: {
            id: true, title: true, description: true, completed: true, priority: true, dueDate: true,
            list: { select: { id: true, name: true, color: true } },
            goal: { select: { id: true, title: true } },
          },
        })
      : none,
    want("goals")
      ? prisma.goal.findMany({
          ...shared,
          where: { userId, ...titleOrDescription },
          select: {
            id: true, title: true, description: true, status: true, color: true, archivedAt: true,
            parent: { select: { id: true, title: true } },
          },
        })
      : none,
    // Notes embed images as data URLs, so a description hit can be inside base64; re-checked on the text below.
    want("notes")
      ? prisma.note.findMany({
          take: perType * 2,
          orderBy: { updatedAt: "desc" },
          where: { userId, ...titleOrDescription },
          select: { id: true, title: true, description: true, color: true, updatedAt: true },
        })
      : none,
    want("reminders")
      ? prisma.reminder.findMany({
          ...shared,
          where: { userId, ...titleOrDescription },
          select: { id: true, title: true, description: true, nextAt: true, timeZone: true, status: true, repeat: true },
        })
      : none,
    want("habits")
      ? prisma.habit.findMany({
          ...shared,
          where: { userId, title: contains },
          select: { id: true, title: true, color: true, isArchived: true },
        })
      : none,
    want("brainstorms")
      ? prisma.brainstorm.findMany({
          ...shared,
          where: { userId, content: contains },
          select: { id: true, content: true, status: true, createdAt: true },
        })
      : none,
    want("lists")
      ? prisma.taskList.findMany({
          ...shared,
          where: { userId, OR: [{ name: contains }, { description: contains }] },
          select: { id: true, name: true, color: true, _count: { select: { tasks: true } } },
        })
      : none,
  ]);

  const needle = query.toLowerCase();
  const matchedNotes = notes
    .map(({ description, ...note }) => ({ ...note, text: htmlToText(description) }))
    .filter((n) => n.title.toLowerCase().includes(needle) || n.text.toLowerCase().includes(needle))
    .slice(0, perType)
    .map(({ text, ...note }) => ({ ...note, snippet: snippet(text, query) }));

  return {
    tasks: tasks.map(({ description, ...t }) => ({ ...t, snippet: snippet(description, query) })),
    goals: goals.map(({ description, ...g }) => ({ ...g, snippet: snippet(description, query) })),
    notes: matchedNotes,
    reminders: reminders.map(({ description, ...r }) => ({ ...r, snippet: snippet(description, query) })),
    habits,
    brainstorms: brainstorms.map(({ content, ...b }) => ({ ...b, content: snippet(content, query, 90) })),
    lists: lists.map(({ _count, ...l }) => ({ ...l, taskCount: _count.tasks })),
  };
}
