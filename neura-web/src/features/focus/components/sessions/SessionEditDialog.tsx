import { useState } from "react";

import type { FocusSession, FocusSessionTag } from "@/features/focus/types/focusSession";
import { useUpdateFocusSession } from "@/features/focus/hooks/useFocusSessions";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SessionFormFields from "@/features/focus/components/sessions/SessionFormFields";
import { Button } from "@/components/ui/button";

interface Props { session: FocusSession | null; onClose: () => void; }

// Keyed by session, so the form starts from the session being edited
function SessionEditDialog({ session, onClose }: Props) {
  if (!session) return null;
  return <SessionEditForm key={session.id} session={session} onClose={onClose} />;
}

function SessionEditForm({ session, onClose }: { session: FocusSession; onClose: () => void }) {
  const [name, setName] = useState(session.name);
  const [description, setDescription] = useState(session.description ?? "");
  const [tag, setTag] = useState<FocusSessionTag | undefined>(session.tag ?? undefined);
  const { mutate: updateSession, isPending } = useUpdateFocusSession();

  const handleSave = () => {
    updateSession(
      { id: session.id, updates: { name: name.trim(), description: description.trim() || undefined, tag } },
      { onSuccess: () => { toast.success("Session updated"); onClose(); }, onError: () => toast.error("Couldn't update the session") }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
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