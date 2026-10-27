import { useState } from "react";
import { Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReminderLinkOptions } from "@/features/reminders/hooks/useReminders";
import { LINK_ICONS } from "@/features/reminders/lib/linkIcons";
import type { ReminderLink, ReminderLinkType } from "@/features/reminders/types/reminder";
import { cn } from "@/lib/utils";

interface ReminderLinkPickerProps {
  value: ReminderLink | null;
  onChange: (link: ReminderLink | null) => void;
  /** Hide the clear button and keep the trigger read-only (e.g. inside a goal page) */
  locked?: boolean;
}

/** "Link to…" button: search goals, sub-goals, tasks and notes. A reminder has at most one link. */
export function ReminderLinkPicker({ value, onChange, locked }: ReminderLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useReminderLinkOptions(q.trim(), open);

  if (value) {
    const Icon = LINK_ICONS[value.type];
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-xs capitalize text-muted-foreground">{value.type}</span>
        <span className="min-w-0 flex-1 truncate">{value.title}</span>
        {!locked && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Remove link"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  const pick = (link: ReminderLink) => {
    onChange(link);
    setOpen(false);
    setQ("");
  };

  const sections: { type: ReminderLinkType; label: string; items: { id: string; title: string; hint?: string | null }[] }[] = [
    { type: "goal", label: "Goals", items: (data?.goals ?? []).map((g) => ({ id: g.id, title: g.title, hint: g.parentTitle })) },
    { type: "task", label: "Tasks", items: data?.tasks ?? [] },
    { type: "note", label: "Notes", items: data?.notes ?? [] },
  ];
  const empty = !isLoading && sections.every((s) => s.items.length === 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-fit text-muted-foreground">
          <Link2 className="size-4" /> Link to goal, task or note
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border p-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus className="h-8" />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {isLoading && <div className="space-y-1.5 p-2">{[0, 1, 2].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-muted" />)}</div>}
          {empty && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nothing found</p>}
          {sections.map(({ type, label, items }) => {
            if (!items.length) return null;
            const Icon = LINK_ICONS[type];
            return (
              <div key={type} className="py-1">
                <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pick({ type, id: item.id, title: item.title })}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.title || "Untitled"}</span>
                    {item.hint && <span className="max-w-24 truncate text-[11px] text-muted-foreground">in {item.hint}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
