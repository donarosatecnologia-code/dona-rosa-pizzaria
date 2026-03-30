import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandLinhaDecorativa, BrandTomilhoB } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";

const Cursos = () => {
  const isMobile = useIsMobile();
  const { getText, getLink } = useCmsContents(["home-cursos-title", "home-cursos-desc", "home-cursos-cta"], "home");
  const { images: carouselImages, columns } = useCmsCarousel("home-cursos-carousel", 2);
  const [current, setCurrent] = useState(0);
  const safeLen = carouselImages.length;
  const visibleColumns = safeLen === 0 ? 0 : isMobile ? 1 : Math.min(columns, safeLen);
  const visibleImages =
    safeLen === 0 || visibleColumns === 0
      ? []
      : Array.from({ length: visibleColumns }, (_, idx) => carouselImages[(current + idx) % safeLen]);
  const cursosTitle = getText("home-cursos-title");
  const cursosDescription = getText("home-cursos-desc");
  const cursosCta = getLink("home-cursos-cta");

  useEffect(() => {
    if (safeLen > 0 && current > safeLen - 1) {
      setCurrent(0);
    }
  }, [current, safeLen]);

  const prev = () => setCurrent((c) => (safeLen === 0 ? 0 : c === 0 ? safeLen - 1 : c - 1));
  const next = () => setCurrent((c) => (safeLen === 0 ? 0 : c === safeLen - 1 ? 0 : c + 1));

  return (
    <section id="cursos" className="section-paper relative overflow-hidden py-16 md:py-24">
      <BrandTomilhoB className="absolute left-2 top-8 h-24 w-auto opacity-[0.22] hidden lg:block" />
      <BrandLinhaDecorativa className="absolute bottom-6 right-6 h-9 w-auto opacity-[0.2] rotate-12 hidden md:block" />
      <div className="container relative z-10 mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <EditableWrapper id="home-cursos-title" type="text" label="Título Cursos">
              {cursosTitle ? (
                <RichText as="h2" inline content={cursosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
              ) : (
                <CmsPlaceholder label="Título" className="mb-4" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-cursos-desc" type="textarea" label="Descrição Cursos">
              {cursosDescription ? (
                <RichText content={cursosDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
              ) : (
                <CmsPlaceholder label="Descrição" className="mb-8" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-cursos-cta" type="link" label="Botão Cursos">
              {cursosCta.label && cursosCta.url ? (
                <a href={cursosCta.url} className="btn-primary-dr inline-block">
                  <RichText as="span" inline content={cursosCta.label} />
                </a>
              ) : (
                <CmsPlaceholder label="Botão (título e URL)" className="inline-block min-w-[10rem]" />
              )}
            </EditableWrapper>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={safeLen === 0}
                className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
                aria-label="Anterior"
              >
                <ChevronLeft className="text-primary" size={20} />
              </button>
              <EditableWrapper id="home-cursos-carousel" type="carousel" label="Carrossel Cursos">
                {safeLen === 0 ? (
                  <CmsPlaceholder label="Carrossel sem imagens publicadas" className="min-h-[14rem] flex-1" />
                ) : (
                  <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}>
                    {visibleImages.map((img, i) => (
                      <div key={`${img.src}-${current}-${i}`} className="rounded-2xl overflow-hidden shadow-lg">
                        <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-56 md:h-72 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </EditableWrapper>
              <button
                type="button"
                onClick={next}
                disabled={safeLen === 0}
                className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
                aria-label="Próximo"
              >
                <ChevronRight className="text-primary" size={20} />
              </button>
            </div>
            {safeLen > 0 && (
              <div className="flex justify-center gap-2 mt-4">
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
        </div>
      </div>
    </section>
  );
};

export default Cursos;
