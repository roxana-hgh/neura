import type { ElementType } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CircleSlash,
  Flame,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ToolAction } from "@/features/assistant/hooks/useAssistant";
import { cn } from "@/lib/utils";

interface ActionBadgeProps {
  action: ToolAction;
}

type Tone = "create" | "update" | "delete" | "error";

const TONE_STYLES: Record<Tone, string> = {
  create: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  update: "border-primary/20 bg-primary/10 text-primary",
  delete: "border-destructive/20 bg-destructive/10 text-destructive",
  error: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const VERBS: Record<ToolAction["name"], string> = {
  create_task: "Added task",
  update_task: "Updated task",
  delete_task: "Deleted task",
  create_habit: "New habit",
  update_habit: "Updated habit",
  delete_habit: "Deleted habit",
  log_habit_completion: "Habit",
};

interface BadgeView {
  tone: Tone;
  icon: ElementType;
  verb: string;
  title?: string;
  meta?: string;
}

function describe(action: ToolAction): BadgeView | null {
  const { name, result } = action;
  if (!result) return null;

  if (result.error) {
    return { tone: "error", icon: AlertCircle, verb: "Couldn't apply", meta: result.error };
  }

  if (name === "log_habit_completion") {
    if (!result.habit) return null;
    const day = result.date ? format(parseISO(result.date), "MMM d") : undefined;
    return result.completed === false
      ? { tone: "update", icon: CircleSlash, verb: "Unchecked", title: result.habit, meta: day }
      : { tone: "create", icon: Flame, verb: "Done", title: result.habit, meta: day };
  }

  if (result.deleted) {
    return { tone: "delete", icon: Trash2, verb: VERBS[name], title: result.deleted.title };
  }

  const item = result.created ?? result.updated;
  if (!item) return null;

  const isHabit = name.endsWith("_habit");
  const meta = isHabit
    ? item.durationDays
      ? `${item.durationDays} days`
      : undefined
    : item.priority;

  return {
    tone: result.created ? "create" : "update",
    icon: result.created ? (isHabit ? CalendarCheck : PlusCircle) : Pencil,
    verb: VERBS[name],
    title: item.title,
    meta,
  };
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const view = describe(action);
  if (!view) return null;
  const { tone, icon: Icon, verb, title, meta } = view;

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs",
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
        TONE_STYLES[tone]
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="shrink-0 opacity-80">{verb}</span>
      {title && (
        <span dir="auto" className={cn("truncate font-medium", tone === "delete" && "line-through")}>
          {title}
        </span>
      )}
      {meta && <span className={cn("truncate opacity-70", title && "shrink-0")}>· {meta}</span>}
    </div>
  );
}
