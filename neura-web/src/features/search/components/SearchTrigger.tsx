import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/features/search/stores/searchStore";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Header entry point: a wide search field on md+, an icon button on phones. */
function SearchTrigger({ variant, className }: { variant: "bar" | "icon"; className?: string }) {
  const setOpen = useSearchStore((s) => s.setOpen);

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={cn("size-8", className)}
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0" />
      <span className="flex-1 truncate text-left">Search everything…</span>
      <kbd className="hidden h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-sans text-[10px] font-medium lg:inline-flex">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

export default SearchTrigger;
