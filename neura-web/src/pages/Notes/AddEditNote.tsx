import { useNavigate, useParams } from "react-router-dom";

import AddEditNoteForm from "../../components/features/Notes/components/AddEditNoteForm";
import type { NoteFormValues } from "../../components/features/Notes/schema/note.schema";
import { useCreateNote, useNote, useUpdateNote } from "../../components/features/Notes/hooks/useNotes";
import { toast } from "../../lib/toast";

function AddEditNotePage() {
const { id } = useParams();
const navigate = useNavigate();

const { data: note } = useNote(id ?? "");
const createNote = useCreateNote();
const updateNote = useUpdateNote();

const editHandler = (data: NoteFormValues) => {
  if (!id || !note) return;
  updateNote.mutate(
    { id, ...data },
    { onSuccess: () => {
      navigate(`/note/${id}`);
      toast.success("Note updated successfully");
    },
    onError: () => {
      toast.error("Failed to update note");
    }
  
  }
  );
};

const addHandler = (data: NoteFormValues) => {
  createNote.mutate(data, {
    onSuccess: (newNote) => {
      navigate(`/note/${newNote.id}`);
      toast.success("Note created successfully");
    },
    onError: () => {
      toast.error("Failed to create note");
    }
  });
};

  return (
    <div className="">
      {id && note ? (
        <div className="">
          <AddEditNoteForm onSubmit={editHandler} note={note} />
        </div>
      ) : (
        <AddEditNoteForm onSubmit={addHandler} />
      )}
    </div>
  );
}

export default AddEditNotePage;
