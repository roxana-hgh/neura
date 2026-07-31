import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotesStore } from "../stores/notes";
import type { Note } from "../../../../types/Note";
import { api } from "../../../../lib/api";


export const useNotes = () => {
  const search = useNotesStore((s) => s.search);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", search],
    queryFn: async () => {
      const { data } = await api.get<Note[]>("/notes");
      return data;
    },
  });

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  return { notes: filtered, isLoading };
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

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<Note, "title" | "description" | "color">) =>
      api.post("/notes", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<Note, "title" | "description" | "color">>) =>
      api.put(`/notes/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
};