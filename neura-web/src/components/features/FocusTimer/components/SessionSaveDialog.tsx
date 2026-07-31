import { useEffect, useState } from "react";
import { Button } from "../../../ui/button";
import type { FocusSessionTag } from "../../../../types/FocusSession";
import { useCreateFocusSession } from "../hooks/useFocusSessions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../ui/dialog";
import SessionFormFields from "./SessionFormFields";
import { formatDuration } from "../utils/time";
import { toast } from "../../../../lib/toast";

interface PendingSession { duration: number; startTime: Date; endTime: Date; }
interface Props { pendingSession: PendingSession | null; onClose: () => void; }

function SessionSaveDialog({ pendingSession, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<FocusSessionTag | undefined>();
  const { mutate: createSession, isPending } = useCreateFocusSession();

  useEffect(() => {
    if (pendingSession) {
      setName(`Focus session - ${pendingSession.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      setDescription("");
      setTag(undefined);
    }
  }, [pendingSession]);

  if (!pendingSession) return null;

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
    <Dialog open={!!pendingSession} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log this session</DialogTitle>
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