import EditableWrapper from "@/components/EditableWrapper";
import { BrandHeroAccents } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useAdminMirrorEmbed } from "@/contexts/AdminMirrorEmbedContext";
import { cn } from "@/lib/utils";

const Hero = () => {
  const heroLogoImage = useCmsImage("home-hero-logo");
  const isEmbed = useAdminMirrorEmbed();

  return (
    <section
      className={cn(
        "section-paper relative flex min-h-[70vh] items-center justify-center overflow-hidden",
        isEmbed ? "pt-0" : "pt-16",
      )}
    >
      <BrandHeroAccents />
      <div className="text-center py-16 px-4">
        <EditableWrapper id="home-hero-logo" type="image" label="Logo Hero">
          {heroLogoImage ? (
            <img src={heroLogoImage} alt="Dona Rosa Pizzaria" className="mx-auto w-64 md:w-80 lg:w-96" />
          ) : (
            <CmsPlaceholder label="Logo do hero não publicada" className="mx-auto max-w-md" />
          )}
        </EditableWrapper>
      </div>
    </section>
  );
};

export default Hero;
