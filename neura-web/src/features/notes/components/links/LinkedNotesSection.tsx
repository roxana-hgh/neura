import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Link2, Plus, StickyNote, Unlink } from "lucide-react";
import LinkPickerPopover from "@/features/notes/components/links/LinkPickerPopover";
import { useLinkedNotes, useNoteList, useSetNoteLinks } from "@/features/notes/hooks/useNotes";
import type { Note, NoteLinkTarget } from "@/features/notes/types/note";
import { formatNoteDate, getNotePreview } from "@/features/notes/utils/textPreview";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LinkedNotesSectionProps {
  target: NoteLinkTarget;
  /** "compact" = small uppercase label (task detail modal); "card" = page panel (list page) */
  variant?: "compact" | "card";
}

const linkedTo = (n: Note, type: NoteLinkTarget["type"]) =>
  type === "task" ? n.task?.title : n.list?.name;

/** Notes linked to a task or task list: open, unlink, link an existing note, write a new one. */
export default function LinkedNotesSection({ target, variant = "compact" }: LinkedNotesSectionProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: notes = [], isLoading } = useLinkedNotes(target);
  const { data: allNotes = [], isLoading: allLoading } = useNoteList(pickerOpen);
  const setLinks = useSetNoteLinks();
  const busyId = setLinks.isPending ? setLinks.variables?.id : null;
  const key = target.type === "task" ? "task_id" : "list_id";
  const isCard = variant === "card";

  const candidates = allNotes.filter((n) => (target.type === "task" ? n.taskId : n.listId) !== target.id);

  return (
    <div className={cn(isCard ? "rounded-xl border border-border bg-card p-4" : "space-y-1.5")}>
      <div className={cn("flex items-center justify-between gap-2", isCard && "mb-2")}>
        {isCard ? (
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <StickyNote className="size-4 text-primary" /> Notes
            {notes.length > 0 && <span className="text-xs font-normal text-muted-foreground">{notes.length}</span>}
          </h2>
        ) : (
          <h3 className="text-[10px] font-medium tracking-wide text-neutral-600 uppercase dark:text-neutral-400">
            Notes
          </h3>
        )}
        <div className="flex items-center">
          <LinkPickerPopover
            align="end"
            onOpenChange={setPickerOpen}
            trigger={
              <Button variant="ghost" size="xs" className="text-muted-foreground">
                <Link2 /> Link note
              </Button>
            }
            items={candidates.map((n) => {
              const current = linkedTo(n, target.type);
              return {
                id: String(n.id),
                label: n.title || "Untitled",
                hint: current ? `Linked to: ${current}` : n.folder?.name ?? null,
                icon: <StickyNote className="size-3.5 shrink-0 text-muted-foreground" />,
              };
            })}
            onSelect={(id) => setLinks.mutate({ id, links: { [key]: target.id } })}
            placeholder="Search notes…"
            emptyText="No notes to link"
            loading={allLoading}
          />
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => navigate(`/note/new?${target.type}=${target.id}`)}
          >
            <Plus /> New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      ) : notes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
          No notes yet. Write one for research, meeting notes or a plan.
        </p>
      ) : (
        <div className={cn("divide-y divide-border/60", !isCard && "rounded-md border border-border")}>
          {notes.map((n) => {
            const id = String(n.id);
            const { text } = getNotePreview(n.description, n.title);
            return (
              <div key={id} className={cn("group flex items-start gap-2.5 px-3 py-2", busyId === id && "opacity-60")}>
                <StickyNote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <Link to={`/note/${id}`} className="min-w-0 flex-1">
                  <p dir="auto" className={cn("truncate font-medium hover:underline", isCard ? "text-sm" : "text-xs")}>
                    {n.title || "Untitled"}
                  </p>
                  {text && <p dir="auto" className="line-clamp-1 text-[11px] text-muted-foreground">{text}</p>}
                </Link>
                <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">{formatNoteDate(n.updatedAt)}</span>
                <button
                  type="button"
                  disabled={busyId === id}
                  onClick={() => setLinks.mutate({ id, links: { [key]: null } })}
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
