import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import EditableWrapper from "@/components/EditableWrapper";
import RichText from "@/components/RichText";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTomilhoB, BrandTrigo } from "@/components/BrandAccents";
import { useCmsContents } from "@/hooks/useCmsContent";

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

const DEFAULT_TITLE = "Política de Privacidade";

const DEFAULT_INTRO = `<p>A Dona Rosa Pizzaria respeita a privacidade dos visitantes do site e dos clientes que utilizam nossos serviços. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
<p><strong>Definições:</strong> “Dados pessoais” são informações relacionadas a pessoa natural identificada ou identificável; “titular” é você; “controlador” é a Dona Rosa Pizzaria na qualidade de responsável pelas decisões referentes ao tratamento desses dados.</p>`;

const DEFAULT_COLLECTED = `<h2>Estas são as informações pessoais que coletamos:</h2>
<p>Podemos coletar, conforme o caso:</p>
<ul>
<li><strong>Dados de identificação e contato:</strong> nome, telefone, e-mail e endereço quando você preenche formulários, faz reservas, pedidos ou cadastros.</li>
<li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas e tempo de permanência, por meio de cookies ou ferramentas de análise, quando aplicável.</li>
<li><strong>Dados fornecidos voluntariamente:</strong> mensagens, preferências ou informações enviadas por WhatsApp, e-mail ou canais de atendimento.</li>
</ul>`;

const DEFAULT_WHY = `<h2>Por que processamos seus dados?</h2>
<p>Tratamos dados pessoais para:</p>
<ul>
<li>Atender pedidos, reservas e solicitações;</li>
<li>Comunicar informações sobre produtos, serviços e horários de funcionamento;</li>
<li>Melhorar a experiência no site e a segurança das operações;</li>
<li>Cumprir obrigações legais e regulatórias;</li>
<li>Exercer direitos em processos administrativos ou judiciais, quando necessário.</li>
</ul>
<p>O tratamento fundamenta-se em execução de contrato, legítimo interesse, consentimento quando exigido e cumprimento de obrigação legal, conforme cada hipótese.</p>`;

const DEFAULT_RIGHTS = `<h2>Seus direitos:</h2>
<p>Como titular, você pode solicitar, conforme a LGPD:</p>
<ol>
<li><strong>Confirmação</strong> da existência de tratamento;</li>
<li><strong>Acesso</strong> aos dados;</li>
<li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados;</li>
<li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários ou tratados em desconformidade;</li>
<li><strong>Portabilidade</strong>, nas hipóteses previstas em lei;</li>
<li><strong>Eliminação</strong> dos dados tratados com consentimento, quando aplicável;</li>
<li><strong>Informação</strong> sobre entidades com as quais compartilhamos dados;</li>
<li><strong>Revogação do consentimento</strong>, quando o tratamento se basear nele.</li>
</ol>
<p>Para exercer seus direitos, utilize os canais de contato indicados ao final desta página. Responderemos no prazo legal.</p>`;

const DEFAULT_LINKS = `<h2>Links para outros sites:</h2>
<p>Nosso site pode conter links para páginas de terceiros (redes sociais, parceiros ou ferramentas). Não somos responsáveis pelas práticas de privacidade desses sites; recomendamos a leitura das respectivas políticas antes de fornecer dados.</p>`;

const DEFAULT_SECURITY = `<h2>Segurança das informações:</h2>
<p>Adotamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais contra acessos não autorizados, perda ou alteração indevida. Nenhum sistema é totalmente seguro; em caso de incidente relevante, comunicaremos conforme a legislação aplicável.</p>`;

const DEFAULT_LEGAL = `<h2>Declaração legal:</h2>
<p>Esta política pode ser atualizada periodicamente. A data da última revisão será indicada quando aplicável. O uso continuado do site após alterações constitui ciência das novas condições, salvo quando for exigido novo consentimento.</p>`;

const DEFAULT_CONTACT = `<h2>Informações de contato:</h2>
<p>Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos, entre em contato:</p>
<p><strong>E-mail:</strong> donarosapizzaria@gmail.com</p>
<p><strong>Telefones:</strong> (11) 2389-0220 e (11) 3021-7878</p>
<p><strong>Endereço:</strong> Rua Caminho de Amorim, 242 – Alto de Pinheiros (Vila Jataí), São Paulo – SP, 05451-020</p>`;

type PrivacyBodySectionKey = Exclude<(typeof PRIVACY_CMS_KEYS)[number], "privacy-page-title">;

interface LegalContentSectionProps {
  sectionKey: PrivacyBodySectionKey;
  label: string;
  fallback: string;
  getText: (key: string, fallback: string) => string;
}

function LegalContentSection({ sectionKey, label, fallback, getText }: LegalContentSectionProps) {
  return (
    <EditableWrapper id={sectionKey} type="textarea" label={label}>
      <RichText
        content={getText(sectionKey, fallback)}
        className="text-[15px] md:text-base leading-relaxed text-foreground/90"
      />
    </EditableWrapper>
  );
}

function PrivacyPolicyPage() {
  const { getText } = useCmsContents([...PRIVACY_CMS_KEYS], PRIVACY_PAGE_KEY);

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

        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 text-center md:mb-12">
            <EditableWrapper id="privacy-page-title" type="text" label="Título da página">
              <RichText
                as="h1"
                inline
                content={getText("privacy-page-title", DEFAULT_TITLE)}
                className="text-3xl font-bold text-primary md:text-4xl"
              />
            </EditableWrapper>
          </header>

          <article className="legal-rich space-y-8 md:space-y-10">
            <LegalContentSection
              sectionKey="privacy-intro"
              label="Introdução e definições"
              fallback={DEFAULT_INTRO}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-collected"
              label="Informações pessoais que coletamos"
              fallback={DEFAULT_COLLECTED}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-why"
              label="Por que processamos seus dados?"
              fallback={DEFAULT_WHY}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-rights"
              label="Seus direitos (LGPD)"
              fallback={DEFAULT_RIGHTS}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-links"
              label="Links para outros sites"
              fallback={DEFAULT_LINKS}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-security"
              label="Segurança das informações"
              fallback={DEFAULT_SECURITY}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-legal"
              label="Declaração legal"
              fallback={DEFAULT_LEGAL}
              getText={getText}
            />
            <LegalContentSection
              sectionKey="privacy-contact"
              label="Informações de contato"
              fallback={DEFAULT_CONTACT}
              getText={getText}
            />
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default PrivacyPolicyPage;
