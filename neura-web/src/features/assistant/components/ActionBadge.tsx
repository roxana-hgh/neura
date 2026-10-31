import type { ElementType } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
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
  create: "text-emerald-600 dark:text-emerald-400",
  update: "text-muted-foreground",
  delete: "text-destructive",
  error: "text-amber-600 dark:text-amber-400",
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
    "group/badge inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs",
    "animate-in fade-in slide-in-from-bottom-1 duration-300",
    to && "transition-colors hover:bg-accent"
  );
  const content = (
    <>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", TONE_STYLES[tone])} />
      <span className="shrink-0 text-muted-foreground">{verb}</span>
      {title && (
        <span dir="auto" className={cn("truncate font-medium", tone === "delete" && "line-through")}>
          {title}
        </span>
      )}
      {meta && <span className={cn("truncate text-muted-foreground", title && "shrink-0")}>· {meta}</span>}
      {to && (
        <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover/badge:-translate-y-px group-hover/badge:translate-x-px" />
      )}
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
