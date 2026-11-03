import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { colors } from "@/types/color";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AlertDialog from "@/components/shared/AlertDialog";
import EmptyState from "@/components/shared/EmptyState";
import TagChip from "@/features/tasks/components/tags/TagChip";
import TagColorPicker from "@/features/tasks/components/tags/TagColorPicker";
import {
  tagErrorMessage,
  useCreateTag,
  useDeleteTag,
  useTaskTags,
  useUpdateTag,
  type TagInput,
} from "@/features/tasks/hooks/useTaskTags";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import type { TaskTagWithCount } from "@/features/tasks/types/task";
import { TAG_NAME_MAX, nextTagColor, normalizeTagName } from "@/features/tasks/utils/taskTags";
import { toast } from "@/lib/toast";

interface IProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Create, rename, recolor and delete tags. */
function TagManagerDialog({ open, onOpenChange }: IProps) {
  const { data: tags = [], isPending } = useTaskTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const { mutate: updateTag, isPending: isUpdating } = useUpdateTag();
  const { mutate: deleteTag } = useDeleteTag();
  const tagFilter = useTasksStore((s) => s.tagFilter);
  const toggleTagFilter = useTasksStore((s) => s.toggleTagFilter);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<TaskTagWithCount | null>(null);

  const handleCreate = (values: TagInput) =>
    createTag(values, {
      onSuccess: () => setAdding(false),
      onError: (e) => toast.error(tagErrorMessage(e, "Couldn't create the tag")),
    });

  const handleUpdate = (id: string, values: TagInput) =>
    updateTag(
      { id, values },
      {
        onSuccess: () => setEditingId(null),
        onError: (e) => toast.error(tagErrorMessage(e, "Couldn't update the tag")),
      },
    );

  const handleDelete = () => {
    if (!toDelete) return;
    const { id, name } = toDelete;
    deleteTag(id, {
      onSuccess: () => {
        if (tagFilter.includes(id)) toggleTagFilter(id);
        toast.success(`Tag "${name}" deleted`);
      },
      onError: (e) => toast.error(tagErrorMessage(e, "Couldn't delete the tag")),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
            <DialogDescription>
              Rename, recolor or delete tags. Deleting a tag keeps its tasks.
            </DialogDescription>
          </DialogHeader>

          {adding ? (
            <TagEditor
              initial={{ name: "", color: nextTagColor(tags) }}
              submitLabel="Create"
              pending={isCreating}
              onSubmit={handleCreate}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditingId(null);
                setAdding(true);
              }}
            >
              <Plus className="size-3.5" /> New tag
            </Button>
          )}

          {isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            !adding && (
              <EmptyState
                compact
                icon={Tags}
                title="No tags yet"
                description="Tags group tasks across lists, like “work”, “errands” or “deep focus”."
              />
            )
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {tags.map((tag) =>
                editingId === tag.id ? (
                  <li key={tag.id} className="p-2">
                    <TagEditor
                      initial={{ name: tag.name, color: tag.color }}
                      submitLabel="Save"
                      pending={isUpdating}
                      onSubmit={(values) => handleUpdate(tag.id, values)}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                ) : (
                  <li key={tag.id} className="group flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      className="min-w-0 cursor-pointer"
                      onClick={() => {
                        setAdding(false);
                        setEditingId(tag.id);
                      }}
                    >
                      <TagChip tag={tag} />
                    </button>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {tag.taskCount} {tag.taskCount === 1 ? "task" : "tasks"}
                    </span>
                    <div className="flex shrink-0 items-center transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Edit tag ${tag.name}`}
                        className="text-muted-foreground"
                        onClick={() => {
                          setAdding(false);
                          setEditingId(tag.id);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Delete tag ${tag.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(tag)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {toDelete && (
        <AlertDialog
          title="Delete tag?"
          description={`"${toDelete.name}" will be removed from ${toDelete.taskCount} ${
            toDelete.taskCount === 1 ? "task" : "tasks"
          }. The tasks themselves are kept.`}
          acceptButtonText="Delete"
          cancelButtonText="Cancel"
          AcceptButtonVariant="danger"
          open={!!toDelete}
          setOpen={(o) => !o && setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

interface EditorProps {
  initial: { name: string; color: colors };
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: TagInput) => void;
  onCancel: () => void;
}

/** Inline name + color form, used for both "New tag" and editing a row. */
function TagEditor({ initial, submitLabel, pending, onSubmit, onCancel }: EditorProps) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState<colors>(initial.color);
  const cleaned = normalizeTagName(name);

  const submit = () => {
    if (cleaned && !pending) onSubmit({ name: cleaned, color });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          dir="auto"
          value={name}
          maxLength={TAG_NAME_MAX}
          placeholder="Tag name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="h-8 bg-background"
        />
        {cleaned && <TagChip tag={{ name: cleaned, color }} className="hidden shrink-0 sm:inline-flex" />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TagColorPicker value={color} onChange={setColor} size="sm" />
        <div className="ml-auto flex gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!cleaned || pending} onClick={submit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TagManagerDialog;
