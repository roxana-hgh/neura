// HabitsPage.tsx
import { useState } from "react";
import { addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, format } from "date-fns";
import { Plus, ListChecks, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useHabits } from "../../components/features/Habits/hooks/useHabits";
import { HabitViewTabs } from "../../components/features/Habits/components/HabitViewTabs";

import { CreateHabitModal } from "../../components/features/Habits/components/CreateHabitModal";
import { HabitListModal } from "../../components/features/Habits/components/HabitListModal";
import type { HabitView } from "../../types/habit";
import { WeekGrid } from "../../components/features/Habits/components/Weekgrid";
import { MonthCalendar } from "../../components/features/Habits/components/Monthcalendar";
import { YearHeatmap } from "../../components/features/Habits/components/Yearheatmap";
import Loader from "../../components/ui/loader";

export function HabitsPage() {
  const [view, setView] = useState<HabitView>("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <HabitViewTabs view={view} onChange={setView} />

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="flex items-center" onClick={() => setListModalOpen(true)}>
            <span className="hidden sm:block text-sm">Manage</span>{" "}
            <ListChecks size={12} />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(true)}>
            <span className="hidden sm:block text-sm">Add Habit</span>{" "}
            <Plus size={12} />
          </Button>
        </div>
      </div>

      {data && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center px-1 gap-2">
              {view !== "all" && (
                <>
                  <Button variant="outline" size="icon-sm" onClick={() => shift(-1)}><ChevronLeftIcon size={24} /></Button>
                  <Button variant="outline" size="icon-sm" onClick={() => shift(1)}><ChevronRightIcon size={24} /></Button>
                </>
              )}
              <span className="font-semibold text-sm">
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
          <div className="md:px-3">

            {view === "week" && (
              <WeekGrid habits={data.habits} rangeStart={data.rangeStart} rangeEnd={data.rangeEnd} />
            )}
            {view === "month" && (
              <MonthCalendar habits={data.habits} monthDate={anchorDate} />
            )}
            {(view === "year" || view === "all") && (
              <YearHeatmap habits={data.habits} rangeStart={data.rangeStart} rangeEnd={data.rangeEnd} />
            )}
          </div>
        </>
      )}

      {isLoading && <div className="py-10"><Loader /></div>}

      <CreateHabitModal open={modalOpen} onOpenChange={setModalOpen} />
      <HabitListModal open={listModalOpen} onOpenChange={setListModalOpen} />
    </div>
  );
}