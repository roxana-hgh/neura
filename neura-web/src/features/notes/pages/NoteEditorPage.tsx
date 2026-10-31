import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import NoteEditor from "@/features/notes/components/editor/NoteEditor";
import { useNote } from "@/features/notes/hooks/useNotes";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";

/** `/note/new` writes a new note, `/note/:id` opens one; both are edited in place */
function NoteEditorPage() {
  const { id = "new" } = useParams();
  const navigate = useNavigate();

  // After the first autosave the URL switches from /note/new to /note/:id.
  // That is still the same writing session, so the editor must not remount.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const isDraft = id === "new" || id === createdId;

  const { data: note, isLoading, isError } = useNote(isDraft ? "" : id);

  const handleCreated = useCallback(
    (newId: string) => {
      setCreatedId(newId);
      navigate(`/note/${newId}`, { replace: true, preventScrollReset: true });
    },
    [navigate]
  );

  if (!isDraft && isLoading) return <Loader screen />;

  if (!isDraft && (isError || !note)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <FileQuestion className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Note not found</h2>
        <p className="text-sm text-muted-foreground">It may have been deleted.</p>
        <Button asChild variant="outline" size="sm" className="mt-2 rounded-full">
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  return (
    <NoteEditor
      key={isDraft ? "draft" : id}
      note={isDraft ? undefined : note}
      onCreated={handleCreated}
    />
  );
}

export default NoteEditorPage;
