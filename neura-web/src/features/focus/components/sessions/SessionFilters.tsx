import type { DateRangeFilter, FocusSessionTag } from "@/features/focus/types/focusSession";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAG_COLORS, TAG_LABELS } from "@/features/focus/utils/time";
import { cn } from "@/lib/utils";

const RANGES: { value: DateRangeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];
const TAGS: FocusSessionTag[] = ["work", "personal", "study", "break", "other"];

interface Props {
  range: DateRangeFilter;
  onRangeChange: (r: DateRangeFilter) => void;
  tag: FocusSessionTag | "all";
  onTagChange: (t: FocusSessionTag | "all") => void;
}

function SessionFilters({ range, onRangeChange, tag, onTagChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onRangeChange(r.value)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
              range === r.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Select value={tag} onValueChange={(v) => onTagChange(v as FocusSessionTag | "all")}>
        <SelectTrigger size="sm" className="w-36 rounded-full">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {TAGS.map((t) => (
            <SelectItem key={t} value={t}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${TAG_COLORS[t]}`} />
                {TAG_LABELS[t]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default SessionFilters;
