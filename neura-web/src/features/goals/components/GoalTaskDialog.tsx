import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateGoalTask } from "@/features/goals/hooks/useGoals";
import { goalTaskFormSchema, type GoalTaskFormValues } from "@/features/goals/schemas/goal.schema";
import type { GoalTask } from "@/features/goals/types/goal";
import { toast } from "@/lib/toast";

const PRIORITIES = [
  { value: "high", label: "High", dot: "bg-rose-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-sky-500" },
] as const;

const toValues = (task: GoalTask | null): GoalTaskFormValues => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  priority: task?.priority ?? "medium",
  // due dates are stored as UTC midnight of the picked day
  dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  showInTasks: task?.showInTasks ?? false,
});

/** Edits a task from the goal page: title, notes, due date, priority and whether it also shows in Tasks. */
export function GoalTaskDialog({ goalId, task, open, onOpenChange }: {
  goalId: string;
  task: GoalTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateGoalTask();
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<GoalTaskFormValues>({
    resolver: zodResolver(goalTaskFormSchema),
    defaultValues: toValues(task),
  });

  useEffect(() => {
    if (open) reset(toValues(task));
  }, [open, task, reset]);

  const submit = (values: GoalTaskFormValues) => {
    if (!task) return;
    if (!isDirty) {
      onOpenChange(false);
      return;
    }
    update.mutate(
      {
        goalId,
        taskId: task.id,
        title: values.title,
        description: values.description.trim() || null,
        priority: values.priority,
        due_date: values.dueDate || null,
        show_in_tasks: values.showInTasks,
      },
      {
        onSuccess: () => {
          toast.success("Task saved");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Changes show everywhere this task appears.</DialogDescription>
        </DialogHeader>

        <form id="goal-task-form" onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-task-title">Title</Label>
            <Input id="goal-task-title" dir="auto" maxLength={100} {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-task-description">Notes</Label>
            <Textarea
              id="goal-task-description"
              dir="auto"
              rows={3}
              maxLength={1000}
              placeholder="Optional details"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-task-due">Due date</Label>
              <Input id="goal-task-due" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-task-priority">Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="goal-task-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className={`size-2 rounded-full ${p.dot}`} /> {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Controller
            control={control}
            name="showInTasks"
            render={({ field }) => (
              <Label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 font-normal">
                <Checkbox className="mt-0.5" checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />
                <span className="space-y-0.5">
                  <span className="block text-sm">Also show in my Tasks list</span>
                  <span className="block text-xs text-muted-foreground">Off: the task only lives on this goal.</span>
                </span>
              </Label>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="goal-task-form" disabled={update.isPending}>
            {update.isPending && <Spinner />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
