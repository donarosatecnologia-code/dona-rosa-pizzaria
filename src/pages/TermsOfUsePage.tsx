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

const TERMS_PAGE_KEY = "termos-de-uso";

const TERMS_CMS_KEYS = [
  "terms-page-title",
  "terms-intro",
  "terms-section-1",
  "terms-section-2",
  "terms-section-3",
  "terms-section-4",
  "terms-section-5",
  "terms-section-6",
  "terms-section-7",
  "terms-section-8",
  "terms-vigencia",
] as const;

type TermsBodySectionKey = Exclude<(typeof TERMS_CMS_KEYS)[number], "terms-page-title">;

interface LegalTextWrapperProps {
  sectionKey: TermsBodySectionKey;
  label: string;
  getText: (key: string) => string;
}

function LegalTextWrapper({ sectionKey, label, getText }: LegalTextWrapperProps) {
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

function TermsOfUsePage() {
  const shell = useSiteShellReady();
  const { getText, isPending, isError } = useCmsContents([...TERMS_CMS_KEYS], TERMS_PAGE_KEY);

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

  const title = getText("terms-page-title");

  return (
    <div className="min-h-screen legal-page-paper terms-page font-montserrat text-foreground">
      <Header />

      <main className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <BrandLinhaDecorativa className="absolute right-10 top-28 h-56 w-auto max-w-[5rem] opacity-[0.22] hidden lg:block xl:right-14" />
        <BrandTomilho className="absolute right-4 top-1/2 h-40 w-auto -translate-y-1/2 opacity-[0.18] hidden lg:block xl:h-48" />
        <BrandTomilhoB className="absolute right-16 bottom-32 h-24 w-auto opacity-[0.16] hidden xl:block" />
        <BrandAlecrim className="absolute right-2 top-40 h-28 w-auto opacity-[0.14] hidden xl:block" />
        <BrandTrigo className="absolute left-1 bottom-24 h-32 w-auto opacity-[0.12] hidden lg:block" />
        <BrandLinhaDecorativa className="absolute left-6 top-1/3 h-16 w-auto max-w-[4rem] opacity-[0.14] -rotate-6 hidden 2xl:block" />

        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 text-center md:mb-12">
            <EditableWrapper id="terms-page-title" type="text" label="Título da página">
              {title ? (
                <RichText as="h1" inline content={title} className="text-3xl font-bold text-primary md:text-4xl" />
              ) : (
                <CmsPlaceholder label="Título dos termos" className="py-6" />
              )}
            </EditableWrapper>
          </header>

          <article className="legal-rich space-y-8 md:space-y-10">
            <LegalTextWrapper sectionKey="terms-intro" label="Introdução e concordância" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-1" label="1. Alterações nos Termos" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-2" label="2. Uso do Site" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-3" label="3. Propriedade Intelectual" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-4" label="4. Links para outros sites" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-5" label="5. Limitação de responsabilidade" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-6" label="6. Rescisão" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-7" label="7. Jurisdição" getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-8" label="8. Contato" getText={getText} />
            <LegalTextWrapper sectionKey="terms-vigencia" label="Data de vigência" getText={getText} />
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default TermsOfUsePage;
