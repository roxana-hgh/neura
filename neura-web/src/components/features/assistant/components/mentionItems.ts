export interface MentionItem {
  id: string;
  title: string;
  type: "task" | "habit";
  meta?: string;
}

export function filterMentionItems(items: MentionItem[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  const matches = q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  return matches.slice(0, limit);
}