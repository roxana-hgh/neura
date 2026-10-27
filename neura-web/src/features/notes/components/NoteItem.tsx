import { Link } from "react-router-dom";
import type { Note } from "@/features/notes/types/note";
import { NOTE_COLORS, getNoteColor } from "@/features/notes/utils/colorMapper";
import { formatNoteDate, getNotePreview } from "@/features/notes/utils/textPreview";
import { cn } from "@/lib/utils";

interface NoteItemProps {
  note: Note;
  className?: string;
}

function NoteItem({ note, className = "" }: NoteItemProps) {
  const palette = getNoteColor(note.color);
  const { text, image } = getNotePreview(note.description, note.title);

  return (
    <Link
      to={`/note/${note.id}`}
      className={cn(
        "group flex min-h-40 flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        "bg-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 active:scale-[0.98]",
        className
      )}
    >
      <h3 dir="auto" className="line-clamp-2 font-semibold leading-snug">
        {note.title || "Untitled"}
      </h3>

      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="mt-3 max-h-32 w-full rounded-lg object-cover"
        />
      )}

      <p
        dir="auto"
        className={cn(
          "mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground",
          image ? "line-clamp-2" : "line-clamp-6"
        )}
      >
        {text}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatNoteDate(note.updatedAt ?? note.createdAt)}</span>
        {palette !== NOTE_COLORS.gray && (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 font-medium text-foreground/80">
            <span className={cn("size-1.5 rounded-full", palette.swatch)} />
            {palette.label}
          </span>
        )}
      </div>
    </Link>
  );
}

export default NoteItem;
