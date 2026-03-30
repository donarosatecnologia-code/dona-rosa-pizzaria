import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";
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

const DEFAULT_TITLE = "Termos de Uso";

const DEFAULT_INTRO = `<p>Ao acessar e utilizar o site da Dona Rosa Pizzaria, você declara ter lido, compreendido e concordado com estes Termos de Uso. Se não concordar com qualquer disposição, recomendamos que não utilize nossos canais digitais.</p>
<p>O uso continuado do site após eventuais atualizações constitui aceitação das novas condições, na medida permitida pela legislação aplicável.</p>`;

const DEFAULT_S1 = `<h2>1. Alterações nos Termos de Uso</h2>
<p>Podemos revisar estes Termos de Uso a qualquer momento. A versão atualizada será publicada nesta página, com indicação da data de vigência quando aplicável. Recomendamos que você consulte periodicamente este documento.</p>`;

const DEFAULT_S2 = `<h2>2. Uso do Site</h2>
<p>O site destina-se a fornecer informações sobre a Dona Rosa Pizzaria, cardápio, horários, espaços, eventos e formas de contato.</p>
<h3>2.1 Conduta</h3>
<p>Você concorda em utilizar o site de forma lícita, sem violar direitos de terceiros, disseminar conteúdo ilícito ou ofensivo, ou tentar comprometer a segurança ou o funcionamento da plataforma.</p>
<h3>2.2 Disponibilidade</h3>
<p>Não garantimos que o site estará disponível em caráter ininterrupto ou livre de erros. Podemos suspender ou restringir acessos para manutenção ou por motivos de força maior.</p>`;

const DEFAULT_S3 = `<h2>3. Propriedade Intelectual</h2>
<p>Todo o conteúdo disponibilizado no site (textos, marcas, logotipos, imagens, layout e demais materiais) é protegido por direitos de propriedade intelectual da Dona Rosa Pizzaria ou de licenciantes. É vedada a reprodução, distribuição ou uso comercial não autorizado, salvo quando expressamente permitido por lei ou por nós por escrito.</p>`;

const DEFAULT_S4 = `<h2>4. Links para Outros Sites</h2>
<p>O site pode conter links para páginas de terceiros. Não nos responsabilizamos pelo conteúdo, políticas ou práticas desses sites. O acesso é por sua conta e risco, devendo você ler os termos e políticas aplicáveis a cada serviço.</p>`;

const DEFAULT_S5 = `<h2>5. Limitação de Responsabilidade</h2>
<p>Na medida máxima permitida pela lei, a Dona Rosa Pizzaria não se responsabiliza por danos indiretos, incidentais, lucros cessantes ou perdas decorrentes do uso ou da impossibilidade de uso do site, salvo dolo ou culpa grave quando exigidos por lei.</p>
<p>As informações divulgadas no site têm caráter informativo e podem ser alteradas sem aviso prévio. Em caso de divergência entre o site e condições contratuais ou informações prestadas presencialmente, prevalecerão os documentos acordados no canal adequado.</p>`;

const DEFAULT_S6 = `<h2>6. Rescisão</h2>
<p>Podemos encerrar ou suspender o acesso ao site ou a funcionalidades específicas a qualquer momento, com ou sem aviso, em caso de violação destes Termos ou por motivos operacionais ou legais.</p>`;

const DEFAULT_S7 = `<h2>7. Jurisdição</h2>
<p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio da Dona Rosa Pizzaria, salvo disposição legal em contrário em relação a consumidores.</p>`;

const DEFAULT_S8 = `<h2>8. Contato</h2>
<p>Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail <strong>contato@donarosapizzaria.com.br</strong> ou pelos canais informados no site.</p>`;

const DEFAULT_VIGENCIA = `<p><strong>Data de vigência:</strong> março de 2026.</p>
<p>Última atualização: março de 2026.</p>`;

type TermsBodySectionKey = Exclude<(typeof TERMS_CMS_KEYS)[number], "terms-page-title">;

interface LegalTextWrapperProps {
  sectionKey: TermsBodySectionKey;
  label: string;
  fallback: string;
  getText: (key: string, fallback: string) => string;
}

function LegalTextWrapper({ sectionKey, label, fallback, getText }: LegalTextWrapperProps) {
  return (
    <EditableWrapper id={sectionKey} type="textarea" label={label}>
      <RichText
        content={getText(sectionKey, fallback)}
        className="text-[15px] md:text-base leading-relaxed text-foreground/90"
      />
    </EditableWrapper>
  );
}

function TermsOfUsePage() {
  const { getText } = useCmsContents([...TERMS_CMS_KEYS], TERMS_PAGE_KEY);

  return (
    <div className="min-h-screen legal-page-paper terms-page font-montserrat text-foreground">
      <Header />

      <main className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Lateral direita — linha vertical decorativa + ramos (referência ao layout) */}
        <BrandLinhaDecorativa className="absolute right-10 top-28 h-56 w-auto max-w-[5rem] opacity-[0.22] hidden lg:block xl:right-14" />
        <BrandTomilho className="absolute right-4 top-1/2 h-40 w-auto -translate-y-1/2 opacity-[0.18] hidden lg:block xl:h-48" />
        <BrandTomilhoB className="absolute right-16 bottom-32 h-24 w-auto opacity-[0.16] hidden xl:block" />
        <BrandAlecrim className="absolute right-2 top-40 h-28 w-auto opacity-[0.14] hidden xl:block" />
        <BrandTrigo className="absolute left-1 bottom-24 h-32 w-auto opacity-[0.12] hidden lg:block" />
        <BrandLinhaDecorativa className="absolute left-6 top-1/3 h-16 w-auto max-w-[4rem] opacity-[0.14] -rotate-6 hidden 2xl:block" />

        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 text-center md:mb-12">
            <EditableWrapper id="terms-page-title" type="text" label="Título da página">
              <RichText
                as="h1"
                inline
                content={getText("terms-page-title", DEFAULT_TITLE)}
                className="text-3xl font-bold text-primary md:text-4xl"
              />
            </EditableWrapper>
          </header>

          <article className="legal-rich space-y-8 md:space-y-10">
            <LegalTextWrapper sectionKey="terms-intro" label="Introdução e concordância" fallback={DEFAULT_INTRO} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-1" label="1. Alterações nos Termos" fallback={DEFAULT_S1} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-2" label="2. Uso do Site" fallback={DEFAULT_S2} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-3" label="3. Propriedade Intelectual" fallback={DEFAULT_S3} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-4" label="4. Links para outros sites" fallback={DEFAULT_S4} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-5" label="5. Limitação de responsabilidade" fallback={DEFAULT_S5} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-6" label="6. Rescisão" fallback={DEFAULT_S6} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-7" label="7. Jurisdição" fallback={DEFAULT_S7} getText={getText} />
            <LegalTextWrapper sectionKey="terms-section-8" label="8. Contato" fallback={DEFAULT_S8} getText={getText} />
            <LegalTextWrapper sectionKey="terms-vigencia" label="Data de vigência" fallback={DEFAULT_VIGENCIA} getText={getText} />
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default TermsOfUsePage;
