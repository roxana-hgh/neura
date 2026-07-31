import { LucideClock } from "lucide-react";
import { format } from "date-fns";
import type { FocusSession } from "../../../../types/FocusSession";
import { formatDurationClock, TAG_BADGE_CLASSES, TAG_LABELS } from "../utils/time";


interface Props {
  session: FocusSession;
  onEdit: () => void;
  onDelete: () => void;
}

function SessionCard({ session, onEdit, onDelete }: Props) {
  const tagKey = session.tag ?? "untagged";

  return (
    <div className="group relative rounded-2xl border border-stone-200 bg-white hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 transition-colors p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TAG_BADGE_CLASSES[tagKey]}`}>
          {TAG_LABELS[tagKey]}
        </span>
        <span className="text-[11px] text-stone-400 dark:text-neutral-500">{format(new Date(session.startTime), "M/d/yyyy")}</span>
      </div>

      <p className="text-sm font-semibold tracking-tight leading-snug mb-3 line-clamp-2 min-h-[2.5rem]">
        {session.name}
      </p>

      <div className="h-px bg-stone-200 dark:bg-white/10 mb-3" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-stone-600 dark:text-neutral-300">
          <LucideClock size={13} className="text-stone-400 dark:text-neutral-500" />
          <span className="font-mono text-xs">{formatDurationClock(session.duration)}</span>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white">Edit</button>
          <button onClick={onDelete} className="text-[11px] text-stone-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
