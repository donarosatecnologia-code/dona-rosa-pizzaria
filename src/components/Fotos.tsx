import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import forno1 from "@/assets/forno-1.jpg";
import ambiente1 from "@/assets/ambiente-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import evento1 from "@/assets/evento-1.jpg";
import { useCmsGallery } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

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
  const { getText } = useCmsContents(["home-fotos-title"], "home");
  const galleryImages = useCmsGallery("home-fotos-gallery", data.images);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fotosTitle = getText("home-fotos-title", data.title);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
  }, [lightboxIndex, galleryImages.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
  }, [lightboxIndex, galleryImages.length]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    if (lightboxIndex > galleryImages.length - 1) {
      setLightboxIndex(0);
    }
  }, [lightboxIndex, galleryImages.length]);

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
          <EditableWrapper id="home-fotos-title" type="text" label="Título Fotos">
            <RichText as="h2" inline content={fotosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-10" />
          </EditableWrapper>

          <EditableWrapper id="home-fotos-gallery" type="gallery" label="Galeria Fotos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {galleryImages.map((img, i) => (
                <button
                  key={`${img.src}-${i}`}
                  onClick={() => setLightboxIndex(i)}
                  className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full"
                >
                  <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </EditableWrapper>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2" aria-label="Fechar">
            <X size={32} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full" aria-label="Anterior">
            <ChevronLeft size={36} />
          </button>
          <img src={galleryImages[lightboxIndex].src} alt={galleryImages[lightboxIndex].alt} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full" aria-label="Próxima">
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </>
  );
};

export default Fotos;
