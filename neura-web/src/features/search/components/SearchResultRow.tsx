import { CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import HighlightText from "@/features/search/components/HighlightText";
import { SEARCH_GROUPS } from "@/features/search/lib/searchItems";
import type { SearchItem } from "@/features/search/types/search";

interface Props {
  item: SearchItem;
  query: string;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}

function SearchResultRow({ item, query, index, active, onSelect, onHover }: Props) {
  const { icon: Icon, tone } = SEARCH_GROUPS[item.type];

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-index={index}
      onClick={onSelect}
      onMouseMove={onHover}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
        active ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", tone)}>
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <HighlightText
            text={item.title}
            query={query}
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              item.done && "text-muted-foreground line-through decoration-muted-foreground/40",
            )}
          />
          {item.meta && (
            <span className="hidden shrink-0 text-[11px] tabular-nums text-muted-foreground sm:inline">
              {item.meta}
            </span>
          )}
        </span>
        {(item.snippet || item.meta) && (
          <span className="mt-0.5 flex items-baseline gap-1.5 text-xs text-muted-foreground">
            {item.meta && <span className="shrink-0 tabular-nums sm:hidden">{item.meta}</span>}
            {item.meta && item.snippet && <span className="sm:hidden">·</span>}
            {item.snippet && <HighlightText text={item.snippet} query={query} className="min-w-0 truncate" />}
          </span>
        )}
      </span>

      <CornerDownLeft
        className={cn("hidden size-3.5 shrink-0 text-muted-foreground sm:block", active ? "opacity-100" : "opacity-0")}
      />
    </button>
  );
}

export default SearchResultRow;
