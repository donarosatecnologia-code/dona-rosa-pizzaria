import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import alecrim from "@/assets/alecrim.png";
import tomilho from "@/assets/tomilho.png";
import trigo from "@/assets/trigo.png";
import forno1 from "@/assets/forno-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import ambiente1 from "@/assets/ambiente-1.jpg";
import evento1 from "@/assets/evento-1.jpg";
import curso1 from "@/assets/curso-1.jpg";
import saude1 from "@/assets/saude-1.jpg";
import prato2 from "@/assets/prato-2.jpg";
import prato3 from "@/assets/prato-3.jpg";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useCmsCarousel } from "@/hooks/useCmsMedia";
import RichText from "@/components/RichText";
import { useIsMobile } from "@/hooks/use-mobile";

const sections = [
  {
    id: "tradicao-familiar",
    title: "Tradição Familiar",
    description: "A história da Dona Rosa é marcada por afeto, receita de família e o costume de reunir pessoas ao redor da mesa.",
    rows: [
      { type: "text-image" as const, image: evento1, text: "A Dona Rosa, matriarca da família Fasanaro, herdou da nonna italiana o saber do preparo artesanal. Esse legado foi passado com carinho entre gerações e segue vivo em cada detalhe do nosso trabalho." },
      { type: "image-text" as const, image: prato2, text: "Mais do que receitas, carregamos histórias. Nossa cozinha é um espaço de memórias, técnica e amor pela tradição italiana." },
      { type: "text-image" as const, image: ambiente1, text: "Cada pizza que sai do forno representa esse encontro entre origem, família e acolhimento." },
    ],
  },
  {
    id: "segredos-das-nossas-pizzas",
    title: "Segredos das Nossas Pizzas",
    description: "Do preparo da massa ao forno, cada etapa foi pensada para valorizar textura, sabor e autenticidade.",
    rows: [
      { type: "image-text" as const, image: saude1, text: "Nossa massa passa por fermentação lenta, com equilíbrio de hidratação e tempo, para chegar leve e saborosa à mesa." },
      { type: "text-image" as const, image: prato3, text: "Selecionamos ingredientes frescos e combinações que respeitam o protagonismo de cada sabor." },
      { type: "image-text" as const, image: forno1, text: "No forno, o ponto certo garante bordas aeradas, centro macio e a assinatura artesanal da Dona Rosa." },
    ],
  },
  {
    id: "criacoes-exclusivas",
    title: "Criações Exclusivas",
    description: "Um cardápio que celebra a tradição italiana com toques contemporâneos e ingredientes selecionados.",
    rows: [
      { type: "text-image" as const, image: pizza1, text: "Nossas criações exclusivas nascem da combinação entre técnica italiana e criatividade da casa." },
      { type: "image-text" as const, image: prato2, text: "Montamos sabores que equilibram tradição, sazonalidade e personalidade em cada receita." },
      { type: "text-image" as const, image: prato3, text: "Cada pizza é pensada para criar experiência: textura perfeita, aroma marcante e identidade própria." },
      { type: "image-text" as const, image: evento1, text: "As combinações exclusivas valorizam ingredientes de qualidade e o cuidado artesanal do preparo." },
      { type: "text-image" as const, image: curso1, text: "Nosso cardápio evolui sem perder essência: acolhimento, sabor e autenticidade." },
    ],
  },
];

const QuemSomosPage = () => {
  const isMobile = useIsMobile();
  const [brindarCurrent, setBrindarCurrent] = useState(0);
  const cmsKeys = [
    "qs-hero-subtitle",
    "qs-hero-title",
    "qs-hero-description",
    "qs-brindar-title",
    "qs-brindar-description",
    "qs-brindar-cta",
    ...sections.flatMap((section) => {
      const sectionBase = [`qs-${section.id}-title`, `qs-${section.id}-desc`];
      const rowTextKeys = section.rows
        .map((row, rIdx) => (row.type === "image-text" || row.type === "text-image" ? `qs-${section.id}-text-${rIdx}` : null))
        .filter((value): value is string => value !== null);
      const rowImageKeys = section.rows
        .map((_, rIdx) => `qs-${section.id}-img-${rIdx}`);
      return [...sectionBase, ...rowTextKeys, ...rowImageKeys];
    }),
  ];

  const { getText, getImage, getLink } = useCmsContents(cmsKeys, "quem-somos");
  const { images: brindarImages } = useCmsCarousel("qs-brindar-carousel", [forno1, ambiente1, pizza1, evento1].map((src, i) => ({
    src,
    alt: `Brindar ${i + 1}`,
  })), 2);
  const brindarCta = getLink("qs-brindar-cta", "Ver Cardápio", "/cardapio");

  useEffect(() => {
    if (brindarCurrent > brindarImages.length - 1) {
      setBrindarCurrent(0);
    }
  }, [brindarCurrent, brindarImages.length]);

  const nextBrindar = () => {
    setBrindarCurrent((prev) => (prev === brindarImages.length - 1 ? 0 : prev + 1));
  };

  const prevBrindar = () => {
    setBrindarCurrent((prev) => (prev === 0 ? brindarImages.length - 1 : prev - 1));
  };

  const visibleBrindarImages = Array.from({ length: isMobile ? 1 : Math.min(2, brindarImages.length) }, (_, idx) => {
    return brindarImages[(brindarCurrent + idx) % brindarImages.length];
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="section-paper relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <img src={alecrim} alt="" className="absolute top-16 left-2 w-20 md:w-28 opacity-25 pointer-events-none" />
        <img src={trigo} alt="" className="absolute top-10 right-2 w-16 md:w-24 opacity-20 pointer-events-none" />
        <img src={tomilho} alt="" className="absolute bottom-6 left-1/3 w-14 md:w-20 opacity-15 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <EditableWrapper id="qs-hero-subtitle" type="text" label="Subtítulo Hero">
            <RichText as="span" inline content={getText("qs-hero-subtitle", "Quem Somos")} className="inline-block text-sm font-semibold text-secondary tracking-wider uppercase mb-4" />
          </EditableWrapper>
          <EditableWrapper id="qs-hero-title" type="text" label="Título Hero">
            <RichText as="h1" inline content={getText("qs-hero-title", "Nossa História")} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" />
          </EditableWrapper>
          <EditableWrapper id="qs-hero-description" type="textarea" label="Descrição Hero">
            <RichText content={getText("qs-hero-description", "Somos a Dona Rosa Pizzaria, um espaço que nasceu do amor pela tradição italiana e pelo prazer de reunir pessoas ao redor de uma boa mesa.")} className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-base md:text-lg space-y-3" />
          </EditableWrapper>
        </div>
      </section>

      {/* Content Sections */}
      {sections.map((section, sIdx) => (
        <section key={section.id} id={section.id} className={`py-16 md:py-24 ${sIdx % 2 === 0 ? "bg-background" : "section-paper"}`}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14">
              <EditableWrapper id={`qs-${section.id}-title`} type="text" label={`Título: ${section.title}`}>
                <RichText as="h2" inline content={getText(`qs-${section.id}-title`, section.title)} className="text-3xl md:text-4xl font-bold text-foreground mb-3" />
              </EditableWrapper>
              <EditableWrapper id={`qs-${section.id}-desc`} type="textarea" label={`Descrição: ${section.title}`}>
                <RichText content={getText(`qs-${section.id}-desc`, section.description)} className="text-muted-foreground max-w-2xl mx-auto leading-relaxed space-y-3" />
              </EditableWrapper>
            </div>

            <div className="space-y-10">
              {section.rows.map((row, rIdx) => {
                if (row.type === "image-text") {
                  return (
                    <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <EditableWrapper id={`qs-${section.id}-img-${rIdx}`} type="image" label={`Imagem ${rIdx + 1}`}>
                        <div className="flex justify-center">
                          <div className="inline-flex max-w-full overflow-hidden rounded-2xl shadow-md bg-muted/10">
                            <img src={getImage(`qs-${section.id}-img-${rIdx}`, row.image)} alt={section.title} loading="lazy" className="block w-auto max-w-full h-auto max-h-[32rem] object-contain transition-transform duration-700" />
                          </div>
                        </div>
                      </EditableWrapper>
                      <EditableWrapper id={`qs-${section.id}-text-${rIdx}`} type="textarea" label={`Texto ${rIdx + 1}`}>
                        <div className="border-l-4 border-secondary/60 pl-6">
                          <RichText content={getText(`qs-${section.id}-text-${rIdx}`, row.text)} className="text-muted-foreground leading-relaxed text-sm md:text-base space-y-2" />
                        </div>
                      </EditableWrapper>
                    </div>
                  );
                }
                if (row.type === "text-image") {
                  return (
                    <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <EditableWrapper id={`qs-${section.id}-text-${rIdx}`} type="textarea" label={`Texto ${rIdx + 1}`}>
                        <div className="border-r-4 border-secondary/60 pr-6 md:text-right order-2 md:order-1">
                          <RichText content={getText(`qs-${section.id}-text-${rIdx}`, row.text)} className="text-muted-foreground leading-relaxed text-sm md:text-base space-y-2" />
                        </div>
                      </EditableWrapper>
                      <EditableWrapper id={`qs-${section.id}-img-${rIdx}`} type="image" label={`Imagem ${rIdx + 1}`}>
                        <div className="flex justify-center order-1 md:order-2">
                          <div className="inline-flex max-w-full overflow-hidden rounded-2xl shadow-md bg-muted/10">
                            <img src={getImage(`qs-${section.id}-img-${rIdx}`, row.image)} alt={section.title} loading="lazy" className="block w-auto max-w-full h-auto max-h-[32rem] object-contain transition-transform duration-700" />
                          </div>
                        </div>
                      </EditableWrapper>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Para Começar e Brindar */}
      <section className="section-paper py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <EditableWrapper id="qs-brindar-title" type="text" label="Título Para Começar e Brindar">
              <RichText as="h2" inline content={getText("qs-brindar-title", "Para Começar e Brindar")} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
            </EditableWrapper>
            <EditableWrapper id="qs-brindar-description" type="textarea" label="Descrição Para Começar e Brindar">
              <RichText content={getText("qs-brindar-description", "Conheça nossos antepastos, saladas frescas e uma carta de vinhos cuidadosamente selecionada para harmonizar com nossas pizzas.")} className="text-muted-foreground leading-relaxed max-w-2xl mx-auto space-y-3" />
            </EditableWrapper>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <button onClick={prevBrindar} className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Anterior">
              <ChevronLeft className="text-primary" size={20} />
            </button>
            <EditableWrapper id="qs-brindar-carousel" type="carousel" label="Carrossel Para Começar e Brindar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-10 md:px-12">
                {visibleBrindarImages.map((image, index) => (
                  <div key={`${image.src}-${brindarCurrent}-${index}`} className="rounded-2xl overflow-hidden shadow-md bg-muted/20 h-[18rem] md:h-[22rem]">
                    <img src={image.src} alt={image.alt} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </EditableWrapper>
            <button onClick={nextBrindar} className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Próximo">
              <ChevronRight className="text-primary" size={20} />
            </button>
          </div>
          <div className="text-center mt-8">
            <EditableWrapper id="qs-brindar-cta" type="link" label="Botão Para Começar e Brindar">
              <a href={brindarCta.url} className="btn-secondary-dr inline-block">
                <RichText as="span" inline content={brindarCta.label} />
              </a>
            </EditableWrapper>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default QuemSomosPage;
