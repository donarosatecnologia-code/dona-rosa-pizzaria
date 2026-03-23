import { Phone, Mail } from "lucide-react";
import ambiente from "@/assets/ambiente-1.jpg";
import linhaDecorativa from "@/assets/linha-decorativa.png";

interface ContatoData {
  title: string;
  subtitle: string;
  description: string;
  ctaDelivery: string;
  ctaReserva: string;
  image: string;
}

const defaultData: ContatoData = {
  title: "Contato & Reserva de mesa",
  subtitle: "Delivery com atendimento pessoal. Por aqui nada de robôs!",
  description:
    "Ligue e fale com um dos nossos atendentes para pedir o seu delivery ou reservar uma mesa!",
  ctaDelivery: "Delivery",
  ctaReserva: "Reservar uma mesa",
  image: ambiente,
};

const Contato = ({ data = defaultData }: { data?: ContatoData }) => {
  return (
    <section id="contato" className="bg-background py-16 md:py-24 relative">
      <img
        src={linhaDecorativa}
        alt=""
        className="absolute left-6 top-0 bottom-0 h-full opacity-30 hidden xl:block pointer-events-none"
      />
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{data.title}</h2>
            <p className="text-accent font-semibold mb-2">{data.subtitle}</p>
            <p className="text-muted-foreground mb-8 leading-relaxed">{data.description}</p>

            <div className="flex flex-wrap gap-4">
              <a href="tel:+551100000000" className="btn-secondary-dr inline-flex items-center gap-2">
                <Phone size={16} /> {data.ctaDelivery}
              </a>
              <a href="#" className="btn-outline-dr inline-flex items-center gap-2">
                <Mail size={16} /> {data.ctaReserva}
              </a>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={data.image}
              alt="Ambiente da pizzaria"
              loading="lazy"
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contato;
