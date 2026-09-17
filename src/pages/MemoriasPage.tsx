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
import { useAdminMirrorSurface } from "@/hooks/useAdminMirrorSurface";
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
  imageKey: string;
  videoKey: string;
}

function buildDay(
  day: number,
  dayNumber: number,
  dateLabel: string,
  navLabel: string,
): MemoriasDayConfig {
  return {
    day,
    dayNumber,
    dateLabel,
    navLabel,
    titleKey: `mem-dia-${day}-title`,
    guestKey: `mem-dia-${day}-guest`,
    bodyKey: `mem-dia-${day}-body`,
    carouselKey: `mem-dia-${day}-carousel`,
    imageKey: `mem-dia-${day}-img`,
    videoKey: `mem-dia-${day}-video`,
  };
}

const MEMORIAS_DAYS: MemoriasDayConfig[] = [
  buildDay(15, 1, "15 de março", "Marco zero"),
  buildDay(16, 2, "16 de março", "Vila Japaí"),
  buildDay(17, 3, "17 de março", "Masseria"),
  buildDay(18, 4, "18 de março", "Heborá"),
  buildDay(19, 5, "19 de março", "Forno na praça"),
  buildDay(22, 6, "22 de março", "Lasanheria"),
  buildDay(23, 7, "23 de março", "Forno libanês"),
  buildDay(24, 8, "24 de março", "Forno PANC"),
  buildDay(25, 9, "25 de março", "Quibe no forno"),
  buildDay(26, 10, "26 de março", "Doutores ao forno"),
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
  ...MEMORIAS_DAYS.flatMap((day) => [
    day.titleKey,
    day.guestKey,
    day.bodyKey,
    day.imageKey,
    day.videoKey,
  ]),
] as const;

function parseYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function DayVideoEmbed({ url }: { url: string }) {
  const youtubeId = parseYoutubeId(url);
  const isMp4 = /\.mp4($|\?)/i.test(url);

  if (youtubeId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted/25 shadow-md ring-1 ring-border/20">
        <iframe
          title="Vídeo do dia"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isMp4) {
    return (
      <video
        src={url}
        controls
        className="w-full overflow-hidden rounded-xl bg-muted/25 shadow-md ring-1 ring-border/20"
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      Assistir vídeo
    </a>
  );
}

function DayMediaBlock({
  day,
  imageSrc,
  videoUrl,
}: {
  day: MemoriasDayConfig;
  imageSrc: string;
  videoUrl: string;
}) {
  const mirrorSurface = useAdminMirrorSurface();
  const { images, columns, isPending } = useCmsCarousel(day.carouselKey, 1);
  const [current, setCurrent] = useState(0);

  const hasCarousel = images.length > 0;
  const hasImage = Boolean(imageSrc.trim());
  const hasVideo = Boolean(videoUrl.trim());
  const hasPublicMedia = hasCarousel || hasImage || hasVideo;

  const visibleColumns = Math.min(columns, Math.max(1, images.length || 1));
  const visibleImages = hasCarousel
    ? Array.from({ length: Math.min(visibleColumns, images.length) }, (_, idx) => {
        return images[(current + idx) % images.length];
      })
    : [];

  useEffect(() => {
    if (images.length > 0 && current > images.length - 1) {
      setCurrent(0);
    }
  }, [current, images.length]);

  if (isPending && !hasImage && !hasVideo) {
    return null;
  }

  if (!hasPublicMedia && !mirrorSurface) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      {(hasCarousel || mirrorSurface) && (
        <EditableWrapper id={day.carouselKey} type="carousel" label={`Dia ${day.day} — Carrossel`}>
          {hasCarousel ? (
            <div className="relative w-full">
              <div className="flex items-center justify-center gap-3 md:gap-4">
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
          ) : (
            <div className="rounded-lg border border-dashed border-primary/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Adicionar carrossel de fotos
            </div>
          )}
        </EditableWrapper>
      )}

      {(hasImage || mirrorSurface) && !hasCarousel && (
        <EditableWrapper id={day.imageKey} type="image" label={`Dia ${day.day} — Foto`}>
          {hasImage ? (
            <div className="overflow-hidden rounded-xl bg-muted/25 shadow-md ring-1 ring-border/20">
              <img
                src={imageSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="mx-auto max-h-[min(32rem,85vh)] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-primary/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Adicionar foto única
            </div>
          )}
        </EditableWrapper>
      )}

      {(hasVideo || mirrorSurface) && (
        <EditableWrapper id={day.videoKey} type="text" label={`Dia ${day.day} — URL do vídeo`}>
          {hasVideo ? (
            <DayVideoEmbed url={videoUrl.trim()} />
          ) : (
            <div className="rounded-lg border border-dashed border-primary/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Adicionar URL de vídeo (opcional)
            </div>
          )}
        </EditableWrapper>
      )}
    </div>
  );
}

function MemoriasDayChapter({
  day,
  getText,
  getImage,
}: {
  day: MemoriasDayConfig;
  getText: (sectionKey: string) => string;
  getImage: (sectionKey: string) => string;
}) {
  const title = getText(day.titleKey);
  const guest = getText(day.guestKey);
  const body = getText(day.bodyKey);
  const imageSrc = getImage(day.imageKey);
  const videoUrl = getText(day.videoKey);

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
        ) : null}
      </EditableWrapper>

      <DayMediaBlock day={day} imageSrc={imageSrc} videoUrl={videoUrl} />

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
  const { getText, getImage, isPending, isError } = useCmsContents([...MEMORIAS_CMS_KEYS], MEMORIAS_PAGE_KEY);

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

        {/* Abertura — sem decoração no mobile (não sobrepor o texto) */}
        <section className="relative overflow-hidden bg-background py-14 md:py-20">
          <BrandTomilhoB className="pointer-events-none absolute right-4 top-8 z-0 hidden h-40 w-auto max-w-[min(48%,20rem)] object-contain opacity-40 drop-shadow-md lg:block" />
          <BrandLinhaDecorativa className="pointer-events-none absolute left-6 top-1/3 z-0 hidden h-16 w-auto max-w-[4rem] -rotate-6 opacity-[0.18] 2xl:block" />
          <BrandTrigo className="pointer-events-none absolute bottom-8 left-0 z-0 hidden h-32 w-auto opacity-50 drop-shadow-sm lg:block" />

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
          <BrandAlecrim className="pointer-events-none absolute left-2 bottom-16 z-0 hidden h-24 w-auto opacity-[0.2] lg:block" />
          <BrandTomilho className="pointer-events-none absolute right-2 top-10 z-0 hidden h-20 w-auto opacity-[0.16] lg:block" />
          <BrandLinhaDecorativa className="pointer-events-none absolute right-6 top-8 z-0 hidden h-10 w-auto opacity-[0.2] md:block" />
          <BrandTomilhoB className="pointer-events-none absolute right-4 bottom-10 z-0 hidden h-20 w-auto opacity-50 md:block" />
          <BrandTrigo className="pointer-events-none absolute left-1 top-1/2 z-0 hidden h-36 w-auto -translate-y-1/2 opacity-[0.14] xl:block" />

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
                <MemoriasDayChapter key={day.day} day={day} getText={getText} getImage={getImage} />
              ))}
            </div>
          </div>
        </section>

        {/* Encerramento */}
        <section className="relative overflow-hidden bg-background pb-28 pt-14 md:py-20">
          <BrandAlecrim className="pointer-events-none absolute left-0 top-10 z-0 hidden h-40 w-auto opacity-50 md:block lg:h-48" />
          <BrandTomilhoB className="pointer-events-none absolute bottom-6 right-0 z-0 hidden h-44 w-auto opacity-40 drop-shadow-md lg:block xl:bottom-10 xl:h-52" />
          <BrandLinhaDecorativa className="pointer-events-none absolute right-8 top-12 z-0 hidden h-9 w-auto rotate-6 opacity-[0.18] md:block" />
          <BrandTrigo className="pointer-events-none absolute left-2 bottom-8 z-0 hidden h-28 w-auto opacity-[0.15] lg:block" />

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
