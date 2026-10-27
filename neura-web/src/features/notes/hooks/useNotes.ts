import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotesStore } from "@/features/notes/stores/notesStore";
import type { Note } from "@/features/notes/types/note";
import { stripHtml } from "@/features/notes/utils/textPreview";
import { api } from "@/lib/api";

export const NOTES_LIST_KEY = ["notes", "list"] as const;

const editedAt = (n: Note) => new Date(n.updatedAt ?? n.createdAt).getTime();

export const useNotes = () => {
  const search = useNotesStore((s) => s.search);

  const { data = [], isLoading } = useQuery({
    queryKey: NOTES_LIST_KEY,
    queryFn: async () => {
      const { data } = await api.get<Note[]>("/notes");
      return data;
    },
  });

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
    onSettled: () => qc.invalidateQueries({ queryKey: NOTES_LIST_KEY }),
  });
};
