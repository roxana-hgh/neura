import { prisma } from "@/lib/prisma";
import { clip, localDateTime, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { htmlToText } from "@/modules/assistant/tools/note.tools";

/** One search across everything in the app, so the model can find an item in a single call. */

const PER_TYPE = 5;

export const SEARCH_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "search_everything",
        description:
          "Find anything by word across tasks, habits, goals, notes, reminders and brainstorms. Returns ids. Use it when you don't know where something lives.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    ],
  },
];

export async function executeSearchTool(name: string, args: any, { userId }: ToolContext) {
  if (name !== "search_everything") return { error: `Unknown tool: ${name}` };

  const contains = { contains: requiredText(args.query, "query", 100), mode: "insensitive" as const };
  const titleOrDescription = { OR: [{ title: contains }, { description: contains }] };
  const shared = { take: PER_TYPE, orderBy: { updatedAt: "desc" as const } };

  const [tasks, habits, goals, notes, reminders, brainstorms] = await Promise.all([
    prisma.task.findMany({
      ...shared,
      where: { userId, ...titleOrDescription },
      select: { id: true, title: true, completed: true, dueDate: true },
    }),
    prisma.habit.findMany({
      ...shared,
      where: { userId, title: contains },
      select: { id: true, title: true, isArchived: true },
    }),
    prisma.goal.findMany({
      ...shared,
      where: { userId, ...titleOrDescription },
      select: { id: true, title: true, status: true, parentId: true },
    }),
    prisma.note.findMany({ ...shared, where: { userId, ...titleOrDescription } }),
    prisma.reminder.findMany({
      ...shared,
      where: { userId, ...titleOrDescription },
      select: { id: true, title: true, nextAt: true, timeZone: true, status: true },
    }),
    prisma.brainstorm.findMany({
      ...shared,
      where: { userId, content: contains },
      select: { id: true, content: true, status: true },
    }),
  ]);

  return {
    tasks,
    habits,
    goals,
    notes: notes.map((n) => ({ id: n.id, title: n.title, preview: clip(htmlToText(n.description), 100) })),
    reminders: reminders.map(({ nextAt, timeZone, ...r }) => ({ ...r, at: localDateTime(nextAt, timeZone) })),
    brainstorms: brainstorms.map((b) => ({ ...b, content: clip(b.content, 120) })),
  };
}
