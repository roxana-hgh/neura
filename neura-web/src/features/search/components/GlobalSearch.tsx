import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Loader2, Search, SearchX, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import SearchResultRow from "@/features/search/components/SearchResultRow";
import { MIN_QUERY, useGlobalSearch } from "@/features/search/hooks/useGlobalSearch";
import { QUICK_LINKS, SEARCH_GROUPS, SEARCH_TYPE_ORDER, toSearchItems } from "@/features/search/lib/searchItems";
import { useSearchStore } from "@/features/search/stores/searchStore";
import type { SearchItem, SearchType } from "@/features/search/types/search";
import TaskDetail from "@/features/tasks/components/TaskDetail";
import { useTask } from "@/features/tasks/hooks/useTasks";

type Filter = "all" | SearchType;

/** Rows the arrow keys move through, whatever the palette is showing. */
type Row =
  | { kind: "item"; item: SearchItem }
  | { kind: "recent"; query: string }
  | { kind: "link"; label: string; href: string; icon: (typeof QUICK_LINKS)[number]["icon"] };

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 pt-3 pb-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <div className="size-8 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The palette body. Mounted only while the dialog is open, so its state resets on every open. */
function SearchPalette({ onClose, onOpenTask }: { onClose: () => void; onOpenTask: (id: string) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const recent = useSearchStore((s) => s.recent);
  const addRecent = useSearchStore((s) => s.addRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const clearRecent = useSearchStore((s) => s.clearRecent);

  const { data, isSearching, isError, debouncedQuery } = useGlobalSearch(query);
  const typing = query.trim().length >= MIN_QUERY;

  const grouped = data ? toSearchItems(data) : null;
  const types = SEARCH_TYPE_ORDER.filter((t) => (grouped?.[t].length ?? 0) > 0);
  const visibleTypes = filter === "all" ? types : types.filter((t) => t === filter);
  const total = types.reduce((sum, t) => sum + (grouped?.[t].length ?? 0), 0);

  const rows: Row[] = typing
    ? visibleTypes.flatMap((t) => grouped![t].map((item) => ({ kind: "item" as const, item })))
    : [
        ...recent.map((q) => ({ kind: "recent" as const, query: q })),
        ...QUICK_LINKS.map((l) => ({ kind: "link" as const, ...l })),
      ];
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  // Keep the highlighted row in view while moving with the keyboard
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setActive(0);
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setActive(0);
  };

  const select = (row: Row) => {
    if (row.kind === "recent") {
      changeQuery(row.query);
      return;
    }
    if (row.kind === "link") {
      onClose();
      navigate(row.href);
      return;
    }
    addRecent(query);
    onClose();
    if (row.item.type === "tasks") onOpenTask(row.item.id);
    else if (row.item.href) navigate(row.item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!rows.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[activeIndex]) select(rows[activeIndex]);
    } else if (e.key === "Tab" && typing && types.length) {
      // Tab / Shift+Tab cycle the type filter
      e.preventDefault();
      const filters: Filter[] = ["all", ...types];
      const at = filters.indexOf(filter);
      changeFilter(filters[(at + (e.shiftKey ? -1 : 1) + filters.length) % filters.length]);
    }
  };

  // First row index of each result group, in render order (matches `rows`)
  const groupStart = visibleTypes.reduce<Partial<Record<SearchType, number>>>((acc, t, at) => {
    const prev = visibleTypes[at - 1];
    acc[t] = prev ? acc[prev]! + grouped![prev].length : 0;
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Input */}
      <div className="flex items-center gap-2 border-b border-border px-3 sm:px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          dir="auto"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search tasks, goals, notes…"
          aria-label="Search everything"
          role="combobox"
          aria-expanded
          aria-controls="global-search-results"
          autoComplete="off"
          spellCheck={false}
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:h-13 sm:text-sm"
        />
        {isSearching && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        {query && (
          <button
            type="button"
            onClick={() => changeQuery("")}
            aria-label="Clear search"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground sm:hidden"
        >
          Cancel
        </button>
        <Kbd className="hidden sm:inline-flex">Esc</Kbd>
      </div>

      {/* Type filter */}
      {typing && types.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2 [scrollbar-width:none] sm:px-4">
          {(["all", ...types] as Filter[]).map((f) => {
            const count = f === "all" ? total : grouped![f].length;
            const Icon = f === "all" ? null : SEARCH_GROUPS[f].icon;
            return (
              <button
                key={f}
                type="button"
                onClick={() => changeFilter(f)}
                className={cn(
                  "flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-3" />}
                {f === "all" ? "All" : SEARCH_GROUPS[f].label}
                <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div
        ref={listRef}
        id="global-search-results"
        role="listbox"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-2 sm:max-h-[min(60vh,28rem)]"
      >
        {!typing ? (
          <>
            {recent.length > 0 && (
              <>
                <SectionLabel
                  action={
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  }
                >
                  Recent
                </SectionLabel>
                {recent.map((q, i) => {
                  return (
                    <div
                      key={q}
                      role="option"
                      aria-selected={i === activeIndex}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors",
                        i === activeIndex ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => changeQuery(q)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                      >
                        <Clock className="size-4 shrink-0 text-muted-foreground" />
                        <span dir="auto" className="truncate text-sm">{q}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(q)}
                        aria-label={`Remove ${q}`}
                        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-100 hover:bg-background hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            <SectionLabel>Jump to</SectionLabel>
            <div className="grid grid-cols-2 gap-0.5">
              {QUICK_LINKS.map((link, at) => {
                const i = recent.length + at;
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    data-index={i}
                    onClick={() => select({ kind: "link", ...link })}
                    onMouseMove={() => setActive(i)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      i === activeIndex ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{link.label}</span>
                    <ArrowRight
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-opacity",
                        i === activeIndex ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {query.trim() && (
              <p className="px-2.5 pt-3 text-xs text-muted-foreground">Keep typing to search…</p>
            )}
          </>
        ) : !grouped && isError ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Search failed. Check your connection and try again.
          </p>
        ) : !grouped ? (
          <ResultsSkeleton />
        ) : total === 0 && !isSearching ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">No results</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Nothing matches “<span dir="auto">{debouncedQuery}</span>”. Try a different word.
            </p>
          </div>
        ) : (
          visibleTypes.map((type) => (
            <div key={type}>
              <SectionLabel>{SEARCH_GROUPS[type].label}</SectionLabel>
              {grouped![type].map((item, at) => {
                const i = groupStart[type]! + at;
                return (
                  <SearchResultRow
                    key={item.key}
                    item={item}
                    query={debouncedQuery}
                    index={i}
                    active={i === activeIndex}
                    onSelect={() => select({ kind: "item", item })}
                    onHover={() => setActive(i)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer hints (keyboard users) */}
      <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground sm:flex">
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        {typing && types.length > 0 && <span className="flex items-center gap-1"><Kbd>Tab</Kbd> filter</span>}
        <span className="ml-auto flex items-center gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd> toggle</span>
      </div>
    </div>
  );
}

/** Task results open their detail dialog in place, fetched fresh by id. */
function SearchTaskDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: task } = useTask(id);
  if (!task) return null;
  return <TaskDetail task={task} open onOpenChange={(open) => !open && onClose()} />;
}

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Global search palette: Ctrl/⌘ K anywhere, or "/" when not typing. Mounted once in AppLayout. */
function GlobalSearch() {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useSearchStore.getState().open);
      } else if (
        e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !isTypingTarget(e.target) && !document.querySelector("[role=dialog]")
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0",
            // phones: full screen sheet; sm+: floating panel near the top
            "top-0 h-dvh max-w-full translate-y-0 rounded-none border-0",
            "sm:top-[12vh] sm:h-auto sm:max-w-xl sm:rounded-xl sm:border sm:shadow-2xl",
          )}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search across tasks, goals, notes, reminders, habits, brainstorms and lists.
          </DialogDescription>
          <SearchPalette onClose={() => setOpen(false)} onOpenTask={setTaskId} />
        </DialogContent>
      </Dialog>

      {taskId && <SearchTaskDetail key={taskId} id={taskId} onClose={() => setTaskId(null)} />}
    </>
  );
}

export default GlobalSearch;
