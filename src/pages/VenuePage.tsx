import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";
import RichText from "@/components/RichText";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel, useCmsGallery } from "@/hooks/useCmsMedia";
import { supabase } from "@/integrations/supabase/client";

interface VenueZigZagRow {
  id: string;
  imageKey: string;
  textKey: string;
  imageRight: boolean;
}

const venueIntroRows: VenueZigZagRow[] = [
  { id: "venue-hero-row-1", imageKey: "venue-hero-img-1", textKey: "venue-hero-text-1", imageRight: true },
  { id: "venue-hero-row-2", imageKey: "venue-hero-img-2", textKey: "venue-hero-text-2", imageRight: false },
  { id: "venue-hero-row-3", imageKey: "venue-hero-img-3", textKey: "venue-hero-text-3", imageRight: true },
  { id: "venue-hero-row-4", imageKey: "venue-hero-img-4", textKey: "venue-hero-text-4", imageRight: false },
];

function VenuePage() {
  const shell = useSiteShellReady();
  const isMobile = useIsMobile();
  const cmsKeys = [
    "venue-intro-title",
    ...venueIntroRows.flatMap((row) => [row.imageKey, row.textKey]),
    "venue-menu-title",
    "venue-menu-cta",
    "venue-moments-title",
    "venue-customers-title",
  ];

  const { getText, getImage, getLink, isPending, isError } = useCmsContents(cmsKeys, "espacos");

  const menuCarousel = useCmsCarousel("venue-menu-highlights-carousel", 3);
  const momentsGallery = useCmsGallery("venue-moments-gallery");
  const customerMural = useCmsCarousel("venue-customers-mural", 3);

  const menuCtaLink = getLink("venue-menu-cta");

  const mediaPending =
    menuCarousel.isPending || momentsGallery.isPending || customerMural.isPending;

  if (shell.isPending || isPending || mediaPending) {
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

      <VenueIntro getText={getText} getImage={getImage} />
      <MenuHighlights
        menuHighlights={menuCarousel.images}
        columns={menuCarousel.columns}
        getText={getText}
        menuCtaLink={menuCtaLink}
        isMobile={isMobile}
      />
      <MomentsCarousel momentsGallery={momentsGallery.images} getText={getText} />
      <CustomerMural customerMural={customerMural.images} getText={getText} />

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function VenueIntro({
  getText,
  getImage,
}: {
  getText: (sectionKey: string) => string;
  getImage: (sectionKey: string) => string;
}) {
  const introTitle = getText("venue-intro-title");

  return (
    <section className="section-paper relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <BrandTomilhoB className="pointer-events-none absolute right-3 top-24 z-[1] h-28 w-auto max-w-[42%] object-contain drop-shadow-md lg:hidden" />
      <BrandAlecrim className="absolute left-0 top-28 h-40 w-auto opacity-[0.18] hidden lg:block" />
      <BrandLinhaDecorativa className="absolute right-4 top-1/3 h-11 w-auto opacity-15 hidden xl:block rotate-6" />
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <EditableWrapper id="venue-intro-title" type="text" label="Título Nosso Espaço">
            {introTitle ? (
              <RichText as="h1" inline content={introTitle} className="text-4xl md:text-5xl text-foreground" />
            ) : (
              <CmsPlaceholder label="Título da página" />
            )}
          </EditableWrapper>
        </div>

        <div className="space-y-12">
          {venueIntroRows.map((row) => {
            const textBody = getText(row.textKey);
            const imgSrc = getImage(row.imageKey);
            return (
              <div
                key={row.id}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                  row.imageRight ? "md:[&>*:first-child]:order-1 md:[&>*:last-child]:order-2" : "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
                }`}
              >
                <EditableWrapper id={row.textKey} type="textarea" label={`Texto ${row.id}`}>
                  <div className={`${row.imageRight ? "border-r-4 pr-5 md:text-right" : "border-l-4 pl-5"} border-secondary/60`}>
                    {textBody ? (
                      <RichText content={textBody} className="text-muted-foreground leading-relaxed text-sm md:text-base" />
                    ) : (
                      <CmsPlaceholder label="Texto do bloco" />
                    )}
                  </div>
                </EditableWrapper>

                <EditableWrapper id={row.imageKey} type="image" label={`Imagem ${row.id}`}>
                  <div className="rounded-2xl overflow-hidden shadow-md bg-muted/10 min-h-[12rem] flex items-center justify-center">
                    {imgSrc ? (
                      <img src={imgSrc} alt="" loading="lazy" decoding="async" className="w-full h-[20rem] md:h-[22rem] object-cover" />
                    ) : (
                      <CmsPlaceholder label="Imagem do bloco" className="w-full border-0" />
                    )}
                  </div>
                </EditableWrapper>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MenuHighlights({
  menuHighlights,
  columns,
  getText,
  menuCtaLink,
  isMobile,
}: {
  menuHighlights: { src: string; alt: string }[];
  columns: number;
  getText: (sectionKey: string) => string;
  menuCtaLink: { label: string; url: string };
  isMobile: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const len = menuHighlights.length;
  const visibleColumns = len === 0 ? 0 : isMobile ? 1 : Math.min(columns, len);
  const visibleImages =
    len === 0 || visibleColumns === 0
      ? []
      : Array.from({ length: visibleColumns }, (_, idx) => menuHighlights[(current + idx) % len]);

  const { data: categories } = useQuery({
    queryKey: ["venue-menu-categories-anchor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name, slug").eq("is_active", true).order("sort_order");
      if (error) {
        throw error;
      }
      return data ?? [];
    },
  });

  useEffect(() => {
    if (len > 0 && current > len - 1) {
      setCurrent(0);
    }
  }, [current, len]);

  const prev = () => setCurrent((c) => (len === 0 ? 0 : c === 0 ? len - 1 : c - 1));
  const next = () => setCurrent((c) => (len === 0 ? 0 : c === len - 1 ? 0 : c + 1));

  const menuTitle = getText("venue-menu-title");

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-background">
      <BrandTrigo className="absolute left-2 top-8 hidden h-28 w-auto opacity-[0.16] lg:block" />
      <BrandTomilhoB className="absolute right-4 bottom-6 hidden h-20 w-auto md:block" />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-menu-title" type="text" label="Título Nosso Cardápio">
            {menuTitle ? (
              <RichText as="h2" inline content={menuTitle} className="text-3xl md:text-4xl text-foreground" />
            ) : (
              <CmsPlaceholder label="Título da seção cardápio" />
            )}
          </EditableWrapper>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {(categories ?? []).map((cat) => (
              <a
                key={cat.slug}
                href={`/cardapio#${cat.slug}`}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs md:text-sm bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>

        <EditableWrapper id="venue-menu-highlights-carousel" type="carousel" label="Carrossel Nosso Cardápio">
          {len === 0 ? (
            <CmsPlaceholder label="Carrossel sem imagens publicadas" className="py-12" />
          ) : (
            <div className="relative max-w-4xl mx-auto">
              <div className="flex items-center gap-4 justify-center">
                <button
                  type="button"
                  onClick={prev}
                  className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="text-primary" size={22} />
                </button>

                <div
                  className="grid gap-4 w-full max-w-3xl"
                  style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}
                >
                  {visibleImages.map((image, index) => (
                    <div key={`${image.src}-${current}-${index}`} className="rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-40 md:h-44 object-cover"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={next}
                  className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="text-primary" size={22} />
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-6">
                {menuHighlights.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </EditableWrapper>

        <div className="text-center mt-8">
          <EditableWrapper id="venue-menu-cta" type="link" label="Botão Nosso Cardápio">
            {menuCtaLink.label && menuCtaLink.url ? (
              <a href={menuCtaLink.url} className="btn-secondary-dr inline-block">
                <RichText as="span" inline content={menuCtaLink.label} />
              </a>
            ) : (
              <CmsPlaceholder label="CTA (título e URL)" className="inline-block min-w-[10rem]" />
            )}
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
}

function LightboxGalleryGrid({
  galleryId,
  galleryLabel,
  images,
  imageClassName,
}: {
  galleryId: string;
  galleryLabel: string;
  images: { src: string; alt: string }[];
  imageClassName?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const visibleImages = images.slice(0, visibleCount);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goNext = useCallback(() => {
    if (lightboxIndex === null) {
      return;
    }
    setLightboxIndex((lightboxIndex + 1) % images.length);
  }, [lightboxIndex, images.length]);
  const goPrev = useCallback(() => {
    if (lightboxIndex === null) {
      return;
    }
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      }
      if (e.key === "ArrowRight") {
        goNext();
      }
      if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  useEffect(() => {
    setVisibleCount(12);
  }, [images.length]);

  return (
    <>
      <EditableWrapper id={galleryId} type="gallery" label={galleryLabel}>
        {images.length === 0 ? (
          <CmsPlaceholder label="Galeria sem imagens publicadas" className="py-12" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {visibleImages.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="rounded-xl overflow-hidden bg-muted/15 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-40 md:h-44 object-cover ${imageClassName || ""}`}
                />
              </button>
            ))}
          </div>
        )}
      </EditableWrapper>
      {images.length > visibleCount && (
        <div className="text-center mt-8">
          <button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="btn-secondary-dr inline-block">
            Carregar mais
          </button>
        </div>
      )}

      {lightboxIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button type="button" onClick={closeLightbox} className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2" aria-label="Fechar">
            <X size={32} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <img
            src={images[lightboxIndex].src}
            alt={images[lightboxIndex].alt}
            className={`max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl ${imageClassName || ""}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Próxima"
          >
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

function MomentsCarousel({
  momentsGallery,
  getText,
}: {
  momentsGallery: { src: string; alt: string }[];
  getText: (sectionKey: string) => string;
}) {
  const t = getText("venue-moments-title");

  return (
    <section className="section-paper relative overflow-hidden py-16 md:py-24">
      <BrandTomilho className="absolute right-2 top-8 hidden h-20 w-auto opacity-[0.16] lg:block" />
      <BrandLinhaDecorativa className="absolute left-8 bottom-8 hidden h-9 w-auto opacity-[0.2] md:block" />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-moments-title" type="text" label="Título Momentos">
            {t ? (
              <RichText as="h2" inline content={t} className="text-3xl md:text-4xl text-foreground" />
            ) : (
              <CmsPlaceholder label="Título da galeria de momentos" />
            )}
          </EditableWrapper>
        </div>

        <LightboxGalleryGrid galleryId="venue-moments-gallery" galleryLabel="Galeria Momentos" images={momentsGallery} />
      </div>
    </section>
  );
}

function CustomerMural({
  customerMural,
  getText,
}: {
  customerMural: { src: string; alt: string }[];
  getText: (sectionKey: string) => string;
}) {
  const t = getText("venue-customers-title");

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-background">
      <BrandAlecrim className="absolute left-0 bottom-10 hidden h-24 w-auto opacity-[0.2] lg:block" />
      <BrandTomilhoB className="absolute right-8 top-10 hidden h-16 w-auto md:block" />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-customers-title" type="text" label="Título Nossos Clientes">
            {t ? (
              <RichText as="h2" inline content={t} className="text-3xl md:text-4xl text-foreground" />
            ) : (
              <CmsPlaceholder label="Título do mural" />
            )}
          </EditableWrapper>
        </div>

        <LightboxGalleryGrid galleryId="venue-customers-mural" galleryLabel="Mural Nossos Clientes" images={customerMural} />
      </div>
    </section>
  );
}

export default VenuePage;
