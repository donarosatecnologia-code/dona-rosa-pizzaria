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

interface DeleteContactDialogProps {
  contactId: string;
  contactName: string;
}

export function DeleteContactDialog({ contactId, contactName }: DeleteContactDialogProps) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const deleteContact = useDeleteWhatsappContact();

  async function handleDelete() {
    try {
      await deleteContact.mutateAsync({ contactId, reason: reason.trim() || undefined });
      toast.success("Contato excluído. Trilha registrada para LGPD.");
      setOpen(false);
      setReason("");
    } catch {
      toast.error("Não foi possível excluir o contato.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir contato permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{contactName}</strong> será removido da base. Conversas anteriores permanecem com
            indicador &quot;Removido da base&quot;. Esta ação é irreversível.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Motivo da exclusão (opcional, para auditoria LGPD)"
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
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
