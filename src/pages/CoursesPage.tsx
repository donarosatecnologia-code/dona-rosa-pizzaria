import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { BrandAlecrim, BrandTomilhoB } from "@/components/BrandAccents";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel } from "@/hooks/useCmsMedia";

const WHATSAPP_REGISTRATION_PHONE = "5511930617116";

const EVENT_OPTIONS = [
  { value: "Espaco Gourmet", label: "Espaço Gourmet" },
  { value: "Curso de Pizza", label: "Curso de Pizza" },
  { value: "Dona Rosa em Casa", label: "Dona Rosa em Casa" },
] as const;

export function generateWhatsAppLink(phoneDigits: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneDigits}?text=${encoded}`;
}

interface RegistrationFormState {
  event: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
}

function buildRegistrationMessage(values: RegistrationFormState): string {
  const lines = [
    "*Nova Inscrição - Dona Rosa Pizzaria*",
    "",
    `*Evento:* ${values.event}`,
    `*Nome:* ${values.name}`,
    `*Telefone:* ${values.phone}`,
    `*E-mail:* ${values.email}`,
    `*Data:* ${values.date}`,
    `*Horário:* ${values.time}`,
  ];
  return lines.join("\n");
}

function validateRegistrationForm(values: RegistrationFormState): string | null {
  if (!values.event.trim()) {
    return "Selecione o tipo de evento.";
  }
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
  if (!values.date) {
    return "Informe a data.";
  }
  if (!values.time) {
    return "Informe o horário.";
  }
  return null;
}

function handleFormSubmit(values: RegistrationFormState): void {
  const error = validateRegistrationForm(values);
  if (error) {
    toast.error(error);
    return;
  }
  const message = buildRegistrationMessage(values);
  const url = generateWhatsAppLink(WHATSAPP_REGISTRATION_PHONE, message);
  window.open(url, "_blank", "noopener,noreferrer");
  toast.success("Redirecionando para o WhatsApp. Sua mensagem foi preparada!");
}

/** Mesmo offset do cardápio (`scrollToCategory`) para o header fixo. */
const COURSES_HEADER_SCROLL_OFFSET = 120;
const COURSES_REGISTRATION_SECTION_ID = "inscricao";

function scrollToCoursesRegistrationForm() {
  const el = document.getElementById(COURSES_REGISTRATION_SECTION_ID);
  if (!el) {
    return;
  }
  const elementPosition = el.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - COURSES_HEADER_SCROLL_OFFSET;
  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
}

function SingleImageCarousel({
  carouselId,
  carouselLabel,
  images,
}: {
  carouselId: string;
  carouselLabel: string;
  images: { src: string; alt: string }[];
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current > images.length - 1) {
      setCurrent(0);
    }
  }, [current, images.length]);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  const active = images.length > 0 ? (images[current] ?? images[0]) : null;

  return (
    <EditableWrapper id={carouselId} type="carousel" label={carouselLabel}>
      {images.length === 0 || !active ? (
        <CmsPlaceholder label="Carrossel sem imagens publicadas" className="py-10" />
      ) : (
      <div className="relative max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 justify-center">
          <button
            type="button"
            onClick={prev}
            className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="text-primary" size={22} />
          </button>
          <div className="rounded-2xl overflow-hidden shadow-md bg-muted/10 flex-1 min-w-0">
            <img
              src={active.src}
              alt={active.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-[14rem] md:h-[20rem] object-cover"
            />
          </div>
          <button
            type="button"
            onClick={next}
            className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="Próxima foto"
          >
            <ChevronRight className="text-primary" size={22} />
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
              aria-label={`Foto ${i + 1}`}
            />
          ))}
        </div>
      </div>
      )}
    </EditableWrapper>
  );
}

function CoursesPage() {
  const cmsKeys = [
    "courses-s1-title",
    "courses-s1-subtitle",
    "courses-s1-body",
    "courses-s1-cta",
    "courses-s2-title",
    "courses-s2-subtitle",
    "courses-s2-body",
    "courses-s2-cta",
    "courses-s3-title",
    "courses-s3-subtitle",
    "courses-s3-body",
    "courses-s3-cta",
    "courses-form-title",
  ];

  const { getText, getLink, isPending, isError } = useCmsContents(cmsKeys, "cursos-e-eventos");

  const eventsCarousel = useCmsCarousel("courses-events-carousel", 1);

  const pizzaCarousel = useCmsCarousel("courses-pizza-carousel", 1);

  const homeCarousel = useCmsCarousel("courses-home-carousel", 1);

  const s1Cta = getLink("courses-s1-cta");
  const s2Cta = getLink("courses-s2-cta");
  const s3Cta = getLink("courses-s3-cta");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === COURSES_REGISTRATION_SECTION_ID) {
      const t = window.setTimeout(() => scrollToCoursesRegistrationForm(), 400);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (isPending) {
    return <LoadingScreen />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-muted-foreground text-center">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Seção 1 — papel */}
      <section id="espaco-gourmet" className="section-paper relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        <BrandAlecrim className="absolute left-0 top-32 h-32 w-auto opacity-[0.2] hidden lg:block" />
        <BrandTomilhoB className="absolute bottom-6 right-0 h-28 w-auto opacity-[0.18] hidden md:block" />
        <div className="container relative z-10 mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <EditableWrapper id="courses-s1-title" type="text" label="Título — Espaço de Eventos">
                <RichText
                  as="h1"
                  inline
                  content={getText("courses-s1-title")}
                  className="text-4xl md:text-5xl text-foreground"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s1-subtitle" type="text" label="Subtítulo — Espaço de Eventos">
                <RichText
                  as="p"
                  inline
                  content={getText("courses-s1-subtitle")}
                  className="text-lg text-secondary font-medium"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s1-body" type="textarea" label="Texto — Espaço de Eventos">
                <RichText
                  content={getText("courses-s1-body")}
                  className="text-muted-foreground leading-relaxed text-sm md:text-base"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s1-cta" type="link" label="Botão — Espaço de Eventos">
                <a
                  href="#inscricao"
                  className="btn-primary-dr inline-block mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToCoursesRegistrationForm();
                  }}
                >
                  <RichText as="span" inline content={s1Cta.label} />
                </a>
              </EditableWrapper>
            </div>
            <SingleImageCarousel
              carouselId="courses-events-carousel"
              carouselLabel="Carrossel — Espaço de Eventos"
              images={eventsCarousel.images}
            />
          </div>
        </div>
      </section>

      {/* Seção 2 — liso */}
      <section id="curso-pizza" className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="md:order-1">
              <SingleImageCarousel
                carouselId="courses-pizza-carousel"
                carouselLabel="Carrossel — Curso de Pizza"
                images={pizzaCarousel.images}
              />
            </div>
            <div className="md:order-2 space-y-4">
              <EditableWrapper id="courses-s2-title" type="text" label="Título — Curso de Pizza">
                <RichText
                  as="h2"
                  inline
                  content={getText("courses-s2-title")}
                  className="text-3xl md:text-4xl text-foreground"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s2-subtitle" type="text" label="Subtítulo — Curso de Pizza">
                <RichText
                  as="p"
                  inline
                  content={getText("courses-s2-subtitle")}
                  className="text-lg text-secondary font-medium"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s2-body" type="textarea" label="Texto — Curso de Pizza">
                <RichText
                  content={getText("courses-s2-body")}
                  className="text-muted-foreground leading-relaxed text-sm md:text-base"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s2-cta" type="link" label="Botão — Curso de Pizza">
                <a
                  href="#inscricao"
                  className="btn-primary-dr inline-block mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToCoursesRegistrationForm();
                  }}
                >
                  <RichText as="span" inline content={s2Cta.label} />
                </a>
              </EditableWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3 — papel */}
      <section id="dona-rosa-em-casa" className="section-paper py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <EditableWrapper id="courses-s3-title" type="text" label="Título — Dona Rosa em Casa">
                <RichText
                  as="h2"
                  inline
                  content={getText("courses-s3-title")}
                  className="text-3xl md:text-4xl text-foreground"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s3-subtitle" type="text" label="Subtítulo — Dona Rosa em Casa">
                <RichText
                  as="p"
                  inline
                  content={getText("courses-s3-subtitle")}
                  className="text-lg text-secondary font-medium"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s3-body" type="textarea" label="Texto — Dona Rosa em Casa">
                <RichText
                  content={getText("courses-s3-body")}
                  className="text-muted-foreground leading-relaxed text-sm md:text-base"
                />
              </EditableWrapper>
              <EditableWrapper id="courses-s3-cta" type="link" label="Botão — Dona Rosa em Casa">
                <a
                  href="#inscricao"
                  className="btn-primary-dr inline-block mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToCoursesRegistrationForm();
                  }}
                >
                  <RichText as="span" inline content={s3Cta.label} />
                </a>
              </EditableWrapper>
            </div>
            <SingleImageCarousel
              carouselId="courses-home-carousel"
              carouselLabel="Carrossel — Dona Rosa em Casa"
              images={homeCarousel.images}
            />
          </div>
        </div>
      </section>

      {/* Seção 4 — formulário (liso) */}
      <section
        id="inscricao"
        className="bg-background py-16 md:py-24 scroll-mt-[120px]"
      >
        <div className="container mx-auto px-4 max-w-lg">
          <RegistrationFormCard formTitle={getText("courses-form-title")} />
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function RegistrationFormCard({ formTitle }: { formTitle: string }) {
  const [event, setEvent] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const label =
      EVENT_OPTIONS.find((o) => o.value === event)?.label ?? event;
    handleFormSubmit({
      event: label,
      name,
      phone,
      email,
      date,
      time,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg p-6 md:p-8">
      <div className="mb-8">
        <EditableWrapper id="courses-form-title" type="text" label="Título do formulário">
          <RichText
            as="h2"
            inline
            content={formTitle}
            className="text-2xl md:text-3xl text-center text-foreground"
          />
        </EditableWrapper>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="courses-event">Evento</Label>
            <Select value={event || undefined} onValueChange={setEvent}>
              <SelectTrigger id="courses-event" className="w-full">
                <SelectValue placeholder="Escolha uma opção" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courses-name">Nome</Label>
            <Input
              id="courses-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courses-phone">Telefone</Label>
            <Input
              id="courses-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courses-email">E-mail</Label>
            <Input
              id="courses-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courses-date">Data</Label>
            <Input id="courses-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courses-time">Horário</Label>
            <Input id="courses-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary-dr w-full mt-2">
            Enviar
          </button>
        </form>
    </div>
  );
}

export default CoursesPage;
