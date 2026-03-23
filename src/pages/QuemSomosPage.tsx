import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
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
    description: "A história da Dona Rosa é a história de uma família que transformou o amor pela culinária italiana em um legado de sabor e acolhimento.",
    blocks: [
      {
        text: "Dona Rosa, que dá nome à nossa pizzaria, é a matriarca da família Fasanaro. Filha de imigrantes italianos, recebeu a tradição do preparo artesanal da pizza napolitana diretamente de sua nonna. Com muito carinho, transmitiu esse conhecimento aos seus filhos e netos.",
        image: forno1,
      },
      {
        text: "Cada pizza que sai do nosso forno a lenha carrega décadas de tradição, amor e dedicação. A atmosfera acolhedora reflete a essência da família italiana: reunir pessoas ao redor da mesa para celebrar a vida.",
        image: pizza1,
      },
    ],
  },
  {
    id: "segredos",
    title: "Segredos das nossas pizzas",
    description: "Da massa ao forno, cada detalhe é cuidadosamente pensado para criar uma experiência gastronômica única.",
    blocks: [
      {
        text: "Nossa massa é o resultado de anos de experimentação e aprimoramento. Utilizamos farinha especial importada da Itália, fermentação natural de 72 horas e técnicas tradicionais que garantem uma textura leve, crocante por fora e macia por dentro.",
        image: prato2,
      },
      {
        text: "Nosso forno a lenha atinge temperaturas superiores a 400°C, proporcionando o cozimento perfeito em poucos minutos. O resultado é uma pizza com sabor defumado único, bordas aeradas e ingredientes que mantêm toda a sua frescura.",
        image: prato3,
      },
    ],
  },
  {
    id: "criacoes",
    title: "Criações Exclusivas",
    description: "Um cardápio que celebra a tradição italiana com toques contemporâneos e ingredientes sazonais.",
    blocks: [
      {
        text: "Além das pizzas tradicionais, oferecemos criações exclusivas que combinam ingredientes sazonais e locais com a autenticidade da receita napolitana. Cada criação conta uma história e proporciona uma nova experiência.",
        image: ambiente1,
      },
      {
        text: "A Margherita DOP com tomate San Marzano, a Tartufo com azeite trufado e a Pizza de Figo com Gorgonzola são algumas das nossas especialidades que encantam paladares e criam experiências gastronômicas memoráveis.",
        image: evento1,
      },
    ],
  },
];

const QuemSomosPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="section-paper relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <img src={alecrim} alt="" className="absolute top-16 left-2 w-20 md:w-28 opacity-25 pointer-events-none" />
        <img src={trigo} alt="" className="absolute top-10 right-2 w-16 md:w-24 opacity-20 pointer-events-none" />
        <img src={tomilho} alt="" className="absolute bottom-6 left-1/3 w-14 md:w-20 opacity-15 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <span className="inline-block text-sm font-semibold text-secondary tracking-wider uppercase mb-4">Nossa História</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Quem Somos
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-base md:text-lg">
            Somos a Dona Rosa Pizzaria, um espaço que nasceu do amor pela tradição italiana e pelo prazer de reunir
            pessoas ao redor de uma boa mesa. Nossa história começa na cozinha de Dona Rosa, uma mulher que
            transformou receitas de família em momentos inesquecíveis.
          </p>
          <img src={linhaDecorativa} alt="" className="mx-auto mt-10 w-48 opacity-40" />
        </div>
      </section>

      {/* Content Sections */}
      {sections.map((section, sIdx) => (
        <section
          key={section.id}
          id={section.id}
          className={`py-20 md:py-28 ${sIdx % 2 === 1 ? "section-paper" : "bg-background"}`}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Section header */}
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold text-secondary tracking-widest uppercase mb-3">
                {String(sIdx + 1).padStart(2, "0")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {section.title}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{section.description}</p>
              <img src={linhaDecorativa} alt="" className="mx-auto mt-6 w-32 opacity-25" />
            </div>

            {/* Blocks */}
            <div className="space-y-20">
              {section.blocks.map((block, bIdx) => {
                const isReversed = bIdx % 2 === 1;
                return (
                  <div
                    key={bIdx}
                    className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} gap-10 md:gap-16 items-center`}
                  >
                    {/* Image */}
                    <div className="flex-1 w-full">
                      <div className="relative group">
                        <div className={`absolute inset-0 bg-primary/10 rounded-2xl transform ${isReversed ? "rotate-2" : "-rotate-2"} transition-transform group-hover:rotate-0`} />
                        <img
                          src={block.image}
                          alt={section.title}
                          loading="lazy"
                          className="relative w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg"
                        />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <div className={`border-l-4 border-secondary pl-6 ${isReversed ? "md:border-r-4 md:border-l-0 md:pr-6 md:pl-0 md:text-right" : ""}`}>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                          {block.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Gallery */}
      <section className="section-paper py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">Nossos Espaços</h2>
          <img src={linhaDecorativa} alt="" className="mx-auto mb-12 w-32 opacity-25" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[forno1, ambiente1, pizza1, evento1, curso1, saude1].map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md group">
                <img
                  src={img}
                  alt={`Espaço ${i + 1}`}
                  loading="lazy"
                  className="w-full h-40 md:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Para começar e brindar</h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
            Conheça nossos antepastos, saladas frescas e uma carta de vinhos e cervejas artesanais cuidadosamente
            selecionada para harmonizar com nossas pizzas. Venha viver essa experiência!
          </p>
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
