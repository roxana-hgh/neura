import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { endOfDay, format, parseISO } from "date-fns";
import { AlignLeft, Repeat, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AlertDialog from "@/components/shared/AlertDialog";
import { ReminderLinkPicker } from "@/features/reminders/components/ReminderLinkPicker";
import { useCreateReminder, useDeleteReminder, useUpdateReminder } from "@/features/reminders/hooks/useReminders";
import {
  combineDateTime, describeRepeat, quickTimePresets, REPEAT_LABELS, userTimeZone, WEEKDAY_LETTERS,
} from "@/features/reminders/lib/reminderTime";
import { reminderFormSchema, type ReminderFormValues } from "@/features/reminders/schemas/reminder.schema";
import type { Reminder, ReminderInput, ReminderLink, ReminderRepeat } from "@/features/reminders/types/reminder";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export interface ReminderDefaults {
  title?: string;
  at?: Date;
  link?: ReminderLink | null;
}

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this reminder; omit to create one */
  reminder?: Reminder | null;
  defaults?: ReminderDefaults;
  /** Keep the link fixed (e.g. created from a goal or task) */
  lockLink?: boolean;
}

const UNIT: Record<Exclude<ReminderRepeat, "none">, string> = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };

function linkOf(r: Reminder): ReminderLink | null {
  if (r.goal) return { type: "goal", id: r.goal.id, title: r.goal.title };
  if (r.task) return { type: "task", id: r.task.id, title: r.task.title };
  if (r.note) return { type: "note", id: r.note.id, title: r.note.title };
  return null;
}

function defaultValues(reminder: Reminder | null | undefined, defaults: ReminderDefaults | undefined): ReminderFormValues {
  if (reminder) {
    const at = new Date(reminder.scheduledAt);
    return {
      title: reminder.title,
      description: reminder.description ?? "",
      date: format(at, "yyyy-MM-dd"),
      time: format(at, "HH:mm"),
      repeat: reminder.repeat,
      interval: reminder.interval,
      weekdays: reminder.weekdays,
      hasEnd: !!reminder.repeatUntil,
      endDate: reminder.repeatUntil ? format(new Date(reminder.repeatUntil), "yyyy-MM-dd") : "",
    };
  }
  const at = defaults?.at ?? quickTimePresets().find((p) => p.label === "Tomorrow 9:00")!.at();
  return {
    title: defaults?.title ?? "",
    description: "",
    date: format(at, "yyyy-MM-dd"),
    time: format(at, "HH:mm"),
    repeat: "none",
    interval: 1,
    weekdays: [],
    hasEnd: false,
    endDate: "",
  };
}

export function ReminderFormDialog({ open, onOpenChange, reminder, defaults, lockLink }: ReminderFormDialogProps) {
  const isEdit = !!reminder;
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const isPending = createReminder.isPending || updateReminder.isPending;

  const [link, setLink] = useState<ReminderLink | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: defaultValues(reminder, defaults),
  });

  // refill whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    reset(defaultValues(reminder, defaults));
    setLink(reminder ? linkOf(reminder) : defaults?.link ?? null);
    setShowDetails(!!reminder?.description);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reminder]);

  const [date, time, repeat, interval, weekdays, hasEnd] = useWatch({
    control, name: ["date", "time", "repeat", "interval", "weekdays", "hasEnd"],
  });

  const setRepeat = (value: ReminderRepeat) => {
    setValue("repeat", value);
    // weekly starts on the chosen date's weekday
    if (value === "weekly" && weekdays.length === 0 && date) setValue("weekdays", [parseISO(date).getDay()]);
  };

  const toggleWeekday = (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day];
    setValue("weekdays", next.length ? next : weekdays); // keep at least one
  };

  const applyPreset = (at: Date) => {
    setValue("date", format(at, "yyyy-MM-dd"), { shouldValidate: true });
    setValue("time", format(at, "HH:mm"), { shouldValidate: true });
  };

  const onSubmit = (values: ReminderFormValues) => {
    const at = combineDateTime(values.date, values.time);
    const repeats = values.repeat !== "none";
    const schedule: ReminderInput = {
      scheduled_at: at.toISOString(),
      time_zone: userTimeZone(),
      repeat: values.repeat,
      interval: repeats ? values.interval : 1,
      weekdays: values.repeat === "weekly" ? values.weekdays : [],
      repeat_until: repeats && values.hasEnd ? endOfDay(parseISO(values.endDate)).toISOString() : null,
    };
    const linkFields: ReminderInput = {
      goal_id: link?.type === "goal" ? link.id : null,
      task_id: link?.type === "task" ? link.id : null,
      note_id: link?.type === "note" ? link.id : null,
    };
    const base: ReminderInput = { title: values.title.trim(), description: values.description.trim() || null };

    if (isEdit) {
      const before = defaultValues(reminder, undefined);
      const scheduleChanged = (["date", "time", "repeat", "interval", "weekdays", "hasEnd", "endDate"] as const)
        .some((k) => JSON.stringify(before[k]) !== JSON.stringify(values[k]));
      const prevLink = linkOf(reminder);
      const linkChanged = prevLink?.id !== link?.id || prevLink?.type !== link?.type;
      // unchanged schedule isn't sent, so editing a title doesn't restart a series
      updateReminder.mutate(
        { id: reminder.id, ...base, ...(scheduleChanged && schedule), ...(linkChanged && linkFields) },
        { onSuccess: () => { toast.success("Reminder updated"); onOpenChange(false); } },
      );
    } else {
      createReminder.mutate(
        { ...base, ...schedule, ...linkFields },
        { onSuccess: () => { toast.success("Reminder created"); onOpenChange(false); } },
      );
    }
  };

  const summary = describeRepeat({ repeat, interval: interval || 1, weekdays });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit reminder" : "New reminder"}</DialogTitle>
              <DialogDescription className="sr-only">Title, time, repeat and link of the reminder.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Input placeholder="Remind me to…" autoFocus={!isEdit} aria-label="Title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              {showDetails ? (
                <Textarea placeholder="Details (optional)" rows={2} {...register("description")} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <AlignLeft className="size-3.5" /> Add details
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>When</Label>
              <div className="flex gap-2">
                <Input type="date" className="flex-1" {...register("date")} aria-label="Date" />
                <Input type="time" className="w-28" {...register("time")} aria-label="Time" />
              </div>
              {(errors.date || errors.time) && (
                <p className="text-xs text-destructive">{errors.date?.message ?? errors.time?.message}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {quickTimePresets().map((p) => {
                  const at = p.at();
                  const active = date === format(at, "yyyy-MM-dd") && time === format(at, "HH:mm");
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(at)}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Repeat className="size-3.5" /> Repeat</Label>
              <Controller
                control={control}
                name="repeat"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => setRepeat(v as ReminderRepeat)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(REPEAT_LABELS) as ReminderRepeat[]).map((r) => (
                        <SelectItem key={r} value={r}>{REPEAT_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {repeat !== "none" && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Every</span>
                    <Input type="number" min={1} max={365} className="h-8 w-16" {...register("interval", { valueAsNumber: true })} />
                    <span className="text-muted-foreground">{UNIT[repeat]}{interval > 1 ? "s" : ""}</span>
                  </div>
                  {errors.interval && <p className="text-xs text-destructive">{errors.interval.message}</p>}

                  {repeat === "weekly" && (
                    <div className="flex gap-1">
                      {WEEKDAY_LETTERS.map((label, day) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          aria-pressed={weekdays.includes(day)}
                          className={cn(
                            "h-7 flex-1 cursor-pointer rounded-md border text-[11px] font-medium transition",
                            weekdays.includes(day)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {label.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Ends</span>
                    <button
                      type="button"
                      onClick={() => setValue("hasEnd", false)}
                      className={cn("cursor-pointer rounded-full border px-2.5 py-0.5 text-xs", !hasEnd ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}
                    >
                      Never
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("hasEnd", true)}
                      className={cn("cursor-pointer rounded-full border px-2.5 py-0.5 text-xs", hasEnd ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}
                    >
                      On date
                    </button>
                    {hasEnd && <Input type="date" min={date} className="h-8 w-40" {...register("endDate")} />}
                  </div>
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                  {summary && <p className="text-[11px] text-muted-foreground">{summary} at {time}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Link <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <ReminderLinkPicker value={link} onChange={setLink} locked={lockLink} />
            </div>

            <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
              {isEdit ? (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save" : "Create"}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete}
        setOpen={setConfirmDelete}
        title="Delete reminder?"
        description={`"${reminder?.title ?? ""}" will be removed${reminder?.repeat !== "none" ? " with all its future occurrences" : ""}.`}
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={() => reminder && deleteReminder.mutate(reminder.id, {
          onSuccess: () => { toast.success("Reminder deleted"); onOpenChange(false); },
        })}
      />
    </>
  );
}
