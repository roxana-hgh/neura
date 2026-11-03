import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowUpRight, CircleCheckBig, Folder, FolderPlus, Plus, Target } from "lucide-react";
import LinkPickerPopover from "@/features/notes/components/links/LinkPickerPopover";
import { useCreateNoteFolder, useNoteFolders } from "@/features/notes/hooks/useNoteFolders";
import { useNoteLinkOptions } from "@/features/notes/hooks/useNotes";
import { getNoteColor } from "@/features/notes/utils/colorMapper";
import type { Note } from "@/features/notes/types/note";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface NoteLinkIds {
  folderId: string | null;
  goalId: string | null;
  taskId: string | null;
}

interface NoteLinksBarProps {
  links: NoteLinkIds;
  /** The saved note, for names of links that aren't in the pickers (archived goal, completed task) */
  note?: Note;
  onChange: (key: keyof NoteLinkIds, value: string | null) => void;
}

/** Folder / goal / task chips under the note title; each opens a picker. */
export default function NoteLinksBar({ links, note, onChange }: NoteLinksBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: folders = [], isLoading: foldersLoading } = useNoteFolders();
  // Names of a goal / task chosen before this page opened (e.g. "New note" from a goal) need the options too
  const needsNames =
    (!!links.goalId && links.goalId !== note?.goal?.id) || (!!links.taskId && links.taskId !== note?.task?.id);
  const { data: options, isLoading: optionsLoading } = useNoteLinkOptions(pickerOpen || needsNames);

  const folder = folders.find((f) => f.id === links.folderId);
  const goalTitle =
    options?.goals.find((g) => g.id === links.goalId)?.title ??
    (note?.goal?.id === links.goalId ? note?.goal?.title : undefined);
  const task =
    options?.tasks.find((t) => t.id === links.taskId) ??
    (note?.task?.id === links.taskId ? note?.task : undefined);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      <LinkPickerPopover
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
        items={folders.map((f) => ({
          id: f.id,
          label: f.name,
          hint: `${f.noteCount} ${f.noteCount === 1 ? "note" : "notes"}`,
          icon: <span className={cn("size-2.5 shrink-0 rounded-full", getNoteColor(f.color).swatch)} />,
        }))}
        selectedId={links.folderId}
        onSelect={(id) => onChange("folderId", id)}
        onClear={() => onChange("folderId", null)}
        clearLabel="Move out of folder"
        placeholder="Search folders…"
        emptyText="No folders yet"
        loading={foldersLoading}
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
          onOpenChange={setPickerOpen}
          trigger={
            <Chip active={!!links.goalId} icon={<Target className="size-3.5" />} placeholder="Goal">
              {links.goalId && (goalTitle ?? "Linked goal")}
            </Chip>
          }
          items={(options?.goals ?? []).map((g) => ({
            id: g.id,
            label: g.title,
            hint: g.parentTitle ? `↳ sub-goal of ${g.parentTitle}` : null,
            icon: <Target className="size-3.5 shrink-0 text-muted-foreground" />,
          }))}
          selectedId={links.goalId}
          onSelect={(id) => onChange("goalId", id)}
          onClear={() => onChange("goalId", null)}
          clearLabel="Unlink goal"
          placeholder="Search goals…"
          emptyText="No active goals"
          loading={optionsLoading}
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
        onOpenChange={setPickerOpen}
        trigger={
          <Chip active={!!links.taskId} icon={<CircleCheckBig className="size-3.5" />} placeholder="Task">
            {links.taskId && (
              <span className={cn(task && "completed" in task && task.completed && "line-through opacity-70")}>
                {task?.title ?? "Linked task"}
              </span>
            )}
          </Chip>
        }
        items={(options?.tasks ?? []).map((t) => ({
          id: t.id,
          label: t.title,
          hint: t.dueDate ? `Due ${format(new Date(t.dueDate), "MMM d")}` : null,
          icon: <CircleCheckBig className="size-3.5 shrink-0 text-muted-foreground" />,
        }))}
        selectedId={links.taskId}
        onSelect={(id) => onChange("taskId", id)}
        onClear={() => onChange("taskId", null)}
        clearLabel="Unlink task"
        placeholder="Search open tasks…"
        emptyText="No open tasks"
        loading={optionsLoading}
      />
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

function NewFolderInline({ onCreated }: { onCreated: (id: string) => void }) {
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
