import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NOTES_LIST_KEY } from "@/features/notes/hooks/useNotes";
import type { Note, NoteInput } from "@/features/notes/types/note";
import type { colors } from "@/types/color";
import { api } from "@/lib/api";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface NoteDraft {
  title: string;
  /** Editor HTML, or null when the editor is empty */
  description: string | null;
  /** Plain text of the body, used to name untitled notes */
  plainText: string;
  color: colors;
}

const isDraftEmpty = (d: NoteDraft) => !d.title.trim() && !d.description;

const toPayload = (d: NoteDraft): NoteInput => {
  const firstLine = d.plainText.trim().split("\n")[0]?.trim().slice(0, 80);
  return {
    title: d.title.trim() || firstLine || "Untitled",
    description: d.description,
    color: d.color,
  };
};

interface Options {
  noteId?: string;
  onCreated?: (id: string) => void;
  delay?: number;
}

/**
 * Debounced autosave. The first save of a new note creates it (POST), later
 * saves update it (PUT). Saves never overlap, and pending changes are flushed
 * when the editor unmounts or the tab is hidden.
 */
export function useNoteAutosave({ noteId, onCreated, delay = 800 }: Options) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>(noteId ? "saved" : "idle");

  const idRef = useRef<string | null>(noteId ?? null);
  const draftRef = useRef<NoteDraft | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const onCreatedRef = useRef(onCreated);

  useEffect(() => {
    onCreatedRef.current = onCreated;
  }, [onCreated]);

  const flush = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    while (inFlightRef.current) await inFlightRef.current;

    const draft = draftRef.current;
    if (!draft) return;
    draftRef.current = null;

    // Don't create a note until something has been written
    if (!idRef.current && isDraftEmpty(draft)) {
      setStatus("idle");
      return;
    }

    setStatus("saving");
    const run = (async () => {
      try {
        const payload = toPayload(draft);
        const { data } = idRef.current
          ? await api.put<Note>(`/notes/${idRef.current}`, payload)
          : await api.post<Note>("/notes", payload);
        const created = !idRef.current;
        idRef.current = String(data.id);

        qc.setQueryData(["notes", idRef.current], data);
        qc.setQueryData<Note[]>(NOTES_LIST_KEY, (old) =>
          old && [data, ...old.filter((n) => String(n.id) !== String(data.id))]
        );
        if (created) onCreatedRef.current?.(idRef.current);

        setStatus(draftRef.current ? "pending" : "saved");
      } catch {
        // Keep the failed draft unless something newer replaced it
        draftRef.current ??= draft;
        setStatus("error");
      }
    })();

    inFlightRef.current = run;
    await run;
    if (inFlightRef.current === run) inFlightRef.current = null;
  }, [qc]);

  const schedule = useCallback(
    (draft: NoteDraft) => {
      draftRef.current = draft;
      setStatus("pending");
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => void flush(), delay);
    },
    [delay, flush]
  );

  /** Drop unsaved changes, e.g. right before deleting the note */
  const cancel = useCallback(() => {
    window.clearTimeout(timerRef.current);
    draftRef.current = null;
  }, []);

  const getNoteId = useCallback(() => idRef.current, []);

  // Save when the app goes to the background; warn before closing with unsaved changes
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!draftRef.current && !inFlightRef.current) return;
      void flush();
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [flush]);

  return { status, schedule, flush, cancel, getNoteId };
}
