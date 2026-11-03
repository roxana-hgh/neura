import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Link2, Plus, StickyNote, Unlink } from "lucide-react";
import LinkPickerPopover from "@/features/notes/components/links/LinkPickerPopover";
import { useNoteList, useSetNoteLinks, useTaskNotes } from "@/features/notes/hooks/useNotes";
import { formatNoteDate, getNotePreview } from "@/features/notes/utils/textPreview";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Notes linked to a task, shown in the task detail modal: open, unlink, link existing, write new. */
export default function TaskNotesSection({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: notes = [], isLoading } = useTaskNotes(taskId);
  const { data: allNotes = [], isLoading: allLoading } = useNoteList(pickerOpen);
  const setLinks = useSetNoteLinks();
  const busyId = setLinks.isPending ? setLinks.variables?.id : null;

  const candidates = allNotes.filter((n) => n.taskId !== taskId);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-medium tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
          Notes
        </h3>
        <div className="flex items-center">
          <LinkPickerPopover
            align="end"
            onOpenChange={setPickerOpen}
            trigger={
              <Button variant="ghost" size="xs" className="text-muted-foreground">
                <Link2 /> Link note
              </Button>
            }
            items={candidates.map((n) => ({
              id: String(n.id),
              label: n.title || "Untitled",
              hint: n.task ? `Linked to: ${n.task.title}` : n.folder?.name ?? null,
              icon: <StickyNote className="size-3.5 shrink-0 text-muted-foreground" />,
            }))}
            onSelect={(id) => setLinks.mutate({ id, links: { task_id: taskId } })}
            placeholder="Search notes…"
            emptyText="No notes to link"
            loading={allLoading}
          />
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => navigate(`/note/new?task=${taskId}`)}
          >
            <Plus /> New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      ) : notes.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300/60 px-3 py-2.5 text-xs text-muted-foreground dark:border-neutral-800/60">
          No notes yet. Write one for research, meeting notes or a plan.
        </p>
      ) : (
        <div className="divide-y divide-border/60 rounded-md border border-neutral-300/50 dark:border-neutral-800/50">
          {notes.map((n) => {
            const id = String(n.id);
            const { text } = getNotePreview(n.description, n.title);
            return (
              <div key={id} className={cn("group flex items-start gap-2.5 px-3 py-2", busyId === id && "opacity-60")}>
                <StickyNote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <Link to={`/note/${id}`} className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-xs font-medium hover:underline">{n.title || "Untitled"}</p>
                  {text && <p dir="auto" className="line-clamp-1 text-[11px] text-muted-foreground">{text}</p>}
                </Link>
                <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">{formatNoteDate(n.updatedAt)}</span>
                <button
                  type="button"
                  disabled={busyId === id}
                  onClick={() => setLinks.mutate({ id, links: { task_id: null } })}
                  aria-label="Unlink note"
                  title="Unlink (the note is kept)"
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                >
                  {busyId === id ? <Spinner className="size-3" /> : <Unlink className="size-3" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
