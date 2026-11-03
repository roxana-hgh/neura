import { X } from "lucide-react";
import type { TaskTag } from "@/features/tasks/types/task";
import { TAG_STYLES } from "@/features/tasks/utils/taskTags";
import { cn } from "@/lib/utils";

interface IProps {
  tag: Pick<TaskTag, "name" | "color">;
  /** Shows an × button that calls this */
  onRemove?: () => void;
  size?: "sm" | "md";
  /** Greyed out, e.g. on a completed task */
  muted?: boolean;
  className?: string;
}

/** Tinted pill with a color dot, used everywhere a tag is shown. */
function TagChip({ tag, onRemove, size = "md", muted = false, className }: IProps) {
  const style = TAG_STYLES[tag.color] ?? TAG_STYLES.gray;

  return (
    <span
      className={cn(
        "inline-flex max-w-40 min-w-0 items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        muted ? "bg-muted text-muted-foreground ring-border" : style.chip,
        onRemove && "pr-0.5",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", muted ? "bg-muted-foreground/50" : style.dot)} />
      <span dir="auto" className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-60 transition hover:bg-foreground/10 hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export default TagChip;
