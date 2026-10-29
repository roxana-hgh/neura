import { useState } from "react";
import { Bell, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { useCreateReminder } from "@/features/reminders/hooks/useReminders";
import { formatWhen, quickTimePresets, userTimeZone } from "@/features/reminders/lib/reminderTime";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** "Remind me to…" bar: type, pick a time chip, Enter. Repeat and links live behind "More". */
export function ReminderQuickAdd() {
  const presets = quickTimePresets();
  const [title, setTitle] = useState("");
  const [presetLabel, setPresetLabel] = useState("Tomorrow 9:00");
  const [moreOpen, setMoreOpen] = useState(false);
  const createReminder = useCreateReminder();

  const preset = presets.find((p) => p.label === presetLabel) ?? presets[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const at = preset.at();
    createReminder.mutate(
      { title: title.trim(), scheduled_at: at.toISOString(), time_zone: userTimeZone() },
      {
        onSuccess: () => {
          setTitle("");
          toast.success(`Reminder set for ${formatWhen(at.toISOString())}`);
        },
      },
    );
  };

  return (
    <>
      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Remind me to…"
            aria-label="New reminder"
            maxLength={200}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" disabled={!title.trim() || createReminder.isPending}>
            <span className="text-xs">Add</span>
          </Button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-6">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPresetLabel(p.label)}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition",
                p.label === preset.label
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="size-3" /> Time, repeat, link…
          </button>
        </div>
      </form>

      {/* outside the <form>: React submit events bubble through portals */}
      <ReminderFormDialog
        open={moreOpen}
        onOpenChange={setMoreOpen}
        defaults={{ title: title.trim(), at: preset.at() }}
      />
    </>
  );
}
