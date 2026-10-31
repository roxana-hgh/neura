import type { ElementType } from "react";
import { Link } from "react-router-dom";
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
import { TOOL_ACTIONS } from "@/features/assistant/lib/toolActions";
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

interface BadgeView {
  tone: Tone;
  icon: ElementType;
  verb: string;
  title?: string;
  meta?: string;
  to?: string;
}

function describe(action: ToolAction): BadgeView | null {
  const { name, result } = action;
  if (!result) return null;

  if (result.error) {
    return { tone: "error", icon: AlertCircle, verb: "Couldn't apply", meta: result.error };
  }

  const info = TOOL_ACTIONS[name];
  const verb = info?.verb ?? "Updated";

  if (name === "log_habit_completion") {
    if (!result.habit) return null;
    const day = result.date ? format(parseISO(result.date), "MMM d") : undefined;
    return result.completed === false
      ? { tone: "update", icon: CircleSlash, verb: "Unchecked", title: result.habit, meta: day }
      : { tone: "create", icon: Flame, verb: "Done", title: result.habit, meta: day };
  }

  if (result.deleted) {
    return { tone: "delete", icon: Trash2, verb, title: result.deleted.title };
  }

  const item = result.created ?? result.updated;
  if (!item) return null;

  const isHabit = name.endsWith("_habit");
  const meta = item.meta ?? (item.durationDays ? `${item.durationDays} days` : item.priority);

  return {
    tone: result.created ? "create" : "update",
    icon: result.created ? (isHabit ? CalendarCheck : PlusCircle) : Pencil,
    verb,
    title: item.title,
    meta,
    to: info?.path?.(item.id ?? ""),
  };
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const view = describe(action);
  if (!view) return null;
  const { tone, icon: Icon, verb, title, meta, to } = view;

  const className = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs",
    "animate-in fade-in slide-in-from-bottom-1 duration-300",
    to && "transition-opacity hover:opacity-75",
    TONE_STYLES[tone]
  );
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="shrink-0 opacity-80">{verb}</span>
      {title && (
        <span dir="auto" className={cn("truncate font-medium", tone === "delete" && "line-through")}>
          {title}
        </span>
      )}
      {meta && <span className={cn("truncate opacity-70", title && "shrink-0")}>· {meta}</span>}
    </>
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
