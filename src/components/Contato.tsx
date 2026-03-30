import { Phone, Mail } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandLinhaDecorativa, BrandTrigo } from "@/components/BrandAccents";
import ambiente from "@/assets/ambiente-1.jpg";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";

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
  description: "Ligue e fale com um dos nossos atendentes para pedir o seu delivery ou reservar uma mesa!",
  ctaDelivery: "Delivery",
  ctaReserva: "Reservar uma mesa",
  image: ambiente,
};

const Contato = ({ data = defaultData }: { data?: ContatoData }) => {
  const { getText, getLink } = useCmsContents([
    "home-contato-title",
    "home-contato-subtitle",
    "home-contato-desc",
    "home-contato-cta-delivery",
    "home-contato-cta-reserva",
  ], "home");
  const contatoImage = useCmsImage("home-contato-img", data.image);
  const contatoTitle = getText("home-contato-title", data.title);
  const contatoSubtitle = getText("home-contato-subtitle", data.subtitle);
  const contatoDescription = getText("home-contato-desc", data.description);
  const deliveryCta = getLink("home-contato-cta-delivery", data.ctaDelivery, "tel:+551100000000");
  const reservaCta = getLink("home-contato-cta-reserva", data.ctaReserva, "/contato");

  return (
    <section id="contato" className="relative overflow-hidden bg-background py-16 md:py-24">
      <BrandTrigo className="absolute right-0 top-1/4 h-36 w-auto opacity-[0.18] hidden xl:block" />
      <BrandLinhaDecorativa className="absolute bottom-8 left-4 h-10 w-auto opacity-20 hidden lg:block" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div>
            <EditableWrapper id="home-contato-title" type="text" label="Título Contato">
              <RichText as="h2" inline content={contatoTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
            </EditableWrapper>
            <EditableWrapper id="home-contato-subtitle" type="text" label="Subtítulo Contato">
              <RichText as="p" inline content={contatoSubtitle} className="text-accent font-semibold mb-2" />
            </EditableWrapper>
            <EditableWrapper id="home-contato-desc" type="textarea" label="Descrição Contato">
              <RichText content={contatoDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
            </EditableWrapper>

            <div className="flex flex-wrap gap-4">
              <EditableWrapper id="home-contato-cta-delivery" type="link" label="Botão Delivery">
                <a href={deliveryCta.url} className="btn-secondary-dr inline-flex items-center gap-2">
                  <Phone size={16} /> <RichText as="span" inline content={deliveryCta.label} />
                </a>
              </EditableWrapper>
              <EditableWrapper id="home-contato-cta-reserva" type="link" label="Botão Reservar Mesa">
                <a href={reservaCta.url} className="btn-outline-dr inline-flex items-center gap-2">
                  <Mail size={16} /> <RichText as="span" inline content={reservaCta.label} />
                </a>
              </EditableWrapper>
            </div>
          </div>

          <EditableWrapper id="home-contato-img" type="image" label="Imagem Contato">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={contatoImage} alt="Ambiente da pizzaria" loading="lazy" className="w-full h-64 md:h-80 object-cover" />
            </div>
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
};

export default Contato;
