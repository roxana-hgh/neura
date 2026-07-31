import { CheckCircle2, PlusCircle, Trash2 } from "lucide-react";
import type { ToolAction } from "../hooks/Useassistant";
import { cn } from "../../../../lib/utils";



interface ActionBadgeProps {
  action: ToolAction;
}

export function ActionBadge({ action }: ActionBadgeProps) {
  if (action.name === "delete_task") {
    const task = action.result?.deleted;
    if (!task) return null;

    return (
      <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive animate-in fade-in slide-in-from-bottom-1 duration-300">
        <Trash2 className="h-3 w-3" />
        <span className="font-medium line-through opacity-80">{task.title}</span>
      </div>
    );
  }

  const task = action.result?.created ?? action.result?.updated;
  if (!task) return null;

  const isCreate = action.name === "create_task";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary",
        "animate-in fade-in slide-in-from-bottom-1 duration-300"
      )}
    >
      {isCreate ? <PlusCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      <span className="font-medium">{task.title}</span>
      {task.priority && <span className="opacity-70">· {task.priority}</span>}
    </div>
  );
}