import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandTomilho } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

const Saude = () => {
  const { getText, getLink } = useCmsContents(["home-saude-title", "home-saude-desc", "home-saude-cta"], "home");
  const saudeImage = useCmsImage("home-saude-img");
  const saudeTitle = getText("home-saude-title");
  const saudeDescription = getText("home-saude-desc");
  const saudeCta = getLink("home-saude-cta");

  return (
    <section id="saude" className="relative overflow-hidden bg-background py-16 md:py-24">
      <BrandAlecrim className="absolute -left-2 top-20 h-32 w-auto opacity-[0.16] hidden lg:block" />
      <BrandTomilho className="absolute right-0 bottom-10 h-16 w-auto opacity-[0.18] hidden md:block" />
      <div className="container relative z-10 mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <EditableWrapper id="home-saude-img" type="image" label="Imagem Saúde">
            <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1 min-h-[16rem] flex items-center justify-center bg-muted/20">
              {saudeImage ? (
                <img src={saudeImage} alt="" loading="lazy" className="w-full h-64 md:h-80 object-cover" />
              ) : (
                <CmsPlaceholder label="Imagem da seção saúde" className="w-full border-0" />
              )}
            </div>
          </EditableWrapper>

          <div className="order-1 md:order-2 text-center md:text-left">
            <EditableWrapper id="home-saude-title" type="text" label="Título Saúde">
              {saudeTitle ? (
                <RichText as="h2" inline content={saudeTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
              ) : (
                <CmsPlaceholder label="Título" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-saude-desc" type="textarea" label="Descrição Saúde">
              {saudeDescription ? (
                <RichText content={saudeDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
              ) : (
                <CmsPlaceholder label="Descrição" className="mb-8" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-saude-cta" type="link" label="Botão Saúde">
              {saudeCta.label && saudeCta.url ? (
                <a href={saudeCta.url} className="btn-secondary-dr inline-block">
                  <RichText as="span" inline content={saudeCta.label} />
                </a>
              ) : (
                <CmsPlaceholder label="Botão (título e URL)" className="inline-block min-w-[10rem]" />
              )}
            </EditableWrapper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Saude;
