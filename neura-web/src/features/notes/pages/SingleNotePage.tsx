import { Link, useNavigate, useParams } from "react-router-dom";
import { getNoteColorClass } from "@/features/notes/utils/colorMapper";
import { ChevronLeftIcon, Edit, StickyNoteIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AlertDialog from "@/components/shared/AlertDialog";

import NoteContent from "@/features/notes/components/NoteContent";
import {
  useDeleteNote,
  useNote,
} from "@/features/notes/hooks/useNotes";
import Loader from "@/components/ui/loader";
import { toast } from "@/lib/toast";

function SingleNotes() {
  const params = useParams();
  const noteId = params.id ?? "";

  const navigate = useNavigate();

  const { data: note, isLoading } = useNote(noteId);

  const [alertOpen, setAlertOpen] = useState(false);

  const { mutate: deleteNote, isPending  : isDeleting} = useDeleteNote();

  const deleteHandler = () => {
    if (!note || !params.id) return;
    deleteNote(note?.id, {
      onSuccess: () => {
        navigate("/notes");
        toast.success("Note deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete note");
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between max-sm:mb-3">
          <div className="flex flex-col gap-3">
            <div className="icon mb-2">
              <span
                className={`${getNoteColorClass(note?.color ?? "gray")} p-2 aspect-square w-fit block rounded-md border`}
              >
                <StickyNoteIcon size={18} />
              </span>
            </div>
          </div>
          {!isLoading && note && (
            <div className="flex gap-2">
              <Link to={`/notes`}>
                <Button
                  type="button"
                  className="cursor-pointer"
                  size="icon-sm"
                  variant="outline"
                >
                  <ChevronLeftIcon size={14} />
                </Button>
              </Link>
              <Link to={`/note/${note.id}/edit`}>
                <Button type="button" size="sm" variant="outline">
                  Edit Note <Edit />
                </Button>
              </Link>
              <Button
                className="text-red-500 bg-red-300/20 border-red-400 hover:bg-red-300/30 cursor-pointer"
                type="button"
                size="icon-sm"
                onClick={() => setAlertOpen(true)}
              >
                <Trash />
              </Button>
            </div>
          )}

          {isLoading && <Loader screen />}
        </div>
        <h2 className="text-3xl font-bold mb-2">{note?.title}</h2>
        <div className="flex mb-2">
          <span className="text-sm flex gap-3 text-muted-foreground">
            Created :{" "}
            {note
              ? new Date(note.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>

        {/* Display editor blocks or fallback to description */}
        {note?.description ? <NoteContent html={note.description} /> : "..."}
      </div>
      {isDeleting && <Loader screen />}
      {alertOpen && (
        <AlertDialog
          title="Remove Note"
          description={`Are you Sure you want to Remove '${note?.title}' ? `}
          acceptButtonText="Remove"
          AcceptButtonVariant="danger"
          open={alertOpen}
          setOpen={setAlertOpen}
          onConfirm={deleteHandler}
        />
      )}
    </>
  );
}

export default SingleNotes;
