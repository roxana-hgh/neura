import { useMemo } from "react";
import { Activity } from "lucide-react";
import SectionCard from "@/components/shared/SectionCard";
import { Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid } from "recharts";


import { eachDayOfInterval, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useFocusSessions } from "@/features/focus/hooks/useFocusSessions";
import { useHabits } from "@/features/habits/hooks/useHabits";

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

const chartConfig = {
  focusMinutes: {
    label: "Focus (min)",
    color: "var(--chart-3)",
  },
  habitPercent: {
    label: "Habits %",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function WeeklyOverviewChart() {
  const today = startOfDay(new Date());
  const { data: habitsData, isPending: habitsPending } = useHabits(
    "week",
    today
  );
  const { data: sessionsData, isPending: sessionsPending } = useFocusSessions(
    "week",
    undefined,
    1,
    200 // grab enough of the week's sessions to aggregate client-side
  );

  const chartData = useMemo(() => {
    if (!habitsData) return [];

    const days = eachDayOfInterval({
      start: parseISO(habitsData.rangeStart),
      end: parseISO(habitsData.rangeEnd),
    });

    const activeHabits = habitsData.habits.filter((h) => !h.isArchived);

    return days.map((day) => {
      const key = dateKey(day);

      const focusMinutes = Math.round(
        (sessionsData?.sessions ?? [])
          .filter((s) => isSameDay(new Date(s.startTime), day))
          .reduce((sum, s) => sum + s.duration, 0) / 60
      );

      const habitPercent =
        activeHabits.length > 0
          ? Math.round(
              (activeHabits.filter((h) => h.entries.includes(key)).length /
                activeHabits.length) *
                100
            )
          : 0;

      return {
        date: format(day, "EEE"),
        focusMinutes,
        habitPercent,
      };
    });
  }, [habitsData, sessionsData]);

  const isPending = habitsPending || sessionsPending;
  const totalFocus = chartData.reduce((sum, d) => sum + d.focusMinutes, 0);

  return (
    <SectionCard
      icon={<Activity className="size-4 text-muted-foreground" />}
      title="Focus & habits"
      description={`${totalFocus} min focused this week`}
      className="h-full"
    >
      {isPending ? (
        <div className="h-[220px] animate-pulse rounded-lg bg-muted/60" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <ComposedChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={30}
              domain={[0, 100]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="focusMinutes"
              fill="var(--color-focusMinutes)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="habitPercent"
              stroke="var(--color-habitPercent)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

export default WeeklyOverviewChart;