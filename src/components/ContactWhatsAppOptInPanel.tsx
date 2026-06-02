import { useState, type ReactNode } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/siteConfig";
import { LegalTermsOptIn } from "@/components/LegalTermsOptIn";
import { Button } from "@/components/ui/button";

interface ContactWhatsAppOptInPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  message: string;
  submitLabel?: string;
}

export function ContactWhatsAppOptInPanel({
  open,
  onClose,
  title,
  description,
  message,
  submitLabel = "Continuar no WhatsApp",
}: ContactWhatsAppOptInPanelProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!open) {
    return null;
  }

  function handleClose() {
    setAcceptedTerms(false);
    onClose();
  }

  function handleContinue() {
    if (!acceptedTerms) {
      return;
    }

    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-wa-optin-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Fechar"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl duration-300">
        <div className="flex items-center justify-between bg-primary px-4 py-3">
          <div className="flex items-center gap-2 text-primary-foreground">
            <MessageCircle size={20} aria-hidden />
            <span id="contact-wa-optin-title" className="text-sm font-semibold">
              {title}
            </span>
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

        <div className="space-y-4 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          <LegalTermsOptIn
            id="contact-wa-reserve-terms"
            checked={acceptedTerms}
            onCheckedChange={setAcceptedTerms}
          />
          <Button
            type="button"
            disabled={!acceptedTerms}
            className="flex w-full items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] disabled:opacity-50"
            onClick={handleContinue}
          >
            <Send size={16} aria-hidden />
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ContactWhatsAppReserveButtonProps {
  message?: string;
  className?: string;
  children?: ReactNode;
}

export function ContactWhatsAppReserveButton({
  message = "Olá! Gostaria de reservar uma mesa na Dona Rosa Pizzaria.",
  className,
  children,
}: ContactWhatsAppReserveButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-6 py-4 text-base font-semibold text-white shadow-md transition-transform hover:scale-[1.02] hover:shadow-lg"
        }
        aria-label="Reservar mesa pelo WhatsApp"
      >
        {children ?? (
          <>
            <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
            Reservar pelo WhatsApp
          </>
        )}
      </button>

      <ContactWhatsAppOptInPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Reservar pelo WhatsApp"
        description="Você será direcionado ao WhatsApp da Dona Rosa para combinar sua reserva. Antes de continuar, confirme que leu nossos termos."
        message={message}
      />
    </>
  );
}
