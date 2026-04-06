import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandTrigo } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";
import { siteContainerClass } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const Cardapio = () => {
  const isMobile = useIsMobile();
  const { getText, getLink } = useCmsContents(["home-cardapio-title", "home-cardapio-desc", "home-cardapio-cta"], "home");
  const { images: carouselImages, columns } = useCmsCarousel("home-cardapio-carousel", 3);
  const [current, setCurrent] = useState(0);
  const safeLen = carouselImages.length;
  const visibleColumns = safeLen === 0 ? 0 : isMobile ? 1 : Math.min(columns, safeLen);
  const visibleImages =
    safeLen === 0 || visibleColumns === 0
      ? []
      : Array.from({ length: visibleColumns }, (_, idx) => carouselImages[(current + idx) % safeLen]);
  const cardapioTitle = getText("home-cardapio-title");
  const cardapioDescription = getText("home-cardapio-desc");
  const cta = getLink("home-cardapio-cta");

  useEffect(() => {
    if (safeLen > 0 && current > safeLen - 1) {
      setCurrent(0);
    }
  }, [current, safeLen]);

  const prev = () => setCurrent((c) => (safeLen === 0 ? 0 : c === 0 ? safeLen - 1 : c - 1));
  const next = () => setCurrent((c) => (safeLen === 0 ? 0 : c === safeLen - 1 ? 0 : c + 1));

  return (
    <section id="cardapio" className="section-paper relative overflow-hidden py-16 md:py-24">
      <BrandTrigo className="absolute right-0 top-0 h-40 opacity-30 hidden lg:block" />
      <BrandAlecrim className="absolute bottom-6 left-0 h-32 w-auto opacity-[0.2] hidden md:block" />
      <div className={cn(siteContainerClass, "relative z-10 text-center")}>
        <EditableWrapper id="home-cardapio-title" type="text" label="Título Cardápio">
          {cardapioTitle ? (
            <RichText as="h2" inline content={cardapioTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
          ) : (
            <CmsPlaceholder label="Título do cardápio" className="mb-4" />
          )}
        </EditableWrapper>
        <EditableWrapper id="home-cardapio-desc" type="textarea" label="Descrição Cardápio">
          {cardapioDescription ? (
            <RichText content={cardapioDescription} className="text-muted-foreground mb-10 w-full space-y-3" />
          ) : (
            <CmsPlaceholder label="Descrição" className="mb-10 w-full" />
          )}
        </EditableWrapper>

        <div className="relative w-full">
          <div className="flex items-center gap-4 justify-center">
            <button
              type="button"
              onClick={prev}
              disabled={safeLen === 0}
              className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="text-primary" size={24} />
            </button>

            <EditableWrapper id="home-cardapio-carousel" type="carousel" label="Carrossel Cardápio">
              {safeLen === 0 ? (
                <CmsPlaceholder label="Carrossel sem imagens publicadas" className="min-h-[12rem]" />
              ) : (
                <div className="grid w-full gap-4" style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}>
                  {visibleImages.map((img, i) => (
                    <div key={`${img.src}-${current}-${i}`} className="rounded-xl overflow-hidden shadow-lg">
                      <img src={img.src} alt={img.alt} loading="lazy" className="h-52 w-full object-cover md:h-64 lg:h-72" />
                    </div>
                  ))}
                </div>
              )}
            </EditableWrapper>

            <button
              type="button"
              onClick={next}
              disabled={safeLen === 0}
              className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
              aria-label="Próximo"
            >
              <ChevronRight className="text-primary" size={24} />
            </button>
          </div>

          {safeLen > 0 && (
            <div className="flex justify-center gap-2 mt-6">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <EditableWrapper id="home-cardapio-cta" type="link" label="Botão Cardápio">
            {cta.label && cta.url ? (
              <a href={cta.url} className="btn-secondary-dr inline-block">
                <RichText as="span" inline content={cta.label} />
              </a>
            ) : (
              <CmsPlaceholder label="Botão (título e URL)" className="inline-block min-w-[10rem]" />
            )}
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
};

export default Cardapio;
