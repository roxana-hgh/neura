import { useEffect, useMemo, useState } from "react";
import { isSameMonth, isWithinInterval } from "date-fns";
import type { Task } from "@/features/tasks/types/task";
import { useCalendarTasks } from "@/features/tasks/hooks/useCalendarTasks";
import { useCalendarStore } from "@/features/tasks/stores/calendarStore";
import { DayTasksModal } from "@/features/tasks/components/DayTasksModal";
import { CalendarHeader } from "@/features/tasks/components/calendar/CalendarHeader";
import { CalendarMonthView } from "@/features/tasks/components/calendar/CalendarMonthView";
import { CalendarWeekView } from "@/features/tasks/components/calendar/CalendarWeekView";
import {
  dayKey,
  formatRangeTitle,
  getCalendarStats,
  getRangeDays,
  getVisibleRange,
  groupTasksByDay,
  shiftCursor,
} from "@/features/tasks/utils/calendar";

// Ignore shortcuts while typing or while a dialog is open
function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) {
    return true;
  }
  return !!document.querySelector('[role="dialog"]');
}

export function CalendarPage() {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const range = useMemo(() => getVisibleRange(view, cursor), [view, cursor]);
  const days = useMemo(() => getRangeDays(range), [range]);
  const { data: tasks, isLoading, isFetching } = useCalendarTasks(range);

  const tasksByDay = useMemo(() => groupTasksByDay(tasks), [tasks]);

  // Stats cover the month in month view (not the padding days) and the week in week view
  const stats = useMemo(() => {
    const scope = tasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return view === "month" ? isSameMonth(due, cursor) : isWithinInterval(due, range);
    });
    return getCalendarStats(scope);
  }, [tasks, view, cursor, range]);

  const selectedDayTasks: Task[] = selectedDate
    ? (tasksByDay.get(dayKey(selectedDate)) ?? [])
    : [];

  const goPrev = () => setCursor((c) => shiftCursor(view, c, -1));
  const goNext = () => setCursor((c) => shiftCursor(view, c, 1));
  const goToday = () => setCursor(new Date());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      switch (e.key) {
        case "ArrowLeft":
          setCursor((c) => shiftCursor(view, c, -1));
          break;
        case "ArrowRight":
          setCursor((c) => shiftCursor(view, c, 1));
          break;
        case "t":
        case "T":
          setCursor(new Date());
          break;
        case "m":
        case "M":
          setView("month");
          break;
        case "w":
        case "W":
          setView("week");
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, setView]);

  return (
    <div className="p-3 sm:p-4 md:p-6 h-full flex flex-col gap-4 md:gap-5">
      <CalendarHeader
        title={formatRangeTitle(view, cursor, range)}
        view={view}
        stats={stats}
        isFetching={isFetching && !isLoading}
        onViewChange={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {isLoading ? (
        <div className="flex-1 min-h-100 rounded-xl border border-border bg-card animate-pulse" />
      ) : view === "month" ? (
        <CalendarMonthView
          key={dayKey(range.start)}
          cursor={cursor}
          days={days}
          tasksByDay={tasksByDay}
          onSelectDay={setSelectedDate}
        />
      ) : (
        <CalendarWeekView
          key={dayKey(range.start)}
          days={days}
          tasksByDay={tasksByDay}
          onSelectDay={setSelectedDate}
        />
      )}

      <DayTasksModal
        open={!!selectedDate}
        date={selectedDate ?? new Date()}
        tasks={selectedDayTasks}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
