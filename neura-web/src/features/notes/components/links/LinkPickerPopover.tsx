import { useState, type ReactNode } from "react";
import { Check, Unlink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface PickerItem {
  id: string;
  label: string;
  hint?: string | null;
  icon?: ReactNode;
}

interface LinkPickerPopoverProps {
  trigger: ReactNode;
  items: PickerItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /** Shows a "Remove" row when something is selected */
  onClear?: () => void;
  clearLabel?: string;
  placeholder: string;
  emptyText?: string;
  loading?: boolean;
  /** Extra content under the list, e.g. "New folder"; gets a `close` callback */
  footer?: (close: () => void) => ReactNode;
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
}

/** Search-and-pick list in a popover (folder, goal, task or note). */
export default function LinkPickerPopover({
  trigger,
  items,
  selectedId,
  onSelect,
  onClear,
  clearLabel = "Remove link",
  placeholder,
  emptyText = "Nothing found",
  loading,
  footer,
  align = "start",
  onOpenChange,
}: LinkPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const query = q.toLowerCase().trim();
  const filtered = query ? items.filter((i) => i.label.toLowerCase().includes(query)) : items;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQ("");
    onOpenChange?.(next);
  };
  const close = () => changeOpen(false);

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-0">
        <div className="border-b border-border p-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            dir="auto"
            className="h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {selectedId && onClear && !query && (
            <button
              type="button"
              onClick={() => {
                onClear();
                close();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              <Unlink className="size-3.5" /> {clearLabel}
            </button>
          )}
          {loading && <div className="m-2 h-6 animate-pulse rounded bg-muted" />}
          {!loading && filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
          )}
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => {
                if (i.id !== selectedId) onSelect(i.id);
                close();
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                i.id === selectedId && "bg-accent/60"
              )}
            >
              {i.icon}
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block truncate">{i.label}</span>
                {i.hint && <span dir="auto" className="block truncate text-[11px] text-muted-foreground">{i.hint}</span>}
              </span>
              {i.id === selectedId && <Check className="size-3.5 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
        {footer && <div className="border-t border-border p-1">{footer(close)}</div>}
      </PopoverContent>
    </Popover>
  );
}
