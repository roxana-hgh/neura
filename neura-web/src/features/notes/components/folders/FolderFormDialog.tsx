import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateNoteFolder, useUpdateNoteFolder } from "@/features/notes/hooks/useNoteFolders";
import { useNoteLinkOptions } from "@/features/notes/hooks/useNotes";
import { FolderSchema, type FolderFormValues } from "@/features/notes/schemas/folder.schema";
import type { NoteFolder } from "@/features/notes/types/note";
import { NOTE_COLOR_OPTIONS, NOTE_COLORS } from "@/features/notes/utils/colorMapper";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this folder; create a new one when undefined */
  folder?: NoteFolder | null;
  onSaved?: (folder: NoteFolder) => void;
}

const NO_GOAL = "none";

export default function FolderFormDialog({ open, onOpenChange, folder, onSaved }: FolderFormDialogProps) {
  const create = useCreateNoteFolder();
  const update = useUpdateNoteFolder();
  const { data: options, isLoading } = useNoteLinkOptions(open);
  const saving = create.isPending || update.isPending;

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(FolderSchema),
    defaultValues: { name: "", color: "gray", goalId: NO_GOAL },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: folder?.name ?? "",
        color: folder?.color ?? "gray",
        goalId: folder?.goalId ?? NO_GOAL,
      });
    }
  }, [open, folder, form]);

  // An archived / finished goal isn't in the options, but stays selectable while it's the current link
  const goals = options?.goals ?? [];
  const currentGoal = folder?.goal && !goals.some((g) => g.id === folder.goal!.id) ? folder.goal : null;

  const submit = (values: FolderFormValues) => {
    const input = { name: values.name, color: values.color, goal_id: values.goalId === NO_GOAL ? null : values.goalId };
    const done = (saved: NoteFolder) => {
      toast.success(folder ? "Folder updated" : "Folder created");
      onSaved?.(saved);
      onOpenChange(false);
    };
    if (folder) update.mutate({ id: folder.id, input }, { onSuccess: done });
    else create.mutate(input, { onSuccess: done });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit folder" : "New folder"}</DialogTitle>
          <DialogDescription>
            Group related notes. Link the folder to a goal to see its notes on the goal's page.
          </DialogDescription>
        </DialogHeader>

        <form id="folder-form" onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input id="folder-name" autoFocus dir="auto" maxLength={60} placeholder="e.g. Research" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLOR_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      title={NOTE_COLORS[value].label}
                      aria-label={NOTE_COLORS[value].label}
                      aria-pressed={field.value === value}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110",
                        NOTE_COLORS[value].swatch,
                        field.value === value && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      )}
                    >
                      {field.value === value && <Check className="size-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Linked goal</Label>
            <Controller
              control={form.control}
              name="goalId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoading ? "Loading goals…" : "No goal"} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72 max-w-[calc(100vw-2rem)]">
                    <SelectItem value={NO_GOAL}>No goal</SelectItem>
                    {currentGoal && <SelectItem value={currentGoal.id}>{currentGoal.title}</SelectItem>}
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.parentTitle ? `↳ ${g.title}` : g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="folder-form" disabled={saving}>
            {saving && <Spinner />} {folder ? "Save" : "Create folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
