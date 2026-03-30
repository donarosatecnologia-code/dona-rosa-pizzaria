import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandTomilho, BrandTrigo } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";

type RowType = "text-image" | "image-text";

function SectionImageBlock({
  imgKey,
  imgSrc,
  labelIndex,
}: {
  imgKey: string;
  imgSrc: string;
  labelIndex: number;
}) {
  return (
    <EditableWrapper id={imgKey} type="image" label={`Imagem ${labelIndex + 1}`}>
      <div className="flex w-full justify-center">
        <div className="inline-block max-w-full">
          {imgSrc ? (
            <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.22)] ring-1 ring-border/25">
              <img
                src={imgSrc}
                alt=""
                loading="lazy"
                className="block h-auto max-h-[min(32rem,85vh)] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-border/40">
              <CmsPlaceholder label="Imagem" className="min-h-[10rem] w-full max-w-lg border-0" />
            </div>
          )}
        </div>
      </div>
    </EditableWrapper>
  );
}

const sections: { id: string; label: string; rows: { type: RowType }[] }[] = [
  {
    id: "tradicao-familiar",
    label: "Tradição Familiar",
    rows: [{ type: "text-image" }, { type: "image-text" }, { type: "text-image" }],
  },
  {
    id: "segredos-das-nossas-pizzas",
    label: "Segredos das Nossas Pizzas",
    rows: [{ type: "image-text" }, { type: "text-image" }, { type: "image-text" }],
  },
  {
    id: "criacoes-exclusivas",
    label: "Criações Exclusivas",
    rows: [
      { type: "text-image" },
      { type: "image-text" },
      { type: "text-image" },
      { type: "image-text" },
      { type: "text-image" },
    ],
  },
];

const QuemSomosPage = () => {
  const shell = useSiteShellReady();
  const isMobile = useIsMobile();
  const [brindarCurrent, setBrindarCurrent] = useState(0);
  const cmsKeys = [
    "qs-hero-subtitle",
    "qs-hero-title",
    "qs-hero-description",
    "qs-brindar-title",
    "qs-brindar-description",
    "qs-brindar-cta",
    ...sections.flatMap((section) => {
      const sectionBase = [`qs-${section.id}-title`, `qs-${section.id}-desc`];
      const rowTextKeys = section.rows.map((_, rIdx) => `qs-${section.id}-text-${rIdx}`);
      const rowImageKeys = section.rows.map((_, rIdx) => `qs-${section.id}-img-${rIdx}`);
      return [...sectionBase, ...rowTextKeys, ...rowImageKeys];
    }),
  ];

  const { getText, getImage, getLink, isPending, isError } = useCmsContents(cmsKeys, "quem-somos");
  const { images: brindarImages, columns: brindarColumns, isPending: brindarPending } = useCmsCarousel(
    "qs-brindar-carousel",
    2,
  );
  const brindarCta = getLink("qs-brindar-cta");

  const brindarLen = brindarImages.length;
  const visibleBrindarCols = brindarLen === 0 ? 0 : isMobile ? 1 : Math.min(brindarColumns, brindarLen);
  const visibleBrindarImages =
    brindarLen === 0 || visibleBrindarCols === 0
      ? []
      : Array.from({ length: visibleBrindarCols }, (_, idx) => brindarImages[(brindarCurrent + idx) % brindarLen]);

  useEffect(() => {
    if (brindarLen > 0 && brindarCurrent > brindarLen - 1) {
      setBrindarCurrent(0);
    }
  }, [brindarCurrent, brindarLen]);

  const nextBrindar = () => {
    setBrindarCurrent((prev) => (brindarLen === 0 ? 0 : prev === brindarLen - 1 ? 0 : prev + 1));
  };

  const prevBrindar = () => {
    setBrindarCurrent((prev) => (brindarLen === 0 ? 0 : prev === 0 ? brindarLen - 1 : prev - 1));
  };

  if (shell.isPending || isPending || brindarPending) {
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

      <section className="section-paper relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <BrandAlecrim className="absolute top-16 left-2 w-20 md:w-28 opacity-25" />
        <BrandTrigo className="absolute top-10 right-2 w-16 md:w-24 opacity-20" />
        <BrandTomilho className="absolute bottom-6 left-1/3 w-14 md:w-20 opacity-15" />

        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <EditableWrapper id="qs-hero-subtitle" type="text" label="Subtítulo Hero">
            {getText("qs-hero-subtitle") ? (
              <RichText
                as="span"
                inline
                content={getText("qs-hero-subtitle")}
                className="inline-block text-sm font-semibold text-secondary tracking-wider uppercase mb-4"
              />
            ) : (
              <CmsPlaceholder label="Subtítulo" className="mb-4" />
            )}
          </EditableWrapper>
          <EditableWrapper id="qs-hero-title" type="text" label="Título Hero">
            {getText("qs-hero-title") ? (
              <RichText as="h1" inline content={getText("qs-hero-title")} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" />
            ) : (
              <CmsPlaceholder label="Título principal" className="mb-6" />
            )}
          </EditableWrapper>
          <EditableWrapper id="qs-hero-description" type="textarea" label="Descrição Hero">
            {getText("qs-hero-description") ? (
              <RichText content={getText("qs-hero-description")} className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-base md:text-lg space-y-3" />
            ) : (
              <CmsPlaceholder label="Descrição" />
            )}
          </EditableWrapper>
        </div>
      </section>

      {sections.map((section, sIdx) => (
        <section key={section.id} id={section.id} className={`py-16 md:py-24 ${sIdx % 2 === 0 ? "bg-background" : "section-paper"}`}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14">
              <EditableWrapper id={`qs-${section.id}-title`} type="text" label={`Título: ${section.label}`}>
                {getText(`qs-${section.id}-title`) ? (
                  <RichText as="h2" inline content={getText(`qs-${section.id}-title`)} className="text-3xl md:text-4xl font-bold text-foreground mb-3" />
                ) : (
                  <CmsPlaceholder label="Título da seção" className="mb-3" />
                )}
              </EditableWrapper>
              <EditableWrapper id={`qs-${section.id}-desc`} type="textarea" label={`Descrição: ${section.label}`}>
                {getText(`qs-${section.id}-desc`) ? (
                  <RichText content={getText(`qs-${section.id}-desc`)} className="text-muted-foreground max-w-2xl mx-auto leading-relaxed space-y-3" />
                ) : (
                  <CmsPlaceholder label="Descrição da seção" />
                )}
              </EditableWrapper>
            </div>

            <div className="space-y-10">
              {section.rows.map((row, rIdx) => {
                const textKey = `qs-${section.id}-text-${rIdx}`;
                const imgKey = `qs-${section.id}-img-${rIdx}`;
                const textBody = getText(textKey);
                const imgSrc = getImage(imgKey);

                if (row.type === "image-text") {
                  return (
                    <div key={rIdx} className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:items-center">
                      <SectionImageBlock imgKey={imgKey} imgSrc={imgSrc} labelIndex={rIdx} />
                      <EditableWrapper id={textKey} type="textarea" label={`Texto ${rIdx + 1}`}>
                        <div className="border-l-4 border-secondary/60 pl-6">
                          {textBody ? (
                            <RichText content={textBody} className="space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base" />
                          ) : (
                            <CmsPlaceholder label="Texto" />
                          )}
                        </div>
                      </EditableWrapper>
                    </div>
                  );
                }
                return (
                  <div key={rIdx} className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:items-center">
                    <EditableWrapper id={textKey} type="textarea" label={`Texto ${rIdx + 1}`}>
                      <div className="order-2 border-r-4 border-secondary/60 pr-6 md:order-1 md:text-right">
                        {textBody ? (
                          <RichText content={textBody} className="space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base" />
                        ) : (
                          <CmsPlaceholder label="Texto" />
                        )}
                      </div>
                    </EditableWrapper>
                    <div className="order-1 md:order-2">
                      <SectionImageBlock imgKey={imgKey} imgSrc={imgSrc} labelIndex={rIdx} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="section-paper py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <EditableWrapper id="qs-brindar-title" type="text" label="Título Para Começar e Brindar">
              {getText("qs-brindar-title") ? (
                <RichText as="h2" inline content={getText("qs-brindar-title")} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
              ) : (
                <CmsPlaceholder label="Título" className="mb-4" />
              )}
            </EditableWrapper>
            <EditableWrapper id="qs-brindar-description" type="textarea" label="Descrição Para Começar e Brindar">
              {getText("qs-brindar-description") ? (
                <RichText content={getText("qs-brindar-description")} className="text-muted-foreground leading-relaxed max-w-2xl mx-auto space-y-3" />
              ) : (
                <CmsPlaceholder label="Descrição" />
              )}
            </EditableWrapper>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <button
              type="button"
              onClick={prevBrindar}
              disabled={brindarLen === 0}
              className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="text-primary" size={20} />
            </button>
            <EditableWrapper id="qs-brindar-carousel" type="carousel" label="Carrossel Para Começar e Brindar">
              {brindarLen === 0 ? (
                <CmsPlaceholder label="Carrossel sem imagens publicadas" className="min-h-[14rem] mx-10 md:mx-12" />
              ) : (
                <div
                  className="grid gap-4 w-full px-10 md:px-12"
                  style={{ gridTemplateColumns: `repeat(${visibleBrindarCols}, minmax(0, 1fr))` }}
                >
                  {visibleBrindarImages.map((image, index) => (
                    <div key={`${image.src}-${brindarCurrent}-${index}`} className="rounded-2xl overflow-hidden shadow-md bg-muted/20 h-[18rem] md:h-[22rem]">
                      <img src={image.src} alt={image.alt} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </EditableWrapper>
            <button
              type="button"
              onClick={nextBrindar}
              disabled={brindarLen === 0}
              className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
              aria-label="Próximo"
            >
              <ChevronRight className="text-primary" size={20} />
            </button>
          </div>
          <div className="text-center mt-8">
            <EditableWrapper id="qs-brindar-cta" type="link" label="Botão Para Começar e Brindar">
              {brindarCta.label && brindarCta.url ? (
                <a href={brindarCta.url} className="btn-secondary-dr inline-block">
                  <RichText as="span" inline content={brindarCta.label} />
                </a>
              ) : (
                <CmsPlaceholder label="Botão (título e URL)" className="inline-block min-w-[10rem]" />
              )}
            </EditableWrapper>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default QuemSomosPage;
