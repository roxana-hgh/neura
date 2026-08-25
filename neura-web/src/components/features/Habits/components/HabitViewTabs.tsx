// HabitViewTabs.tsx

import { cn } from "../../../../lib/utils";
import type { HabitView } from "../../../../types/habit";


const VIEWS: { value: HabitView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All Time" },
];

export function HabitViewTabs({ view, onChange }: { view: HabitView; onChange: (v: HabitView) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-neutral-50/20 dark:bg-white/5 border border-neutral-600/20 dark:border-white/10 p-1">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            view === v.value ? "bg-primary text-primary-foreground" : "text-neutral-600 dark:text-neutral-400 cursor-pointer"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}