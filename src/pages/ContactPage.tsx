import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Globe, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { FormFieldError } from "@/components/FormFieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BrandAlecrim, BrandTomilho, BrandTomilhoB } from "@/components/BrandAccents";
import { siteContainerClass } from "@/lib/siteLayout";
import { buildWhatsAppUrl, SITE_WHATSAPP } from "@/lib/siteConfig";
import { LegalTermsOptIn } from "@/components/LegalTermsOptIn";
import { registerWhatsappSiteConsent } from "@/lib/whatsapp/registerSiteConsent";
import { ContactWhatsAppReserveButton } from "@/components/ContactWhatsAppOptInPanel";
import { MaskedEmailInput } from "@/components/MaskedEmailInput";
import { MaskedPhoneInput } from "@/components/MaskedPhoneInput";
import { brazilPhoneField, emailField, requiredField } from "@/lib/form-validation";
import { cn } from "@/lib/utils";

export interface ContactFormValues {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export function buildContactWhatsAppMessage(values: ContactFormValues): string {
  const lines = [
    "*Novo Contato - Dona Rosa Pizzaria*",
    "",
    `*Nome:* ${values.name}`,
    `*Telefone:* ${values.phone}`,
    `*E-mail:* ${values.email}`,
    `*Assunto:* ${values.subject}`,
    `*Mensagem:* ${values.message}`,
  ];
  return lines.join("\n");
}

export function sendWhatsAppMessage(_phoneDigits: string, message: string): void {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

type ContactFormField = "name" | "phone" | "email" | "subject" | "message" | "terms";

function getContactFormErrors(
  values: ContactFormValues,
  acceptedTerms: boolean,
): Partial<Record<ContactFormField, string>> {
  const errors: Partial<Record<ContactFormField, string>> = {};
  const nameErr = requiredField(values.name, "Informe seu nome.");
  if (nameErr) {
    errors.name = nameErr;
  }
  const phoneErr = brazilPhoneField(values.phone);
  if (phoneErr) {
    errors.phone = phoneErr;
  }
  const emailErr = emailField(values.email);
  if (emailErr) {
    errors.email = emailErr;
  }
  const subjectErr = requiredField(values.subject, "Informe o assunto.");
  if (subjectErr) {
    errors.subject = subjectErr;
  }
  const messageErr = requiredField(values.message, "Escreva sua mensagem.");
  if (messageErr) {
    errors.message = messageErr;
  }
  if (!acceptedTerms) {
    errors.terms = "Aceite os Termos de Uso e a Política de Privacidade para continuar.";
  }
  return errors;
}

function stripMailtoPrefix(value: string): string {
  return value.replace(/^mailto:/i, "").trim();
}

const iconMap: Record<string, ReactNode> = {
  instagram: <Instagram size={18} />,
  facebook: <Facebook size={18} />,
  youtube: <Youtube size={18} />,
  twitter: <Twitter size={18} />,
  linkedin: <Linkedin size={18} />,
  globe: <Globe size={18} />,
};

function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { validate, clearField, getError, showError } = useFieldErrors<ContactFormField>();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const values: ContactFormValues = { name, phone, email, subject, message };
    if (!validate(getContactFormErrors(values, acceptedTerms))) {
      return;
    }

    try {
      await registerWhatsappSiteConsent({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        source: "site_contact_form",
      });
    } catch {
      toast.error("Não conseguimos salvar seu aceite agora, mas você pode continuar no WhatsApp.");
    }

    sendWhatsAppMessage(SITE_WHATSAPP.e164, buildContactWhatsAppMessage(values));
    toast.success("Abrindo o WhatsApp com sua mensagem.");
    setAcceptedTerms(false);
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormFieldError
          label={<Label htmlFor="contact-name">Nome completo</Label>}
          error={getError("name")}
          showError={showError("name")}
        >
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              clearField("name");
              setName(e.target.value);
            }}
            placeholder="Seu nome"
          />
        </FormFieldError>
        <FormFieldError
          label={<Label htmlFor="contact-phone">Telefone</Label>}
          error={getError("phone")}
          showError={showError("phone")}
        >
          <MaskedPhoneInput
            id="contact-phone"
            name="phone"
            value={phone}
            onChange={(value) => {
              clearField("phone");
              setPhone(value);
            }}
          />
        </FormFieldError>
        <FormFieldError
          label={<Label htmlFor="contact-email">E-mail</Label>}
          error={getError("email")}
          showError={showError("email")}
        >
          <MaskedEmailInput
            id="contact-email"
            name="email"
            value={email}
            onChange={(value) => {
              clearField("email");
              setEmail(value);
            }}
          />
        </FormFieldError>
        <FormFieldError
          label={<Label htmlFor="contact-subject">Assunto</Label>}
          error={getError("subject")}
          showError={showError("subject")}
        >
          <Input
            id="contact-subject"
            name="subject"
            value={subject}
            onChange={(e) => {
              clearField("subject");
              setSubject(e.target.value);
            }}
            placeholder="Assunto"
          />
        </FormFieldError>
      </div>
      <FormFieldError
        label={<Label htmlFor="contact-message">Mensagem</Label>}
        error={getError("message")}
        showError={showError("message")}
      >
        <Textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => {
            clearField("message");
            setMessage(e.target.value);
          }}
          placeholder="Sua mensagem"
          rows={5}
          className="min-h-[140px] resize-y"
        />
      </FormFieldError>
      <FormFieldError error={getError("terms")} showError={showError("terms")}>
        <LegalTermsOptIn
          id="contact-form-terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => {
            clearField("terms");
            setAcceptedTerms(checked);
          }}
        />
      </FormFieldError>
      <button
        type="submit"
        className="btn-primary-dr w-full font-semibold uppercase tracking-wide sm:w-auto sm:min-w-[12rem]"
      >
        Enviar pelo WhatsApp
      </button>
    </form>
  );
}

function ContactPage() {
  const shell = useSiteShellReady();
  const cmsKeys = [
    "contact-s1-title",
    "contact-s1-desc",
    "contact-phone-1",
    "contact-phone-2",
    "contact-email",
    "contact-address",
    "contact-s2-title",
    "contact-s2-desc",
    "contact-s2-hours",
    "contact-s3-title",
  ];

  const { getText, isPending, isError } = useCmsContents(cmsKeys, "contato");

  const { data: socialLinks } = useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) {
        throw error;
      }
      return data;
    },
  });

  if (shell.isPending || isPending) {
    return <LoadingScreen message="Carregando conteúdo…" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Bloco 1: introdução + grade de contato + reserva */}
      <section className="section-paper relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <BrandTomilhoB className="pointer-events-none absolute right-3 top-28 z-[1] h-28 w-auto max-w-[42%] object-contain drop-shadow-md lg:hidden" />
        <BrandAlecrim className="pointer-events-none absolute left-0 top-28 hidden h-40 w-auto md:block lg:h-48 lg:opacity-100" />
        <BrandTomilhoB className="pointer-events-none absolute bottom-6 right-0 hidden h-44 w-auto lg:block xl:bottom-10 xl:h-52 lg:opacity-100 drop-shadow-md" />

        <div className={cn(siteContainerClass, "relative z-10")}>
          <header className="mb-12 w-full text-justify md:mb-14">
            <EditableWrapper id="contact-s1-title" type="text" label="Título — Entre em contato">
              <RichText
                as="h1"
                inline
                content={getText("contact-s1-title")}
                className="text-4xl font-bold text-foreground md:text-5xl"
              />
            </EditableWrapper>
            <div className="mt-5 h-1 w-16 rounded-full bg-secondary/80" aria-hidden />
            <EditableWrapper id="contact-s1-desc" type="textarea" label="Texto introdutório — Contato">
              <RichText
                content={getText("contact-s1-desc")}
                className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg"
              />
            </EditableWrapper>
          </header>

          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-0 md:overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-sm">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:rounded-none md:border-0 md:border-r md:p-8">
              <div className="flex items-center gap-2 text-primary">
                <Phone className="h-5 w-5" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Telefones</span>
              </div>
              <div className="space-y-3 text-sm md:text-base">
                <EditableWrapper id="contact-phone-1" type="text" label="Telefone 1">
                  <RichText as="p" inline content={getText("contact-phone-1")} className="text-foreground" />
                </EditableWrapper>
                <EditableWrapper id="contact-phone-2" type="text" label="Telefone 2">
                  <RichText as="p" inline content={getText("contact-phone-2")} className="text-foreground" />
                </EditableWrapper>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:rounded-none md:border-0 md:border-r md:p-8">
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">E-mail</span>
              </div>
              <EditableWrapper id="contact-email" type="text" label="E-mail">
                <a
                  href={`mailto:${stripMailtoPrefix(getText("contact-email"))}`}
                  className="text-sm text-primary underline-offset-2 hover:underline md:text-base"
                >
                  <RichText as="span" inline content={getText("contact-email")} />
                </a>
              </EditableWrapper>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:rounded-none md:border-0 md:p-8">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Endereço</span>
              </div>
              <EditableWrapper id="contact-address" type="textarea" label="Endereço">
                <RichText content={getText("contact-address")} className="text-sm leading-relaxed text-muted-foreground md:text-base" />
              </EditableWrapper>
            </div>
          </div>

          <div className="mb-10 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-background to-secondary/[0.06] p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10">
              <div className="min-w-0 flex-1 space-y-3">
                <EditableWrapper id="contact-s2-title" type="text" label="Título — Reserve sua mesa">
                  <RichText
                    as="h2"
                    inline
                    content={getText("contact-s2-title")}
                    className="text-2xl font-bold text-foreground md:text-3xl"
                  />
                </EditableWrapper>
                <EditableWrapper id="contact-s2-desc" type="textarea" label="Texto — Reserva">
                  <RichText
                    content={getText("contact-s2-desc")}
                    className="text-sm leading-relaxed text-muted-foreground md:text-base"
                  />
                </EditableWrapper>
                <div className="border-t border-border/50 pt-4">
                  <EditableWrapper id="contact-s2-hours" type="textarea" label="Horário de funcionamento (reserva)">
                    <RichText
                      content={getText("contact-s2-hours")}
                      className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
                    />
                  </EditableWrapper>
                </div>
              </div>
              <div className="flex shrink-0 flex-col justify-center lg:w-72">
                <ContactWhatsAppReserveButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 2: formulário + redes sociais */}
      <section className="relative border-t border-border/60 bg-muted/25 py-14 md:py-20">
        <div className={siteContainerClass}>
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-justify">
              <EditableWrapper id="contact-s3-title" type="text" label="Título — Fale conosco">
                <RichText
                  as="h2"
                  inline
                  content={getText("contact-s3-title")}
                  className="text-2xl font-bold text-foreground md:text-3xl"
                />
              </EditableWrapper>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
              <ContactForm />
            </div>
            {(socialLinks?.length ?? 0) > 0 && (
              <div className="mt-10 flex w-full flex-col items-center border-t border-border/60 pt-8">
                <div className="flex justify-center">
                  <p className="text-sm font-medium text-muted-foreground">Siga a Dona Rosa</p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-5">
                  {(socialLinks ?? []).map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground opacity-75 transition-opacity hover:opacity-100"
                      aria-label={link.platform}
                    >
                      {iconMap[link.icon_name] || <Globe size={22} />}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default ContactPage;
