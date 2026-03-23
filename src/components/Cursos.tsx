import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import curso1 from "@/assets/curso-1.jpg";
import evento1 from "@/assets/evento-1.jpg";

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
  const [current, setCurrent] = useState(0);

  return (
    <section id="cursos" className="section-paper py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <EditableWrapper id="home-cursos-title" type="text" label="Título Cursos">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{data.title}</h2>
            </EditableWrapper>
            <EditableWrapper id="home-cursos-desc" type="textarea" label="Descrição Cursos">
              <p className="text-muted-foreground mb-8 leading-relaxed">{data.description}</p>
            </EditableWrapper>
            <a href="#" className="btn-primary-dr inline-block">{data.ctaLabel}</a>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrent(c => c === 0 ? data.images.length - 1 : c - 1)} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20" aria-label="Anterior">
                <ChevronLeft className="text-primary" size={20} />
              </button>
              <EditableWrapper id={`home-cursos-img-${current}`} type="carousel" label="Carrossel Cursos">
                <div className="rounded-2xl overflow-hidden shadow-lg flex-1">
                  <img src={data.images[current].src} alt={data.images[current].alt} loading="lazy" className="w-full h-56 md:h-72 object-cover" />
                </div>
              </EditableWrapper>
              <button onClick={() => setCurrent(c => c === data.images.length - 1 ? 0 : c + 1)} className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20" aria-label="Próximo">
                <ChevronRight className="text-primary" size={20} />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {data.images.map((_, i) => (
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
