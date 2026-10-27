import type { DateRangeFilter, FocusSessionTag } from "@/features/focus/types/focusSession";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAG_COLORS, TAG_LABELS } from "@/features/focus/utils/time";



const RANGES: { value: DateRangeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
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
      <div className="inline-flex items-center gap-1 rounded-full bg-neutral-50/20 dark:bg-white/5 border border-neutral-600/20 dark:border-white/10 p-1  md:p-1.5">
        {RANGES.map((r) => (
          <button
          
            key={r.value}
            onClick={() => onRangeChange(r.value)}
            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              range === r.value
                ? "bg-primary text-primary-foreground"
                : "text-neutral-600 dark:text-neutral-400 cursor-pointer"
            } `}
          >
            {r.label}
          </button>
        ))}
      </div>

     <Select value={tag} onValueChange={(v) => onTagChange(v as FocusSessionTag | "all")}>
        <SelectTrigger className="max-w-40 max-sm:w-32.5 rounded-full bg-stone-100 border-stone-200 text-stone-700 dark:bg-white/5 dark:border-white/10 dark:text-neutral-200">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-white border-stone-200 text-stone-700 dark:bg-neutral-900 dark:border-white/10 dark:text-neutral-200">
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

