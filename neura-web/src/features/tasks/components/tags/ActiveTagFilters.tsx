import TagChip from "@/features/tasks/components/tags/TagChip";
import { useTaskTags } from "@/features/tasks/hooks/useTaskTags";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";

interface IProps {
  /** How many tasks are shown after filtering */
  shownCount?: number;
}

/** Row under the page header listing the active tag filters, each removable. */
function ActiveTagFilters({ shownCount }: IProps) {
  const { data: tags = [] } = useTaskTags();
  const tagFilter = useTasksStore((s) => s.tagFilter);
  const tagMatch = useTasksStore((s) => s.tagMatch);
  const toggleTagFilter = useTasksStore((s) => s.toggleTagFilter);
  const clearTagFilter = useTasksStore((s) => s.clearTagFilter);

  const active = tags.filter((t) => tagFilter.includes(t.id));
  if (!active.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 animate-in fade-in duration-150">
      <span className="mr-0.5 text-xs text-muted-foreground">
        {shownCount != null && <span className="tabular-nums">{shownCount} {shownCount === 1 ? "task" : "tasks"} · </span>}
        {active.length > 1 ? (tagMatch === "all" ? "with all of" : "with any of") : "tagged"}
      </span>
      {active.map((tag) => (
        <TagChip key={tag.id} tag={tag} onRemove={() => toggleTagFilter(tag.id)} />
      ))}
      <button
        type="button"
        onClick={clearTagFilter}
        className="ml-1 cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear
      </button>
    </div>
  );
}

export default ActiveTagFilters;
