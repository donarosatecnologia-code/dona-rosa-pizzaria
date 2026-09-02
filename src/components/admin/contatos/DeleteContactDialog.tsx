import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteWhatsappContact } from "@/hooks/whatsapp/useWhatsappBusinessHours";
import { cn } from "@/lib/utils";

interface DeleteContactDialogProps {
  contactId: string;
  contactName: string;
  /** Linha da tabela desktop — botão compacto inline. */
  compact?: boolean;
}

export function DeleteContactDialog({
  contactId,
  contactName,
  compact = false,
}: DeleteContactDialogProps) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const deleteContact = useDeleteWhatsappContact();

  async function handleDelete() {
    try {
      await deleteContact.mutateAsync({ contactId, reason: reason.trim() || undefined });
      toast.success("Cadastro excluído.");
      setOpen(false);
      setReason("");
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("contact_not_found")
          ? "Contato não encontrado."
          : err instanceof Error && err.message.includes("not_admin")
            ? "Sem permissão para excluir."
            : "Não deu para excluir. Se acabou de atualizar o sistema, rode db:deploy.";
      toast.error(msg);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "text-destructive hover:bg-destructive/10 hover:text-destructive",
            compact
              ? "h-8 px-2 text-xs shrink-0"
              : "min-h-[44px] w-full",
          )}
        >
          <Trash2 className={cn("h-4 w-4", compact ? "mr-1" : "mr-2")} />
          Excluir cadastro
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir cadastro para sempre?</AlertDialogTitle>
          <AlertDialogDescription>
            O cadastro de <strong>{contactName}</strong> será removido. Conversas antigas ficam
            guardadas. Não dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Por que está excluindo? (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleteContact.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir cadastro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
