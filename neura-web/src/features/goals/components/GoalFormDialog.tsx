import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse } from "date-fns";
import { Bell, CalendarIcon, Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useWeekStartsOn } from "@/hooks/useWeekStartsOn";
import { useCreateGoal, useUpdateGoal } from "@/features/goals/hooks/useGoals";
import {
  defaultPresets, formatRange, GOAL_CATEGORIES, METRIC_OPTIONS, PERIOD_OPTIONS, periodRange, PRESET_OPTIONS,
} from "@/features/goals/lib/goalPeriod";
import { goalFormSchema, type GoalFormValues } from "@/features/goals/schemas/goal.schema";
import type { GoalBase, GoalInput, GoalMetric, GoalPeriod, ReminderPreset } from "@/features/goals/types/goal";
import { GOAL_COLOR_OPTIONS, GOAL_COLORS } from "@/features/goals/utils/goalStyles";
import type { WeekStartsOn } from "@/lib/weekStart";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const MORE_KEY = "neura-goal-form-more";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this goal; omit to create */
  goal?: GoalBase | null;
  /** Create / edit a sub-goal of this goal */
  parent?: GoalBase | null;
  /** Prefill the title (e.g. from an example) */
  initialTitle?: string;
}

function chip(active: boolean) {
  return cn(
    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
  );
}

function parseDayKey(value: string): Date | undefined {
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

function defaultValues(
  goal: GoalBase | null | undefined, parent: GoalBase | null | undefined, weekStartsOn: WeekStartsOn, title = "",
): GoalFormValues {
  if (goal) {
    return {
      title: goal.title,
      successCriteria: goal.successCriteria ?? "",
      description: goal.description ?? "",
      category: goal.category ?? "",
      color: goal.color,
      period: goal.period,
      startDate: goal.startDate,
      endDate: goal.endDate,
      metric: goal.metric,
      startValue: String(goal.startValue),
      targetValue: goal.targetValue === null ? "" : String(goal.targetValue),
      unit: goal.unit ?? "",
      presets: [],
    };
  }
  const range = parent ? { start: parent.startDate, end: parent.endDate } : periodRange("monthly", weekStartsOn);
  return {
    title,
    successCriteria: "",
    description: "",
    category: "",
    color: parent?.color ?? "blue",
    period: parent?.period ?? "monthly",
    startDate: range.start,
    endDate: range.end,
    metric: parent ? "milestone" : "manual",
    startValue: "",
    targetValue: "",
    unit: "",
    presets: parent ? [] : defaultPresets("monthly"),
  };
}

export function GoalFormDialog({ open, onOpenChange, goal, parent, initialTitle }: GoalFormDialogProps) {
  const isEdit = !!goal;
  const isSub = !!parent || !!goal?.parentId;
  const navigate = useNavigate();
  const weekStartsOn = useWeekStartsOn();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isPending = createGoal.isPending || updateGoal.isPending;

  const [showMore, setShowMore] = useState(false);
  const [offset, setOffset] = useState(0); // 0 = this period, 1 = the next one
  const [editDates, setEditDates] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(null);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: defaultValues(goal, parent, weekStartsOn, initialTitle),
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues(goal, parent, weekStartsOn, initialTitle));
    setOffset(0);
    setEditDates(isSub);
    setOpenDatePicker(null);
    let remembered = false;
    try { remembered = localStorage.getItem(MORE_KEY) === "1"; } catch { /* storage unavailable */ }
    setShowMore(isEdit || remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal, parent]);

  const [period, startDate, endDate, metric, color, presets] = useWatch({
    control, name: ["period", "startDate", "endDate", "metric", "color", "presets"],
  });
  const startDateValue = parseDayKey(startDate);
  const endDateValue = parseDayKey(endDate);

  const toggleMore = () => {
    const next = !showMore;
    setShowMore(next);
    try { localStorage.setItem(MORE_KEY, next ? "1" : "0"); } catch { /* storage unavailable */ }
  };

  const applyPeriod = (p: GoalPeriod, nextOffset = offset) => {
    setValue("period", p);
    if (p === "custom") {
      setEditDates(true);
      return;
    }
    const range = periodRange(p, weekStartsOn, nextOffset);
    setValue("startDate", range.start, { shouldValidate: true });
    setValue("endDate", range.end, { shouldValidate: true });
    if (!isEdit) setValue("presets", defaultPresets(p));
  };

  const togglePreset = (p: ReminderPreset) =>
    setValue("presets", presets.includes(p) ? presets.filter((x) => x !== p) : [...presets, p]);

  const onSubmit = (v: GoalFormValues) => {
    const numeric = v.metric === "numeric";
    const input: GoalInput = {
      title: v.title.trim(),
      success_criteria: v.successCriteria.trim() || null,
      description: v.description.trim() || null,
      category: v.category.trim() || null,
      color: v.color,
      period: v.period,
      start_date: v.startDate,
      end_date: v.endDate,
      metric: v.metric,
      ...(numeric && {
        start_value: v.startValue.trim() ? Number(v.startValue) : 0,
        target_value: Number(v.targetValue),
        unit: v.unit.trim() || null,
      }),
    };

    if (isEdit) {
      updateGoal.mutate({ id: goal.id, ...input }, {
        onSuccess: () => { toast.success("Goal updated"); onOpenChange(false); },
      });
      return;
    }
    createGoal.mutate(
      {
        ...input,
        ...(parent && { parent_id: parent.id }),
        ...(!parent && { reminder_presets: v.presets, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          if (parent) {
            toast.success("Sub-goal added");
          } else {
            toast.success("Goal created");
            navigate(`/goal/${created.id}`);
          }
        },
      },
    );
  };

  // a sub-goal has no sub-goals of its own, so "milestone" means a plain checkbox
  const metricOptions = METRIC_OPTIONS.map((m) =>
    isSub && m.value === "milestone" ? { ...m, label: "Checkbox", description: "Done or not done" } : m,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? (isSub ? "Edit sub-goal" : "Edit goal") : parent ? "New sub-goal" : "New goal"}
            </DialogTitle>
            <DialogDescription>
              {parent ? `A smaller step toward “${parent.title}”.` : isEdit ? "Changes are kept in the goal's history." : "Only the name is required — everything else can wait."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              placeholder={parent ? "e.g. Run 10 km without stopping" : "What do you want to achieve?"}
              autoFocus
              aria-label="Title"
              className="h-10 text-base"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {!isSub && (
            <div className="space-y-2">
              <Label>Time frame</Label>
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_OPTIONS.map((p) => (
                  <button key={p.value} type="button" className={chip(period === p.value)} onClick={() => applyPeriod(p.value)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">{startDate && endDate && formatRange(startDate, endDate)}</span>
                {period !== "custom" && period !== "half_year" && !isEdit && (
                  <button
                    type="button"
                    className="cursor-pointer underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => {
                      const next = offset ? 0 : 1;
                      setOffset(next);
                      applyPeriod(period, next);
                    }}
                  >
                    {offset ? "Use the current one" : `Start next ${period === "weekly" ? "week" : period === "monthly" ? "month" : period === "quarterly" ? "quarter" : "year"}`}
                  </button>
                )}
                {!editDates && (
                  <button type="button" className="cursor-pointer underline-offset-2 hover:text-foreground hover:underline" onClick={() => setEditDates(true)}>
                    Change dates
                  </button>
                )}
              </div>
            </div>
          )}

          {editDates && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="goal-start" className="text-xs text-muted-foreground">Start</Label>
                <Popover open={openDatePicker === "start"} onOpenChange={(open) => setOpenDatePicker(open ? "start" : null)}>
                  <PopoverTrigger asChild>
                    <Button id="goal-start" type="button" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon />
                      {startDate || <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateValue}
                      defaultMonth={startDateValue}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (!date) return;
                        setValue("startDate", format(date, "yyyy-MM-dd"), { shouldValidate: true });
                        if (!isSub) setValue("period", "custom");
                        setOpenDatePicker(null);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="goal-end" className="text-xs text-muted-foreground">{isSub ? "Due" : "End"}</Label>
                <Popover open={openDatePicker === "end"} onOpenChange={(open) => setOpenDatePicker(open ? "end" : null)}>
                  <PopoverTrigger asChild>
                    <Button id="goal-end" type="button" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon />
                      {endDate || <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateValue}
                      defaultMonth={endDateValue}
                      captionLayout="dropdown"
                      disabled={startDateValue ? { before: startDateValue } : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setValue("endDate", format(date, "yyyy-MM-dd"), { shouldValidate: true });
                        if (!isSub) setValue("period", "custom");
                        setOpenDatePicker(null);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(errors.startDate || errors.endDate) && (
                <p className="col-span-2 text-xs text-destructive">{errors.startDate?.message ?? errors.endDate?.message}</p>
              )}
            </div>
          )}

          {!isEdit && !parent && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Bell className="size-3.5" /> Reminders</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OPTIONS.map((p) => (
                  <button key={p.value} type="button" title={p.hint} className={chip(presets.includes(p.value))} onClick={() => togglePreset(p.value)}>
                    {presets.includes(p.value) && <Check className="mr-1 inline size-3" strokeWidth={3} />}
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">You can add, change or turn these off later from the goal page.</p>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={toggleMore}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} />
              More options
            </button>

            {showMore && (
              <div className="mt-4 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="goal-success">Success looks like</Label>
                  <Input id="goal-success" placeholder="How will you know you made it?" {...register("successCriteria")} />
                </div>

                <div className="space-y-2">
                  <Label>Measure progress by</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {metricOptions.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setValue("metric", m.value as GoalMetric, { shouldValidate: true })}
                        className={cn(
                          "cursor-pointer rounded-lg border px-3 py-2 text-left transition",
                          metric === m.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40",
                        )}
                      >
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-[11px] text-muted-foreground">{m.description}</p>
                      </button>
                    ))}
                  </div>

                  {metric === "numeric" && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="goal-from" className="text-xs text-muted-foreground">From</Label>
                        <Input id="goal-from" inputMode="decimal" placeholder="0" {...register("startValue")} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="goal-target" className="text-xs text-muted-foreground">Target</Label>
                        <Input id="goal-target" inputMode="decimal" placeholder="50" {...register("targetValue")} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="goal-unit" className="text-xs text-muted-foreground">Unit</Label>
                        <Input id="goal-unit" placeholder="km" {...register("unit")} />
                      </div>
                      {(errors.targetValue || errors.startValue) && (
                        <p className="col-span-3 text-xs text-destructive">{errors.targetValue?.message ?? errors.startValue?.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {!isSub && (
                  <div className="space-y-2">
                    <Label htmlFor="goal-category">Category</Label>
                    <Input id="goal-category" list="goal-categories" placeholder="e.g. Health" {...register("category")} />
                    <datalist id="goal-categories">
                      {GOAL_CATEGORIES.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                )}

                {!isSub && (
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setValue("color", c)}
                          aria-label={`Color ${c}`}
                          aria-pressed={color === c}
                          className={cn(
                            "flex size-7 cursor-pointer items-center justify-center rounded-full text-white transition hover:scale-110",
                            GOAL_COLORS[c].dot,
                            color === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                          )}
                        >
                          {color === c && <Check className="size-3.5" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="goal-description">Notes</Label>
                  <Textarea id="goal-description" rows={3} placeholder="Why it matters, how you'll approach it…" {...register("description")} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {isPending ? "Saving…" : isEdit ? "Save changes" : parent ? "Add sub-goal" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
