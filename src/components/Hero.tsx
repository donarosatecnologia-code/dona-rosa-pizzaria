import EditableWrapper from "@/components/EditableWrapper";
import { BrandHeroAccents } from "@/components/BrandAccents";
import logoFull from "@/assets/logo-full.png";
import { useCmsImage } from "@/hooks/useCmsMedia";

const Hero = () => {
  const heroLogoImage = useCmsImage("home-hero-logo", logoFull);

  return (
    <section className="section-paper relative min-h-[70vh] flex items-center justify-center pt-16 overflow-hidden">
      <BrandHeroAccents />
      <div className="text-center py-16 px-4">
        <EditableWrapper id="home-hero-logo" type="image" label="Logo Hero">
          <img src={heroLogoImage} alt="Dona Rosa Pizzaria" className="mx-auto w-64 md:w-80 lg:w-96" />
        </EditableWrapper>
      </div>
    </section>
  );
};

export default Hero;
