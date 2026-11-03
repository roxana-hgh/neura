import { format, isThisYear } from "date-fns";
import {
  Bell, Brain, CalendarDays, CheckSquare, Flag, FolderOpen, LayoutDashboard, Lightbulb,
  ListTodo, NotebookPen, Repeat, Sparkles, Timer, type LucideIcon,
} from "lucide-react";
import type { SearchItem, SearchResponse, SearchType } from "@/features/search/types/search";

interface GroupConfig {
  label: string;
  icon: LucideIcon;
  /** Icon tile colors; soft in both themes. */
  tone: string;
}

/** Display order of the groups and the filter chips. */
export const SEARCH_GROUPS: Record<SearchType, GroupConfig> = {
  tasks: { label: "Tasks", icon: CheckSquare, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  goals: { label: "Goals", icon: Flag, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  notes: { label: "Notes", icon: NotebookPen, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  reminders: { label: "Reminders", icon: Bell, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  habits: { label: "Habits", icon: Repeat, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  brainstorms: { label: "Brainstorms", icon: Lightbulb, tone: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  lists: { label: "Lists", icon: FolderOpen, tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

export const SEARCH_TYPE_ORDER = Object.keys(SEARCH_GROUPS) as SearchType[];

/** Shown before anything is typed. */
export const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "Goals", href: "/goals", icon: Flag },
  { label: "Habits", href: "/habits", icon: Repeat },
  { label: "Reminders", href: "/reminders", icon: Bell },
  { label: "Brainstorms", href: "/brainstorms", icon: Brain },
  { label: "Focus", href: "/focus", icon: Timer },
  { label: "Assistant", href: "/assistant", icon: Sparkles },
];

const shortDate = (iso: string) => format(new Date(iso), isThisYear(new Date(iso)) ? "MMM d" : "MMM d, yyyy");
const shortDateTime = (iso: string) => `${shortDate(iso)} · ${format(new Date(iso), "HH:mm")}`;

const GOAL_STATUS: Record<SearchResponse["goals"][number]["status"], string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Flattens the response into rows, grouped in SEARCH_TYPE_ORDER. */
export function toSearchItems(data: SearchResponse): Record<SearchType, SearchItem[]> {
  return {
    tasks: data.tasks.map((t) => ({
      key: `tasks:${t.id}`,
      type: "tasks",
      id: t.id,
      title: t.title,
      snippet: t.snippet,
      meta: [t.list?.name ?? t.goal?.title, t.dueDate && shortDate(t.dueDate)].filter(Boolean).join(" · "),
      done: t.completed,
    })),
    goals: data.goals.map((g) => ({
      key: `goals:${g.id}`,
      type: "goals",
      id: g.id,
      title: g.title,
      snippet: g.snippet || (g.parent ? `Sub-goal of ${g.parent.title}` : undefined),
      meta: g.archivedAt ? "Archived" : GOAL_STATUS[g.status],
      href: `/goal/${g.id}`,
      done: g.status === "completed",
    })),
    notes: data.notes.map((n) => ({
      key: `notes:${n.id}`,
      type: "notes",
      id: n.id,
      title: n.title || "Untitled",
      snippet: n.snippet,
      meta: shortDate(n.updatedAt),
      href: `/note/${n.id}`,
    })),
    reminders: data.reminders.map((r) => ({
      key: `reminders:${r.id}`,
      type: "reminders",
      id: r.id,
      title: r.title,
      snippet: r.snippet,
      meta: r.status === "done" ? "Done" : r.status === "paused" ? "Paused" : shortDateTime(r.nextAt),
      href: "/reminders",
      done: r.status === "done",
    })),
    habits: data.habits.map((h) => ({
      key: `habits:${h.id}`,
      type: "habits",
      id: h.id,
      title: h.title,
      meta: h.isArchived ? "Archived" : undefined,
      href: "/habits",
    })),
    brainstorms: data.brainstorms.map((b) => ({
      key: `brainstorms:${b.id}`,
      type: "brainstorms",
      id: b.id,
      title: b.content,
      meta: b.status === "processed" ? "Sorted" : shortDate(b.createdAt),
      href: "/brainstorms",
      done: b.status === "processed",
    })),
    lists: data.lists.map((l) => ({
      key: `lists:${l.id}`,
      type: "lists",
      id: l.id,
      title: l.name,
      meta: `${l.taskCount} ${l.taskCount === 1 ? "task" : "tasks"}`,
      href: `/list/${l.id}`,
    })),
  };
}
