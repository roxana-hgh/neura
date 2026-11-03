import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { NoteCodeBlock } from "@/features/notes/lib/codeBlock";
import { LinkEmbed } from "@/features/notes/lib/linkEmbed";

// StarterKit v3 already ships Link, Underline, ListKeymap and TrailingNode
export const noteExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    // replaced by NoteCodeBlock (syntax highlighting)
    codeBlock: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
    },
  }),
  Image.configure({ inline: false, allowBase64: true }),
  Placeholder.configure({
    // the summary of a toggle block shows its own hint even when the caret is elsewhere (see .note-prose CSS)
    includeChildren: true,
    showOnlyCurrent: false,
    placeholder: ({ node }) => (node.type.name === "detailsSummary" ? "Toggle title" : "Start writing…"),
  }),
  NoteCodeBlock,
  // Collapsible "toggle" blocks; the open / closed state is saved with the note
  Details.configure({ persist: true, HTMLAttributes: { class: "note-details" } }),
  DetailsSummary,
  DetailsContent,
  LinkEmbed,
  TaskList,
  TaskItem.configure({ nested: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
];

export const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#71717a" },
];

// Translucent so highlighted text stays readable in light and dark themes
export const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "rgba(250, 204, 21, 0.4)" },
  { label: "Green", value: "rgba(74, 222, 128, 0.35)" },
  { label: "Blue", value: "rgba(96, 165, 250, 0.35)" },
  { label: "Pink", value: "rgba(244, 114, 182, 0.35)" },
  { label: "Purple", value: "rgba(192, 132, 252, 0.35)" },
  { label: "Orange", value: "rgba(251, 146, 60, 0.4)" },
];
