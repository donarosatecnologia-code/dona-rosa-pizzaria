import EditableWrapper from "@/components/EditableWrapper";
import logoFull from "@/assets/logo-full.png";
import alecrim from "@/assets/alecrim.png";
import trigo from "@/assets/trigo.png";
import { useCmsImage } from "@/hooks/useCmsMedia";

const Hero = () => {
  const heroLogoImage = useCmsImage("home-hero-logo", logoFull);

  return (
    <section className="section-paper relative min-h-[70vh] flex items-center justify-center pt-16 overflow-hidden">
      <img src={alecrim} alt="" className="absolute left-0 top-20 h-72 opacity-40 hidden lg:block pointer-events-none" />
      <img src={trigo} alt="" className="absolute right-4 bottom-10 h-64 opacity-40 hidden lg:block pointer-events-none" />
      <div className="text-center py-16 px-4">
        <EditableWrapper id="home-hero-logo" type="image" label="Logo Hero">
          <img src={heroLogoImage} alt="Dona Rosa Pizzaria" className="mx-auto w-64 md:w-80 lg:w-96" />
        </EditableWrapper>
      </div>
    </section>
  );
};

export default Hero;
