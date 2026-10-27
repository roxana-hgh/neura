import { StickyNoteIcon } from "lucide-react";
import type { Note } from "@/features/notes/types/note";
import { getNoteColorClass } from "@/features/notes/utils/colorMapper";
import { Link } from "react-router-dom";
import { stripHtml } from "@/features/notes/utils/textPreview";


interface Iptops {
    note: Note;
    className?: string;
}

function NoteItem({note, className=""}: Iptops) {
    const preview = note.description ? stripHtml(note.description) : "";

    return ( 
        <div className={`glass p-3 ${className}`}>
            <Link to={`/note/${note.id}`}>
            <div className="flex mb-3 items-center justify-between">
                <div className="icon">
                    <span className={`${getNoteColorClass(note.color)} p-1 aspect-square w-fit block rounded-md border`}>
                        <StickyNoteIcon size={18} />
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                </span>
            </div>
            <h5 className="font-semibold mb-3">
                {note.title}
            </h5>
            <p className="text-muted-foreground text-sm line-clamp-2 pb-1 max-h-15">
                {preview || "..."}
            </p>
            </Link>
        </div>
     );
}

export default NoteItem;