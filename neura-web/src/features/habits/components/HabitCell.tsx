import type { CSSProperties, ReactNode } from "react";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { fromDayKey, type CellState } from "@/features/habits/lib/habitDate";
import { cn } from "@/lib/utils";

interface HabitCellProps {
  dayKey: string;
  state: CellState;
  color: string;
  isToday?: boolean;
  /** "xs" = heatmap square, "md" = month calendar day, "lg" = week row checkbox */
  size?: "xs" | "md" | "lg";
  /** shown inside the cell, e.g. the day number in month view */
  label?: ReactNode;
  onToggle: (dayKey: string) => void;
  className?: string;
}

const SIZE_CLASS = {
  xs: "size-3 rounded-[3px]",
  md: "w-full aspect-square rounded-lg text-xs font-medium",
  lg: "size-7 sm:size-8.5 rounded-xl",
};

const STATE_TEXT: Record<CellState, string> = {
  done: "Done",
  open: "Not done",
  inactive: "Not tracked",
  future: "Upcoming",
};

export function HabitCell({ dayKey, state, color, isToday, size = "lg", label, onToggle, className }: HabitCellProps) {
  const clickable = state === "done" || state === "open";
  const title = `${format(fromDayKey(dayKey), "EEE, MMM d, yyyy")} · ${STATE_TEXT[state]}`;

  return (
    <button
      type="button"
      disabled={!clickable}
      aria-pressed={clickable ? state === "done" : undefined}
      aria-label={title}
      title={title}
      onClick={() => onToggle(dayKey)}
      style={{ "--habit": color } as CSSProperties}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center transition-[background-color,transform,box-shadow] duration-150",
        SIZE_CLASS[size],
        clickable && "cursor-pointer active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        state === "done" && "bg-(--habit) text-white shadow-sm hover:brightness-110",
        state === "open" &&
          "bg-muted text-muted-foreground hover:bg-[color-mix(in_srgb,var(--habit)_28%,transparent)] hover:text-foreground",
        state === "inactive" && "bg-muted/35 text-muted-foreground/40 cursor-default",
        state === "future" &&
          (size === "xs" ? "bg-muted/20 cursor-default" : "border border-dashed border-border bg-transparent text-muted-foreground/50 cursor-default"),
        isToday && (size === "xs" ? "ring-1 ring-foreground/60" : "ring-2 ring-(--habit) ring-offset-2 ring-offset-card"),
        className,
      )}
    >
      {label ?? (state === "done" && size === "lg" && <Check className="size-[55%]" strokeWidth={3} />)}
    </button>
  );
}
