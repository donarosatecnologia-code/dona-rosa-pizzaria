import { useCmsUiStore } from "@/stores/cmsUiStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CmsConfirmDialog() {
  const confirmDialog = useCmsUiStore((s) => s.confirmDialog);
  const closeConfirmDialog = useCmsUiStore((s) => s.closeConfirmDialog);

  if (!confirmDialog) {
    return null;
  }

  const { title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "default", onConfirm } =
    confirmDialog;

  return (
    <AlertDialog open onOpenChange={(o) => !o && closeConfirmDialog()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-left whitespace-pre-wrap">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeConfirmDialog}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            onClick={async () => {
              await onConfirm();
              closeConfirmDialog();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
