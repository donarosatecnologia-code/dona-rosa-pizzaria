import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { siteContainerClass } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

export const MEMORIAS_PAGE_KEY = "memorias";

interface MemoriasDayConfig {
  day: number;
  dayNumber: number;
  dateLabel: string;
  navLabel: string;
  titleKey: string;
  guestKey: string;
  bodyKey: string;
  carouselKey: string;
}

const MEMORIAS_DAYS: MemoriasDayConfig[] = [
  {
    day: 15,
    dayNumber: 1,
    dateLabel: "15 de março",
    navLabel: "Marco zero",
    titleKey: "mem-dia-15-title",
    guestKey: "mem-dia-15-guest",
    bodyKey: "mem-dia-15-body",
    carouselKey: "mem-dia-15-carousel",
  },
  {
    day: 16,
    dayNumber: 2,
    dateLabel: "16 de março",
    navLabel: "Vila Japaí",
    titleKey: "mem-dia-16-title",
    guestKey: "mem-dia-16-guest",
    bodyKey: "mem-dia-16-body",
    carouselKey: "mem-dia-16-carousel",
  },
  {
    day: 17,
    dayNumber: 3,
    dateLabel: "17 de março",
    navLabel: "Masseria",
    titleKey: "mem-dia-17-title",
    guestKey: "mem-dia-17-guest",
    bodyKey: "mem-dia-17-body",
    carouselKey: "mem-dia-17-carousel",
  },
  {
    day: 18,
    dayNumber: 4,
    dateLabel: "18 de março",
    navLabel: "Heborá",
    titleKey: "mem-dia-18-title",
    guestKey: "mem-dia-18-guest",
    bodyKey: "mem-dia-18-body",
    carouselKey: "mem-dia-18-carousel",
  },
  {
    day: 19,
    dayNumber: 5,
    dateLabel: "19 de março",
    navLabel: "Forno na praça",
    titleKey: "mem-dia-19-title",
    guestKey: "mem-dia-19-guest",
    bodyKey: "mem-dia-19-body",
    carouselKey: "mem-dia-19-carousel",
  },
  {
    day: 22,
    dayNumber: 6,
    dateLabel: "22 de março",
    navLabel: "Lasanheria",
    titleKey: "mem-dia-22-title",
    guestKey: "mem-dia-22-guest",
    bodyKey: "mem-dia-22-body",
    carouselKey: "mem-dia-22-carousel",
  },
  {
    day: 23,
    dayNumber: 7,
    dateLabel: "23 de março",
    navLabel: "Forno libanês",
    titleKey: "mem-dia-23-title",
    guestKey: "mem-dia-23-guest",
    bodyKey: "mem-dia-23-body",
    carouselKey: "mem-dia-23-carousel",
  },
  {
    day: 24,
    dayNumber: 8,
    dateLabel: "24 de março",
    navLabel: "Forno PANC",
    titleKey: "mem-dia-24-title",
    guestKey: "mem-dia-24-guest",
    bodyKey: "mem-dia-24-body",
    carouselKey: "mem-dia-24-carousel",
  },
  {
    day: 25,
    dayNumber: 9,
    dateLabel: "25 de março",
    navLabel: "Quibe no forno",
    titleKey: "mem-dia-25-title",
    guestKey: "mem-dia-25-guest",
    bodyKey: "mem-dia-25-body",
    carouselKey: "mem-dia-25-carousel",
  },
  {
    day: 26,
    dayNumber: 10,
    dateLabel: "26 de março",
    navLabel: "Doutores ao forno",
    titleKey: "mem-dia-26-title",
    guestKey: "mem-dia-26-guest",
    bodyKey: "mem-dia-26-body",
    carouselKey: "mem-dia-26-carousel",
  },
];

export const MEMORIAS_CMS_KEYS = [
  "mem-page-title",
  "mem-page-subtitle",
  "mem-page-anchor",
  "mem-intro-body",
  "mem-concepts",
  "mem-index-label",
  "mem-closing-body",
  "mem-closing-hashtags",
  ...MEMORIAS_DAYS.flatMap((day) => [day.titleKey, day.guestKey, day.bodyKey]),
] as const;

function DayMediaCarousel({
  carouselId,
  carouselLabel,
}: {
  carouselId: string;
  carouselLabel: string;
}) {
  const { images, columns, isPending } = useCmsCarousel(carouselId, 1);
  const [current, setCurrent] = useState(0);

  const visibleColumns = Math.min(columns, Math.max(1, images.length || 1));
  const visibleImages =
    images.length === 0
      ? []
      : Array.from({ length: Math.min(visibleColumns, images.length) }, (_, idx) => {
          return images[(current + idx) % images.length];
        });

  useEffect(() => {
    if (images.length > 0 && current > images.length - 1) {
      setCurrent(0);
    }
  }, [current, images.length]);

  if (isPending) {
    return <div className="h-48 w-full animate-pulse rounded-xl bg-muted/40" aria-hidden />;
  }

  return (
    <EditableWrapper id={carouselId} type="carousel" label={carouselLabel}>
      {images.length === 0 ? (
        <CmsPlaceholder label="Fotos deste dia (carrossel)" className="min-h-[10rem] py-10" />
      ) : (
        <div className="relative w-full">
          <div className="flex items-center gap-3 justify-center md:gap-4">
            {images.length > 1 ? (
              <button
                type="button"
                onClick={() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))}
                className="shrink-0 rounded-full bg-primary/10 p-2 transition-colors hover:bg-primary/20"
                aria-label="Anterior"
              >
                <ChevronLeft className="text-primary" size={22} />
              </button>
            ) : null}

            <div
              className="grid w-full gap-2 sm:gap-3"
              style={{ gridTemplateColumns: `repeat(${visibleImages.length}, minmax(0, 1fr))` }}
            >
              {visibleImages.map((image, index) => (
                <div
                  key={`${image.src}-${current}-${index}`}
                  className="h-56 w-full overflow-hidden rounded-xl bg-muted/25 shadow-md ring-1 ring-border/20 sm:h-64 md:h-72"
                >
                  <img
                    src={image.src}
                    alt={image.alt || ""}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ))}
            </div>

            {images.length > 1 ? (
              <button
                type="button"
                onClick={() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))}
                className="shrink-0 rounded-full bg-primary/10 p-2 transition-colors hover:bg-primary/20"
                aria-label="Próximo"
              >
                <ChevronRight className="text-primary" size={22} />
              </button>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-4 flex justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i === current ? "bg-primary" : "bg-border",
                  )}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </EditableWrapper>
  );
}

function MemoriasDayChapter({
  day,
  getText,
}: {
  day: MemoriasDayConfig;
  getText: (sectionKey: string) => string;
}) {
  const title = getText(day.titleKey);
  const guest = getText(day.guestKey);
  const body = getText(day.bodyKey);

  return (
    <article
      id={`dia-${day.day}`}
      className="scroll-mt-[7.5rem] border-t border-border/50 pt-12 md:pt-16"
    >
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80 md:text-sm">
          {day.dateLabel}
        </span>
        <span className="text-xs text-muted-foreground md:text-sm">· Dia {day.dayNumber}</span>
      </div>

      <EditableWrapper id={day.titleKey} type="text" label={`Dia ${day.day} — Título`}>
        {title ? (
          <RichText
            as="h2"
            inline
            content={title}
            className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          />
        ) : (
          <CmsPlaceholder label={`Título do dia ${day.day}`} />
        )}
      </EditableWrapper>

      <EditableWrapper id={day.guestKey} type="text" label={`Dia ${day.day} — Convidado`}>
        {guest ? (
          <RichText
            as="p"
            inline
            content={guest}
            className="mt-2 text-sm text-muted-foreground md:text-base"
          />
        ) : (
          <CmsPlaceholder label="Convidado / parceiro" className="mt-2" />
        )}
      </EditableWrapper>

      <div className="mt-8">
        <DayMediaCarousel
          carouselId={day.carouselKey}
          carouselLabel={`Dia ${day.day} — Fotos`}
        />
      </div>

      <div className="mt-8 md:mt-10">
        <EditableWrapper id={day.bodyKey} type="textarea" label={`Dia ${day.day} — Texto`}>
          {body ? (
            <RichText
              content={body}
              className="space-y-4 text-[15px] leading-relaxed text-foreground/90 md:text-base md:leading-[1.75]"
            />
          ) : (
            <CmsPlaceholder label="Texto do post" />
          )}
        </EditableWrapper>
      </div>
    </article>
  );
}

function MemoriasPage() {
  const shell = useSiteShellReady();
  const { getText, isPending, isError } = useCmsContents([...MEMORIAS_CMS_KEYS], MEMORIAS_PAGE_KEY);

  if (shell.isPending || isPending) {
    return <LoadingScreen message="Carregando conteúdo…" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">
          Não foi possível carregar o conteúdo. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  const title = getText("mem-page-title");
  const subtitle = getText("mem-page-subtitle");
  const anchor = getText("mem-page-anchor");
  const intro = getText("mem-intro-body");
  const concepts = getText("mem-concepts");
  const indexLabel = getText("mem-index-label");
  const closing = getText("mem-closing-body");
  const closingHashtags = getText("mem-closing-hashtags");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="section-paper relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
          <BrandAlecrim className="pointer-events-none absolute left-2 top-16 hidden h-auto w-28 lg:block lg:opacity-100" />
          <BrandTrigo className="pointer-events-none absolute right-2 top-24 z-[1] h-auto w-14 max-h-[4.5rem] max-w-[24%] object-contain object-top-right drop-shadow-md md:top-12 md:w-20 md:max-h-none md:max-w-[36%] lg:top-10 lg:w-24 lg:max-w-[42%] lg:opacity-100" />
          <BrandTomilho className="pointer-events-none absolute right-2 top-24 z-[1] h-20 w-auto max-h-20 max-w-[26%] object-contain object-top-right drop-shadow-md lg:hidden" />

          <div className={cn(siteContainerClass, "relative z-10 max-w-3xl text-center")}>
            <EditableWrapper id="mem-page-title" type="text" label="Título da página">
              {title ? (
                <RichText
                  as="h1"
                  inline
                  content={title}
                  className="text-4xl font-bold tracking-tight text-primary md:text-5xl lg:text-[3.25rem]"
                />
              ) : (
                <CmsPlaceholder label="Título da página Memórias" className="py-6" />
              )}
            </EditableWrapper>

            <EditableWrapper id="mem-page-subtitle" type="text" label="Subtítulo">
              {subtitle ? (
                <RichText
                  as="p"
                  inline
                  content={subtitle}
                  className="mt-4 text-base text-muted-foreground md:text-lg"
                />
              ) : (
                <CmsPlaceholder label="Subtítulo" className="mt-4" />
              )}
            </EditableWrapper>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-secondary/80" aria-hidden />

            <EditableWrapper id="mem-page-anchor" type="text" label="Frase-âncora">
              {anchor ? (
                <RichText
                  as="p"
                  inline
                  content={anchor}
                  className="mt-6 text-lg italic leading-snug text-foreground/85 md:text-xl"
                />
              ) : (
                <CmsPlaceholder label="Frase-âncora" className="mt-6" />
              )}
            </EditableWrapper>
          </div>
        </section>

        {/* Abertura */}
        <section className="relative overflow-hidden bg-background py-14 md:py-20">
          <BrandTomilhoB className="pointer-events-none absolute right-3 top-10 z-[1] h-28 w-auto max-w-[42%] object-contain drop-shadow-md lg:hidden" />
          <BrandTomilhoB className="pointer-events-none absolute right-4 top-8 z-[1] hidden h-40 w-auto max-w-[min(48%,20rem)] object-contain drop-shadow-md lg:block lg:opacity-100" />
          <BrandLinhaDecorativa className="pointer-events-none absolute left-6 top-1/3 hidden h-16 w-auto max-w-[4rem] -rotate-6 opacity-[0.18] 2xl:block" />
          <BrandTrigo className="pointer-events-none absolute bottom-8 left-0 hidden h-32 w-auto drop-shadow-sm lg:block lg:opacity-100" />

          <div className={cn(siteContainerClass, "relative z-10 max-w-3xl")}>
            <EditableWrapper id="mem-intro-body" type="textarea" label="Texto de abertura">
              {intro ? (
                <RichText
                  content={intro}
                  className="space-y-4 text-[15px] leading-relaxed text-foreground/90 md:text-base md:leading-[1.75]"
                />
              ) : (
                <CmsPlaceholder label="Texto de abertura da campanha" />
              )}
            </EditableWrapper>

            <EditableWrapper id="mem-concepts" type="text" label="Conceitos do forno">
              {concepts ? (
                <p className="mt-10 text-center text-sm leading-relaxed tracking-wide text-primary/90 md:text-base">
                  {concepts}
                </p>
              ) : (
                <CmsPlaceholder label="Conceitos do forno" className="mt-10" />
              )}
            </EditableWrapper>
          </div>
        </section>

        {/* Índice + dias */}
        <section className="section-paper relative overflow-hidden py-14 md:py-20">
          <BrandAlecrim className="pointer-events-none absolute left-2 bottom-16 hidden h-24 w-auto opacity-[0.2] lg:block" />
          <BrandTomilho className="pointer-events-none absolute right-2 top-10 hidden h-20 w-auto opacity-[0.16] lg:block" />
          <BrandLinhaDecorativa className="pointer-events-none absolute right-6 top-8 hidden h-10 w-auto opacity-[0.2] md:block" />
          <BrandTomilhoB className="pointer-events-none absolute right-4 bottom-10 hidden h-20 w-auto md:block" />
          <BrandTrigo className="pointer-events-none absolute left-1 top-1/2 hidden h-36 w-auto -translate-y-1/2 opacity-[0.14] xl:block" />

          <div className={cn(siteContainerClass, "relative z-10")}>
            <EditableWrapper id="mem-index-label" type="text" label="Título do índice">
              {indexLabel ? (
                <RichText
                  as="h2"
                  inline
                  content={indexLabel}
                  className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                />
              ) : (
                <CmsPlaceholder label="Título do índice" className="mb-6" />
              )}
            </EditableWrapper>

            <nav
              aria-label="Dias da celebração"
              className="-mx-4 mb-14 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:mb-16 md:flex-wrap md:justify-center md:overflow-visible md:px-0"
            >
              {MEMORIAS_DAYS.map((day) => (
                <a
                  key={day.day}
                  href={`#dia-${day.day}`}
                  className="shrink-0 rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="font-semibold text-primary">{day.day}</span>
                  <span className="ml-1.5 text-muted-foreground">{day.navLabel}</span>
                </a>
              ))}
            </nav>

            <div className="mx-auto max-w-3xl space-y-4">
              {MEMORIAS_DAYS.map((day) => (
                <MemoriasDayChapter key={day.day} day={day} getText={getText} />
              ))}
            </div>
          </div>
        </section>

        {/* Encerramento */}
        <section className="relative overflow-hidden bg-background py-14 md:py-20">
          <BrandAlecrim className="pointer-events-none absolute left-0 top-10 hidden h-40 w-auto md:block lg:h-48 lg:opacity-100" />
          <BrandTomilhoB className="pointer-events-none absolute bottom-6 right-0 hidden h-44 w-auto drop-shadow-md lg:block xl:bottom-10 xl:h-52 lg:opacity-100" />
          <BrandLinhaDecorativa className="pointer-events-none absolute right-8 top-12 hidden h-9 w-auto rotate-6 opacity-[0.18] md:block" />
          <BrandTrigo className="pointer-events-none absolute left-2 bottom-8 hidden h-28 w-auto opacity-[0.15] lg:block" />

          <div className={cn(siteContainerClass, "relative z-10 max-w-3xl text-center")}>
            <EditableWrapper id="mem-closing-body" type="textarea" label="Texto de encerramento">
              {closing ? (
                <RichText
                  content={closing}
                  className="space-y-4 text-[15px] leading-relaxed text-foreground/90 md:text-base md:leading-[1.75]"
                />
              ) : (
                <CmsPlaceholder label="Texto de encerramento" />
              )}
            </EditableWrapper>

            <EditableWrapper id="mem-closing-hashtags" type="text" label="Hashtags da campanha">
              {closingHashtags ? (
                <RichText
                  as="p"
                  inline
                  content={closingHashtags}
                  className="mt-8 text-sm font-medium text-primary md:text-base"
                />
              ) : (
                <CmsPlaceholder label="Hashtags" className="mt-8" />
              )}
            </EditableWrapper>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default MemoriasPage;
