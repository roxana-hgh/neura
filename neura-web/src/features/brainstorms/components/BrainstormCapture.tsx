import { forwardRef, useState } from "react";
import { Check, CornerDownLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateBrainstorm } from "@/features/brainstorms/hooks/useBrainstorms";
import { cn } from "@/lib/utils";

const MAX = 5000;

/**
 * The capture box: type, Enter, done. Focus stays here so several thoughts
 * can be dumped in a row; Shift+Enter adds a new line.
 */
export const BrainstormCapture = forwardRef<HTMLTextAreaElement>(function BrainstormCapture(_props, ref) {
  const [text, setText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const create = useCreateBrainstorm();

  const save = () => {
    const content = text.trim();
    if (!content) return;
    setText(""); // clear at once; put it back if saving fails
    create.mutate(content, {
      onSuccess: () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1400);
      },
      onError: () => setText(content),
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="rounded-xl border border-border bg-card p-3 transition-shadow focus-within:border-primary/40 focus-within:shadow-sm"
    >
      <div className="flex gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lightbulb className="size-4" />
        </span>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
          }}
          rows={1}
          maxLength={MAX}
          dir="auto"
          placeholder="What's on your mind? An idea, a to-do, something to look into…"
          aria-label="New brainstorm"
          className="field-sizing-content max-h-60 min-h-7 min-w-0 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 pl-9.5">
        <p
          className={cn(
            "inline-flex items-center gap-1 text-[11px] transition-colors",
            savedFlash ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {savedFlash ? (
            <><Check className="size-3" /> Saved to your inbox</>
          ) : (
            <span className="hidden sm:inline">
              <kbd className="font-sans">Enter</kbd> to save · <kbd className="font-sans">Shift + Enter</kbd> for a new line
            </span>
          )}
        </p>
        <Button type="submit" size="sm" disabled={!text.trim()}>
          Capture <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </form>
  );
});
