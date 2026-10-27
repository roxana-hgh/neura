import { useEffect, useState } from "react";
import { SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

/** Pill search field, same style as the Notes search */
function TasksSearch({ className }: { className?: string }) {
  const search = useTasksStore((state) => state.search);
  const setSearch = useTasksStore((state) => state.setSearch);
  const [value, setValue] = useState(search);

  // The search is global (every task query reads it), so debounce it
  useEffect(() => {
    if (value === search) return;
    const id = setTimeout(() => setSearch(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value, search, setSearch]);

  // ...and clear it when leaving the page, so the dashboard and list cards aren't filtered
  useEffect(() => () => setSearch(""), [setSearch]);

  const clear = () => {
    setValue("");
    setSearch("");
  };

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && clear()}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="h-8 rounded-full border-transparent bg-muted/60 pr-8 pl-9 text-sm shadow-none focus-visible:border-ring"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default TasksSearch;
