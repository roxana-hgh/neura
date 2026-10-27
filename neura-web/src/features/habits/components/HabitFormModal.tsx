import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHabit, useUpdateHabit } from "@/features/habits/hooks/useHabits";
import { HABIT_COLORS, habitFormSchema, type HabitFormValues } from "@/features/habits/schemas/habit.schema";
import {
  daysToDurationInput, fromDayKey, lastDayKey, toDayKey, unitToDays,
} from "@/features/habits/lib/habitDate";
import type { DurationUnit, Habit } from "@/features/habits/types/habit";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Preset {
  label: string;
  days: number | null;
}

const PRESETS: Preset[] = [
  { label: "Forever", days: null },
  { label: "1 week", days: 7 },
  { label: "21 days", days: 21 },
  { label: "30 days", days: 30 },
  { label: "66 days", days: 66 },
];

function defaultValues(habit: Habit | null): HabitFormValues {
  const duration = habit?.durationDays != null ? daysToDurationInput(habit.durationDays) : null;
  return {
    title: habit?.title ?? "",
    color: habit?.color ?? HABIT_COLORS[0],
    startDate: habit?.startKey ?? toDayKey(new Date()),
    hasDuration: duration !== null,
    durationValue: duration?.value ?? 21,
    durationUnit: duration?.unit ?? "day",
  };
}

interface HabitFormModalProps {
  /** null = create a new habit */
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitFormModal({ habit, open, onOpenChange }: HabitFormModalProps) {
  const isEdit = habit !== null;
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const isPending = createHabit.isPending || updateHabit.isPending;

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: defaultValues(habit),
  });

  // refill whenever the dialog opens (new habit or a different one to edit)
  useEffect(() => {
    if (open) reset(defaultValues(habit));
  }, [open, habit, reset]);

  const [color, startDate, hasDuration, durationValue, durationUnit] = useWatch({
    control,
    name: ["color", "startDate", "hasDuration", "durationValue", "durationUnit"],
  });

  const durationDays = hasDuration ? unitToDays(durationUnit, durationValue || 1) : null;
  const lastKey = startDate ? lastDayKey(startDate, durationDays) : null;
  const todayKey = toDayKey(new Date());

  const applyPreset = (preset: Preset) => {
    setValue("hasDuration", preset.days !== null);
    if (preset.days !== null) {
      const { value, unit } = daysToDurationInput(preset.days);
      setValue("durationValue", value, { shouldValidate: true });
      setValue("durationUnit", unit);
    }
  };

  const onSubmit = (values: HabitFormValues) => {
    const input = {
      title: values.title.trim(),
      color: values.color,
      startDate: values.startDate,
      durationDays: values.hasDuration ? unitToDays(values.durationUnit, values.durationValue) : null,
    };
    const onSuccess = () => {
      toast.success(isEdit ? "Habit updated" : "Habit created");
      onOpenChange(false);
    };
    if (isEdit) updateHabit.mutate({ id: habit.id, ...input }, { onSuccess });
    else createHabit.mutate(input, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Changes apply to the whole history of this habit." : "Small daily actions add up."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input id="habit-title" placeholder="e.g. Read 10 pages, Workout, Meditate" autoFocus {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-start">Start date</Label>
            <Input id="habit-start" type="date" max={todayKey} className="w-44" {...register("startDate")} />
            {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            <p className="text-[11px] text-muted-foreground">Pick an earlier date to fill in past days.</p>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = p.days === null ? !hasDuration : hasDuration && durationDays === p.days;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
              {!hasDuration ? (
                <button
                  type="button"
                  onClick={() => setValue("hasDuration", true)}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Custom…
                </button>
              ) : null}
            </div>

            {hasDuration && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  className="w-20"
                  {...register("durationValue", { valueAsNumber: true })}
                />
                <Controller
                  control={control}
                  name="durationUnit"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as DurationUnit)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Days</SelectItem>
                        <SelectItem value="week">Weeks</SelectItem>
                        <SelectItem value="month">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            {errors.durationValue && <p className="text-xs text-destructive">{errors.durationValue.message}</p>}

            {startDate && (
              <p className="text-[11px] text-muted-foreground">
                {lastKey
                  ? `Tracks ${format(fromDayKey(startDate), "MMM d")} → ${format(fromDayKey(lastKey), "MMM d, yyyy")} (${durationDays} days)`
                  : `Tracks every day from ${format(fromDayKey(startDate), "MMM d, yyyy")}`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-white transition cursor-pointer hover:scale-110",
                    color === c && "ring-2 ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                >
                  {color === c && <Check className="size-3.5" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
