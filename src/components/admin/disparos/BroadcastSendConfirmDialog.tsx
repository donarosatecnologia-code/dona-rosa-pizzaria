import { Loader2, Send } from "lucide-react";
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
import { formatBroadcastCostBrl } from "@/lib/whatsapp/broadcastCost";

interface BroadcastSendConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactCount: number;
  isLoadingCount?: boolean;
  isSending?: boolean;
  onConfirm: () => void;
}

export function BroadcastSendConfirmDialog({
  open,
  onOpenChange,
  contactCount,
  isLoadingCount = false,
  isSending = false,
  onConfirm,
}: BroadcastSendConfirmDialogProps) {
  const costLabel = formatBroadcastCostBrl(contactCount);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar disparo</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Você está prestes a enviar{" "}
                <strong className="text-foreground">
                  {isLoadingCount ? "…" : contactCount}
                </strong>{" "}
                mensagem(ns). Isso não pode ser desfeito.
              </p>
              <p>
                Custo estimado: <strong className="text-foreground">{costLabel}</strong> (
                {isLoadingCount ? "…" : contactCount} contatos × R$ 0,35)
              </p>
              <p className="text-xs">
                Este valor será cobrado diretamente pela Meta no cartão cadastrado na sua conta
                Business.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSending || isLoadingCount || contactCount === 0}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Confirmar disparo
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
