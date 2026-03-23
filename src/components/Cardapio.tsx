import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import pizza1 from "@/assets/pizza-1.jpg";
import prato2 from "@/assets/prato-2.jpg";
import prato3 from "@/assets/prato-3.jpg";
import trigo from "@/assets/trigo.png";

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
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? data.images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === data.images.length - 1 ? 0 : c + 1));

  return (
    <section id="cardapio" className="section-paper py-16 md:py-24 relative overflow-hidden">
      <img src={trigo} alt="" className="absolute right-0 top-0 h-40 opacity-30 hidden lg:block pointer-events-none" />
      <div className="container mx-auto px-4 text-center">
        <EditableWrapper id="home-cardapio-title" type="text" label="Título Cardápio">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{data.title}</h2>
        </EditableWrapper>
        <EditableWrapper id="home-cardapio-desc" type="textarea" label="Descrição Cardápio">
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">{data.description}</p>
        </EditableWrapper>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-4 justify-center">
            <button onClick={prev} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Anterior">
              <ChevronLeft className="text-primary" size={24} />
            </button>

            <div className="flex gap-4 overflow-hidden">
              {data.images.map((img, i) => (
                <EditableWrapper key={i} id={`home-cardapio-img-${i}`} type="image" label={`Imagem Cardápio ${i + 1}`}>
                  <div className={`shrink-0 w-48 md:w-64 rounded-xl overflow-hidden transition-transform duration-300 ${
                    i === current ? "scale-105 shadow-lg" : "opacity-70 scale-95"
                  }`}>
                    <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-36 md:h-48 object-cover" />
                  </div>
                </EditableWrapper>
              ))}
            </div>

            <button onClick={next} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Próximo">
              <ChevronRight className="text-primary" size={24} />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {data.images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>

        <a href="/cardapio" className="btn-secondary-dr inline-block mt-8">
          {data.ctaLabel}
        </a>
      </div>
    </section>
  );
};

export default Cardapio;
