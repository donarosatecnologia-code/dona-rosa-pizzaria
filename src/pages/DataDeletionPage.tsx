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

export const DATA_DELETION_PAGE_KEY = "exclusao-de-dados";

export const DATA_DELETION_CMS_KEYS = [
  "deletion-page-title",
  "deletion-intro",
  "deletion-rights",
  "deletion-how",
  "deletion-whatsapp",
  "deletion-deadline",
  "deletion-contact",
] as const;

type DeletionBodySectionKey = Exclude<(typeof DATA_DELETION_CMS_KEYS)[number], "deletion-page-title">;

interface LegalContentSectionProps {
  sectionKey: DeletionBodySectionKey;
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

function DataDeletionPage() {
  const shell = useSiteShellReady();
  const { getText, isPending, isError } = useCmsContents([...DATA_DELETION_CMS_KEYS], DATA_DELETION_PAGE_KEY);

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

  const title = getText("deletion-page-title");

  return (
    <div className="min-h-screen legal-page-paper font-sans text-foreground">
      <Header />

      <main className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <BrandAlecrim className="absolute left-0 top-36 h-44 w-auto opacity-[0.2] hidden lg:block xl:h-52" />
        <BrandTomilhoB className="absolute right-2 top-40 h-28 w-auto opacity-[0.16] hidden xl:block" />
        <BrandTrigo className="absolute left-1 bottom-32 h-36 w-auto opacity-[0.15] hidden lg:block" />
        <BrandTomilho className="absolute right-0 bottom-20 h-32 w-auto opacity-[0.14] hidden lg:block" />
        <BrandLinhaDecorativa className="absolute left-4 top-1/2 h-24 w-auto max-w-[4rem] opacity-[0.18] -translate-y-1/2 -rotate-6 hidden 2xl:block" />

        <div className={cn(siteContainerClass, "relative z-10")}>
          <header className="mb-10 flex justify-center md:mb-12">
            <EditableWrapper id="deletion-page-title" type="text" label="Título da página">
              {title ? (
                <RichText as="h1" inline content={title} className="text-3xl font-bold text-primary md:text-4xl" />
              ) : (
                <CmsPlaceholder label="Título da página de exclusão" className="py-6" />
              )}
            </EditableWrapper>
          </header>

          <article className="legal-rich w-full space-y-8 text-justify md:space-y-10">
            <LegalContentSection sectionKey="deletion-intro" label="Introdução" getText={getText} />
            <LegalContentSection sectionKey="deletion-rights" label="Seus direitos" getText={getText} />
            <LegalContentSection sectionKey="deletion-how" label="Como solicitar" getText={getText} />
            <LegalContentSection sectionKey="deletion-whatsapp" label="Dados no WhatsApp" getText={getText} />
            <LegalContentSection sectionKey="deletion-deadline" label="Prazos" getText={getText} />
            <LegalContentSection sectionKey="deletion-contact" label="Contato" getText={getText} />
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default DataDeletionPage;
