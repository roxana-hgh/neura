import { ListChecks } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTasksCompletedByDay } from "@/features/tasks/hooks/useTasks";
import SectionCard from "@/components/shared/SectionCard";

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
    <SectionCard
      icon={<ListChecks className="size-4 text-muted-foreground" />}
      title="Tasks completed"
      description={`${weekTotal} finished in the last 7 days`}
      className="h-full"
    >
      {isPending ? (
        <div className="h-[220px] animate-pulse rounded-lg bg-muted/60" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
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
    </SectionCard>
  );
}

export default TasksCompletedChart;