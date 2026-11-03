import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { NoteFolder, NoteFolderInput } from "@/features/notes/types/note";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

export const NOTE_FOLDERS_KEY = ["notes", "folders"] as const;

// Folder changes show up in note cards (folder chip), counts and the goal page
const refresh = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ["notes"] }),
    qc.invalidateQueries({ queryKey: ["goals"] }),
  ]);

const errorMessage = (err: unknown, fallback: string) =>
  (isAxiosError(err) && (err.response?.data as { error?: string } | undefined)?.error) || fallback;

export const useNoteFolders = () => {
  return useQuery({
    queryKey: NOTE_FOLDERS_KEY,
    queryFn: async () => (await api.get<NoteFolder[]>("/notes/folders")).data,
  });
};

export const useCreateNoteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NoteFolderInput & { name: string }) =>
      (await api.post<NoteFolder>("/notes/folders", input)).data,
    onSuccess: () => refresh(qc),
    onError: (err) => toast.error(errorMessage(err, "Couldn't create the folder")),
  });
};

export const useUpdateNoteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: NoteFolderInput }) =>
      (await api.patch<NoteFolder>(`/notes/folders/${id}`, input)).data,
    onSuccess: () => refresh(qc),
    onError: (err) => toast.error(errorMessage(err, "Couldn't update the folder")),
  });
};

export const useDeleteNoteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteNotes }: { id: string; deleteNotes: boolean }) =>
      api.delete(`/notes/folders/${id}`, { params: { notes: deleteNotes ? "delete" : "keep" } }),
    onSuccess: () => refresh(qc),
    onError: () => toast.error("Couldn't delete the folder"),
  });
};
