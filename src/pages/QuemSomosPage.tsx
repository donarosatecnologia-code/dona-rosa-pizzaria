import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import linhaDecorativa from "@/assets/linha-decorativa.png";

const sections = [
  {
    id: "tradicao",
    title: "Tradição familiar",
    blocks: [
      {
        text: "Dona Rosa, que dá nome à nossa pizzaria, é a matriarca da família Fasanaro. Filha de imigrantes italianos, recebeu a tradição do preparo artesanal da pizza napolitana diretamente de sua nonna. Com muito carinho, transmitiu esse conhecimento aos seus filhos e netos.",
        images: [forno1, pizza1, ambiente1],
        layout: "text-left" as const,
      },
      {
        text: "Cada pizza que sai do nosso forno a lenha carrega décadas de tradição, amor e dedicação. A atmosfera acolhedora reflete a essência da família italiana: reunir pessoas ao redor da mesa para celebrar a vida.",
        images: [evento1, curso1],
        layout: "text-right" as const,
      },
    ],
  },
  {
    id: "segredos",
    title: "Segredos das nossas pizzas",
    blocks: [
      {
        text: "Nossa massa é o resultado de anos de experimentação e aprimoramento. Utilizamos farinha especial importada da Itália, fermentação natural de 72 horas e técnicas tradicionais que garantem uma textura leve, crocante por fora e macia por dentro.",
        images: [prato2, prato3],
        layout: "text-left" as const,
      },
      {
        text: "Nosso forno a lenha atinge temperaturas superiores a 400°C, proporcionando o cozimento perfeito em poucos minutos. O resultado é uma pizza com sabor defumado único, bordas aeradas e ingredientes que mantêm toda a sua frescura.",
        images: [forno1, saude1],
        layout: "text-right" as const,
      },
    ],
  },
  {
    id: "criacoes",
    title: "Criações Exclusivas",
    blocks: [
      {
        text: "Nosso cardápio é uma celebração da culinária italiana com toques contemporâneos. Além das pizzas tradicionais, oferecemos criações exclusivas que combinam ingredientes sazonais e locais com a autenticidade da receita napolitana.",
        images: [pizza1, ambiente1, prato2],
        layout: "text-left" as const,
      },
      {
        text: "A Margherita DOP com tomate San Marzano, a Tartufo com azeite trufado e a Pizza de Figo com Gorgonzola são algumas das nossas especialidades que encantam paladares e criam experiências gastronômicas memoráveis.",
        images: [prato3, curso1],
        layout: "text-right" as const,
      },
    ],
  },
];

const QuemSomosPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="section-paper relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        <img src={alecrim} alt="" className="absolute top-20 left-4 w-16 md:w-24 opacity-30 pointer-events-none" />
        <img src={trigo} alt="" className="absolute top-16 right-4 w-14 md:w-20 opacity-25 pointer-events-none" />
        <img src={tomilho} alt="" className="absolute bottom-8 left-1/4 w-12 md:w-16 opacity-20 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Quem Somos</h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto text-base md:text-lg">
            Somos a Dona Rosa Pizzaria, um espaço que nasceu do amor pela tradição italiana e pelo prazer de reunir
            pessoas ao redor de uma boa mesa. Nossa história começa na cozinha de Dona Rosa, uma mulher que
            transformou receitas de família em momentos inesquecíveis. Cada pizza que servimos carrega o sabor da
            autenticidade, feita com ingredientes selecionados e assada no forno a lenha.
          </p>
          <img src={linhaDecorativa} alt="" className="mx-auto mt-8 w-48 opacity-40" />
        </div>
      </section>

      {/* Content Sections */}
      {sections.map((section, sIdx) => {
        const isOdd = sIdx % 2 === 1;
        return (
          <section
            key={section.id}
            id={section.id}
            className={`py-16 md:py-24 ${isOdd ? "section-paper" : "bg-background"}`}
          >
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
                {section.title}
              </h2>
              <img src={linhaDecorativa} alt="" className="mx-auto mb-12 w-36 opacity-30" />

              <div className="space-y-16">
                {section.blocks.map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className={`flex flex-col ${
                      block.layout === "text-right" ? "md:flex-row-reverse" : "md:flex-row"
                    } gap-8 items-center`}
                  >
                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {block.text}
                      </p>
                    </div>

                    {/* Images Grid */}
                    <div className="flex-1">
                      <div className={`grid gap-3 ${block.images.length >= 3 ? "grid-cols-2" : "grid-cols-2"}`}>
                        {block.images.map((img, iIdx) => (
                          <div
                            key={iIdx}
                            className={`rounded-xl overflow-hidden shadow-md ${
                              block.images.length === 3 && iIdx === 2 ? "col-span-2" : ""
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${section.title} ${iIdx + 1}`}
                              loading="lazy"
                              className="w-full h-40 md:h-48 object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="section-paper py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Para começar e brindar</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Conheça nossos antepastos, saladas frescas e uma carta de vinhos e cervejas artesanais cuidadosamente
            selecionada para harmonizar com nossas pizzas. Venha viver essa experiência!
          </p>
          <a href="/#contato" className="btn-secondary-dr inline-block">
            Reservar uma mesa
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuemSomosPage;
