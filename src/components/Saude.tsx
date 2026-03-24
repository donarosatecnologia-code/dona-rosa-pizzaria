import EditableWrapper from "@/components/EditableWrapper";
import saude1 from "@/assets/saude-1.jpg";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

interface SaudeData {
  title: string;
  description: string;
  ctaLabel: string;
  image: string;
}

const defaultData: SaudeData = {
  title: "Saúde e Sustentabilidade",
  description: "Na Dona Rosa a dedicação vai além das deliciosas pizzas. Nós oferecemos uma experiência que une sabor, alimentação saudável e práticas sustentáveis.",
  ctaLabel: "Saúde e Sustentabilidade",
  image: saude1,
};

const Saude = ({ data = defaultData }: { data?: SaudeData }) => {
  const { getText, getLink } = useCmsContents([
    "home-saude-title",
    "home-saude-desc",
    "home-saude-cta",
  ], "home");
  const saudeImage = useCmsImage("home-saude-img", data.image);
  const saudeTitle = getText("home-saude-title", data.title);
  const saudeDescription = getText("home-saude-desc", data.description);
  const saudeCta = getLink("home-saude-cta", data.ctaLabel, "#");

  return (
    <section id="saude" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <EditableWrapper id="home-saude-img" type="image" label="Imagem Saúde">
            <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
              <img src={saudeImage} alt="Ingredientes frescos" loading="lazy" className="w-full h-64 md:h-80 object-cover" />
            </div>
          </EditableWrapper>

          <div className="order-1 md:order-2 text-center md:text-left">
            <EditableWrapper id="home-saude-title" type="text" label="Título Saúde">
              <RichText as="h2" inline content={saudeTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
            </EditableWrapper>
            <EditableWrapper id="home-saude-desc" type="textarea" label="Descrição Saúde">
              <RichText content={saudeDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
            </EditableWrapper>
            <EditableWrapper id="home-saude-cta" type="link" label="Botão Saúde">
              <a href={saudeCta.url} className="btn-secondary-dr inline-block"><RichText as="span" inline content={saudeCta.label} /></a>
            </EditableWrapper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Saude;
