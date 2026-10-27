import type { Blocker } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateFocusSession } from "@/features/focus/hooks/useFocusSessions";
import type { FocusTimerControls } from "@/features/focus/hooks/useFocusTimer";
import { defaultSessionName, formatDuration } from "@/features/focus/utils/time";
import { toast } from "@/lib/toast";

interface Props {
  blocker: Blocker;
  timer: FocusTimerControls;
}

/** Shown when the user navigates away from /focus while a session is in progress. */
function LeaveFocusDialog({ blocker, timer }: Props) {
  const { mutateAsync: createSession, isPending } = useCreateFocusSession();
  const open = blocker.state === "blocked";
  const canSave = timer.elapsedSeconds > 0 && timer.startTime !== null;

  const stay = () => blocker.reset?.();

  const saveAndLeave = async () => {
    if (!timer.startTime) return;
    try {
      await createSession({
        name: defaultSessionName(timer.startTime),
        duration: timer.elapsedSeconds,
        startTime: timer.startTime.toISOString(),
        endTime: new Date().toISOString(),
      });
      toast.success("Focus session logged");
      blocker.proceed?.();
    } catch {
      toast.error("Couldn't save the session");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && stay()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave your focus session?</DialogTitle>
          <DialogDescription>
            The timer will stop if you leave this page.
            {canSave && ` You've focused for ${formatDuration(timer.elapsedSeconds)} so far.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={isPending} onClick={() => blocker.proceed?.()}>
            Discard & leave
          </Button>
          {canSave && (
            <Button variant="outline" disabled={isPending} onClick={saveAndLeave}>
              {isPending ? "Saving..." : "Save & leave"}
            </Button>
          )}
          <Button autoFocus disabled={isPending} onClick={stay}>
            Keep focusing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LeaveFocusDialog;
