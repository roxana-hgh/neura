import { useEffect, useMemo, useState } from "react";
import { Check, Settings2, Tags } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagManagerDialog from "@/features/tasks/components/tags/TagManagerDialog";
import { useTaskTags } from "@/features/tasks/hooks/useTaskTags";
import { useTasksStore, type TagMatchMode } from "@/features/tasks/stores/tasksStore";
import type { Task } from "@/features/tasks/types/task";
import { TAG_STYLES } from "@/features/tasks/utils/taskTags";
import { cn } from "@/lib/utils";

interface IProps {
  /** The page's tasks (before tag filtering), for the per-tag counts */
  tasks?: Task[];
}

const MATCH_OPTIONS: { value: TagMatchMode; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "all", label: "All" },
];

/** "Tags" header button: pick tags to filter the task list by. */
function TagFilter({ tasks }: IProps) {
  const { data: tags = [], isPending } = useTaskTags();
  const tagFilter = useTasksStore((s) => s.tagFilter);
  const tagMatch = useTasksStore((s) => s.tagMatch);
  const toggleTagFilter = useTasksStore((s) => s.toggleTagFilter);
  const clearTagFilter = useTasksStore((s) => s.clearTagFilter);
  const setTagMatch = useTasksStore((s) => s.setTagMatch);

  const [query, setQuery] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  // Like the search, the filter belongs to the page: clear it when leaving
  useEffect(() => () => clearTagFilter(), [clearTagFilter]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks ?? []) for (const tag of task.tags) map.set(tag.id, (map.get(tag.id) ?? 0) + 1);
    return map;
  }, [tasks]);

  const lower = query.trim().toLowerCase();
  const visible = lower ? tags.filter((t) => t.name.toLowerCase().includes(lower)) : tags;
  const activeCount = tagFilter.length;

  return (
    <>
      <Popover onOpenChange={(o) => !o && setQuery("")}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={activeCount ? `Filter by tag (${activeCount} selected)` : "Filter by tag"}
            className={cn(
              "cursor-pointer gap-1.5 px-2.5",
              activeCount > 0 && "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
            )}
          >
            <Tags className="size-3.5" />
            <span className="text-xs">Tags</span>
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 p-0">
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <p className="text-xs font-semibold">Filter by tag</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearTagFilter}
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {tags.length > 6 && (
            <div className="px-2 pb-1">
              <Input
                autoFocus
                dir="auto"
                value={query}
                placeholder="Find a tag…"
                aria-label="Find a tag"
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 border-transparent bg-muted/60 shadow-none focus-visible:border-ring"
              />
            </div>
          )}

          <div role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto p-1">
            {isPending && <div className="m-1 h-7 animate-pulse rounded-md bg-muted" />}

            {visible.map((tag) => {
              const selected = tagFilter.includes(tag.id);
              const count = counts.get(tag.id) ?? 0;
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggleTagFilter(tag.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn("size-2 shrink-0 rounded-full", TAG_STYLES[tag.color]?.dot)} />
                  <span dir="auto" className={cn("min-w-0 flex-1 truncate", !count && !selected && "text-muted-foreground")}>
                    {tag.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
                </button>
              );
            })}

            {!isPending && tags.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-sm font-medium">No tags yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add tags from a task's form or detail, or create them here.
                </p>
              </div>
            )}
            {tags.length > 0 && visible.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matching tags</p>
            )}
          </div>

          {activeCount > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Show tasks with</span>
              <div className="flex rounded-md bg-muted p-0.5" role="radiogroup" aria-label="Match tags">
                {MATCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={tagMatch === opt.value}
                    onClick={() => setTagMatch(opt.value)}
                    className={cn(
                      "cursor-pointer rounded px-2 py-0.5 text-xs transition-colors",
                      tagMatch === opt.value
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label} tags
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="size-3.5" /> {tags.length ? "Manage tags" : "Create a tag"}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <TagManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
    </>
  );
}

export default TagFilter;
