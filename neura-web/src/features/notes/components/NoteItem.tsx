import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleCheckBig, Folder, ListTodo, MoreHorizontal, Target } from "lucide-react";
import { LinkPickerList } from "@/features/notes/components/links/LinkPickerPopover";
import { NewFolderInline } from "@/features/notes/components/links/NoteLinksBar";
import { useSetNoteLinks } from "@/features/notes/hooks/useNotes";
import { linkIdsOf, useNoteLinkPickers, type NoteLinkKey } from "@/features/notes/hooks/useNoteLinkPickers";
import type { Note } from "@/features/notes/types/note";
import { NOTE_COLORS, getNoteColor } from "@/features/notes/utils/colorMapper";
import { formatNoteDate, getNotePreview } from "@/features/notes/utils/textPreview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NoteItemProps {
  note: Note;
  className?: string;
  /** Show the folder chip (on "All notes", not inside the folder itself) */
  showFolder?: boolean;
  /** Show the ⋯ menu for moving / linking the note */
  menu?: boolean;
}

function NoteItem({ note, className = "", showFolder = false, menu = false }: NoteItemProps) {
  const palette = getNoteColor(note.color);
  const colored = palette !== NOTE_COLORS.gray;
  const { text, image } = getNotePreview(note.description, note.title);
  const folder = showFolder ? note.folder : null;
  const hasLinks = !!(folder || note.goal || note.task || note.list);

  return (
    <div className={cn("group relative", className)}>
      <Link
        to={`/note/${note.id}`}
        className={cn(
          "relative flex h-full min-h-40 flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200",
          "bg-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 active:scale-[0.98]"
        )}
      >
        {/* The note color is only a visual accent: a strip along the top */}
        {colored && <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", palette.swatch)} />}

        <h3 dir="auto" className={cn("line-clamp-2 font-semibold leading-snug", menu && "pe-6")}>
          {note.title || "Untitled"}
        </h3>

        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="mt-3 max-h-32 w-full rounded-lg object-cover"
          />
        )}

        <p
          dir="auto"
          className={cn(
            "mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground",
            image ? "line-clamp-2" : hasLinks ? "line-clamp-4" : "line-clamp-6"
          )}
        >
          {text}
        </p>

        {hasLinks && (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1">
            {folder && (
              <LinkBadge icon={<Folder className="size-3" />}>{folder.name}</LinkBadge>
            )}
            {note.goal && <LinkBadge icon={<Target className="size-3" />}>{note.goal.title}</LinkBadge>}
            {note.task && (
              <LinkBadge icon={<CircleCheckBig className="size-3" />}>
                <span className={cn(note.task.completed && "line-through")}>{note.task.title}</span>
              </LinkBadge>
            )}
            {note.list && <LinkBadge icon={<ListTodo className="size-3" />}>{note.list.name}</LinkBadge>}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{formatNoteDate(note.updatedAt ?? note.createdAt)}</p>
      </Link>

      {menu && <NoteLinkMenu note={note} />}
    </div>
  );
}

function LinkBadge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-foreground/75">
      <span className="shrink-0">{icon}</span>
      <span dir="auto" className="truncate">{children}</span>
    </span>
  );
}

const ROWS: { key: NoteLinkKey; label: string; icon: ReactNode }[] = [
  { key: "folderId", label: "Folder", icon: <Folder className="size-4" /> },
  { key: "goalId", label: "Goal", icon: <Target className="size-4" /> },
  { key: "taskId", label: "Task", icon: <CircleCheckBig className="size-4" /> },
  { key: "listId", label: "List", icon: <ListTodo className="size-4" /> },
];

/** ⋯ on a note card: pick a row (folder / goal / task / list), then search and pick inside the same popover. */
function NoteLinkMenu({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Move or link note"
          title="Move or link"
          className={cn(
            "absolute top-3 right-3 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-card/80 text-muted-foreground backdrop-blur transition-opacity hover:bg-accent hover:text-foreground",
            "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 data-[state=open]:opacity-100"
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        {open && <NoteLinkMenuContent note={note} onClose={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  );
}

function NoteLinkMenuContent({ note, onClose }: { note: Note; onClose: () => void }) {
  const [view, setView] = useState<NoteLinkKey | null>(null);
  const setLinks = useSetNoteLinks();
  const snake: Record<NoteLinkKey, "folder_id" | "goal_id" | "task_id" | "list_id"> = {
    folderId: "folder_id",
    goalId: "goal_id",
    taskId: "task_id",
    listId: "list_id",
  };
  const change = (key: NoteLinkKey, value: string | null) =>
    setLinks.mutate({ id: String(note.id), links: { [snake[key]]: value } });

  const { pickers } = useNoteLinkPickers({
    links: linkIdsOf(note),
    note,
    onChange: change,
    optionsEnabled: view !== null && view !== "folderId",
  });

  const current: Record<NoteLinkKey, string | undefined> = {
    folderId: note.folder?.name,
    goalId: note.goal?.title,
    taskId: note.task?.title,
    listId: note.list?.name,
  };

  if (view) {
    const row = ROWS.find((r) => r.key === view)!;
    return (
      <>
        <button
          type="button"
          onClick={() => setView(null)}
          className="flex w-full cursor-pointer items-center gap-1.5 border-b border-border px-2 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" /> {view === "folderId" ? "Move to folder" : `Link to ${row.label.toLowerCase()}`}
        </button>
        <LinkPickerList
          {...pickers[view]}
          onDone={onClose}
          footer={
            view === "folderId" ? (
              <NewFolderInline
                onCreated={(id) => {
                  change("folderId", id);
                  onClose();
                }}
              />
            ) : undefined
          }
        />
      </>
    );
  }

  return (
    <div className="p-1">
      <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">Move or link</p>
      {ROWS.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => setView(r.key)}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
        >
          <span className="text-muted-foreground">{r.icon}</span>
          <span className="shrink-0">{r.label}</span>
          <span dir="auto" className="min-w-0 flex-1 truncate text-end text-xs text-muted-foreground">
            {current[r.key] ?? "None"}
          </span>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export default NoteItem;
