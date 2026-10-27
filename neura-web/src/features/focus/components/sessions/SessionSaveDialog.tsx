import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CompletedFocusSession, FocusSessionTag } from "@/features/focus/types/focusSession";
import { useCreateFocusSession } from "@/features/focus/hooks/useFocusSessions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SessionFormFields from "@/features/focus/components/sessions/SessionFormFields";
import { defaultSessionName, formatDuration } from "@/features/focus/utils/time";
import { toast } from "@/lib/toast";

interface Props { pendingSession: CompletedFocusSession | null; onClose: () => void; }

// Keyed by session, so the form starts fresh for every finished session
function SessionSaveDialog({ pendingSession, onClose }: Props) {
  if (!pendingSession) return null;
  return <SessionSaveForm key={pendingSession.startTime.getTime()} pendingSession={pendingSession} onClose={onClose} />;
}

function SessionSaveForm({ pendingSession, onClose }: { pendingSession: CompletedFocusSession; onClose: () => void }) {
  const [name, setName] = useState(() => defaultSessionName(pendingSession.startTime));
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<FocusSessionTag | undefined>();
  const { mutate: createSession, isPending } = useCreateFocusSession();

  const handleSave = () => {
    createSession(
      {
        name: name.trim() || "Focus session",
        description: description.trim() || undefined,
        tag,
        duration: pendingSession.duration,
        startTime: pendingSession.startTime.toISOString(),
        endTime: pendingSession.endTime.toISOString(),
      },
      {
        onSuccess: () => { toast.success("Focus session logged"); onClose(); },
        onError: () => toast.error("Couldn't save the session"),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session complete 🎉</DialogTitle>
          <DialogDescription>
            You focused for {formatDuration(pendingSession.duration)}. Give it a name so you can find it later.
          </DialogDescription>
        </DialogHeader>
        <SessionFormFields name={name} onNameChange={setName} description={description} onDescriptionChange={setDescription} tag={tag} onTagChange={setTag} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Discard</Button>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? "Saving..." : "Save session"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionSaveDialog;