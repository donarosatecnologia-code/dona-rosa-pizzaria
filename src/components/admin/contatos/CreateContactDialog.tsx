import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormFieldError } from "@/components/FormFieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedPhoneInput } from "@/components/MaskedPhoneInput";
import { useCreateWhatsappContact } from "@/hooks/whatsapp";
import { brazilPhoneField, requiredField } from "@/lib/form-validation";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FieldErrors = Partial<Record<"name" | "phone" | "terms", string>>;

export function CreateContactDialog({ open, onOpenChange }: CreateContactDialogProps) {
  const createContact = useCreateWhatsappContact();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function resetState() {
    setName("");
    setPhone("");
    setConfirmTerms(false);
    setErrors({});
    createContact.reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const nameErr = requiredField(name, "Informe o nome do cliente.");
    if (nameErr) {
      nextErrors.name = nameErr;
    }
    const phoneErr = brazilPhoneField(phone);
    if (phoneErr) {
      nextErrors.phone = phoneErr;
    }
    if (!confirmTerms) {
      nextErrors.terms = "Confirme a autorização LGPD para cadastrar o cliente.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await createContact.mutateAsync({
        name,
        phone_number: phone,
        confirmTermsConsent: true,
      });
      toast.success("Cliente cadastrado.");
      handleOpenChange(false);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : error instanceof Error
            ? error.message
            : "";

      if (code === "23505" || code === "duplicate_phone") {
        setErrors({ phone: "Já existe um cliente com este telefone." });
        return;
      }
      if (code === "invalid_phone") {
        setErrors({ phone: "Informe um telefone válido com DDD." });
        return;
      }
      toast.error("Não deu para cadastrar. Tente de novo.");
    }
  }

  const isSaving = createContact.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Cadastre um contato único com nome e telefone. Também dá para importar uma lista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-contact-name">Nome</Label>
            <Input
              id="create-contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do cliente"
              autoComplete="name"
              disabled={isSaving}
              className="min-h-[44px]"
            />
            <FormFieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-contact-phone">Telefone / WhatsApp</Label>
            <MaskedPhoneInput
              id="create-contact-phone"
              value={phone}
              onChange={setPhone}
              disabled={isSaving}
              className="min-h-[44px]"
            />
            <FormFieldError message={errors.phone} />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Checkbox
              id="create-contact-terms"
              checked={confirmTerms}
              onCheckedChange={(checked) => setConfirmTerms(checked === true)}
              disabled={isSaving}
            />
            <Label htmlFor="create-contact-terms" className="cursor-pointer text-sm leading-snug">
              Confirmo que este cliente autorizou receber mensagens da Dona Rosa (LGPD).
            </Label>
          </div>
          <FormFieldError message={errors.terms} />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="min-h-[44px]">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
