import { useState } from "react";
import { Plus } from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import TagChip from "@/features/tasks/components/tags/TagChip";
import TagPicker from "@/features/tasks/components/tags/TagPicker";
import { tagErrorMessage, useSetTaskTags, useTaskTags } from "@/features/tasks/hooks/useTaskTags";
import { toast } from "@/lib/toast";

/**
 * Tags of a task, edited in place (saved on every change via PATCH /tasks/:id/tags).
 * Keeps its own selection so quick successive toggles don't race the refetch.
 */
function TaskTagsEditor({ task }: { task: Task }) {
  const { data: allTags } = useTaskTags();
  const { mutate: setTaskTags } = useSetTaskTags();
  const [ids, setIds] = useState(() => task.tags.map((t) => t.id));

  const tagsById = new Map([...task.tags, ...(allTags ?? [])].map((t) => [t.id, t]));

  const change = (next: string[]) => {
    const previous = ids;
    setIds(next);
    setTaskTags(
      { taskId: task.id, tagIds: next },
      {
        onError: (e) => {
          setIds(previous);
          toast.error(tagErrorMessage(e, "Couldn't update tags"));
        },
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => {
        const tag = tagsById.get(id);
        return tag ? <TagChip key={id} tag={tag} onRemove={() => change(ids.filter((x) => x !== id))} /> : null;
      })}
      <TagPicker
        selectedIds={ids}
        onChange={change}
        trigger={
          <button
            type="button"
            className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="size-3" />
            {ids.length ? "Add" : "Add tag"}
          </button>
        }
      />
    </div>
  );
}

export default TaskTagsEditor;
