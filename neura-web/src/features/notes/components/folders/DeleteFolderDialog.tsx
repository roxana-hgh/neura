import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteNoteFolder } from "@/features/notes/hooks/useNoteFolders";
import type { NoteFolder } from "@/features/notes/types/note";
import { toast } from "@/lib/toast";

interface DeleteFolderDialogProps {
  folder: NoteFolder | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/** Deleting a folder keeps its notes (they become unfiled) unless the user deletes them too. */
export default function DeleteFolderDialog({ folder, onOpenChange, onDeleted }: DeleteFolderDialogProps) {
  const remove = useDeleteNoteFolder();
  const count = folder?.noteCount ?? 0;

  const run = (deleteNotes: boolean) => {
    if (!folder) return;
    remove.mutate(
      { id: folder.id, deleteNotes },
      {
        onSuccess: () => {
          toast.success(deleteNotes ? "Folder and notes deleted" : "Folder deleted");
          onDeleted?.();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={!!folder} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{folder?.name}”?</DialogTitle>
          <DialogDescription>
            {count === 0
              ? "The folder is empty."
              : `It has ${count} ${count === 1 ? "note" : "notes"}. Keep them (they move to “Unfiled”) or delete them with the folder.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {count > 0 && (
            <Button type="button" variant="outline" className="text-destructive" disabled={remove.isPending} onClick={() => run(true)}>
              Delete notes too
            </Button>
          )}
          <Button type="button" variant="destructive" disabled={remove.isPending} onClick={() => run(false)}>
            {count > 0 ? "Delete folder, keep notes" : "Delete folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
