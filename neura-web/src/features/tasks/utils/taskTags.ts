import type { colors } from "@/types/color";
import type { Task, TaskTag } from "@/features/tasks/types/task";
import type { TagMatchMode } from "@/features/tasks/stores/tasksStore";

export const TAG_NAME_MAX = 30;

/** Tinted pill + solid dot per color. Class names are written out so Tailwind keeps them. */
export const TAG_STYLES: Record<colors, { chip: string; dot: string; label: string }> = {
  blue:   { label: "Blue",   dot: "bg-blue-500",   chip: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300" },
  green:  { label: "Green",  dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" },
  red:    { label: "Red",    dot: "bg-rose-500",   chip: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" },
  yellow: { label: "Yellow", dot: "bg-amber-400",  chip: "bg-amber-400/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  orange: { label: "Orange", dot: "bg-orange-500", chip: "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300" },
  pink:   { label: "Pink",   dot: "bg-pink-500",   chip: "bg-pink-500/10 text-pink-700 ring-pink-500/20 dark:text-pink-300" },
  purple: { label: "Purple", dot: "bg-violet-500", chip: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300" },
  gray:   { label: "Gray",   dot: "bg-zinc-400",   chip: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300" },
};

export const TAG_COLORS = Object.keys(TAG_STYLES) as colors[];

/** A color for a new tag: the first one not used yet, then cycling. */
export function nextTagColor(existing: Pick<TaskTag, "color">[]): colors {
  const used = new Set(existing.map((t) => t.color));
  return TAG_COLORS.find((c) => !used.has(c)) ?? TAG_COLORS[existing.length % TAG_COLORS.length];
}

/** Collapses whitespace, the same way the API stores the name. */
export const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, " ");

export function filterTasksByTags<T extends Pick<Task, "tags">>(
  tasks: T[] | undefined,
  tagIds: string[],
  mode: TagMatchMode,
): T[] | undefined {
  if (!tasks || !tagIds.length) return tasks;
  return tasks.filter((task) => {
    const ids = new Set(task.tags.map((t) => t.id));
    return mode === "all" ? tagIds.every((id) => ids.has(id)) : tagIds.some((id) => ids.has(id));
  });
}
