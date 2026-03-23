import { Home, Users, Leaf, UtensilsCrossed } from "lucide-react";

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
  return (
    <section id="quem-somos" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{data.title}</h2>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
          {data.features.map((feat, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="shrink-0 mt-1">{iconMap[feat.icon]}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.text}</p>
            </div>
          ))}
        </div>

        <a href="#contato" className="btn-secondary-dr inline-block">
          {data.ctaLabel}
        </a>
      </div>
    </section>
  );
};

export default QuemSomos;
