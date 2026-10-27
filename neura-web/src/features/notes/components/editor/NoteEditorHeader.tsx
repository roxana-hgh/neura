import { AlertCircle, ArrowLeft, Check, Cloud, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SaveStatus } from "@/features/notes/hooks/useNoteAutosave";
import { NOTE_COLOR_OPTIONS, NOTE_COLORS } from "@/features/notes/utils/colorMapper";
import type { colors } from "@/types/color";
import { cn } from "@/lib/utils";

interface NoteEditorHeaderProps {
  status: SaveStatus;
  color: colors;
  onColorChange: (color: colors) => void;
  onBack: () => void;
  onRetry: () => void;
  onDelete: () => void;
}

function NoteEditorHeader({
  status,
  color,
  onColorChange,
  onBack,
  onRetry,
  onDelete,
}: NoteEditorHeaderProps) {
  return (
    <div className="flex h-14 items-center gap-1 px-2 sm:px-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 rounded-full px-2.5"
        onClick={onBack}
      >
        <ArrowLeft className="size-[18px]" />
        <span className="hidden sm:inline">Notes</span>
      </Button>

      <div className="flex-1" />

      <SaveIndicator status={status} onRetry={onRetry} />

      {/* Note color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Note color"
            title="Note color"
          >
            <span
              className={cn(
                "size-5 rounded-full ring-2 ring-background ring-offset-1 ring-offset-border",
                NOTE_COLORS[color].swatch
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto rounded-xl p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Note color</p>
          <div className="grid grid-cols-4 gap-2">
            {NOTE_COLOR_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                title={NOTE_COLORS[value].label}
                aria-label={NOTE_COLORS[value].label}
                onClick={() => onColorChange(value)}
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110",
                  NOTE_COLORS[value].swatch,
                  color === value && "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                )}
              >
                {color === value && <Check className="size-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="More options"
          >
            <MoreVertical className="size-[18px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 /> Delete note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "idle") return null;

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="mr-1 flex cursor-pointer items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
      >
        <AlertCircle className="size-3.5" />
        Not saved · Retry
      </button>
    );
  }

  const saving = status === "saving" || status === "pending";
  return (
    <span
      className="mr-1 flex items-center gap-1.5 px-1 text-xs text-muted-foreground"
      aria-live="polite"
    >
      {saving ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Cloud className="size-3.5" />
      )}
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}

export default NoteEditorHeader;
