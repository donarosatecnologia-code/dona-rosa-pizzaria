import { Home, Users, Leaf, UtensilsCrossed } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

interface QuemSomosData {
  title: string;
  description: string;
  features: { icon: string; text: string }[];
  ctaLabel: string;
}

const defaultData: QuemSomosData = {
  title: "Quem somos",
  description:
    "Somos uma família inspirada na tradição artesanal da pizza que adora proporcionar encontros ao redor do forno com muito afeto.",
  features: [
    { icon: "home", text: "Uma pizzaria familiar, que se destaca pelo ambiente acolhedor." },
    { icon: "users", text: "Ambientes convidativos, ideais para reuniões familiares e eventos." },
    { icon: "leaf", text: "Temos uma massa de pizza leve e nutritiva, com ingredientes locais sustentáveis." },
    { icon: "utensils", text: "Ampla seleção de opções, incluindo pratos veganos, antepastos e variedade de bebidas." },
  ],
  ctaLabel: "Reservar uma mesa",
};

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="text-primary" size={28} />,
  users: <Users className="text-primary" size={28} />,
  leaf: <Leaf className="text-primary" size={28} />,
  utensils: <UtensilsCrossed className="text-primary" size={28} />,
};

const QuemSomos = ({ data = defaultData }: { data?: QuemSomosData }) => {
  const { getText, getLink } = useCmsContents([
    "home-quemsmos-title",
    "home-quemsmos-desc",
    "home-quemsmos-feat-0",
    "home-quemsmos-feat-1",
    "home-quemsmos-feat-2",
    "home-quemsmos-feat-3",
    "home-quemsmos-cta",
  ], "home");

  const quemSomosTitle = getText("home-quemsmos-title", data.title);
  const quemSomosDescription = getText("home-quemsmos-desc", data.description);
  const cta = getLink("home-quemsmos-cta", data.ctaLabel, "#contato");
  const features = data.features.map((feature, index) => ({
    ...feature,
    text: getText(`home-quemsmos-feat-${index}`, feature.text),
  }));

  return (
    <section id="quem-somos" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <EditableWrapper id="home-quemsmos-title" type="text" label="Título Quem Somos">
          <RichText as="h2" inline content={quemSomosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-6" />
        </EditableWrapper>
        <EditableWrapper id="home-quemsmos-desc" type="textarea" label="Descrição Quem Somos">
          <RichText content={quemSomosDescription} className="text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed space-y-3" />
        </EditableWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
          {features.map((feat, i) => (
            <EditableWrapper key={i} id={`home-quemsmos-feat-${i}`} type="text" label={`Feature ${i + 1}`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">{iconMap[feat.icon]}</div>
                <RichText content={feat.text} className="text-sm text-muted-foreground leading-relaxed space-y-2" />
              </div>
            </EditableWrapper>
          ))}
        </div>

        <EditableWrapper id="home-quemsmos-cta" type="link" label="Botão Quem Somos">
          <a href={cta.url} className="btn-secondary-dr inline-block">
            <RichText as="span" inline content={cta.label} />
          </a>
        </EditableWrapper>
      </div>
    </section>
  );
};

export default QuemSomos;
