import { prisma } from "@/lib/prisma";
import * as brainstorms from "@/modules/brainstorms/brainstorms.service";
import { createReminder } from "@/modules/assistant/tools/reminder.tools";
import { clip, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { HttpError, notFound } from "@/utils/http-error";

/** Assistant tools for the brainstorm inbox. */

const MAX_LISTED = 30;
const MAX_CONTENT = 5000;

export const BRAINSTORM_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_brainstorms",
        description: "Ideas in the brainstorm inbox, or already sorted ones (processed).",
        parameters: {
          type: "object",
          properties: { status: { type: "string", enum: brainstorms.BRAINSTORM_STATUSES, description: "Default inbox." } },
        },
      },
      {
        name: "add_brainstorm",
        description: "Capture a thought in the inbox, for when the user isn't ready to make it a task.",
        parameters: {
          type: "object",
          properties: { content: { type: "string" } },
          required: ["content"],
        },
      },
      {
        name: "update_brainstorm",
        description: "Rewrite an item, e.g. to sharpen a vague idea or merge two.",
        parameters: {
          type: "object",
          properties: { brainstormId: { type: "string" }, content: { type: "string" } },
          required: ["brainstormId", "content"],
        },
      },
      {
        name: "sort_brainstorm",
        description:
          "Decide what happens to an item. to_task (title, priority, dueDate) or to_reminder (title, date, time) creates it and clears the item. keep leaves it for later, dismiss lets it go, restore brings it back to the inbox.",
        parameters: {
          type: "object",
          properties: {
            brainstormId: { type: "string" },
            action: { type: "string", enum: ["to_task", "to_reminder", "keep", "dismiss", "restore"] },
            title: { type: "string", description: "Defaults to the item's first line." },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", description: "yyyy-MM-dd." },
            date: { type: "string", description: "Reminder date, yyyy-MM-dd." },
            time: { type: "string", description: "Reminder time, HH:mm." },
          },
          required: ["brainstormId", "action"],
        },
      },
      {
        name: "delete_brainstorm",
        description: "Permanently delete an item. Prefer sort_brainstorm with dismiss, which can be undone.",
        parameters: {
          type: "object",
          properties: { brainstormId: { type: "string" } },
          required: ["brainstormId"],
        },
      },
    ],
  },
];

export async function executeBrainstormTool(name: string, args: any, ctx: ToolContext) {
  switch (name) {
    case "list_brainstorms":
      return listBrainstorms(args, ctx);
    case "add_brainstorm":
      return addBrainstorm(args, ctx);
    case "update_brainstorm":
      return updateBrainstorm(args, ctx);
    case "sort_brainstorm":
      return sortBrainstorm(args, ctx);
    case "delete_brainstorm":
      return deleteBrainstorm(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const label = (content: string) => clip(content.split("\n")[0], 80);

async function findOwned(userId: string, id: string) {
  const item = await prisma.brainstorm.findFirst({ where: { id, userId } });
  if (!item) throw notFound("Brainstorm not found");
  return item;
}

async function listBrainstorms({ status = "inbox" }: any, { userId }: ToolContext) {
  if (!brainstorms.BRAINSTORM_STATUSES.includes(status)) throw new HttpError(400, "Invalid status");
  const items = await brainstorms.listBrainstorms(userId, status);
  return {
    items: items.slice(0, MAX_LISTED).map((b) => ({
      id: b.id,
      content: clip(b.content, 300),
      capturedOn: b.createdAt.toISOString().slice(0, 10),
      reviewed: !!b.reviewedAt,
      convertedTo: b.convertedTo ?? undefined,
    })),
    total: items.length,
  };
}

async function addBrainstorm({ content }: any, { userId }: ToolContext) {
  const item = await brainstorms.createBrainstorm(userId, requiredText(content, "Content", MAX_CONTENT));
  return { created: { id: item.id, title: label(item.content) } };
}

async function updateBrainstorm({ brainstormId, content }: any, { userId }: ToolContext) {
  const item = await brainstorms.updateBrainstorm(userId, brainstormId, requiredText(content, "Content", MAX_CONTENT));
  return { updated: { id: item.id, title: label(item.content) } };
}

async function sortBrainstorm(args: any, ctx: ToolContext) {
  const { userId } = ctx;
  const { brainstormId: id, action } = args;
  const item = await findOwned(userId, id);
  const [firstLine, ...rest] = item.content.split("\n");
  const title = clip(args.title?.trim() || firstLine, 200);
  const description = rest.join("\n").trim() || null;
  const result = (meta: string) => ({ updated: { id, title: label(item.content), meta } });

  switch (action) {
    case "to_task": {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: ["low", "medium", "high"].includes(args.priority) ? args.priority : "medium",
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          userId,
        },
      });
      await brainstorms.processBrainstorm(userId, id, { taskId: task.id });
      return result("now a task");
    }
    case "to_reminder": {
      const { created } = await createReminder({ title, description, date: args.date, time: args.time }, ctx);
      await brainstorms.processBrainstorm(userId, id, { reminderId: created.id });
      return result(`reminder · ${created.meta}`);
    }
    case "keep":
      await brainstorms.keepBrainstorm(userId, id);
      return result("kept");
    case "dismiss":
      await brainstorms.processBrainstorm(userId, id, {});
      return result("let go");
    case "restore":
      await brainstorms.restoreBrainstorm(userId, id);
      return result("back in inbox");
    default:
      throw new HttpError(400, "Invalid action");
  }
}

async function deleteBrainstorm({ brainstormId }: any, { userId }: ToolContext) {
  const item = await findOwned(userId, brainstormId);
  await brainstorms.deleteBrainstorm(userId, brainstormId);
  return { deleted: { id: item.id, title: label(item.content) } };
}
