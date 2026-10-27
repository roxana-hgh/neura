import { useEffect, useState } from "react";

import type { FocusSession, FocusSessionTag } from "@/features/focus/types/focusSession";
import { useUpdateFocusSession } from "@/features/focus/hooks/useFocusSessions";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SessionFormFields from "@/features/focus/components/sessions/SessionFormFields";
import { Button } from "@/components/ui/button";

interface Props { session: FocusSession | null; onClose: () => void; }

function SessionEditDialog({ session, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<FocusSessionTag | undefined>();
  const { mutate: updateSession, isPending } = useUpdateFocusSession();

  useEffect(() => {
    if (session) {
      setName(session.name);
      setDescription(session.description ?? "");
      setTag(session.tag ?? undefined);
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    updateSession(
      { id: session.id, updates: { name: name.trim(), description: description.trim() || undefined, tag } },
      { onSuccess: () => { toast.success("Session updated"); onClose(); }, onError: () => toast.error("Couldn't update the session") }
    );
  };

  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
          <DialogDescription>Update the name, category, or description.</DialogDescription>
        </DialogHeader>
        <SessionFormFields name={name} onNameChange={setName} description={description} onDescriptionChange={setDescription} tag={tag} onTagChange={setTag} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? "Saving..." : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionEditDialog;