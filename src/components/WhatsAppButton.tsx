import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsAppUrl } from "@/lib/siteConfig";
import { LegalTermsOptIn } from "@/components/LegalTermsOptIn";
import { FormFieldError } from "@/components/FormFieldError";
import { Label } from "@/components/ui/label";
import { MaskedPhoneField } from "@/components/MaskedPhoneInput";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { registerWhatsappSiteConsent } from "@/lib/whatsapp/registerSiteConsent";
import { brazilPhoneField, requiredField } from "@/lib/form-validation";

type WhatsAppWidgetField = "name" | "phone" | "message" | "terms";

function getWhatsAppWidgetErrors(
  name: string,
  phone: string,
  message: string,
  acceptedTerms: boolean,
): Partial<Record<WhatsAppWidgetField, string>> {
  const errors: Partial<Record<WhatsAppWidgetField, string>> = {};
  const nameErr = requiredField(name, "Informe seu nome.");
  if (nameErr) {
    errors.name = nameErr;
  }
  const phoneErr = brazilPhoneField(phone);
  if (phoneErr) {
    errors.phone = phoneErr;
  }
  const messageErr = requiredField(message, "Escreva sua mensagem.");
  if (messageErr) {
    errors.message = messageErr;
  }
  if (!acceptedTerms) {
    errors.terms = "Aceite os Termos de Uso e a Política de Privacidade para continuar.";
  }
  return errors;
}

function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { validate, clearField, getError, showError, reset: resetErrors } = useFieldErrors<WhatsAppWidgetField>();

  function resetForm() {
    setName("");
    setPhone("");
    setMessage("");
    setAcceptedTerms(false);
    resetErrors();
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(getWhatsAppWidgetErrors(name, phone, message, acceptedTerms))) {
      return;
    }

    try {
      await registerWhatsappSiteConsent({
        name: name.trim(),
        phone: phone.trim(),
        source: "site_widget",
      });
    } catch {
      toast.error("Não conseguimos salvar seu aceite agora, mas você pode continuar no WhatsApp.");
    }

    const text = `Olá! Meu nome é ${name.trim()}.\nTelefone: ${phone.trim()}\n\n${message.trim()}`;
    window.open(buildWhatsAppUrl(text), "_blank", "noopener,noreferrer");
    handleClose();
  }

  const inputClassName =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="fixed bottom-20 right-6 z-50 sm:bottom-24 sm:right-8">
      {open && (
        <div className="absolute bottom-16 right-0 w-[min(100vw-2rem,20rem)] animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl duration-300">
          <div className="flex items-center justify-between bg-primary p-4">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle size={20} aria-hidden />
              <span className="text-sm font-semibold">Fale conosco</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-primary-foreground/80 hover:text-primary-foreground"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Preencha os campos abaixo. Você será direcionado ao WhatsApp da Dona Rosa para continuar a conversa.
            </p>

            <FormFieldError
              label={
                <Label htmlFor="wa-name" className="mb-1 block text-xs font-medium">
                  Nome
                </Label>
              }
              error={getError("name")}
              showError={showError("name")}
            >
              <input
                id="wa-name"
                value={name}
                onChange={(e) => {
                  clearField("name");
                  setName(e.target.value);
                }}
                placeholder="Seu nome"
                maxLength={100}
                autoComplete="name"
                className={inputClassName}
              />
            </FormFieldError>

            <FormFieldError
              label={
                <Label htmlFor="wa-phone" className="mb-1 block text-xs font-medium">
                  Telefone
                </Label>
              }
              error={getError("phone")}
              showError={showError("phone")}
            >
              <MaskedPhoneField
                id="wa-phone"
                value={phone}
                onChange={(value) => {
                  clearField("phone");
                  setPhone(value);
                }}
                maxLength={20}
                className={inputClassName}
              />
            </FormFieldError>

            <FormFieldError
              label={
                <Label htmlFor="wa-message" className="mb-1 block text-xs font-medium">
                  Mensagem
                </Label>
              }
              error={getError("message")}
              showError={showError("message")}
            >
              <textarea
                id="wa-message"
                value={message}
                onChange={(e) => {
                  clearField("message");
                  setMessage(e.target.value);
                }}
                placeholder="Como podemos ajudar?"
                maxLength={500}
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </FormFieldError>

            <FormFieldError error={getError("terms")} showError={showError("terms")}>
              <LegalTermsOptIn
                id="wa-terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  clearField("terms");
                  setAcceptedTerms(checked);
                }}
              />
            </FormFieldError>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
            >
              <Send size={16} aria-hidden />
              Continuar no WhatsApp
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:bg-[#1da851]"
        aria-label={open ? "Fechar WhatsApp" : "Abrir WhatsApp"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}

export default WhatsAppButton;
