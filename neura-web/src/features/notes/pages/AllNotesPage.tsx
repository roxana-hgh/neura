import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Plus,
  SearchIcon,
  Target,
  Trash2,
  X,
} from "lucide-react";
import NoteItem from "@/features/notes/components/NoteItem";
import FolderFormDialog from "@/features/notes/components/folders/FolderFormDialog";
import DeleteFolderDialog from "@/features/notes/components/folders/DeleteFolderDialog";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useNoteFolders } from "@/features/notes/hooks/useNoteFolders";
import { useNotesStore } from "@/features/notes/stores/notesStore";
import type { NoteFolder } from "@/features/notes/types/note";
import { getNoteColor } from "@/features/notes/utils/colorMapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** "all" | "unfiled" | a folder id, kept in the URL (?folder=) so a folder can be linked to */
type FolderFilter = string;

function AllNotesPage() {
  const { notes, total, isLoading } = useNotes();
  const { data: folders = [], isFetched: foldersFetched } = useNoteFolders();
  const search = useNotesStore((s) => s.search);
  const setSearch = useNotesStore((s) => s.setSearch);
  const [params, setParams] = useSearchParams();
  const [folderDialog, setFolderDialog] = useState<{ folder: NoteFolder | null } | null>(null);
  const [deleting, setDeleting] = useState<NoteFolder | null>(null);

  const requested: FolderFilter = params.get("folder") ?? "all";
  const current = folders.find((f) => f.id === requested) ?? null;
  // a link to a deleted folder falls back to all notes once the folders have loaded
  const filter: FolderFilter =
    requested === "all" || requested === "unfiled" || current || !foldersFetched ? requested : "all";

  const setFilter = (value: FolderFilter) =>
    setParams(value === "all" ? {} : { folder: value }, { replace: true });

  const visible =
    filter === "all" ? notes : notes.filter((n) => (filter === "unfiled" ? !n.folderId : n.folderId === filter));
  const unfiledCount = Math.max(0, total - folders.reduce((sum, f) => sum + f.noteCount, 0));
  const newNoteHref = current ? `/note/new?folder=${current.id}` : "/note/new";

  return (
    <div className="mx-auto max-w-6xl pb-24 sm:pb-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading ? " " : `${total} ${total === 1 ? "note" : "notes"}`}
            {!isLoading && folders.length > 0 && ` · ${folders.length} ${folders.length === 1 ? "folder" : "folders"}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setFolderDialog({ folder: null })}>
            <FolderPlus className="size-3.5" /> <span className="text-xs">New folder</span>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to={newNoteHref}>
              <Plus className="size-3.5" /> <span className="text-xs">New note</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={current ? `Search in ${current.name}` : "Search notes"}
          aria-label="Search notes"
          className="h-11 rounded-full border-transparent bg-muted/60 pr-10 pl-10 shadow-none focus-visible:border-ring"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Folder chips */}
      {(folders.length > 0 || filter !== "all") && (
        <div className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar" role="tablist" aria-label="Folders">
          <FolderChip active={filter === "all"} onClick={() => setFilter("all")} icon={<NotebookPen className="size-3.5" />} count={total}>
            All notes
          </FolderChip>
          <FolderChip active={filter === "unfiled"} onClick={() => setFilter("unfiled")} icon={<Inbox className="size-3.5" />} count={unfiledCount}>
            Unfiled
          </FolderChip>
          {folders.map((f) => (
            <FolderChip
              key={f.id}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
              icon={<span className={cn("size-2 rounded-full", getNoteColor(f.color).swatch)} />}
              count={f.noteCount}
            >
              {f.name}
            </FolderChip>
          ))}
          <button
            type="button"
            onClick={() => setFolderDialog({ folder: null })}
            aria-label="New folder"
            title="New folder"
            className="flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-dashed px-2.5 text-muted-foreground hover:border-solid hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      )}

      {current && (
        <FolderHeader
          folder={current}
          onEdit={() => setFolderDialog({ folder: current })}
          onDelete={() => setDeleting(current)}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((note) => (
            <NoteItem key={note.id} note={note} showFolder={filter === "all"} folders={folders} />
          ))}
        </div>
      ) : search ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No notes match “{search}”.
        </div>
      ) : filter !== "all" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <FolderOpen className="size-8 text-muted-foreground" />
          <h2 className="font-semibold">{current ? "This folder is empty" : "No unfiled notes"}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {current
              ? "Write a note here, or move notes in from their ⋯ menu."
              : "Every note is in a folder."}
          </p>
          {current && (
            <Button asChild size="sm" className="mt-1 rounded-full">
              <Link to={newNoteHref}>
                <Plus /> New note in {current.name}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <NotebookPen className="size-7 text-muted-foreground" />
          </div>
          <h2 className="font-semibold">No notes yet</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Capture ideas, checklists and anything on your mind.
          </p>
          <Button asChild className="mt-2 rounded-full">
            <Link to="/note/new">
              <Plus /> Write your first note
            </Link>
          </Button>
        </div>
      )}

      {/* Floating "new note" button on phones, stacked above the quick access button */}
      <Link
        to={newNoteHref}
        aria-label="New note"
        className="fixed right-5 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </Link>

      <FolderFormDialog
        open={!!folderDialog}
        onOpenChange={(o) => !o && setFolderDialog(null)}
        folder={folderDialog?.folder}
        onSaved={(f) => !folderDialog?.folder && setFilter(f.id)}
      />
      <DeleteFolderDialog
        folder={deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onDeleted={() => setFilter("all")}
      />
    </div>
  );
}

function FolderChip({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-8 max-w-56 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
        active
          ? "border-foreground/80 bg-foreground text-background"
          : "bg-card text-foreground/80 hover:bg-accent hover:text-foreground"
      )}
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      <span dir="auto" className="truncate">{children}</span>
      <span className={cn("text-xs tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}

function FolderHeader({ folder, onEdit, onDelete }: { folder: NoteFolder; onEdit: () => void; onDelete: () => void }) {
  const palette = getNoteColor(folder.color);
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", palette.swatch)}>
        <Folder className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 dir="auto" className="truncate font-semibold">{folder.name}</h2>
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">
            {folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}
          </span>
          {folder.goal && (
            <Link
              to={`/goal/${folder.goal.id}`}
              className="inline-flex min-w-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary hover:bg-primary/15"
            >
              <Target className="size-3 shrink-0" />
              <span dir="auto" className="truncate">{folder.goal.title}</span>
            </Link>
          )}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Folder actions" className="text-muted-foreground">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit folder
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Target /> {folder.goal ? "Change linked goal" : "Link to a goal"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 /> Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default AllNotesPage;
