import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CircleCheckBig, Folder, FolderPlus, ListTodo, Plus, Target } from "lucide-react";
import LinkPickerPopover from "@/features/notes/components/links/LinkPickerPopover";
import { useCreateNoteFolder } from "@/features/notes/hooks/useNoteFolders";
import { useNoteLinkPickers, type NoteLinkIds, type NoteLinkKey } from "@/features/notes/hooks/useNoteLinkPickers";
import { getNoteColor } from "@/features/notes/utils/colorMapper";
import type { Note } from "@/features/notes/types/note";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface NoteLinksBarProps {
  links: NoteLinkIds;
  /** The saved note, for names of links that aren't in the pickers (archived goal, completed task) */
  note?: Note;
  onChange: (key: NoteLinkKey, value: string | null) => void;
}

/** Folder / goal / task / list chips under the note title; each opens a searchable picker. */
export default function NoteLinksBar({ links, note, onChange }: NoteLinksBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { pickers, folder, goalTitle, task, list } = useNoteLinkPickers({
    links,
    note,
    onChange,
    optionsEnabled: pickerOpen,
  });

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      <LinkPickerPopover
        {...pickers.folderId}
        trigger={
          <Chip active={!!links.folderId} icon={<Folder className="size-3.5" />} placeholder="Folder">
            {folder && (
              <>
                <span className={cn("size-2 shrink-0 rounded-full", getNoteColor(folder.color).swatch)} />
                {folder.name}
              </>
            )}
          </Chip>
        }
        footer={(close) => (
          <NewFolderInline
            onCreated={(id) => {
              onChange("folderId", id);
              close();
            }}
          />
        )}
      />

      <span className="inline-flex items-center">
        <LinkPickerPopover
          {...pickers.goalId}
          onOpenChange={setPickerOpen}
          trigger={
            <Chip active={!!links.goalId} icon={<Target className="size-3.5" />} placeholder="Goal">
              {links.goalId && (goalTitle ?? "Linked goal")}
            </Chip>
          }
        />
        {links.goalId && (
          <Link
            to={`/goal/${links.goalId}`}
            aria-label="Open goal"
            title="Open goal"
            className="ms-0.5 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </span>

      <LinkPickerPopover
        {...pickers.taskId}
        onOpenChange={setPickerOpen}
        trigger={
          <Chip active={!!links.taskId} icon={<CircleCheckBig className="size-3.5" />} placeholder="Task">
            {links.taskId && (
              <span className={cn(task?.completed && "line-through opacity-70")}>{task?.title ?? "Linked task"}</span>
            )}
          </Chip>
        }
      />

      <span className="inline-flex items-center">
        <LinkPickerPopover
          {...pickers.listId}
          onOpenChange={setPickerOpen}
          trigger={
            <Chip active={!!links.listId} icon={<ListTodo className="size-3.5" />} placeholder="List">
              {links.listId && (
                <>
                  {list && <span className={cn("size-2 shrink-0 rounded-full", getNoteColor(list.color).swatch)} />}
                  {list?.name ?? "Linked list"}
                </>
              )}
            </Chip>
          }
        />
        {links.listId && (
          <Link
            to={`/list/${links.listId}`}
            aria-label="Open list"
            title="Open list"
            className="ms-0.5 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </span>
    </div>
  );
}

type ChipProps = ComponentPropsWithoutRef<"button"> & {
  active: boolean;
  icon: ReactNode;
  placeholder: string;
};

/** Filled chip when linked, dashed "+ Folder" style when not. Forwards its ref for PopoverTrigger. */
const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, icon, placeholder, children, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "inline-flex h-7 max-w-64 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs transition-colors",
        active
          ? "border bg-muted/50 font-medium text-foreground/90 hover:bg-muted"
          : "border border-dashed text-muted-foreground hover:border-solid hover:bg-accent hover:text-foreground",
        className
      )}
    >
      {active ? icon : <Plus className="size-3.5" />}
      <span dir="auto" className="flex min-w-0 items-center gap-1.5 truncate">
        {active ? children : placeholder}
      </span>
    </button>
  );
});

export function NewFolderInline({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const create = useCreateNoteFolder();

  return (
    <form
      className="flex items-center gap-2 px-2"
      onSubmit={(e) => {
        e.preventDefault();
        const value = name.trim();
        if (!value || create.isPending) return;
        create.mutate({ name: value }, { onSuccess: (folder) => onCreated(folder.id) });
      }}
    >
      {create.isPending ? (
        <Spinner className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <FolderPlus className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New folder… (Enter)"
        maxLength={60}
        dir="auto"
        className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </form>
  );
}
