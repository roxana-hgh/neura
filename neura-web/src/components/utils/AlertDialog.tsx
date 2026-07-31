
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface Iprops {
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  acceptButtonText?: string;
  cancelButtonText?: string;
  AcceptButtonVariant?: "primary" | "danger";
  open: boolean;
  setOpen: (state: boolean) => void
}

function AlertDialog({
  title = "",
  description = "Are You Sure?",
  onConfirm,
  onCancel,
  acceptButtonText = "Accept",
  cancelButtonText = "cancel",
  AcceptButtonVariant = "primary",
  open,
  setOpen,
}: Iprops) {

  const onAcceptHandler = () => {
    setOpen(false);
    onConfirm();
  };

  const onCancelHandler = () => {
    setOpen(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          {title &&  <DialogTitle>{title}</DialogTitle> }
         
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex gap-2">
            <Button size="sm" className={AcceptButtonVariant === "danger" ? "text-white bg-red-500 border-red-400 hover:bg-red-600" : ""} onClick={onAcceptHandler}>{acceptButtonText}</Button>
            <Button size="sm" onClick={onCancelHandler} variant="ghost">
              {cancelButtonText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AlertDialog;
