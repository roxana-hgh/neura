import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { addDays, endOfWeek, format, isAfter, startOfDay } from "date-fns";
import {
  AlarmClock,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  Flame,
  FolderKanban,
  ListTodo,
  Plus,
  RotateCcw,
  Sparkles,
  StickyNote,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import StatTile from "@/components/shared/StatTile";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/tasks/types/task";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getTaskStats } from "@/features/tasks/utils/taskStats";
import AddNewTask from "@/features/tasks/components/AddTask";
import NoTasks from "@/features/tasks/components/NoTasks";
import TaskListItem from "@/features/tasks/components/task-list/TaskListItem";
import ListCardItem from "@/features/tasks/components/lists/ListCardItem";
import TasksCompletedChart from "@/features/tasks/components/TasksCompletedChart";
import NoteItem from "@/features/notes/components/NoteItem";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useHabits } from "@/features/habits/hooks/useHabits";
import HabitHeatmapCard from "@/features/habits/components/HabitHeatmapCard";
import { useFocusSessionStats } from "@/features/focus/hooks/useFocusSessions";
import { formatDuration } from "@/features/focus/utils/time";
import { useDailyPlan } from "@/features/assistant/hooks/useDailyPlan";
import { MarkdownMessage } from "@/features/assistant/components/MarkdownMessage";
import WeeklyOverviewChart from "@/features/dashboard/components/WeeklyOverviewChart";

type TaskTab = "today" | "week" | "later";
const MAX_TASKS = 5;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

const openFirst = (a: Task, b: Task) => Number(a.completed) - Number(b.completed);

/** Today = overdue + due today; This week = rest of the week; Later = after this week */
function bucketTasks(tasks: Task[]): Record<TaskTab, Task[]> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const buckets: Record<TaskTab, Task[]> = { today: [], week: [], later: [] };

  for (const task of tasks) {
    if (!task.due_date) continue;
    const due = startOfDay(new Date(task.due_date));

    if (due < tomorrow) {
      // overdue only while still open; today's completed tasks stay visible as progress
      if (due >= today || !task.completed) buckets.today.push(task);
    } else if (!task.completed) {
      buckets[isAfter(due, weekEnd) ? "later" : "week"].push(task);
    }
  }
  buckets.today.sort(openFirst);
  return buckets;
}

function SectionHeading({ icon, title, to }: { icon: ReactNode; title: string; to: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </h2>
      <Link
        to={to}
        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        View all <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

function DailyPlanCard() {
  const dailyPlan = useDailyPlan();

  return (
    <SectionCard
      icon={<Sparkles className="size-4 text-primary" />}
      title="Daily plan"
      action={
        dailyPlan.data && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Refresh plan"
            title="Refresh plan"
            disabled={dailyPlan.isPending}
            onClick={() => dailyPlan.mutate()}
            className="text-muted-foreground"
          >
            <RotateCcw />
          </Button>
        )
      }
      className="relative overflow-hidden"
      contentClassName="flex flex-col gap-3"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/5 to-transparent" />

      {dailyPlan.isPending ? (
        <div className="space-y-2 py-1" aria-live="polite">
          <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      ) : dailyPlan.isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn't get a plan just now. Try again in a moment.
        </p>
      ) : dailyPlan.data ? (
        <div className="no-scrollbar relative max-h-64 overflow-y-auto text-foreground">
          <MarkdownMessage content={dailyPlan.data} />
        </div>
      ) : (
        <p className="relative text-sm text-muted-foreground">
          Get a quick read on today: what to start with, what can wait and which habits are at risk.
        </p>
      )}

      <div className="relative mt-auto flex flex-wrap gap-2">
        {!dailyPlan.data && (
          <Button size="sm" disabled={dailyPlan.isPending} onClick={() => dailyPlan.mutate()}>
            <Sparkles className="size-4" />
            {dailyPlan.isPending ? "Thinking…" : dailyPlan.isError ? "Try again" : "Plan my day"}
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link to="/assistant">Open assistant</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

function FocusCard() {
  const { data, isPending } = useFocusSessionStats("today");
  const sessions = data?.sessionCount ?? 0;

  return (
    <SectionCard icon={<Timer className="size-4 text-amber-500" />} title="Focus" viewAllTo="/focus">
      <div className="flex items-end justify-between gap-3">
        <div>
          {isPending ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {sessions ? formatDuration(data!.totalDuration) : "0m"}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {sessions ? `${sessions} ${sessions === 1 ? "session" : "sessions"} today` : "No sessions yet today"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/focus">Start focus</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

function Dashboard() {
  const { data: session } = useSession();
  const { data: tasks, isPending: tasksPending } = useTasks();
  const { data: habitsData, isPending: habitsPending } = useHabits("week", new Date());
  const lists = useTasksStore((s) => s.lists);
  const { notes } = useNotes();
  const [tab, setTab] = useState<TaskTab>("today");

  const buckets = useMemo(() => bucketTasks(tasks ?? []), [tasks]);
  const stats = useMemo(() => getTaskStats(tasks ?? []), [tasks]);

  const habitsToday = useMemo(() => {
    if (!habitsData) return { done: 0, total: 0 };
    const active = habitsData.habits.filter(
      (h) => h.startKey <= habitsData.today && (h.lastKey === null || h.lastKey >= habitsData.today),
    );
    return { done: active.filter((h) => h.doneToday).length, total: active.length };
  }, [habitsData]);

  const visible = buckets[tab];
  const firstName = session?.user.name?.split(" ")[0];

  const tabEmpty: Record<TaskTab, { title: string; description: string; date?: Date }> = {
    today: { title: "Nothing due today", description: "Enjoy the space, or plan something.", date: new Date() },
    week: { title: "A light week", description: "No more tasks due this week." },
    later: { title: "Nothing scheduled later", description: "Tasks due after this week show up here." },
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, MMMM d")}
        title={`${getGreeting()}${firstName ? `, ${firstName}` : ""}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/assistant">
                <Sparkles className="size-4" /> Ask assistant
              </Link>
            </Button>
            <AddNewTask
              trigger={
                <Button type="button" size="sm">
                  <Plus className="size-4" /> New task
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          isLoading={tasksPending}
          icon={<CalendarCheck className="size-3.5 text-primary" />}
          label="Due today"
          value={stats.dueToday}
          hint={stats.dueToday ? "open tasks for today" : "Nothing due today"}
        />
        <StatTile
          isLoading={tasksPending}
          icon={<AlarmClock className="size-3.5 text-rose-500" />}
          label="Overdue"
          value={
            <span className={stats.overdue ? "text-rose-600 dark:text-rose-400" : undefined}>{stats.overdue}</span>
          }
          hint={stats.overdue ? "need a new date" : "You're on track"}
        />
        <StatTile
          isLoading={habitsPending}
          icon={<Flame className="size-3.5 text-orange-500" />}
          label="Habits today"
          value={
            <>
              {habitsToday.done}
              <span className="text-sm font-normal text-muted-foreground">/{habitsToday.total}</span>
            </>
          }
          hint={
            habitsToday.total > 0 && habitsToday.done === habitsToday.total ? "All done, nice!" : "checked in today"
          }
        />
        <StatTile
          isLoading={tasksPending}
          icon={<CircleCheck className="size-3.5 text-emerald-500" />}
          label="Done"
          value={stats.doneThisWeek}
          hint="tasks in the last 7 days"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SectionCard
          icon={<ListTodo className="size-4 text-muted-foreground" />}
          title="Tasks"
          viewAllTo="/tasks"
          className="lg:col-span-2"
          contentClassName="px-2 pb-2"
        >
          <Tabs value={tab} onValueChange={(v) => setTab(v as TaskTab)} className="mb-1 px-2">
            <TabsList>
              {(
                [
                  ["today", "Today", buckets.today.filter((t) => !t.completed).length],
                  ["week", "This week", buckets.week.length],
                  ["later", "Later", buckets.later.length],
                ] as const
              ).map(([value, label, count]) => (
                <TabsTrigger key={value} value={value} className="gap-1.5 text-xs">
                  {label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] tabular-nums",
                        value === "today" && stats.overdue ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {tasksPending ? (
            <div className="space-y-3 px-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          ) : visible.length ? (
            <>
              {visible.slice(0, MAX_TASKS).map((task) => (
                <TaskListItem key={task.id} task={task} compact />
              ))}
              {visible.length > MAX_TASKS && (
                <Link
                  to="/tasks"
                  className="block px-2 pt-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  +{visible.length - MAX_TASKS} more
                </Link>
              )}
            </>
          ) : (
            <NoTasks
              title={tabEmpty[tab].title}
              description={tabEmpty[tab].description}
              initialDueDate={tabEmpty[tab].date}
            />
          )}
        </SectionCard>

        <div className="flex flex-col gap-3">
          <DailyPlanCard />
          <FocusCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:[&>*:last-child]:col-span-2 xl:grid-cols-3 xl:[&>*:last-child]:col-span-1">
        <HabitHeatmapCard />
        <WeeklyOverviewChart />
        <TasksCompletedChart />
      </div>

      {lists.length > 0 && (
        <section className="space-y-2.5">
          <SectionHeading icon={<FolderKanban className="size-4 text-muted-foreground" />} title="Lists" to="/lists" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lists.slice(0, 4).map((list) => (
              <ListCardItem key={list.id} list={list} />
            ))}
          </div>
        </section>
      )}

      {notes.length > 0 && (
        <section className="space-y-2.5">
          <SectionHeading icon={<StickyNote className="size-4 text-muted-foreground" />} title="Latest notes" to="/notes" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {notes.slice(0, 4).map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
