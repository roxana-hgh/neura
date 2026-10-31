import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MENTION_STYLES, type MentionItem } from "@/features/assistant/lib/mentionItems";


interface MentionPickerProps {
  items: MentionItem[];
  activeIndex: number;
  onSelect: (item: MentionItem) => void;
  onHover: (index: number) => void;
}

export function MentionPicker({ items, activeIndex, onSelect, onHover }: MentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (listRef.current?.children[activeIndex] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl shadow-black/10 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="flex items-center justify-between gap-3 px-3.5 pb-1 pt-2.5 text-xs text-muted-foreground">
        <span>Mention an item</span>
        <span className="hidden md:inline">↑↓ · Enter · Esc</span>
      </div>
      <div ref={listRef} className="max-h-56 overflow-y-auto p-1 no-scrollbar">
        {items.map((item, i) => {
          const { icon: Icon, className } = MENTION_STYLES[item.type];
          return (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              // mousedown + preventDefault keeps focus in the textarea
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              onMouseEnter={() => onHover(i)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", className)} />
              <span dir="auto" className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.meta && (
                <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}