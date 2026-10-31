import { prisma } from "@/lib/prisma";
import { clip, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { HttpError, notFound } from "@/utils/http-error";

/**
 * Assistant tools for notes. Notes are TipTap HTML that can hold inline images as data URLs,
 * so the model only ever sees plain text and writes plain text / simple markdown.
 */

const MAX_LISTED = 25;
const MAX_READ_CHARS = 4000;
const MAX_WRITE_CHARS = 8000;

export const NOTE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_notes",
        description: "The user's notes, newest first, with a short preview.",
        parameters: {
          type: "object",
          properties: { query: { type: "string", description: "Only notes containing this." } },
        },
      },
      {
        name: "get_note",
        description: "Read a note's text.",
        parameters: {
          type: "object",
          properties: { noteId: { type: "string" } },
          required: ["noteId"],
        },
      },
      {
        name: "create_note",
        description: "Create a note. Content is plain text; lines may use #, ## and - for headings and bullets.",
        parameters: {
          type: "object",
          properties: { title: { type: "string" }, content: { type: "string" } },
          required: ["title", "content"],
        },
      },
      {
        name: "update_note",
        description:
          "Change a note. appendContent adds to the end and is the safe default. replaceContent rewrites the whole body, only when the user asks, and is refused for notes with images.",
        parameters: {
          type: "object",
          properties: {
            noteId: { type: "string" },
            title: { type: "string" },
            appendContent: { type: "string" },
            replaceContent: { type: "string" },
          },
          required: ["noteId"],
        },
      },
      {
        name: "delete_note",
        description: "Permanently delete a note. Only after the user confirmed it in this chat.",
        parameters: {
          type: "object",
          properties: { noteId: { type: "string" } },
          required: ["noteId"],
        },
      },
    ],
  },
];

export async function executeNoteTool(name: string, args: any, ctx: ToolContext) {
  switch (name) {
    case "list_notes":
      return listNotes(args, ctx);
    case "get_note":
      return getNote(args, ctx);
    case "create_note":
      return createNote(args, ctx);
    case "update_note":
      return updateNote(args, ctx);
    case "delete_note":
      return deleteNote(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const decodeEntities = (text: string) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

export function htmlToText(html: string | null) {
  if (!html) return "";
  const text = html
    .replace(/<\/p>\s*<\/li>/gi, "</li>") // the editor wraps list items in <p>
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|ul|ol)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text).replace(/\n{3,}/g, "\n\n").trim();
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text / simple markdown → the HTML the note editor stores. */
export function textToHtml(text: string) {
  const html: string[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (bullets.length) html.push(`<ul>${bullets.map((b) => `<li><p>${b}</p></li>`).join("")}</ul>`);
    bullets = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push(escapeHtml(bullet[1]));
      continue;
    }
    flushBullets();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) html.push(`<h${heading[1].length}>${escapeHtml(heading[2])}</h${heading[1].length}>`);
    else if (line) html.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushBullets();
  return html.join("");
}

async function findOwned(userId: string, id: string) {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw notFound("Note not found");
  return note;
}

async function listNotes({ query }: any, { userId }: ToolContext) {
  const q = typeof query === "string" ? query.trim() : "";
  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_LISTED,
  });
  return {
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      preview: clip(htmlToText(n.description), 120),
      updatedOn: n.updatedAt.toISOString().slice(0, 10),
    })),
  };
}

async function getNote({ noteId }: any, { userId }: ToolContext) {
  const note = await findOwned(userId, noteId);
  return {
    note: {
      id: note.id,
      title: note.title,
      text: clip(htmlToText(note.description), MAX_READ_CHARS),
      hasImages: !!note.description?.includes("<img"),
      goalId: note.goalId,
      updatedOn: note.updatedAt.toISOString().slice(0, 10),
    },
  };
}

async function createNote({ title, content }: any, { userId }: ToolContext) {
  const note = await prisma.note.create({
    data: {
      userId,
      title: requiredText(title, "Title", 200),
      description: textToHtml(requiredText(content, "Content", MAX_WRITE_CHARS)),
    },
  });
  return { created: { id: note.id, title: note.title } };
}

async function updateNote({ noteId, title, appendContent, replaceContent }: any, { userId }: ToolContext) {
  const note = await findOwned(userId, noteId);

  const data: { title?: string; description?: string } = {};
  if (title !== undefined) data.title = requiredText(title, "Title", 200);
  if (replaceContent !== undefined) {
    // the model only saw the text, so a rewrite would silently drop the images
    if (note.description?.includes("<img")) {
      throw new HttpError(400, "This note has images, so it can't be rewritten. Use appendContent.");
    }
    data.description = textToHtml(requiredText(replaceContent, "replaceContent", MAX_WRITE_CHARS));
  } else if (appendContent !== undefined) {
    data.description = (note.description ?? "") + textToHtml(requiredText(appendContent, "appendContent", MAX_WRITE_CHARS));
  }

  const updated = await prisma.note.update({ where: { id: note.id }, data });
  return { updated: { id: updated.id, title: updated.title } };
}

async function deleteNote({ noteId }: any, { userId }: ToolContext) {
  const note = await findOwned(userId, noteId);
  await prisma.note.delete({ where: { id: note.id } });
  return { deleted: { id: note.id, title: note.title } };
}
