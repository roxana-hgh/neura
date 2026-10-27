import { format, isThisYear, isToday, isYesterday } from "date-fns";

/**
 * Strips HTML tags from a TipTap-generated string and collapses whitespace,
 * so card previews never inherit heading sizes, lists, or other block styling.
 */
export function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    // SSR fallback — plain regex strip
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export interface NotePreview {
  text: string;
  image: string | null;
}

/**
 * Plain-text preview that keeps one line per block and marks checklist items,
 * plus the first image so cards can show a thumbnail.
 */
export function getNotePreview(html: string | null, title = ""): NotePreview {
  if (!html) return { text: "", image: null };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const image = doc.querySelector("img")?.getAttribute("src") ?? null;

  doc.querySelectorAll("li[data-checked]").forEach((li) => {
    li.prepend(li.getAttribute("data-checked") === "true" ? "☑ " : "☐ ");
  });
  doc.querySelectorAll("p, h1, h2, h3, li, blockquote, pre").forEach((el) => {
    el.append("\n");
  });

  let text = (doc.body.textContent || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  // Untitled notes take their title from the first line, so don't show it twice
  const t = title.trim();
  if (t && text.startsWith(t)) text = text.slice(t.length).trim();

  return { text, image };
}

/** "14:32" today, "Yesterday", "Oct 3" this year, "Oct 3, 2025" before */
export function formatNoteDate(value: string): string {
  const date = new Date(value);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMM d");
  return format(date, "MMM d, yyyy");
}
