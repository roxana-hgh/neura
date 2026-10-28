import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateBrainstorm } from "@/features/brainstorms/hooks/useBrainstorms";
import type { Brainstorm } from "@/features/brainstorms/types/brainstorm";
import { cn } from "@/lib/utils";

interface BrainstormEditorProps {
  item: Brainstorm;
  onDone: (content?: string) => void;
  className?: string;
}

/** Inline editor: Enter saves, Shift+Enter adds a line, Esc cancels. */
export function BrainstormEditor({ item, onDone, className }: BrainstormEditorProps) {
  const [text, setText] = useState(item.content);
  const update = useUpdateBrainstorm();

  const save = () => {
    const content = text.trim();
    if (!content || content === item.content) return onDone();
    update.mutate({ id: item.id, content }, { onSuccess: () => onDone(content) });
  };

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onDone();
          }
        }}
        maxLength={5000}
        dir="auto"
        aria-label="Edit brainstorm"
        className={cn(
          "field-sizing-content min-h-16 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
          className,
        )}
      />
      <div className="flex items-center justify-end gap-1.5">
        <span className="mr-auto hidden text-[11px] text-muted-foreground sm:inline">Enter to save · Esc to cancel</span>
        <Button type="button" variant="ghost" size="xs" onClick={() => onDone()}>Cancel</Button>
        <Button type="button" size="xs" onClick={save} disabled={!text.trim() || update.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
