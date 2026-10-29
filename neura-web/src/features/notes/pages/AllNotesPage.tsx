import { Link } from "react-router-dom";
import { NotebookPen, Plus, SearchIcon, X } from "lucide-react";
import NoteItem from "@/features/notes/components/NoteItem";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useNotesStore } from "@/features/notes/stores/notesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function AllNotesPage() {
  const { notes, total, isLoading } = useNotes();
  const search = useNotesStore((s) => s.search);
  const setSearch = useNotesStore((s) => s.setSearch);

  return (
    <div className="mx-auto max-w-6xl pb-24 sm:pb-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading ? " " : `${total} ${total === 1 ? "note" : "notes"}`}
          </p>
        </div>
        <Button size="sm" asChild className="hidden  sm:inline-flex">
          <Link to="/note/new">
            <Plus className="size-3.5" /> <span className="text-xs">New note</span>
          </Link>
        </Button>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes"
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      ) : search ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No notes match “{search}”.
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

      {/* Floating "new note" button on phones */}
      <Link
        to="/note/new"
        aria-label="New note"
        className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}

export default AllNotesPage;
