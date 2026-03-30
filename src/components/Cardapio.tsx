import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandTrigo } from "@/components/BrandAccents";
import pizza1 from "@/assets/pizza-1.jpg";
import prato2 from "@/assets/prato-2.jpg";
import prato3 from "@/assets/prato-3.jpg";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";

interface CardapioData {
  title: string;
  description: string;
  images: { src: string; alt: string }[];
  ctaLabel: string;
}

const defaultData: CardapioData = {
  title: "Nosso Cardápio",
  description: "Nosso cardápio é fruto de muitos anos de experiência, estudo e trabalho minucioso. Conheça!",
  images: [
    { src: pizza1, alt: "Pizza artesanal" },
    { src: prato2, alt: "Antepastos" },
    { src: prato3, alt: "Massa fresca" },
  ],
  ctaLabel: "Ver cardápio",
};

const Cardapio = ({ data = defaultData }: { data?: CardapioData }) => {
  const isMobile = useIsMobile();
  const { getText, getLink } = useCmsContents([
    "home-cardapio-title",
    "home-cardapio-desc",
    "home-cardapio-cta",
  ], "home");
  const { images: carouselImages, columns } = useCmsCarousel("home-cardapio-carousel", data.images, 3);
  const [current, setCurrent] = useState(0);
  const visibleColumns = isMobile ? 1 : Math.min(columns, carouselImages.length);
  const visibleImages = Array.from({ length: visibleColumns }, (_, idx) => {
    return carouselImages[(current + idx) % carouselImages.length];
  });
  const cardapioTitle = getText("home-cardapio-title", data.title);
  const cardapioDescription = getText("home-cardapio-desc", data.description);
  const cta = getLink("home-cardapio-cta", data.ctaLabel, "/cardapio");

  useEffect(() => {
    if (current > carouselImages.length - 1) {
      setCurrent(0);
    }
  }, [current, carouselImages.length]);

  const prev = () => setCurrent((c) => (c === 0 ? carouselImages.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === carouselImages.length - 1 ? 0 : c + 1));

  return (
    <section id="cardapio" className="section-paper relative overflow-hidden py-16 md:py-24">
      <BrandTrigo className="absolute right-0 top-0 h-40 opacity-30 hidden lg:block" />
      <BrandAlecrim className="absolute bottom-6 left-0 h-32 w-auto opacity-[0.2] hidden md:block" />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <EditableWrapper id="home-cardapio-title" type="text" label="Título Cardápio">
          <RichText as="h2" inline content={cardapioTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
        </EditableWrapper>
        <EditableWrapper id="home-cardapio-desc" type="textarea" label="Descrição Cardápio">
          <RichText content={cardapioDescription} className="text-muted-foreground mb-10 max-w-xl mx-auto space-y-3" />
        </EditableWrapper>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-4 justify-center">
            <button onClick={prev} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Anterior">
              <ChevronLeft className="text-primary" size={24} />
            </button>

            <EditableWrapper id="home-cardapio-carousel" type="carousel" label="Carrossel Cardápio">
              <div className="grid gap-4 w-full max-w-3xl" style={{ gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}>
                {visibleImages.map((img, i) => (
                  <div key={`${img.src}-${current}-${i}`} className="rounded-xl overflow-hidden shadow-lg">
                    <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-36 md:h-48 object-cover" />
                  </div>
                ))}
              </div>
            </EditableWrapper>

            <button onClick={next} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Próximo">
              <ChevronRight className="text-primary" size={24} />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {carouselImages.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>

        <EditableWrapper id="home-cardapio-cta" type="link" label="Botão Cardápio">
          <a href={cta.url} className="btn-secondary-dr inline-block mt-8">
            <RichText as="span" inline content={cta.label} />
          </a>
        </EditableWrapper>
      </div>
    </section>
  );
};

export default Cardapio;
