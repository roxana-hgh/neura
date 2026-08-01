import { Stars, Timer } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import TaskItemSummery from "../../components/features/Tasks/components/TasksList/TaskListItemSummery";
import NoteItem from "../../components/features/Notes/components/NoteItem";
import { Link } from "react-router-dom";
import { useTasksStore } from "../../components/features/Tasks/stores/tasks";
import ListCardItem from "../../components/features/Tasks/components/Lists/ListCardItem";
import { useSession } from "../../lib/auth-client";
import { useMemo } from "react";
import { isToday, isAfter, isBefore, startOfDay, endOfWeek } from "date-fns";
import { useTasks } from "../../components/features/Tasks/hooks/useTasks";
import { useNotes } from "../../components/features/Notes/hooks/useNotes";
import type { Task } from "../../types/Tasks";
import NoTasks from "../../components/features/Tasks/components/NoTasks";
import { useDailyPlan } from "../../components/features/assistant/hooks/useDailyPlan";

function Dashboard() {
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Good evening";
    } else {
      return "Good night";
    }
  };
  const { data: session } = useSession();
  const { data: tasks } = useTasks();
  const { data: dailyPlan, isLoading: isPlanLoading, isError: isPlanError } = useDailyPlan();
  const { todayTasks, weekTasks, upcomingTasks } = useMemo(() => {
    if (!tasks)
      return {
        todayTasks: [] as Task[],
        weekTasks: [] as Task[],
        upcomingTasks: [] as Task[],
      };

    const todayStart = startOfDay(new Date());
    const weekEnd = endOfWeek(todayStart, { weekStartsOn: 1 }); // Monday-start week; use 0 for Sunday-start

    const today: Task[] = [];
    const week: Task[] = [];
    const upcoming: Task[] = [];

    for (const task of tasks) {
      if (!task.due_date) continue; // no due date -> doesn't belong in this widget

      const due = startOfDay(new Date(task.due_date));

      if (isBefore(due, todayStart)) continue; // overdue -> skip in this widget

      if (isToday(due)) {
        today.push(task);
      } else if (!isAfter(due, weekEnd)) {
        week.push(task);
      } else {
        upcoming.push(task);
      }
    }

    return { todayTasks: today, weekTasks: week, upcomingTasks: upcoming };
  }, [tasks]);

  const renderTaskSummaries = (list: Task[]) =>
    list.length ? (
      list
        .slice(0, 3)
        .map((task) => <TaskItemSummery key={task.id} task={task} />)
    ) : (
      <NoTasks />
    );

  const Taskslists = useTasksStore((s) => s.lists);
  const { notes } = useNotes();

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1 px-1">
        <h1 className="font-bold text-lg">
          {getGreeting()}, {session?.user.name}
        </h1>
      </div>
      <div className="glass py-3 px-4 ">
        <div className=" text-indigo-400 flex items-center gap-1">
          <Stars size={16} />
          <h5 className="text-indigo-400 font-medium text-base uppercase">
            AI daily plan
          </h5>
        </div>
        <p className="text-sm py-3">
          {isPlanLoading
            ? "Looking at your day..."
            : isPlanError
            ? `Welcome back, ${session?.user.name}. I couldn't pull today's plan just now — head to the assistant if you'd like a hand.`
            : dailyPlan}
        </p>
        <div className="flex gap-2 py-1">
          <Link to={"/assistant"}>
            <Button asChild size="xs" className=" cursor-pointer">
              <span className="flex gap-0.5 items-center">
                Adjust Plan with AI
                {/* <Stars/> */}
              </span>
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-4 md:col-span-3">
          <div className="glass py-3 px-4 h-full">
            <Tabs defaultValue="today">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-base mb-2">Upcoming Tasks</h2>
                <div className="flex items-center gap-2">
                  <TabsList>
                    <TabsTrigger value="today">
                      <span className="text-xs">Today</span>
                    </TabsTrigger>
                    <TabsTrigger value="week">
                      <span className="text-xs">This Week</span>
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">
                      <span className="text-xs">Upcoming</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="today">
                {renderTaskSummaries(todayTasks)}
              </TabsContent>
              <TabsContent value="week">
                {renderTaskSummaries(weekTasks)}
              </TabsContent>
              <TabsContent value="upcoming">
                {renderTaskSummaries(upcomingTasks)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="col-span-4 md:col-span-1">
          <div className="glass py-3 px-4 h-full flex flex-col">
            <div className="flex gap-2 items-center px-1  mb-2">
              <Timer size={16} />
              <h2 className="font-medium text-base">Focus Timer</h2>
            </div>
            <div className="py-3 mb-3 grow flex flex-col justify-center">
              <span className="text-5xl md:text-6xl text-center block font-bold tracking-tight  ">
                25:00
              </span>
              <span className="block text-center text-sm text-centertext-xs text-muted-foreground mt-2 uppercase tracking-[0.2em] ">
                Deep Work Session
              </span>
            </div>
            <div className="flex gap-2 py-2">
              <Link className="grow " to={"/focus"}>
                <Button size="sm" className="w-full rounded-lg cursor-pointer">
                  Start Session
                </Button>
              </Link>
              {/* <Button
                size="icon-sm"
                variant="outline"
                className=" cursor-pointer"
              >
                <RefreshCw />
              </Button> */}
            </div>
          </div>
        </div>
      </div>
      {Taskslists?.length > 0 && (
        <div className=" py-3 h-full">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-medium text-base mb-2">Projects</h2>
            <Link to={"/lists"}>
              <Button size="sm" variant="ghost">
                <span className="text-xs">View All</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
            {Taskslists?.length ? (
              Taskslists.slice(0, 4).map((list) => (
                <ListCardItem key={list.id} list={list} className="" />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </div>
        </div>
      )}
      {notes?.length > 0 && (
        <div className="py-3  h-full">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-medium text-base mb-2">Latest Notes</h2>
            <Link to={"/notes"}>
              <Button size="sm" variant="ghost">
                <span className="text-xs">View All</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
            {notes?.length ? (
              notes
                .slice(0, 4)
                .map((note) => (
                  <NoteItem key={note.id} note={note} className="" />
                ))
            ) : (
              <p className="text-sm px-2 text-muted-foreground">
                No notes available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
