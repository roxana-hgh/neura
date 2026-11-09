import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDueTime, parseTimeInput, snapTime } from "@/features/tasks/utils/dueDate";
import { cn } from "@/lib/utils";

interface IProps {
  /** "HH:mm" (24h), or null for all day */
  value: string | null;
  onChange: (value: string | null) => void;
  /** No due date yet: a time on its own means nothing */
  disabled?: boolean;
}

/** Optional deadline time: one field, type it ("930", "14:30", "2:30 pm"); snaps to 5 minutes. */
function DueTimePicker({ value, onChange, disabled }: IProps) {
  // null = not editing, the field shows the saved value
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value ? formatDueTime(value) : "");
  const parsed = draft?.trim() ? parseTimeInput(draft) : null;
  const invalid = !!draft?.trim() && !parsed;

  const commit = () => {
    if (draft === null) return;
    if (!draft.trim()) {
      onChange(null);
      setDraft(null);
    } else if (parsed) {
      onChange(snapTime(parsed));
      setDraft(null);
    }
    // unreadable: keep the text so it can be fixed
  };

  return (
    <div>
      <div className="relative">
        <Input
          value={text}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape" && draft !== null) {
              e.stopPropagation();
              setDraft(null);
            }
          }}
          placeholder="All day"
          aria-label="Deadline time"
          aria-invalid={invalid}
          autoComplete="off"
          enterKeyHint="done"
          className="pe-9 tabular-nums"
        />
        {value && !disabled && draft === null ? (
          <button
            type="button"
            aria-label="Remove time (all day)"
            onClick={() => onChange(null)}
            className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Clock className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>
      <p
        aria-live="polite"
        className={cn("mt-1 px-0.5 text-xs", invalid ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}
      >
        {invalid
          ? "Try 930, 14:30 or 2:30 pm"
          : parsed
            ? `Due by ${formatDueTime(snapTime(parsed))}`
            : value
              ? `Due by ${formatDueTime(value)}`
              : "Type 930, 14:30 or 2:30 pm"}
      </p>
    </div>
  );
}

export default DueTimePicker;
