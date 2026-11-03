import { format } from "date-fns";
import { CircleCheckBig, Target } from "lucide-react";
import type { LinkPickerListProps } from "@/features/notes/components/links/LinkPickerPopover";
import { useNoteFolders } from "@/features/notes/hooks/useNoteFolders";
import { useNoteLinkOptions } from "@/features/notes/hooks/useNotes";
import type { Note } from "@/features/notes/types/note";
import { getNoteColor } from "@/features/notes/utils/colorMapper";
import { cn } from "@/lib/utils";

export interface NoteLinkIds {
  folderId: string | null;
  goalId: string | null;
  taskId: string | null;
  listId: string | null;
}

export type NoteLinkKey = keyof NoteLinkIds;

export const linkIdsOf = (note: Note): NoteLinkIds => ({
  folderId: note.folderId,
  goalId: note.goalId,
  taskId: note.taskId,
  listId: note.listId,
});

const dot = (color: string) => <span className={cn("size-2.5 shrink-0 rounded-full", getNoteColor(color).swatch)} />;

/**
 * Picker contents (items, search placeholder, "remove" label) for each kind of note link, plus the names of
 * the current links. Names fall back to the saved note for links the pickers don't list (archived goal,
 * completed task).
 */
export function useNoteLinkPickers({
  links,
  note,
  onChange,
  optionsEnabled,
}: {
  links: NoteLinkIds;
  note?: Note;
  onChange: (key: NoteLinkKey, value: string | null) => void;
  /** Goals / tasks / lists are fetched only while a picker is open or a name is missing */
  optionsEnabled: boolean;
}) {
  const { data: folders = [], isLoading: foldersLoading } = useNoteFolders();
  const needsNames =
    (!!links.goalId && links.goalId !== note?.goal?.id) ||
    (!!links.taskId && links.taskId !== note?.task?.id) ||
    (!!links.listId && links.listId !== note?.list?.id);
  const { data: options, isLoading: optionsLoading } = useNoteLinkOptions(optionsEnabled || needsNames);

  const folder = folders.find((f) => f.id === links.folderId) ?? null;
  const goalTitle =
    options?.goals.find((g) => g.id === links.goalId)?.title ??
    (note?.goal?.id === links.goalId ? note?.goal?.title : undefined);
  const optionTask = options?.tasks.find((t) => t.id === links.taskId);
  const task = optionTask
    ? { title: optionTask.title, completed: false }
    : note?.task?.id === links.taskId ? note?.task ?? undefined : undefined;
  const list =
    options?.lists.find((l) => l.id === links.listId) ??
    (note?.list?.id === links.listId ? note?.list ?? undefined : undefined);

  const pickers: Record<NoteLinkKey, Omit<LinkPickerListProps, "onDone" | "footer">> = {
    folderId: {
      items: folders.map((f) => ({
        id: f.id,
        label: f.name,
        hint: `${f.noteCount} ${f.noteCount === 1 ? "note" : "notes"}`,
        icon: dot(f.color),
      })),
      selectedId: links.folderId,
      onSelect: (id) => onChange("folderId", id),
      onClear: () => onChange("folderId", null),
      clearLabel: "Move out of folder",
      placeholder: "Search folders…",
      emptyText: "No folders yet",
      loading: foldersLoading,
    },
    goalId: {
      items: (options?.goals ?? []).map((g) => ({
        id: g.id,
        label: g.title,
        hint: g.parentTitle ? `↳ sub-goal of ${g.parentTitle}` : null,
        icon: <Target className="size-3.5 shrink-0 text-muted-foreground" />,
      })),
      selectedId: links.goalId,
      onSelect: (id) => onChange("goalId", id),
      onClear: () => onChange("goalId", null),
      clearLabel: "Unlink goal",
      placeholder: "Search goals…",
      emptyText: "No active goals",
      loading: optionsLoading,
    },
    taskId: {
      items: (options?.tasks ?? []).map((t) => ({
        id: t.id,
        label: t.title,
        hint: t.dueDate ? `Due ${format(new Date(t.dueDate), "MMM d")}` : null,
        icon: <CircleCheckBig className="size-3.5 shrink-0 text-muted-foreground" />,
      })),
      selectedId: links.taskId,
      onSelect: (id) => onChange("taskId", id),
      onClear: () => onChange("taskId", null),
      clearLabel: "Unlink task",
      placeholder: "Search open tasks…",
      emptyText: "No open tasks",
      loading: optionsLoading,
    },
    listId: {
      items: (options?.lists ?? []).map((l) => ({ id: l.id, label: l.name, icon: dot(l.color) })),
      selectedId: links.listId,
      onSelect: (id) => onChange("listId", id),
      onClear: () => onChange("listId", null),
      clearLabel: "Unlink list",
      placeholder: "Search lists…",
      emptyText: "No lists yet",
      loading: optionsLoading,
    },
  };

  return { pickers, folder, goalTitle, task, list };
}
