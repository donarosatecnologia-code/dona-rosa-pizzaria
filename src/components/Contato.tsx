import { Phone, Mail } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandLinhaDecorativa, BrandTrigo } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { siteContainerClass } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const Contato = () => {
  const { getText, getLink } = useCmsContents(
    ["home-contato-title", "home-contato-subtitle", "home-contato-desc", "home-contato-cta-delivery", "home-contato-cta-reserva"],
    "home",
  );
  const contatoImage = useCmsImage("home-contato-img");
  const contatoTitle = getText("home-contato-title");
  const contatoSubtitle = getText("home-contato-subtitle");
  const contatoDescription = getText("home-contato-desc");
  const deliveryCta = getLink("home-contato-cta-delivery");
  const reservaCta = getLink("home-contato-cta-reserva");

  return (
    <section id="contato" className="relative overflow-hidden bg-background py-16 md:py-24">
      <BrandTrigo className="absolute right-0 top-1/4 h-36 w-auto opacity-[0.18] hidden xl:block" />
      <BrandLinhaDecorativa className="absolute bottom-8 left-4 h-10 w-auto opacity-20 hidden lg:block" />
      <div className={cn(siteContainerClass, "relative z-10")}>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <EditableWrapper id="home-contato-title" type="text" label="Título Contato">
              {contatoTitle ? (
                <RichText as="h2" inline content={contatoTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-4" />
              ) : (
                <CmsPlaceholder label="Título do bloco contato" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-contato-subtitle" type="text" label="Subtítulo Contato">
              {contatoSubtitle ? (
                <RichText as="p" inline content={contatoSubtitle} className="text-accent font-semibold mb-2" />
              ) : (
                <CmsPlaceholder label="Subtítulo" className="my-2" />
              )}
            </EditableWrapper>
            <EditableWrapper id="home-contato-desc" type="textarea" label="Descrição Contato">
              {contatoDescription ? (
                <RichText content={contatoDescription} className="text-muted-foreground mb-8 leading-relaxed space-y-3" />
              ) : (
                <CmsPlaceholder label="Descrição" className="mb-8" />
              )}
            </EditableWrapper>

            <div className="flex flex-wrap gap-4">
              <EditableWrapper id="home-contato-cta-delivery" type="link" label="Botão Delivery">
                {deliveryCta.label && deliveryCta.url ? (
                  <a href={deliveryCta.url} className="btn-secondary-dr inline-flex items-center gap-2">
                    <Phone size={16} /> <RichText as="span" inline content={deliveryCta.label} />
                  </a>
                ) : (
                  <CmsPlaceholder label="CTA delivery (título e URL)" className="inline-block min-w-[10rem]" />
                )}
              </EditableWrapper>
              <EditableWrapper id="home-contato-cta-reserva" type="link" label="Botão Reservar Mesa">
                {reservaCta.label && reservaCta.url ? (
                  <a href={reservaCta.url} className="btn-outline-dr inline-flex items-center gap-2">
                    <Mail size={16} /> <RichText as="span" inline content={reservaCta.label} />
                  </a>
                ) : (
                  <CmsPlaceholder label="CTA reserva (título e URL)" className="inline-block min-w-[10rem]" />
                )}
              </EditableWrapper>
            </div>
          </div>

          <EditableWrapper id="home-contato-img" type="image" label="Imagem Contato">
            <div className="rounded-2xl overflow-hidden shadow-lg min-h-[16rem] flex items-center justify-center bg-muted/20">
              {contatoImage ? (
                <img src={contatoImage} alt="" loading="lazy" className="w-full h-64 md:h-80 object-cover" />
              ) : (
                <CmsPlaceholder label="Imagem do bloco contato" className="w-full border-0" />
              )}
            </div>
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
};

export default Contato;
