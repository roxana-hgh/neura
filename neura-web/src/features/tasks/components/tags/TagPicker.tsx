import { useState, type ReactNode } from "react";
import { Check, Plus, Settings2 } from "lucide-react";
import type { colors } from "@/types/color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import TagChip from "@/features/tasks/components/tags/TagChip";
import TagColorPicker from "@/features/tasks/components/tags/TagColorPicker";
import TagManagerDialog from "@/features/tasks/components/tags/TagManagerDialog";
import { tagErrorMessage, useCreateTag, useTaskTags } from "@/features/tasks/hooks/useTaskTags";
import { TAG_NAME_MAX, TAG_STYLES, nextTagColor, normalizeTagName } from "@/features/tasks/utils/taskTags";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface IProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  trigger: ReactNode;
  align?: "start" | "center" | "end";
}

/**
 * Search-or-create tag menu. Type to filter, ↑/↓ + Enter to toggle,
 * Enter on a new name creates it (with the color chosen below) and selects it.
 */
function TagPicker({ selectedIds, onChange, trigger, align = "start" }: IProps) {
  const { data: tags = [], isPending } = useTaskTags();
  const { mutate: createTag, isPending: isCreating } = useCreateTag();

  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pickedColor, setPickedColor] = useState<colors | null>(null);
  const [active, setActive] = useState(0);

  const name = normalizeTagName(query);
  const lower = name.toLowerCase();
  const filtered = lower ? tags.filter((t) => t.name.toLowerCase().includes(lower)) : tags;
  const exact = tags.some((t) => t.name.toLowerCase() === lower);
  const canCreate = !!name && !exact && name.length <= TAG_NAME_MAX;
  const newColor = pickedColor ?? nextTagColor(tags);
  const optionCount = filtered.length + (canCreate ? 1 : 0);
  const activeIndex = Math.min(active, Math.max(optionCount - 1, 0));

  const reset = () => {
    setQuery("");
    setPickedColor(null);
    setActive(0);
  };

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const create = () => {
    if (!canCreate || isCreating) return;
    createTag(
      { name, color: newColor },
      {
        onSuccess: (tag) => {
          onChange([...selectedIds, tag.id]);
          reset();
        },
        onError: (e) => toast.error(tagErrorMessage(e, "Couldn't create the tag")),
      },
    );
  };

  const choose = (index: number) => {
    if (index < filtered.length) toggle(filtered[index].id);
    else create();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!optionCount) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + optionCount) % optionCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (optionCount) choose(activeIndex);
    } else if (e.key === "Backspace" && !query && selectedIds.length) {
      onChange(selectedIds.slice(0, -1));
    }
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align={align} className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              dir="auto"
              value={query}
              maxLength={TAG_NAME_MAX + 10}
              placeholder={tags.length ? "Search or create a tag…" : "Name your first tag…"}
              aria-label="Search or create a tag"
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-8 border-transparent bg-muted/60 shadow-none focus-visible:border-ring"
            />
          </div>

          <div role="listbox" aria-multiselectable className="max-h-60 overflow-y-auto p-1">
            {isPending && <div className="m-1 h-7 animate-pulse rounded-md bg-muted" />}

            {filtered.map((tag, i) => {
              const selected = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    i === activeIndex && "bg-accent",
                  )}
                >
                  <span className={cn("size-2 shrink-0 rounded-full", TAG_STYLES[tag.color]?.dot)} />
                  <span dir="auto" className="min-w-0 flex-1 truncate">{tag.name}</span>
                  <Check className={cn("size-3.5 shrink-0 text-primary", !selected && "invisible")} />
                </button>
              );
            })}

            {canCreate && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                disabled={isCreating}
                onMouseEnter={() => setActive(filtered.length)}
                onClick={create}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-60",
                  activeIndex === filtered.length && "bg-accent",
                )}
              >
                <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">Create</span>
                <TagChip tag={{ name, color: newColor }} size="sm" />
              </button>
            )}

            {!isPending && !optionCount && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {name.length > TAG_NAME_MAX
                  ? `Tag names are up to ${TAG_NAME_MAX} characters`
                  : "No tags yet. Type a name to create one."}
              </p>
            )}
          </div>

          {canCreate && (
            <div className="border-t border-border px-3 py-2.5">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">Color for “{name}”</p>
              <TagColorPicker value={newColor} onChange={setPickedColor} size="sm" />
            </div>
          )}

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
                setManageOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="size-3.5" /> Manage tags
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <TagManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
    </>
  );
}

export default TagPicker;
