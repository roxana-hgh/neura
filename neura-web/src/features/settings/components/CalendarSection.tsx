import { Check } from "lucide-react";
import SettingsSection from "@/features/settings/components/SettingsSection";
import { useProfile, useUpdateWeekStart } from "@/features/settings/hooks/useProfile";
import { DEFAULT_WEEK_STARTS_ON, WEEK_START_OPTIONS, getWeekdayLabels } from "@/lib/weekStart";
import { cn } from "@/lib/utils";

function CalendarSection() {
  const { data: user, isPending } = useProfile();
  const updateWeekStart = useUpdateWeekStart();
  const current = user?.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON;

  return (
    <SettingsSection
      title="Calendar"
      description="The first day of the week in the calendar, habits and dashboard."
    >
      <div role="radiogroup" aria-label="First day of the week" className="grid gap-3 sm:grid-cols-3">
        {WEEK_START_OPTIONS.map(({ value, label }) => {
          const selected = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isPending}
              onClick={() => !selected && updateWeekStart.mutate(value)}
              className={cn(
                "cursor-pointer rounded-xl border p-3 text-left transition-all disabled:cursor-default disabled:opacity-60",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {selected && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              {/* week preview: the chosen day leads */}
              <div className="mt-2.5 grid grid-cols-7 gap-1">
                {getWeekdayLabels(value, "EEEEEE").map((d, i) => (
                  <span
                    key={d}
                    className={cn(
                      "rounded py-1 text-center text-[10px] font-medium",
                      i === 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

export default CalendarSection;
