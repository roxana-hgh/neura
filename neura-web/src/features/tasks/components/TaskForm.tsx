/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { parse as parseNaturalDate } from "chrono-node";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskSchema } from "@/features/tasks/schemas/task.schema";
import type { TaskFormInput, TaskFormValues } from "@/features/tasks/schemas/task.schema";
import type { Task } from "@/features/tasks/types/task";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import { useTaskTags } from "@/features/tasks/hooks/useTaskTags";
import TagChip from "@/features/tasks/components/tags/TagChip";
import TagPicker from "@/features/tasks/components/tags/TagPicker";
import DueTimePicker from "@/features/tasks/components/DueTimePicker";
import TaskRepeatPicker, { type TaskRepeatValue } from "@/features/tasks/components/TaskRepeatPicker";
import { dueDay, formatDueTime } from "@/features/tasks/utils/dueDate";



interface IProps {
  initialValues?: Partial<Task>;
  // defaultListId: the list to pre-select when opening the form.
  // Pass the current list's id when opening from a list page,
  // or null / undefined when opening from the "All Tasks" page.
  defaultListId?: string | number | null;
  onSubmit: (task: TaskFormValues) => void;
  submitLabel: string;
}

function formatDateValue(value: Date | null | undefined): string {
  return value ? format(value, "yyyy-MM-dd") : "";
}

/** Right-hand hint above the date field: "Tue, Nov 10 · 2:30 PM" */
function formatDueHint(date: Date | undefined, time: string | null): string {
  if (!date) return "";
  return format(date, "EEE, MMM d") + (time ? ` · ${formatDueTime(time)}` : "");
}

function TaskForm({ initialValues, defaultListId, onSubmit, submitLabel }: IProps) {
  const lists = useTasksStore((s) => s.lists);
  const { data: allTags } = useTaskTags();
  // the task's own tags render right away, before GET /tasks/tags answers
  const tagsById = new Map([...(initialValues?.tags ?? []), ...(allTags ?? [])].map((t) => [t.id, t]));

  const [open, setOpen] = useState(false);
  const initialDay = initialValues?.due_date ? dueDay({ due_date: initialValues.due_date }) : null;
  const [dateInput, setDateInput] = useState<string>(formatDateValue(initialDay));
  const [date, setDate] = useState<Date | undefined>(initialDay ?? undefined);
  const [loader, setLoader] = useState(false);

  // Resolve the effective default list_id:
  // 1. If editing an existing task, use its own list_id
  // 2. Otherwise fall back to defaultListId (the page we're on)
  const effectiveListId =
    initialValues?.list_id !== undefined
      ? initialValues.list_id
      : (defaultListId ?? null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TaskFormInput, unknown, TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      priority: initialValues?.priority ?? "medium",
      description: initialValues?.description ?? null,
      due_date: initialValues?.due_date ?? null,
      due_time: initialValues?.due_time ?? null,
      list_id: effectiveListId,
      tag_ids: initialValues?.tags?.map((t) => t.id) ?? [],
      repeat: initialValues?.repeat ?? "none",
      repeat_interval: initialValues?.repeat_interval ?? 1,
      repeat_weekdays: initialValues?.repeat_weekdays ?? [],
      repeat_until: initialValues?.repeat_until ? initialValues.repeat_until.slice(0, 10) : null,
    },
  });

  // Sync date picker if initialValues change (e.g. edit modal opens)
  useEffect(() => {
    const day = initialValues?.due_date ? dueDay({ due_date: initialValues.due_date }) : null;
    setDateInput(formatDateValue(day));
    setDate(day ?? undefined);
  }, [initialValues?.due_date]);

  const dueTime = useWatch({ control, name: "due_time" }) ?? null;
  const setDueTime = (time: string | null) => setValue("due_time", time, { shouldDirty: true });

  const [repeat, repeatInterval, repeatWeekdays, repeatUntil] = useWatch({
    control,
    name: ["repeat", "repeat_interval", "repeat_weekdays", "repeat_until"],
  });
  const repeatValue: TaskRepeatValue = {
    repeat: repeat ?? "none",
    interval: repeatInterval ?? 1,
    weekdays: repeatWeekdays ?? [],
    until: repeatUntil ?? null,
  };
  const setRepeat = (next: TaskRepeatValue) => {
    // a repeating task needs a due date: start today when none is picked
    if (next.repeat !== "none" && !date) {
      const today = new Date();
      setDate(today);
      setDateInput(formatDateValue(today));
    }
    setValue("repeat", next.repeat, { shouldDirty: true });
    setValue("repeat_interval", next.interval, { shouldDirty: true, shouldValidate: true });
    setValue("repeat_weekdays", next.weekdays, { shouldDirty: true });
    setValue("repeat_until", next.until, { shouldDirty: true });
  };

  const onValidSubmit = (data: TaskFormValues) => {
    setLoader(true);

    onSubmit({
      ...data,
      due_date: date ? format(date, "yyyy-MM-dd") : null,
      // a time only makes sense on a date
      due_time: date ? data.due_time : null,
      list_id: data.list_id,
      // so does repeating (the API clears it without a date too)
      ...(date && data.repeat && data.repeat !== "none"
        ? {
            repeat: data.repeat,
            repeat_interval: data.repeat_interval ?? 1,
            repeat_weekdays: data.repeat === "weekly" ? data.repeat_weekdays : [],
            repeat_until: data.repeat_until || null,
          }
        : { repeat: "none" as const }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)}>
      <div className="grid grid-cols-2 gap-4 mb-3">

        {/* ── Title ── */}
        <div className="col-span-2">
          <Label className="mb-2">Title</Label>
          <Input {...register("title")} placeholder="Task title" />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* ── Due date + time ── */}
        <div className="col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Due Date */}
            <div className="col-span-1">
              <div className="flex justify-between items-end mb-2">
                <Label>Due Date</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDueHint(date, dueTime)}
                </span>
              </div>
              <InputGroup>
                <InputGroupInput
                  value={dateInput}
                  placeholder="Tomorrow 8pm, next week…"
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDateInput(nextValue);

                    if (!nextValue) {
                      setDate(undefined);
                      return;
                    }

                    // "tomorrow 5pm" also fills the time; "tomorrow" alone leaves it as it was
                    const [result] = parseNaturalDate(nextValue);
                    setDate(result?.date() ?? undefined);
                    if (result?.start.isCertain("hour")) {
                      setDueTime(format(result.date(), "HH:mm"));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <InputGroupButton
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Select date"
                        className="px-1"
                      >
                        <CalendarIcon />
                        <span className="sr-only">Select date</span>
                      </InputGroupButton>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="end"
                      sideOffset={8}
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        defaultMonth={date}
                        onSelect={(selected) => {
                          setDate(selected);
                          setDateInput(formatDateValue(selected));
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </InputGroupAddon>
              </InputGroup>
            </div>

            {/* Time (optional) */}
            <div className="col-span-1">
              <div className="flex justify-between items-end mb-2">
                <Label>Time</Label>
                <span className="text-xs text-muted-foreground">
                  {date ? "Optional" : "Pick a date first"}
                </span>
              </div>
              <DueTimePicker value={date ? dueTime : null} onChange={setDueTime} disabled={!date} />
              {errors.due_time && (
                <p className="text-sm text-red-500 mt-1">{errors.due_time.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Priority + List ── */}
        <div className="col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div className="col-span-1">
              <Label className="mb-2">Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* List */}
            <div className="col-span-1">
              <Label className="mb-2">List</Label>
              <Controller
                name="list_id"
                control={control}
                render={({ field }) => (
                  <Select
                    // Select requires string values — we convert null to the
                    // sentinel string "none" and convert back on change
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No list" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No list</span>
                      </SelectItem>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={String(list.id)}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${getListColorClass(list.color)}`}
                            />
                            {list.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.list_id && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.list_id.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Repeat ── */}
        <div className="col-span-2">
          <TaskRepeatPicker
            value={repeatValue}
            onChange={setRepeat}
            dueDate={date}
            error={errors.repeat_interval?.message}
          />
        </div>

        {/* ── Tags ── */}
        <div className="col-span-2">
          <Label className="mb-2">Tags</Label>
          <Controller
            name="tag_ids"
            control={control}
            render={({ field }) => {
              const ids = field.value ?? [];
              return (
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 shadow-xs dark:bg-input/30">
                  {ids.map((id) => {
                    const tag = tagsById.get(id);
                    return tag ? (
                      <TagChip
                        key={id}
                        tag={tag}
                        onRemove={() => field.onChange(ids.filter((x) => x !== id))}
                      />
                    ) : null;
                  })}
                  <TagPicker
                    selectedIds={ids}
                    onChange={field.onChange}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Plus className="size-3" />
                        {ids.length ? "Add" : "Add tags"}
                      </button>
                    }
                  />
                </div>
              );
            }}
          />
        </div>

        {/* ── Description ── */}
        <div className="col-span-2 mb-3">
          <Label className="mb-2">Description</Label>
          <Textarea
            {...register("description")}
            placeholder="Add a description..."
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loader}>
        {loader ? <Spinner /> : submitLabel}
      </Button>
    </form>
  );
}

export default TaskForm;