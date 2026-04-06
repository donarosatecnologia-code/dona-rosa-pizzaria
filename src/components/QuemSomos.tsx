import { Home, Users, Leaf, UtensilsCrossed } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import { BrandAlecrim, BrandTomilho } from "@/components/BrandAccents";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsContents } from "@/hooks/useCmsContent";
import RichText from "@/components/RichText";
import { siteContainerClass } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = ["home", "users", "leaf", "utensils"] as const;

const iconMap: Record<(typeof FEATURE_ICONS)[number], React.ReactNode> = {
  home: <Home className="text-primary" size={28} />,
  users: <Users className="text-primary" size={28} />,
  leaf: <Leaf className="text-primary" size={28} />,
  utensils: <UtensilsCrossed className="text-primary" size={28} />,
};

const QuemSomos = () => {
  const { getText, getLink } = useCmsContents(
    [
      "home-quemsmos-title",
      "home-quemsmos-desc",
      "home-quemsmos-feat-0",
      "home-quemsmos-feat-1",
      "home-quemsmos-feat-2",
      "home-quemsmos-feat-3",
      "home-quemsmos-cta",
    ],
    "home",
  );

  const quemSomosTitle = getText("home-quemsmos-title");
  const quemSomosDescription = getText("home-quemsmos-desc");
  const cta = getLink("home-quemsmos-cta");

  return (
    <section id="quem-somos" className="relative overflow-hidden bg-background py-16 md:py-24">
      <BrandAlecrim className="absolute left-0 top-12 h-28 w-auto opacity-[0.18] hidden md:block" />
      <BrandTomilho className="absolute right-0 bottom-16 h-20 w-auto opacity-[0.18] hidden lg:block" />
      <div className={cn(siteContainerClass, "relative z-10 text-center")}>
        <EditableWrapper id="home-quemsmos-title" type="text" label="Título Quem Somos">
          {quemSomosTitle ? (
            <RichText as="h2" inline content={quemSomosTitle} className="text-3xl md:text-4xl font-bold text-foreground mb-6" />
          ) : (
            <CmsPlaceholder label="Título Quem Somos" className="mb-6" />
          )}
        </EditableWrapper>
        <EditableWrapper id="home-quemsmos-desc" type="textarea" label="Descrição Quem Somos">
          {quemSomosDescription ? (
            <RichText content={quemSomosDescription} className="text-muted-foreground mb-10 w-full leading-relaxed space-y-3" />
          ) : (
            <CmsPlaceholder label="Descrição" className="mb-10 w-full" />
          )}
        </EditableWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
          {FEATURE_ICONS.map((iconKey, index) => {
            const featText = getText(`home-quemsmos-feat-${index}`);
            return (
              <EditableWrapper key={index} id={`home-quemsmos-feat-${index}`} type="text" label={`Feature ${index + 1}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">{iconMap[iconKey]}</div>
                  {featText ? (
                    <RichText content={featText} className="text-sm text-muted-foreground leading-relaxed space-y-2" />
                  ) : (
                    <CmsPlaceholder label={`Texto do destaque ${index + 1}`} className="flex-1 text-left" />
                  )}
                </div>
              </EditableWrapper>
            );
          })}
        </div>

        <div className="flex justify-center">
          <EditableWrapper id="home-quemsmos-cta" type="link" label="Botão Quem Somos">
            {cta.label && cta.url ? (
              <a href={cta.url} className="btn-secondary-dr inline-block">
                <RichText as="span" inline content={cta.label} />
              </a>
            ) : (
              <CmsPlaceholder label="Botão (título e URL)" className="inline-block min-w-[10rem]" />
            )}
          </EditableWrapper>
        </div>
      </div>
    </section>
  );
};

export default QuemSomos;
