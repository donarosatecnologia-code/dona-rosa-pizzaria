import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BrandAlecrim, BrandTrigo } from "@/components/BrandAccents";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { useIsMobile } from "@/hooks/use-mobile";
import curso1 from "@/assets/curso-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import prato2 from "@/assets/prato-2.jpg";
import forno1 from "@/assets/forno-1.jpg";
import ambiente1 from "@/assets/ambiente-1.jpg";
import evento1 from "@/assets/evento-1.jpg";
import prato3 from "@/assets/prato-3.jpg";

interface SustainabilityPillarRow {
  id: string;
  imageKey: string;
  textKey: string;
  imageFallback: string;
  textFallback: string;
  imageRight: boolean;
}

const sustainabilityPillars: SustainabilityPillarRow[] = [
  {
    id: "p1",
    imageKey: "sustain-pillar-1-img",
    textKey: "sustain-pillar-1-text",
    imageFallback: forno1,
    textFallback:
      "Nosso forno a lenha é o coração da casa: buscamos eficiência no uso da energia e respeito ao tempo de cozimento que valoriza sabor e textura.",
    imageRight: true,
  },
  {
    id: "p2",
    imageKey: "sustain-pillar-2-img",
    textKey: "sustain-pillar-2-text",
    imageFallback: ambiente1,
    textFallback:
      "O ambiente foi pensado para acolher com conforto e consciência, priorizando materiais duráveis e uma operação alinhada ao bem-estar de equipe e clientes.",
    imageRight: false,
  },
  {
    id: "p3",
    imageKey: "sustain-pillar-3-img",
    textKey: "sustain-pillar-3-text",
    imageFallback: evento1,
    textFallback:
      "Valorizamos horta e fornecedores parceiros, ampliando o uso de ingredientes frescos e de proximidade sempre que possível.",
    imageRight: true,
  },
  {
    id: "p4",
    imageKey: "sustain-pillar-4-img",
    textKey: "sustain-pillar-4-text",
    imageFallback: prato3,
    textFallback:
      "Trabalhamos para reduzir desperdício na cozinha e organizar descarte e reciclagem de forma responsável no dia a dia.",
    imageRight: false,
  },
  {
    id: "p5",
    imageKey: "sustain-pillar-5-img",
    textKey: "sustain-pillar-5-text",
    imageFallback: pizza1,
    textFallback:
      "Cuidamos dos recursos como água e insumos com disciplina: cada etapa, da massa ao atendimento, reflete esse compromisso contínuo.",
    imageRight: true,
  },
];

function FermentationCarousel({
  carouselId,
  carouselLabel,
  images,
}: {
  carouselId: string;
  carouselLabel: string;
  images: { src: string; alt: string }[];
}) {
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);

  const visibleColumns = isMobile ? 1 : Math.min(3, images.length);
  const visibleImages = Array.from({ length: visibleColumns }, (_, idx) => {
    return images[(current + idx) % images.length];
  });

  useEffect(() => {
    if (current > images.length - 1) {
      setCurrent(0);
    }
  }, [current, images.length]);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  if (images.length === 0) {
    return null;
  }

  return (
    <EditableWrapper id={carouselId} type="carousel" label={carouselLabel}>
      <div className="relative max-w-4xl mx-auto w-full">
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
            className="grid w-full max-w-3xl gap-2 sm:gap-2.5 md:gap-3"
            style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}
          >
            {visibleImages.map((image, index) => (
              <div
                key={`${image.src}-${current}-${index}`}
                className="h-64 w-full overflow-hidden rounded-xl bg-muted/25 shadow-md ring-1 ring-border/20 sm:h-72 md:h-80 lg:h-[22rem]"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-center"
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
          {images.map((_, i) => (
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
    </EditableWrapper>
  );
}

function FermentationSection({
  getText,
  carouselImages,
}: {
  getText: (sectionKey: string, fallback: string) => string;
  carouselImages: { src: string; alt: string }[];
}) {
  return (
    <section className="section-paper relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <BrandAlecrim className="absolute left-2 top-32 h-36 w-auto opacity-[0.18] hidden lg:block" />
      <BrandTrigo className="absolute right-0 top-1/4 h-28 w-auto opacity-[0.16] hidden md:block" />
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <header className="mb-10 md:mb-12 text-center">
          <div className="inline-block max-w-4xl">
            <EditableWrapper id="sustain-fermentation-title" type="text" label="Título — Fermentação">
              <RichText
                as="h1"
                inline
                content={getText("sustain-fermentation-title", "Os benefícios da fermentação")}
                className="text-4xl md:text-5xl lg:text-[3.25rem] text-foreground tracking-tight"
              />
            </EditableWrapper>
            <div className="mt-5 mx-auto h-1 w-16 rounded-full bg-secondary/80" aria-hidden />
          </div>
        </header>

        <div className="mb-12 md:mb-16">
          <FermentationCarousel
            carouselId="sustain-fermentation-carousel"
            carouselLabel="Carrossel — Manipulação da massa"
            images={carouselImages}
          />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-8 md:mb-10" aria-hidden />
          <EditableWrapper id="sustain-fermentation-body" type="textarea" label="Texto — Benefícios da fermentação">
            <RichText
              content={getText(
                "sustain-fermentation-body",
                "A fermentação natural da nossa massa favorece digestibilidade, desenvolve aromas complexos e respeita tempos que tornam a pizza mais leve e saborosa. Esse processo artesanal é parte da nossa identidade e do cuidado com quem compartilha a mesa conosco.",
              )}
              className="text-muted-foreground leading-[1.75] text-[15px] md:text-base text-center"
            />
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
}

function SustainabilityGrid({
  getText,
  getImage,
}: {
  getText: (sectionKey: string, fallback: string) => string;
  getImage: (sectionKey: string, fallbackUrl: string) => string;
}) {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <EditableWrapper id="sustain-s2-title" type="text" label="Título — Sustentabilidade">
            <RichText
              as="h2"
              inline
              content={getText("sustain-s2-title", "Sustentabilidade")}
              className="text-3xl md:text-4xl text-foreground"
            />
          </EditableWrapper>
        </div>

        <div className="space-y-12 md:space-y-16">
          {sustainabilityPillars.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start ${
                row.imageRight
                  ? "md:[&>*:first-child]:order-1 md:[&>*:last-child]:order-2"
                  : "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
              }`}
            >
              <EditableWrapper id={row.textKey} type="textarea" label={`Texto — Pilar ${row.id}`}>
                <div
                  className={`${
                    row.imageRight ? "border-r-4 pr-5 md:text-right md:pt-1" : "border-l-4 pl-5 md:pt-1"
                  } border-secondary/60`}
                >
                  <RichText
                    content={getText(row.textKey, row.textFallback)}
                    className="text-muted-foreground leading-relaxed text-sm md:text-base"
                  />
                </div>
              </EditableWrapper>

              <EditableWrapper id={row.imageKey} type="image" label={`Imagem — Pilar ${row.id}`}>
                <div className="rounded-2xl overflow-hidden shadow-md bg-muted/15 flex justify-center items-center">
                  <img
                    src={getImage(row.imageKey, row.imageFallback)}
                    alt={getText(row.textKey, row.textFallback)}
                    loading="lazy"
                    decoding="async"
                    className="h-auto max-h-[min(85vh,920px)] w-full max-w-full object-contain"
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

function SustainabilityPage() {
  const cmsKeys = [
    "sustain-fermentation-title",
    "sustain-fermentation-body",
    ...sustainabilityPillars.flatMap((row) => [row.imageKey, row.textKey]),
    "sustain-s2-title",
  ];

  const { getText, getImage } = useCmsContents(cmsKeys, "saude-e-sustentabilidade");

  const fermentationCarousel = useCmsCarousel(
    "sustain-fermentation-carousel",
    [
      { src: curso1, alt: "Manipulação artesanal da massa na Dona Rosa" },
      { src: pizza1, alt: "Preparo e fermentação da massa" },
      { src: prato2, alt: "Trabalho manual da massa com fermentação natural" },
    ],
    1,
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <FermentationSection getText={getText} carouselImages={fermentationCarousel.images} />
      <SustainabilityGrid getText={getText} getImage={getImage} />

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default SustainabilityPage;
