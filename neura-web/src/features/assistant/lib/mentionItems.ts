import type { ElementType } from "react";
import { AlarmClock, CheckSquare, Flame, Lightbulb, StickyNote, Target } from "lucide-react";

export type MentionType = "task" | "habit" | "goal" | "note" | "reminder" | "brainstorm";

export interface MentionItem {
  id: string;
  title: string;
  type: MentionType;
  meta?: string;
}

export const MENTION_STYLES: Record<MentionType, { icon: ElementType; className: string }> = {
  task: { icon: CheckSquare, className: "text-primary" },
  habit: { icon: Flame, className: "text-orange-500" },
  goal: { icon: Target, className: "text-emerald-500" },
  note: { icon: StickyNote, className: "text-amber-500" },
  reminder: { icon: AlarmClock, className: "text-sky-500" },
  brainstorm: { icon: Lightbulb, className: "text-violet-500" },
};

const PER_TYPE_WITHOUT_QUERY = 2;

export function filterMentionItems(items: MentionItem[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (q) return items.filter((i) => i.title.toLowerCase().includes(q)).slice(0, limit);

  // Nothing typed yet: a few of each kind, so tasks don't hide everything else
  const seen = new Map<MentionType, number>();
  const sample = items.filter((i) => {
    const count = seen.get(i.type) ?? 0;
    seen.set(i.type, count + 1);
    return count < PER_TYPE_WITHOUT_QUERY;
  });
  return sample.slice(0, limit + PER_TYPE_WITHOUT_QUERY * 2);
}
