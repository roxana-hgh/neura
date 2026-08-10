// HabitsPage.tsx
import { useState } from "react";
import { addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useHabits } from "../../components/features/Habits/hooks/useHabits";
import { HabitViewTabs } from "../../components/features/Habits/components/HabitViewTabs";

import { CreateHabitModal } from "../../components/features/Habits/components/CreateHabitModal";
import type { HabitView } from "../../types/habit";
import { WeekGrid } from "../../components/features/Habits/components/Weekgrid";
import { MonthCalendar } from "../../components/features/Habits/components/Monthcalendar";
import { YearHeatmap } from "../../components/features/Habits/components/Yearheatmap";




export function HabitsPage() {
  const [view, setView] = useState<HabitView>("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useHabits(view, anchorDate);

  const shift = (dir: 1 | -1) => {
    setAnchorDate((d) => {
      if (view === "week") return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
      if (view === "month") return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
      if (view === "year") return dir === 1 ? addYears(d, 1) : subYears(d, 1);
      return d;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <HabitViewTabs view={view} onChange={setView} />
    
         <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(true)}>
          <span className="hidden sm:block text-sm">Add Habit</span>{" "}
          <Plus />
        </Button>
      </div>

      {data && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view !== "all" && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => shift(-1)}>‹</Button>
                  <Button variant="ghost" size="icon" onClick={() => shift(1)}>›</Button>
                </>
              )}
              <span className="font-semibold">
                {format(new Date(data.rangeStart), "MMM d")} – {format(new Date(data.rangeEnd), "MMM d")}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={data.currentPercent >= data.previousPercent ? "text-green-600" : "text-red-500"}>
                {data.currentPercent >= data.previousPercent ? "↑" : "↓"} {Math.abs(data.currentPercent - data.previousPercent)}% from last {view}
              </span>
              <span className="text-muted-foreground">{data.currentPercent}% achieved</span>
            </div>
          </div>

          {view === "week" && (
            <WeekGrid habits={data.habits} rangeStart={data.rangeStart} rangeEnd={data.rangeEnd} />
          )}
          {view === "month" && (
            <MonthCalendar habits={data.habits} monthDate={anchorDate} />
          )}
          {(view === "year" || view === "all") && (
            <YearHeatmap habits={data.habits} rangeStart={data.rangeStart} rangeEnd={data.rangeEnd} />
          )}
        </>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <CreateHabitModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}