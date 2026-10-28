import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CircleCheckBig, CircleSlash, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrainstormEditor } from "@/features/brainstorms/components/BrainstormEditor";
import { exactTime, isNew, timeAgo } from "@/features/brainstorms/lib/brainstormText";
import type { Brainstorm, ConvertKind } from "@/features/brainstorms/types/brainstorm";
import { cn } from "@/lib/utils";

interface BrainstormItemProps {
  item: Brainstorm;
  onConvert: (item: Brainstorm, kind: ConvertKind) => void;
  onDismiss: (item: Brainstorm) => void;
  onRestore: (item: Brainstorm) => void;
  onDelete: (item: Brainstorm) => void;
}

/** Where a processed item went */
function OutcomeChip({ item }: { item: Brainstorm }) {
  const base = "inline-flex max-w-56 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]";
  if (item.convertedTo === "task") {
    return (
      <Link to="/tasks" className={cn(base, "bg-primary/10 text-primary hover:bg-primary/15")}>
        <CircleCheckBig className="size-3 shrink-0" />
        <span className={cn("truncate", item.task?.completed && "line-through")}>
          {item.task ? item.task.title : "Task (deleted)"}
        </span>
      </Link>
    );
  }
  if (item.convertedTo === "reminder") {
    return (
      <Link to="/reminders" className={cn(base, "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400")}>
        <Bell className="size-3 shrink-0" />
        <span className="truncate">{item.reminder ? item.reminder.title : "Reminder (deleted)"}</span>
      </Link>
    );
  }
  return (
    <span className={cn(base, "bg-muted text-muted-foreground")}>
      <CircleSlash className="size-3" /> Let go
    </span>
  );
}

export function BrainstormItem({ item, onConvert, onDismiss, onRestore, onDelete }: BrainstormItemProps) {
  const [editing, setEditing] = useState(false);
  const processed = item.status === "processed";
  const fresh = !processed && isNew(item);

  return (
    <div className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40 sm:px-3">
      <span
        className={cn(
          "mt-2 size-2 shrink-0 rounded-full",
          processed ? "bg-muted-foreground/30" : fresh ? "bg-primary" : "bg-muted-foreground/40",
        )}
        title={fresh ? "New since your last reset" : undefined}
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <BrainstormEditor item={item} onDone={() => setEditing(false)} />
        ) : (
          <button
            type="button"
            onClick={() => !processed && setEditing(true)}
            className={cn("block w-full text-left", !processed && "cursor-text")}
            title={processed ? undefined : "Click to edit"}
          >
            <p
              dir="auto"
              className={cn(
                "whitespace-pre-wrap break-words text-sm leading-relaxed",
                processed && "text-muted-foreground",
              )}
            >
              {item.content}
            </p>
          </button>
        )}

        {!editing && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            <span title={exactTime(item.createdAt)}>{timeAgo(item.createdAt)}</span>
            {fresh && <span className="rounded-full bg-primary/10 px-1.5 font-medium text-primary">New</span>}
            {processed && (
              <>
                <span aria-hidden>→</span>
                <OutcomeChip item={item} />
              </>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          {!processed && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onConvert(item, "task")}
                className="text-muted-foreground hover:text-foreground"
                title="Turn into a task"
              >
                <CircleCheckBig /> <span className="hidden md:inline">Task</span>
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onConvert(item, "reminder")}
                className="text-muted-foreground hover:text-foreground"
                title="Set a reminder"
              >
                <Bell /> <span className="hidden md:inline">Remind</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDismiss(item)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Done, let it go"
                title="Done, let it go"
              >
                <Check />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="More actions" className="text-muted-foreground">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {processed ? (
                <DropdownMenuItem onSelect={() => onRestore(item)}><RotateCcw /> Back to inbox</DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onSelect={() => setEditing(true)}><Pencil /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onConvert(item, "task")}><CircleCheckBig /> Turn into a task</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onConvert(item, "reminder")}><Bell /> Set a reminder</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onDismiss(item)}><Check /> Done, let it go</DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
