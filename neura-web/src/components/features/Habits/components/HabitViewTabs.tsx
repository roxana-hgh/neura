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
    <div className="inline-flex rounded-full bg-muted p-1">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition",
            view === v.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}