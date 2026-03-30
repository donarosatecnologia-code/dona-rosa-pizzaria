import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandLinhaDecorativa, BrandTrigo } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsGallery } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

const Fotos = () => {
  const { getText } = useCmsContents(["home-fotos-title"], "home");
  const { images: galleryImages } = useCmsGallery("home-fotos-gallery");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const fotosTitle = getText("home-fotos-title");
  const visibleImages = galleryImages.slice(0, visibleCount);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) {
      return;
    }
    setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
  }, [lightboxIndex, galleryImages.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) {
      return;
    }
    setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
  }, [lightboxIndex, galleryImages.length]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }
    if (galleryImages.length > 0 && lightboxIndex > galleryImages.length - 1) {
      setLightboxIndex(0);
    }
  }, [lightboxIndex, galleryImages.length]);

  useEffect(() => {
    setVisibleCount(12);
  }, [galleryImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      }
      if (e.key === "ArrowRight") {
        goNext();
      }
      if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goNext, goPrev, closeLightbox]);

  return (
    <>
      <section id="fotos" className="section-paper relative overflow-hidden py-16 md:py-24">
        <BrandTrigo className="absolute right-4 top-1/3 h-28 w-auto opacity-[0.2] hidden lg:block" />
        <BrandLinhaDecorativa className="absolute left-6 bottom-12 h-8 w-auto opacity-15 -rotate-6 hidden xl:block" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <EditableWrapper id="home-fotos-title" type="text" label="Título Fotos">
            {fotosTitle ? (
              <RichText as="h2" inline content={fotosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-10" />
            ) : (
              <CmsPlaceholder label="Título da galeria" className="mb-10" />
            )}
          </EditableWrapper>

          <EditableWrapper id="home-fotos-gallery" type="gallery" label="Galeria Fotos">
            {galleryImages.length === 0 ? (
              <CmsPlaceholder label="Galeria sem imagens publicadas" className="max-w-5xl mx-auto" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {visibleImages.map((img, i) => (
                  <button
                    key={`${img.src}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full"
                  >
                    <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            )}
          </EditableWrapper>
          {galleryImages.length > visibleCount && (
            <div className="mt-8">
              <button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="btn-secondary-dr inline-block">
                Carregar mais
              </button>
            </div>
          )}
        </div>
      </section>

      {lightboxIndex !== null && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button type="button" onClick={closeLightbox} className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2" aria-label="Fechar">
            <X size={32} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <img
            src={galleryImages[lightboxIndex].src}
            alt={galleryImages[lightboxIndex].alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10 p-2 bg-black/30 rounded-full"
            aria-label="Próxima"
          >
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
