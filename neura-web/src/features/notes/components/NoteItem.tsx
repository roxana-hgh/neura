import { Link } from "react-router-dom";
import { Check, CircleCheckBig, Folder, FolderInput, FolderMinus, MoreHorizontal, Target } from "lucide-react";
import type { Note, NoteFolder } from "@/features/notes/types/note";
import { useSetNoteLinks } from "@/features/notes/hooks/useNotes";
import { NOTE_COLORS, getNoteColor } from "@/features/notes/utils/colorMapper";
import { formatNoteDate, getNotePreview } from "@/features/notes/utils/textPreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteItemProps {
  note: Note;
  className?: string;
  /** Show the folder chip (on "All notes", not inside the folder itself) */
  showFolder?: boolean;
  /** Folders for the "Move to folder" menu; the menu is hidden without them */
  folders?: NoteFolder[];
}

function NoteItem({ note, className = "", showFolder = false, folders }: NoteItemProps) {
  const palette = getNoteColor(note.color);
  const { text, image } = getNotePreview(note.description, note.title);
  const folder = showFolder ? note.folder : null;
  const hasLinks = !!(folder || note.goal || note.task);

  return (
    <div className={cn("group relative", className)}>
      <Link
        to={`/note/${note.id}`}
        className={cn(
          "flex h-full min-h-40 flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200",
          "bg-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 active:scale-[0.98]"
        )}
      >
        <h3 dir="auto" className={cn("line-clamp-2 font-semibold leading-snug", folders && "pe-6")}>
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
              <LinkBadge icon={<span className={cn("size-1.5 rounded-full", getNoteColor(folder.color).swatch)} />}>
                {folder.name}
              </LinkBadge>
            )}
            {note.goal && <LinkBadge icon={<Target className="size-3" />}>{note.goal.title}</LinkBadge>}
            {note.task && (
              <LinkBadge icon={<CircleCheckBig className="size-3" />}>
                <span className={cn(note.task.completed && "line-through")}>{note.task.title}</span>
              </LinkBadge>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatNoteDate(note.updatedAt ?? note.createdAt)}</span>
          {palette !== NOTE_COLORS.gray && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 font-medium text-foreground/80">
              <span className={cn("size-1.5 rounded-full", palette.swatch)} />
              {palette.label}
            </span>
          )}
        </div>
      </Link>

      {folders && <MoveToFolderMenu note={note} folders={folders} />}
    </div>
  );
}

function LinkBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-foreground/75">
      <span className="shrink-0">{icon}</span>
      <span dir="auto" className="truncate">{children}</span>
    </span>
  );
}

function MoveToFolderMenu({ note, folders }: { note: Note; folders: NoteFolder[] }) {
  const setLinks = useSetNoteLinks();
  const move = (folderId: string | null) =>
    setLinks.mutate({ id: String(note.id), links: { folder_id: folderId } });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Note actions"
          className={cn(
            "absolute top-3 right-3 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-card/80 text-muted-foreground backdrop-blur transition-opacity hover:bg-accent hover:text-foreground",
            "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 data-[state=open]:opacity-100"
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 min-w-48 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderInput className="size-3.5" /> Move to folder
        </DropdownMenuLabel>
        {folders.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No folders yet</p>
        )}
        {folders.map((f) => (
          <DropdownMenuItem key={f.id} disabled={f.id === note.folderId} onSelect={() => move(f.id)}>
            <Folder className={cn("size-4", f.id === note.folderId && "text-primary")} />
            <span dir="auto" className="min-w-0 flex-1 truncate">{f.name}</span>
            {f.id === note.folderId && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        {note.folderId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => move(null)}>
              <FolderMinus /> Remove from folder
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NoteItem;
