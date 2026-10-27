import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { format } from "date-fns";
import NoteToolbar from "@/features/notes/components/editor/NoteToolbar";
import NoteEditorHeader from "@/features/notes/components/editor/NoteEditorHeader";
import AlertDialog from "@/components/shared/AlertDialog";
import { useNoteAutosave, type NoteDraft } from "@/features/notes/hooks/useNoteAutosave";
import { useDeleteNote } from "@/features/notes/hooks/useNotes";
import { useKeyboardInset } from "@/features/notes/hooks/useKeyboardInset";
import { noteExtensions } from "@/features/notes/lib/editorExtensions";
import { firstImageFile, insertImageFile } from "@/features/notes/lib/noteImage";
import { NOTE_COLORS, getNoteColor } from "@/features/notes/utils/colorMapper";
import type { Note } from "@/features/notes/types/note";
import type { colors } from "@/types/color";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  /** Undefined for a new note; it is created on the first autosave */
  note?: Note;
  onCreated: (id: string) => void;
}

// Keep the caret clear of the sticky header and the mobile bottom toolbar
const SCROLL_MARGIN = { top: 140, bottom: 96, left: 0, right: 0 };

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const resizeTitle = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

function NoteEditor({ note, onCreated }: NoteEditorProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const keyboardInset = useKeyboardInset();

  const [title, setTitle] = useState(note?.title ?? "");
  // Older notes may store "default", which isn't a palette color
  const [color, setColor] = useState<colors>(
    note && note.color in NOTE_COLORS ? note.color : "gray"
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Latest title/color for drafts built inside editor callbacks
  const latest = useRef({ title, color });

  const { status, schedule, flush, cancel, getNoteId } = useNoteAutosave({
    noteId: note ? String(note.id) : undefined,
    onCreated,
  });
  const deleteNote = useDeleteNote();

  const buildDraft = (ed: Editor): NoteDraft => ({
    title: latest.current.title,
    color: latest.current.color,
    description: ed.isEmpty ? null : ed.getHTML(),
    plainText: ed.getText({ blockSeparator: "\n" }),
  });

  const editor = useEditor({
    extensions: noteExtensions,
    content: note?.description ?? "",
    editorProps: {
      attributes: { class: "note-prose", spellcheck: "true" },
      scrollMargin: SCROLL_MARGIN,
      scrollThreshold: SCROLL_MARGIN,
      handlePaste: (view, event) => {
        const file = firstImageFile(event.clipboardData?.files);
        if (!file) return false;
        void insertImageFile(view, file);
        return true;
      },
      handleDrop: (view, event) => {
        const file = firstImageFile(event.dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        void insertImageFile(view, file);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => schedule(buildDraft(ed)),
  });

  const wordCount = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed ? countWords(ed.getText()) : 0),
  });

  useEffect(() => resizeTitle(titleRef.current), []);

  // Ctrl/Cmd + S saves immediately instead of opening the browser dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  const update = (next: Partial<typeof latest.current>) => {
    latest.current = { ...latest.current, ...next };
    if (editor) schedule(buildDraft(editor));
  };

  const goBack = () => {
    // Return to wherever the note was opened from, or the notes list on a fresh tab
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/notes");
  };

  const handleDelete = () => {
    cancel();
    const id = getNoteId();
    navigate("/notes", { replace: true });
    if (!id) return;
    deleteNote
      .mutateAsync(id)
      .then(() => toast.success("Note deleted"))
      .catch(() => toast.error("Failed to delete note"));
  };

  const palette = getNoteColor(color);
  const editedAt = note?.updatedAt ?? note?.createdAt;

  return (
    // Full-bleed page on every screen size: cancel AppLayout's <main> padding
    <div className="relative -mx-3 -my-5 min-h-[calc(100dvh-3rem)] bg-background lg:-mx-6">
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <NoteEditorHeader
          status={status}
          color={color}
          onColorChange={(c) => {
            setColor(c);
            update({ color: c });
          }}
          onBack={goBack}
          onRetry={() => void flush()}
          onDelete={() => setConfirmDelete(true)}
        />
        {!isMobile && editor && (
          <div className="border-t px-3 lg:px-7">
            <NoteToolbar editor={editor} placement="top" />
          </div>
        )}
      </div>

      <div className="relative px-5 pt-6 pb-32 sm:px-8 md:pb-20 lg:px-10">
        <textarea
          ref={titleRef}
          value={title}
          rows={1}
          dir="auto"
          maxLength={150}
          autoFocus={!note}
          placeholder="Title"
          aria-label="Note title"
          onChange={(e) => {
            setTitle(e.target.value);
            resizeTitle(e.target);
            update({ title: e.target.value });
          }}
          onKeyDown={(e) => {
            // Enter jumps to the body, like a real notes app
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              editor?.commands.focus("start");
            }
          }}
          className="block w-full resize-none overflow-hidden bg-transparent text-[28px] leading-tight font-bold tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
        />

        <p className="mt-2 mb-5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {color !== "gray" && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-0.5 font-medium text-foreground/80">
                <span className={cn("size-2 rounded-full", palette.swatch)} />
                {palette.label}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{format(editedAt ? new Date(editedAt) : new Date(), "MMMM d, yyyy · HH:mm")}</span>
          <span aria-hidden>·</span>
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </p>

        {/* Clicking the empty paper below the text continues writing at the end */}
        <div
          className="min-h-[50dvh] cursor-text"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              editor?.commands.focus("end");
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {isMobile && editor && (
        <div
          className="fixed inset-x-0 z-40 border-t bg-background/90 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl"
          style={{
            bottom: keyboardInset,
            paddingBottom: keyboardInset ? 0 : "env(safe-area-inset-bottom)",
          }}
        >
          <NoteToolbar editor={editor} placement="bottom" />
        </div>
      )}

      {confirmDelete && (
        <AlertDialog
          title="Delete note"
          description={`Delete "${title.trim() || "Untitled"}"? This can't be undone.`}
          acceptButtonText="Delete"
          AcceptButtonVariant="danger"
          open={confirmDelete}
          setOpen={setConfirmDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default NoteEditor;
