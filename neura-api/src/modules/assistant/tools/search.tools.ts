import { clip, localDateTime, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { searchEverything } from "@/modules/search/search.service";

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

  const query = requiredText(args.query, "query", 100);
  const found = await searchEverything(userId, query, {
    perType: PER_TYPE,
    types: ["tasks", "habits", "goals", "notes", "reminders", "brainstorms"],
  });

  return {
    tasks: found.tasks.map((t) => ({ id: t.id, title: t.title, completed: t.completed, dueDate: t.dueDate })),
    habits: found.habits.map((h) => ({ id: h.id, title: h.title, isArchived: h.isArchived })),
    goals: found.goals.map((g) => ({ id: g.id, title: g.title, status: g.status, parentId: g.parent?.id ?? null })),
    notes: found.notes.map((n) => ({ id: n.id, title: n.title, preview: clip(n.snippet, 100) })),
    reminders: found.reminders.map((r) => ({
      id: r.id, title: r.title, status: r.status, at: localDateTime(r.nextAt, r.timeZone),
    })),
    brainstorms: found.brainstorms.map((b) => ({ id: b.id, status: b.status, content: clip(b.content, 120) })),
  };
}
