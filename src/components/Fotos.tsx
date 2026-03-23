import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import forno1 from "@/assets/forno-1.jpg";
import ambiente1 from "@/assets/ambiente-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import evento1 from "@/assets/evento-1.jpg";

interface FotosData {
  title: string;
  images: { src: string; alt: string }[];
}

const defaultData: FotosData = {
  title: "Fotos",
  images: [
    { src: forno1, alt: "Forno a lenha" },
    { src: ambiente1, alt: "Ambiente da pizzaria" },
    { src: pizza1, alt: "Pizza artesanal" },
    { src: evento1, alt: "Evento" },
  ],
};

const Fotos = ({ data = defaultData }: { data?: FotosData }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % data.images.length);
  }, [lightboxIndex, data.images.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + data.images.length) % data.images.length);
  }, [lightboxIndex, data.images.length]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goNext, goPrev, closeLightbox]);

  return (
    <>
      <section id="fotos" className="section-paper py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">{data.title}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {data.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            aria-label="Fechar"
          >
            <X size={32} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>

          {/* Image */}
          <img
            src={data.images[lightboxIndex].src}
            alt={data.images[lightboxIndex].alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Próxima"
          >
            <ChevronRight size={36} />
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {data.images.length}
          </div>
        </div>
      )}
    </>
  );
};

export default Fotos;
