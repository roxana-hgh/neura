import { LucideClock, LucidePencil, LucideTrash2 } from "lucide-react";
import { format } from "date-fns";
import type { FocusSession } from "@/features/focus/types/focusSession";
import { formatDuration, TAG_BADGE_CLASSES, TAG_LABELS } from "@/features/focus/utils/time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  session: FocusSession;
  onEdit: () => void;
  onDelete: () => void;
}

function SessionCard({ session, onEdit, onDelete }: Props) {
  const tagKey = session.tag ?? "untagged";
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);

  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", TAG_BADGE_CLASSES[tagKey])}>
          {TAG_LABELS[tagKey]}
        </span>
        <span className="text-[11px] text-muted-foreground">{format(start, "MMM d")}</span>
      </div>

      <p className="mb-1 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground" title={session.name}>
        {session.name}
      </p>
      {session.description && (
        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{session.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-foreground">
            <LucideClock size={13} className="text-muted-foreground" />
            <span className="text-sm font-semibold tabular-nums">{formatDuration(session.duration)}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {format(start, "HH:mm")} – {format(end, "HH:mm")}
          </p>
        </div>

        {/* Always visible on touch screens, on hover / focus on larger ones */}
        <div className="flex gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button size="icon-sm" variant="ghost" className="size-7 rounded-full" aria-label="Edit session" onClick={onEdit}>
            <LucidePencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="size-7 rounded-full text-muted-foreground hover:text-destructive"
            aria-label="Delete session"
            onClick={onDelete}
          >
            <LucideTrash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
