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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCmsContents } from "@/hooks/useCmsContent";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";

const CONTACT_WHATSAPP_PHONE = "5511930617116";

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

export function sendWhatsAppMessage(phoneDigits: string, message: string): void {
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function validateContactForm(values: ContactFormValues): string | null {
  if (!values.name.trim()) {
    return "Informe seu nome.";
  }
  if (!values.phone.trim()) {
    return "Informe seu telefone.";
  }
  if (!values.email.trim()) {
    return "Informe seu e-mail.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return "Informe um e-mail válido.";
  }
  if (!values.subject.trim()) {
    return "Informe o assunto.";
  }
  if (!values.message.trim()) {
    return "Escreva sua mensagem.";
  }
  return null;
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const values: ContactFormValues = { name, phone, email, subject, message };
    const err = validateContactForm(values);
    if (err) {
      toast.error(err);
      return;
    }
    sendWhatsAppMessage(CONTACT_WHATSAPP_PHONE, buildContactWhatsAppMessage(values));
    toast.success("Abrindo o WhatsApp com sua mensagem.");
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nome completo</Label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone">Telefone</Label>
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">E-mail</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">Assunto</Label>
        <Input
          id="contact-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Mensagem</Label>
        <Textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Sua mensagem"
          rows={5}
          className="resize-y min-h-[120px]"
        />
      </div>
      <button type="submit" className="btn-primary-dr w-full uppercase tracking-wide font-semibold">
        Enviar!
      </button>
    </form>
  );
}

function ContactPage() {
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

  const reservationMessage = encodeURIComponent(
    "Olá! Gostaria de reservar uma mesa na Dona Rosa Pizzaria.",
  );
  const reservationWhatsAppUrl = `https://wa.me/${CONTACT_WHATSAPP_PHONE}?text=${reservationMessage}`;

  if (isPending) {
    return <LoadingScreen message="Carregando conteúdo…" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="section-paper relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        <BrandAlecrim className="absolute left-0 top-28 h-40 w-auto opacity-[0.22] hidden md:block lg:h-48" />
        <BrandTomilhoB className="absolute right-4 top-32 h-24 w-auto opacity-[0.18] hidden lg:block xl:h-28" />
        <BrandTrigo className="absolute right-0 bottom-6 h-36 w-auto opacity-[0.18] hidden lg:block xl:bottom-10 xl:h-44" />
        <BrandLinhaDecorativa className="absolute left-8 bottom-16 h-9 w-auto max-w-[11rem] opacity-[0.2] -rotate-6 hidden xl:block" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center md:mb-12">
            <EditableWrapper id="contact-s1-title" type="text" label="Título — Entre em contato">
              <RichText
                as="h1"
                inline
                content={getText("contact-s1-title")}
                className="text-4xl md:text-5xl text-foreground"
              />
            </EditableWrapper>
            <div className="mx-auto mt-5 flex justify-center opacity-[0.35]">
              <BrandLinhaDecorativa className="h-8 w-auto max-w-[min(100%,12rem)] object-contain" />
            </div>
            <EditableWrapper id="contact-s1-desc" type="textarea" label="Texto introdutório — Contato">
              <RichText
                content={getText("contact-s1-desc")}
                className="mt-4 text-muted-foreground mx-auto max-w-2xl leading-relaxed"
              />
            </EditableWrapper>
          </div>

          <div className="mx-auto max-w-xl space-y-5 text-sm md:text-base">
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <EditableWrapper id="contact-phone-1" type="text" label="Telefone 1">
                <RichText as="p" inline content={getText("contact-phone-1")} className="text-foreground" />
              </EditableWrapper>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <EditableWrapper id="contact-phone-2" type="text" label="Telefone 2">
                <RichText as="p" inline content={getText("contact-phone-2")} className="text-foreground" />
              </EditableWrapper>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <EditableWrapper id="contact-email" type="text" label="E-mail">
                <a
                  href={`mailto:${stripMailtoPrefix(getText("contact-email"))}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  <RichText as="span" inline content={getText("contact-email")} />
                </a>
              </EditableWrapper>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <EditableWrapper id="contact-address" type="textarea" label="Endereço">
                <RichText content={getText("contact-address")} className="text-muted-foreground leading-relaxed" />
              </EditableWrapper>
            </div>
          </div>

          {(socialLinks?.length ?? 0) > 0 && (
            <div className="mx-auto mt-10 max-w-xl border-t border-border/60 pt-8">
              <p className="mb-4 text-center text-sm font-medium text-foreground">Redes sociais</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {(socialLinks ?? []).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground opacity-80 transition-opacity hover:opacity-100"
                    aria-label={link.platform}
                  >
                    {iconMap[link.icon_name] || <Globe size={20} />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-16 md:py-24">
        <BrandTomilhoB className="absolute left-0 top-1/2 h-32 w-auto -translate-y-1/2 opacity-[0.14] hidden lg:block xl:h-40" />
        <BrandTrigo className="absolute right-2 top-1/2 h-36 w-auto -translate-y-1/2 opacity-[0.14] hidden lg:block xl:right-6 xl:h-44" />
        <BrandAlecrim className="absolute left-1/3 bottom-4 h-28 w-auto opacity-[0.1] hidden xl:block" />
        <BrandLinhaDecorativa className="absolute right-10 top-8 h-8 w-auto max-w-[9rem] opacity-[0.18] rotate-3 hidden xl:block" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <EditableWrapper id="contact-s2-title" type="text" label="Título — Reserve sua mesa">
            <RichText
              as="h2"
              inline
              content={getText("contact-s2-title")}
              className="text-3xl md:text-4xl text-foreground"
            />
          </EditableWrapper>
          <EditableWrapper id="contact-s2-desc" type="textarea" label="Texto — Reserva">
            <RichText
              content={getText("contact-s2-desc")}
              className="mt-4 text-muted-foreground mx-auto max-w-2xl leading-relaxed"
            />
          </EditableWrapper>

          <div className="mt-10 flex justify-center">
            <a
              href={reservationWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 md:h-28 md:w-28"
              aria-label="Reservar mesa pelo WhatsApp"
            >
              <svg className="h-12 w-12 md:h-14 md:w-14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.03-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>

          <div className="mx-auto mt-12 max-w-md">
            <EditableWrapper id="contact-s2-hours" type="textarea" label="Horário de funcionamento (reserva)">
              <RichText
                content={getText("contact-s2-hours")}
                className="text-center text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
              />
            </EditableWrapper>
          </div>
        </div>
      </section>

      <section className="section-paper relative overflow-hidden py-16 md:py-24">
        <BrandTomilhoB className="absolute left-2 top-20 h-24 w-auto opacity-[0.15] hidden md:block lg:top-24 lg:h-28" />
        <BrandTomilho className="absolute bottom-10 right-4 h-28 w-auto opacity-[0.18] hidden lg:block xl:bottom-14 xl:h-32" />
        <BrandTrigo className="absolute left-4 bottom-24 h-32 w-auto opacity-[0.16] hidden lg:block xl:left-8" />
        <BrandAlecrim className="absolute right-0 top-1/3 h-32 w-auto opacity-[0.12] -translate-y-1/2 hidden xl:block xl:h-40" />
        <BrandLinhaDecorativa className="absolute left-6 top-28 h-10 w-auto opacity-[0.15] -rotate-6 hidden xl:block" />
        <BrandLinhaDecorativa className="absolute right-12 bottom-40 h-11 w-auto opacity-[0.14] rotate-6 hidden 2xl:block" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <EditableWrapper id="contact-s3-title" type="text" label="Título — Fale conosco">
              <RichText
                as="h2"
                inline
                content={getText("contact-s3-title")}
                className="text-3xl md:text-4xl text-foreground"
              />
            </EditableWrapper>
          </div>
          <ContactForm />
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default ContactPage;
