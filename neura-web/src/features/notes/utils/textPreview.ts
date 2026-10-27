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