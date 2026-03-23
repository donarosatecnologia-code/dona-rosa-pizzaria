import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Editable from "@/components/Editable";
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

const sections = [
  {
    id: "tradicao",
    title: "Tradição familiar",
    description:
      "A história da Dona Rosa é a história de uma família que transformou o amor pela culinária italiana em um legado de sabor e acolhimento.",
    rows: [
      {
        type: "image-text" as const,
        image: forno1,
        text: "Dona Rosa, que dá nome à nossa pizzaria, é a matriarca da família Fasanaro. Filha de imigrantes italianos, recebeu a tradição do preparo artesanal da pizza napolitana diretamente de sua nonna. Com muito carinho, transmitiu esse conhecimento aos seus filhos e netos.",
      },
      {
        type: "two-images" as const,
        images: [pizza1, prato2],
      },
      {
        type: "text-image" as const,
        image: ambiente1,
        text: "Cada pizza que sai do nosso forno a lenha carrega décadas de tradição, amor e dedicação. A atmosfera acolhedora reflete a essência da família italiana: reunir pessoas ao redor da mesa para celebrar a vida.",
      },
    ],
  },
  {
    id: "segredos",
    title: "Segredos das nossas pizzas",
    description:
      "Da massa ao forno, cada detalhe é cuidadosamente pensado para criar uma experiência gastronômica única.",
    rows: [
      {
        type: "image-text" as const,
        image: prato3,
        text: "Nossa massa é o resultado de anos de experimentação e aprimoramento. Utilizamos farinha especial importada da Itália, fermentação natural de 72 horas e técnicas tradicionais que garantem uma textura leve, crocante por fora e macia por dentro.",
      },
      {
        type: "two-images" as const,
        images: [forno1, pizza1],
      },
      {
        type: "text-image" as const,
        image: prato2,
        text: "Nosso forno a lenha atinge temperaturas superiores a 400°C, proporcionando o cozimento perfeito em poucos minutos. O resultado é uma pizza com sabor defumado único, bordas aeradas e ingredientes que mantêm toda a sua frescura.",
      },
    ],
  },
  {
    id: "criacoes",
    title: "Criações Exclusivas",
    description:
      "Um cardápio que celebra a tradição italiana com toques contemporâneos e ingredientes sazonais.",
    rows: [
      {
        type: "image-text" as const,
        image: evento1,
        text: "Além das pizzas tradicionais, oferecemos criações exclusivas que combinam ingredientes sazonais e locais com a autenticidade da receita napolitana. Cada criação conta uma história e proporciona uma nova experiência.",
      },
      {
        type: "two-images" as const,
        images: [curso1, saude1],
      },
      {
        type: "text-image" as const,
        image: ambiente1,
        text: "A Margherita DOP com tomate San Marzano, a Tartufo com azeite trufado e a Pizza de Figo com Gorgonzola são algumas das nossas especialidades que encantam paladares e criam experiências gastronômicas memoráveis.",
      },
    ],
  },
];

const QuemSomosPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="section-paper relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <img src={alecrim} alt="" className="absolute top-16 left-2 w-20 md:w-28 opacity-25 pointer-events-none" />
        <img src={trigo} alt="" className="absolute top-10 right-2 w-16 md:w-24 opacity-20 pointer-events-none" />
        <img src={tomilho} alt="" className="absolute bottom-6 left-1/3 w-14 md:w-20 opacity-15 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <Editable id="qs-hero-subtitle" type="text" label="Subtítulo Hero">
            <span className="inline-block text-sm font-semibold text-secondary tracking-wider uppercase mb-4">
              Nossa História
            </span>
          </Editable>
          <Editable id="qs-hero-title" type="text" label="Título Hero">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Quem Somos
            </h1>
          </Editable>
          <Editable id="qs-hero-description" type="textarea" label="Descrição Hero">
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-base md:text-lg">
              Somos a Dona Rosa Pizzaria, um espaço que nasceu do amor pela tradição italiana e pelo prazer de reunir
              pessoas ao redor de uma boa mesa. Nossa história começa na cozinha de Dona Rosa, uma mulher que
              transformou receitas de família em momentos inesquecíveis.
            </p>
          </Editable>
          
        </div>
      </section>

      {/* Content Sections */}
      {sections.map((section, sIdx) => (
        <section
          key={section.id}
          id={section.id}
          className={`py-16 md:py-24 ${sIdx % 2 === 0 ? "bg-background" : "section-paper"}`}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Section header */}
            <div className="text-center mb-14">
              <Editable id={`qs-${section.id}-title`} type="text" label={`Título: ${section.title}`}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  {section.title}
                </h2>
              </Editable>
              <img src={linhaDecorativa} alt="" className="mx-auto mb-4 w-32 opacity-30" />
              <Editable id={`qs-${section.id}-desc`} type="textarea" label={`Descrição: ${section.title}`}>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {section.description}
                </p>
              </Editable>
            </div>

            {/* Content rows */}
            <div className="space-y-10">
              {section.rows.map((row, rIdx) => {
                if (row.type === "image-text") {
                  return (
                    <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <Editable id={`qs-${section.id}-img-${rIdx}`} type="image" label={`Imagem ${rIdx + 1}`}>
                        <div className="overflow-hidden rounded-2xl shadow-md group">
                          <img
                            src={row.image}
                            alt={section.title}
                            loading="lazy"
                            className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </Editable>
                      <Editable id={`qs-${section.id}-text-${rIdx}`} type="textarea" label={`Texto ${rIdx + 1}`}>
                        <div className="border-l-4 border-secondary/60 pl-6">
                          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                            {row.text}
                          </p>
                        </div>
                      </Editable>
                    </div>
                  );
                }

                if (row.type === "two-images") {
                  return (
                    <div key={rIdx} className="grid grid-cols-2 gap-4 md:gap-6">
                      {row.images?.map((img, imgIdx) => (
                        <Editable key={imgIdx} id={`qs-${section.id}-grid-img-${rIdx}-${imgIdx}`} type="image" label={`Imagem grade ${imgIdx + 1}`}>
                          <div className="overflow-hidden rounded-2xl shadow-md group">
                            <img
                              src={img}
                              alt={`${section.title} ${imgIdx + 1}`}
                              loading="lazy"
                              className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        </Editable>
                      ))}
                    </div>
                  );
                }

                if (row.type === "text-image") {
                  return (
                    <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <Editable id={`qs-${section.id}-text-${rIdx}`} type="textarea" label={`Texto ${rIdx + 1}`}>
                        <div className="border-r-4 border-secondary/60 pr-6 md:text-right order-2 md:order-1">
                          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                            {row.text}
                          </p>
                        </div>
                      </Editable>
                      <Editable id={`qs-${section.id}-img-${rIdx}`} type="image" label={`Imagem ${rIdx + 1}`}>
                        <div className="overflow-hidden rounded-2xl shadow-md group order-1 md:order-2">
                          <img
                            src={row.image}
                            alt={section.title}
                            loading="lazy"
                            className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </Editable>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Gallery */}
      <section className="section-paper py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <Editable id="qs-gallery-title" type="text" label="Título Galeria">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-3">Nossos Espaços</h2>
          </Editable>
          <img src={linhaDecorativa} alt="" className="mx-auto mb-10 w-32 opacity-30" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[forno1, ambiente1, pizza1, evento1, curso1, saude1].map((img, i) => (
              <Editable key={i} id={`qs-gallery-img-${i}`} type="image" label={`Foto galeria ${i + 1}`}>
                <div className="rounded-2xl overflow-hidden shadow-md group">
                  <img
                    src={img}
                    alt={`Espaço ${i + 1}`}
                    loading="lazy"
                    className="w-full h-40 md:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Editable>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Editable id="qs-cta-title" type="text" label="Título CTA">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Para começar e brindar</h2>
          </Editable>
          <Editable id="qs-cta-description" type="textarea" label="Descrição CTA">
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
              Conheça nossos antepastos, saladas frescas e uma carta de vinhos e cervejas artesanais cuidadosamente
              selecionada para harmonizar com nossas pizzas. Venha viver essa experiência!
            </p>
          </Editable>
          <a href="/#contato" className="btn-secondary-dr inline-block">
            Reservar uma mesa
          </a>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default QuemSomosPage;
