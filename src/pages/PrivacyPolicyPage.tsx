import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { useCmsContents } from "@/hooks/useCmsContent";
import { siteContainerClass } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const PRIVACY_PAGE_KEY = "politica-privacidade";

const PRIVACY_CMS_KEYS = [
  "privacy-page-title",
  "privacy-intro",
  "privacy-collected",
  "privacy-why",
  "privacy-rights",
  "privacy-links",
  "privacy-security",
  "privacy-legal",
  "privacy-contact",
] as const;

type PrivacyBodySectionKey = Exclude<(typeof PRIVACY_CMS_KEYS)[number], "privacy-page-title">;

interface LegalContentSectionProps {
  sectionKey: PrivacyBodySectionKey;
  label: string;
  getText: (key: string) => string;
}

function LegalContentSection({ sectionKey, label, getText }: LegalContentSectionProps) {
  const body = getText(sectionKey);
  return (
    <EditableWrapper id={sectionKey} type="textarea" label={label}>
      {body ? (
        <RichText content={body} className="text-[15px] md:text-base leading-relaxed text-foreground/90" />
      ) : (
        <CmsPlaceholder label="Texto jurídico não publicado" />
      )}
    </EditableWrapper>
  );
}

function PrivacyPolicyPage() {
  const shell = useSiteShellReady();
  const { getText, isPending, isError } = useCmsContents([...PRIVACY_CMS_KEYS], PRIVACY_PAGE_KEY);

  if (shell.isPending || isPending) {
    return <LoadingScreen message="Carregando conteúdo…" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>
      </div>
    );
  }

  const title = getText("privacy-page-title");

  return (
    <div className="min-h-screen legal-page-paper font-sans text-foreground">
      <Header />

      <main className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <BrandAlecrim className="absolute left-0 top-36 h-44 w-auto opacity-[0.2] hidden lg:block xl:h-52" />
        <BrandTomilhoB className="absolute right-2 top-40 h-28 w-auto opacity-[0.16] hidden xl:block" />
        <BrandTrigo className="absolute left-1 bottom-32 h-36 w-auto opacity-[0.15] hidden lg:block" />
        <BrandTomilho className="absolute right-0 bottom-20 h-32 w-auto opacity-[0.14] hidden lg:block" />
        <BrandLinhaDecorativa className="absolute left-4 top-1/2 h-24 w-auto max-w-[4rem] opacity-[0.18] -translate-y-1/2 -rotate-6 hidden 2xl:block" />
        <BrandLinhaDecorativa className="absolute right-6 top-1/3 h-20 w-auto max-w-[3.5rem] opacity-[0.16] rotate-6 hidden 2xl:block" />

        <div className={cn(siteContainerClass, "relative z-10")}>
          <header className="mb-10 flex justify-center md:mb-12">
            <EditableWrapper id="privacy-page-title" type="text" label="Título da página">
              {title ? (
                <RichText as="h1" inline content={title} className="text-3xl font-bold text-primary md:text-4xl" />
              ) : (
                <CmsPlaceholder label="Título da política" className="py-6" />
              )}
            </EditableWrapper>
          </header>

          <article className="legal-rich w-full space-y-8 text-justify md:space-y-10">
            <LegalContentSection sectionKey="privacy-intro" label="Introdução e definições" getText={getText} />
            <LegalContentSection sectionKey="privacy-collected" label="Informações pessoais que coletamos" getText={getText} />
            <LegalContentSection sectionKey="privacy-why" label="Por que processamos seus dados?" getText={getText} />
            <LegalContentSection sectionKey="privacy-rights" label="Seus direitos (LGPD)" getText={getText} />
            <LegalContentSection sectionKey="privacy-links" label="Links para outros sites" getText={getText} />
            <LegalContentSection sectionKey="privacy-security" label="Segurança das informações" getText={getText} />
            <LegalContentSection sectionKey="privacy-legal" label="Declaração legal" getText={getText} />
            <LegalContentSection sectionKey="privacy-contact" label="Informações de contato" getText={getText} />
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default PrivacyPolicyPage;
