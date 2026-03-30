import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandLinhaDecorativa, BrandTomilhoB } from "@/components/BrandAccents";
import curso1 from "@/assets/curso-1.jpg";
import evento1 from "@/assets/evento-1.jpg";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";

interface CursosData {
  title: string;
  description: string;
  images: { src: string; alt: string }[];
  ctaLabel: string;
}

const defaultData: CursosData = {
  title: "Cursos & Eventos",
  description: 'Quer aprender a fazer pizza artesanal e conhecer nossos segredos e dicas especiais? Confira nossos Cursos e Eventos para entusiastas da culinária!',
  images: [
    { src: curso1, alt: "Curso de pizza" },
    { src: evento1, alt: "Evento privado" },
  ],
  ctaLabel: "Cursos e Eventos",
};

const Cursos = ({ data = defaultData }: { data?: CursosData }) => {
  const isMobile = useIsMobile();
  const { getText, getLink } = useCmsContents([
    "home-cursos-title",
    "home-cursos-desc",
    "home-cursos-cta",
  ], "home");
  const { images: carouselImages, columns } = useCmsCarousel("home-cursos-carousel", data.images, 2);
  const [current, setCurrent] = useState(0);
  const visibleColumns = isMobile ? 1 : Math.min(columns, carouselImages.length);
  const visibleImages = Array.from({ length: visibleColumns }, (_, idx) => {
    return carouselImages[(current + idx) % carouselImages.length];
  });
  const cursosTitle = getText("home-cursos-title", data.title);
  const cursosDescription = getText("home-cursos-desc", data.description);
  const cursosCta = getLink("home-cursos-cta", data.ctaLabel, "#");

  useEffect(() => {
    if (current > carouselImages.length - 1) {
      setCurrent(0);
    }
  }, [current, carouselImages.length]);

  return (
    <section id="cursos" className="section-paper relative overflow-hidden py-16 md:py-24">
      <BrandTomilhoB className="absolute left-2 top-8 h-24 w-auto opacity-[0.22] hidden lg:block" />
      <BrandLinhaDecorativa className="absolute bottom-6 right-6 h-9 w-auto opacity-[0.2] rotate-12 hidden md:block" />
      <div className="container relative z-10 mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <EditableWrapper id="home-cursos-title" type="text" label="Título Cursos">
              <RichText as="h2" inline content={cursosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
            </EditableWrapper>
            <EditableWrapper id="home-cursos-desc" type="textarea" label="Descrição Cursos">
              <RichText content={cursosDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
            </EditableWrapper>
            <EditableWrapper id="home-cursos-cta" type="link" label="Botão Cursos">
              <a href={cursosCta.url} className="btn-primary-dr inline-block"><RichText as="span" inline content={cursosCta.label} /></a>
            </EditableWrapper>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrent(c => c === 0 ? carouselImages.length - 1 : c - 1)} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20" aria-label="Anterior">
                <ChevronLeft className="text-primary" size={20} />
              </button>
              <EditableWrapper id="home-cursos-carousel" type="carousel" label="Carrossel Cursos">
                <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}>
                  {visibleImages.map((img, i) => (
                    <div key={`${img.src}-${current}-${i}`} className="rounded-2xl overflow-hidden shadow-lg">
                      <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-56 md:h-72 object-cover" />
                    </div>
                  ))}
                </div>
              </EditableWrapper>
              <button onClick={() => setCurrent(c => c === carouselImages.length - 1 ? 0 : c + 1)} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20" aria-label="Próximo">
                <ChevronRight className="text-primary" size={20} />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {carouselImages.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cursos;
