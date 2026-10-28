import { useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskForm from "@/features/tasks/components/TaskForm";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";
import type { TaskFormValues } from "@/features/tasks/schemas/task.schema";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { useProcessBrainstorm } from "@/features/brainstorms/hooks/useBrainstorms";
import { suggestFields } from "@/features/brainstorms/lib/brainstormText";
import type { Brainstorm, ConvertKind } from "@/features/brainstorms/types/brainstorm";
import { toast } from "@/lib/toast";

export interface ConvertTarget {
  item: Brainstorm;
  kind: ConvertKind;
}

interface BrainstormConvertDialogsProps {
  target: ConvertTarget | null;
  onClose: () => void;
  /** After the task / reminder exists and the item has left the inbox */
  onConverted?: (target: ConvertTarget) => void;
}

/** The original jotted text, shown above the form for reference */
function Original({ content }: { content: string }) {
  return (
    <div className="flex gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <p dir="auto" className="line-clamp-4 whitespace-pre-wrap break-words text-xs text-muted-foreground">{content}</p>
    </div>
  );
}

/**
 * Turn a brainstorm into a task or a reminder. The forms are prefilled from the text
 * (first line = title) and can be changed freely before saving.
 */
export function BrainstormConvertDialogs({ target, onClose, onConverted }: BrainstormConvertDialogsProps) {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const process = useProcessBrainstorm();

  const item = target?.item;
  const taskFields = item ? suggestFields(item.content, "task") : null;
  const reminderFields = item ? suggestFields(item.content, "reminder") : null;

  const handleTask = (values: TaskFormValues) => {
    if (!target) return;
    createTask.mutate(values, {
      onSuccess: (task) => {
        process.mutate({ id: target.item.id, taskId: String(task.id) });
        toast.success("Moved to your tasks", { action: { label: "Open", onClick: () => navigate("/tasks") } });
        onConverted?.(target);
        onClose();
      },
      onError: (error) => toast.error(`Couldn't create the task: ${error.message}`),
    });
  };

  return (
    <>
      <Dialog open={target?.kind === "task"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Turn into a task</DialogTitle>
            <DialogDescription>Give it a clear title and the details you need. It leaves your inbox once saved.</DialogDescription>
          </DialogHeader>
          {item && taskFields && (
            <div className="space-y-4">
              <Original content={item.content} />
              <TaskForm
                key={item.id}
                initialValues={{ title: taskFields.title, description: taskFields.description || null }}
                onSubmit={handleTask}
                submitLabel="Create task"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReminderFormDialog
        open={target?.kind === "reminder"}
        onOpenChange={(open) => !open && onClose()}
        defaults={reminderFields ?? undefined}
        onSaved={(reminder) => {
          if (!target) return;
          process.mutate({ id: target.item.id, reminderId: reminder.id });
          onConverted?.(target);
        }}
      />
    </>
  );
}
