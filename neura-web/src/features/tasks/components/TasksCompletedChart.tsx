import { ListChecks } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTasksCompletedByDay } from "@/features/tasks/hooks/useTasks";

const chartConfig = {
  tasksCompleted: {
    label: "Tasks completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function TasksCompletedChart() {
  const { data, isPending } = useTasksCompletedByDay();
  const weekTotal = data.reduce((sum, d) => sum + d.tasksCompleted, 0);

  return (
    <div className="glass py-3 px-4 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-1">
        <ListChecks size={16} className="text-blue-400" />
        <h2 className="font-medium text-base">Tasks Completed</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {weekTotal} finished this week
      </p>

      {isPending ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={24}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="tasksCompleted"
              fill="var(--color-tasksCompleted)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

export default TasksCompletedChart;