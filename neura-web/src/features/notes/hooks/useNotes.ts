import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotesStore } from "@/features/notes/stores/notesStore";
import type { Note, NoteLinkOptions, NoteLinksInput } from "@/features/notes/types/note";
import { stripHtml } from "@/features/notes/utils/textPreview";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

export const NOTES_LIST_KEY = ["notes", "list"] as const;

const editedAt = (n: Note) => new Date(n.updatedAt ?? n.createdAt).getTime();

/** Every note, unfiltered (pickers); the Notes page uses useNotes for its search */
export const useNoteList = (enabled = true) => {
  return useQuery({
    queryKey: NOTES_LIST_KEY,
    queryFn: async () => {
      const { data } = await api.get<Note[]>("/notes");
      return data;
    },
    enabled,
  });
};

export const useNotes = () => {
  const search = useNotesStore((s) => s.search);

  const { data = [], isLoading } = useNoteList();

  // Most recently edited first; search matches the title and the body text
  const q = search.toLowerCase().trim();
  const notes = [...data]
    .sort((a, b) => editedAt(b) - editedAt(a))
    .filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.description && stripHtml(n.description).toLowerCase().includes(q))
    );

  return { notes, total: data.length, isLoading };
};

export const useNote = (id: string) => {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: async () => {
      const { data } = await api.get<Note>(`/notes/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onMutate: (id) => {
      qc.setQueryData<Note[]>(NOTES_LIST_KEY, (old) =>
        old?.filter((n) => String(n.id) !== id)
      );
      qc.removeQueries({ queryKey: ["notes", id], exact: true });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["notes"] });
      void qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
};

/** Notes linked to one task (task detail) */
export const useTaskNotes = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: ["notes", "task", taskId],
    queryFn: async () => (await api.get<Note[]>("/notes", { params: { task_id: taskId } })).data,
    enabled: enabled && !!taskId,
  });
};

/** Goals and open tasks a note can be linked to */
export const useNoteLinkOptions = (enabled: boolean) => {
  return useQuery({
    queryKey: ["notes", "link-options"],
    queryFn: async () => (await api.get<NoteLinkOptions>("/notes/link-options")).data,
    enabled,
    staleTime: 30_000,
  });
};

/** Moves a note to a folder and/or links it to a goal or task */
export const useSetNoteLinks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, links }: { id: string; links: NoteLinksInput }) =>
      (await api.patch<Note>(`/notes/${id}/links`, links)).data,
    onSuccess: (note) => {
      qc.setQueryData(["notes", String(note.id)], note);
      qc.setQueryData<Note[]>(NOTES_LIST_KEY, (old) =>
        old?.map((n) => (String(n.id) === String(note.id) ? note : n))
      );
      void qc.invalidateQueries({ queryKey: ["notes"] });
      void qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => toast.error("Couldn't update the note's links"),
  });
};
