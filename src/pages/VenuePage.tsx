import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandLinhaDecorativa } from "@/components/BrandAccents";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel, useCmsGallery } from "@/hooks/useCmsMedia";
import { supabase } from "@/integrations/supabase/client";
import ambiente1 from "@/assets/ambiente-1.jpg";
import evento1 from "@/assets/evento-1.jpg";
import forno1 from "@/assets/forno-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import prato2 from "@/assets/prato-2.jpg";
import prato3 from "@/assets/prato-3.jpg";

interface VenueZigZagRow {
  id: string;
  imageKey: string;
  textKey: string;
  imageFallback: string;
  textFallback: string;
  imageRight: boolean;
}

const venueIntroRows: VenueZigZagRow[] = [
  {
    id: "venue-hero-row-1",
    imageKey: "venue-hero-img-1",
    textKey: "venue-hero-text-1",
    imageFallback: ambiente1,
    textFallback:
      "Nosso salão foi pensado para receber você com conforto, luz acolhedora e o clima perfeito para encontros especiais.",
    imageRight: true,
  },
  {
    id: "venue-hero-row-2",
    imageKey: "venue-hero-img-2",
    textKey: "venue-hero-text-2",
    imageFallback: evento1,
    textFallback:
      "Da mesa em família ao jantar entre amigos, cada detalhe do espaço convida a viver uma experiência completa.",
    imageRight: false,
  },
  {
    id: "venue-hero-row-3",
    imageKey: "venue-hero-img-3",
    textKey: "venue-hero-text-3",
    imageFallback: forno1,
    textFallback:
      "A arquitetura integra tradição e modernidade, valorizando o forno, a cozinha e a energia do serviço ao vivo.",
    imageRight: true,
  },
  {
    id: "venue-hero-row-4",
    imageKey: "venue-hero-img-4",
    textKey: "venue-hero-text-4",
    imageFallback: prato3,
    textFallback:
      "Entre o calor do forno e o cuidado em cada serviço, criamos um espaço que valoriza presença, sabor e boas histórias.",
    imageRight: false,
  },
];

function VenuePage() {
  const isMobile = useIsMobile();
  const cmsKeys = [
    "venue-intro-title",
    ...venueIntroRows.flatMap((row) => [row.imageKey, row.textKey]),
    "venue-menu-title",
    "venue-menu-cta",
    "venue-moments-title",
    "venue-customers-title",
  ];

  const { getText, getImage } = useCmsContents(cmsKeys, "espacos");

  const { images: menuHighlights } = useCmsCarousel(
    "venue-menu-highlights-carousel",
    [
      { src: pizza1, alt: "Destaque de pizza artesanal" },
      { src: prato2, alt: "Destaque de prato da casa" },
      { src: prato3, alt: "Destaque do cardápio Dona Rosa" },
      { src: forno1, alt: "Destaque do forno e pizza" },
    ],
    3,
  );

  const momentsGallery = useCmsGallery("venue-moments-gallery", [
    { src: ambiente1, alt: "Momento no salão da Dona Rosa" },
    { src: evento1, alt: "Clientes no salão da Dona Rosa" },
    { src: forno1, alt: "Registro de evento na Dona Rosa" },
    { src: prato2, alt: "Encontro no ambiente da Dona Rosa" },
    { src: prato3, alt: "Clientes em momento especial na Dona Rosa" },
  ]);

  const customerMural = useCmsCarousel(
    "venue-customers-mural",
    [
      { src: prato2, alt: "Cliente com prato autografado 1" },
      { src: prato3, alt: "Cliente com prato autografado 2" },
      { src: evento1, alt: "Cliente com prato autografado 3" },
      { src: ambiente1, alt: "Cliente com prato autografado 4" },
    ],
    3,
  );

  const menuCta = getText("venue-menu-cta", "Ver mais");
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <VenueIntro getText={getText} getImage={getImage} />
      <MenuHighlights menuHighlights={menuHighlights} getText={getText} menuCta={menuCta} isMobile={isMobile} />
      <MomentsCarousel momentsGallery={momentsGallery} getText={getText} />
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
  getText: (sectionKey: string, fallback: string) => string;
  getImage: (sectionKey: string, fallbackUrl: string) => string;
}) {
  return (
    <section className="section-paper relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <BrandAlecrim className="absolute left-0 top-28 h-40 w-auto opacity-[0.18] hidden lg:block" />
      <BrandLinhaDecorativa className="absolute right-4 top-1/3 h-11 w-auto opacity-15 hidden xl:block rotate-6" />
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <EditableWrapper id="venue-intro-title" type="text" label="Título Nosso Espaço">
            <RichText
              as="h1"
              inline
              content={getText("venue-intro-title", "Nosso Espaço")}
              className="text-4xl md:text-5xl text-foreground"
            />
          </EditableWrapper>
        </div>

        <div className="space-y-12">
          {venueIntroRows.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                row.imageRight ? "md:[&>*:first-child]:order-1 md:[&>*:last-child]:order-2" : "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
              }`}
            >
              <EditableWrapper id={row.textKey} type="textarea" label={`Texto ${row.id}`}>
                <div className={`${row.imageRight ? "border-r-4 pr-5 md:text-right" : "border-l-4 pl-5"} border-secondary/60`}>
                  <RichText
                    content={getText(row.textKey, row.textFallback)}
                    className="text-muted-foreground leading-relaxed text-sm md:text-base"
                  />
                </div>
              </EditableWrapper>

              <EditableWrapper id={row.imageKey} type="image" label={`Imagem ${row.id}`}>
                <div className="rounded-2xl overflow-hidden shadow-md bg-muted/10">
                  <img
                    src={getImage(row.imageKey, row.imageFallback)}
                    alt={getText(row.textKey, row.textFallback)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-[20rem] md:h-[22rem] object-cover"
                  />
                </div>
              </EditableWrapper>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuHighlights({
  menuHighlights,
  getText,
  menuCta,
  isMobile,
}: {
  menuHighlights: { src: string; alt: string }[];
  getText: (sectionKey: string, fallback: string) => string;
  menuCta: string;
  isMobile: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const visibleColumns = isMobile ? 1 : Math.min(3, menuHighlights.length);
  const visibleImages = Array.from({ length: visibleColumns }, (_, idx) => {
    return menuHighlights[(current + idx) % menuHighlights.length];
  });

  const { data: categories } = useQuery({
    queryKey: ["venue-menu-categories-anchor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .order("sort_order");
      if (error) {
        throw error;
      }
      return data ?? [];
    },
  });

  useEffect(() => {
    if (current > menuHighlights.length - 1) {
      setCurrent(0);
    }
  }, [current, menuHighlights.length]);

  const prev = () => setCurrent((c) => (c === 0 ? menuHighlights.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === menuHighlights.length - 1 ? 0 : c + 1));

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-menu-title" type="text" label="Título Nosso Cardápio">
            <RichText
              as="h2"
              inline
              content={getText("venue-menu-title", "Nosso Cardápio")}
              className="text-3xl md:text-4xl text-foreground"
            />
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
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center gap-4 justify-center">
              <button
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
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </EditableWrapper>

        <div className="text-center mt-8">
          <EditableWrapper id="venue-menu-cta" type="link" label="Botão Nosso Cardápio">
            <a href="/cardapio" className="btn-secondary-dr inline-block">
              <RichText as="span" inline content={menuCta} />
            </a>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {visibleImages.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
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
      </EditableWrapper>
      {images.length > visibleCount && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisibleCount((count) => count + 12)}
            className="btn-secondary-dr inline-block"
          >
            Carregar mais
          </button>
        </div>
      )}

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            aria-label="Fechar"
          >
            <X size={32} />
          </button>
          <button
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
  getText: (sectionKey: string, fallback: string) => string;
}) {
  return (
    <section className="section-paper py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-moments-title" type="text" label="Título Momentos">
            <RichText
              as="h2"
              inline
              content={getText("venue-moments-title", "Momentos")}
              className="text-3xl md:text-4xl text-foreground"
            />
          </EditableWrapper>
        </div>

        <LightboxGalleryGrid
          galleryId="venue-moments-gallery"
          galleryLabel="Galeria Momentos"
          images={momentsGallery}
        />
      </div>
    </section>
  );
}

function CustomerMural({
  customerMural,
  getText,
}: {
  customerMural: { src: string; alt: string }[];
  getText: (sectionKey: string, fallback: string) => string;
}) {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <EditableWrapper id="venue-customers-title" type="text" label="Título Nossos Clientes">
            <RichText
              as="h2"
              inline
              content={getText("venue-customers-title", "Nossos Clientes")}
              className="text-3xl md:text-4xl text-foreground"
            />
          </EditableWrapper>
        </div>

        <LightboxGalleryGrid
          galleryId="venue-customers-mural"
          galleryLabel="Mural Nossos Clientes"
          images={customerMural}
        />

      </div>
    </section>
  );
}
export default VenuePage;
