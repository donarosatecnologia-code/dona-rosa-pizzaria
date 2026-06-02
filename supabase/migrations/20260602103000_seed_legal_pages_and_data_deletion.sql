-- Seed de páginas jurídicas: política de privacidade, termos de uso e exclusão de dados.
-- Insere apenas seções ausentes (não sobrescreve conteúdo já publicado pela Rosa).

insert into public.page_contents (page_key, section_key, title, content, subtitle, is_active)
select v.page_key, v.section_key, v.title, v.content, v.subtitle, true
from (
  values
    -- Política de privacidade
    ('politica-privacidade', 'privacy-page-title', 'Política de Privacidade'::text, null::text, null::text),
    (
      'politica-privacidade',
      'privacy-intro',
      null::text,
      '<p>Esta Política de Privacidade explica como a <strong>Dona Rosa Pizzaria</strong> trata dados pessoais quando você visita nosso site, entra em contato conosco ou conversa conosco pelo WhatsApp.</p><p>Ao usar o site, você declara ter lido esta política. Se não concordar, pedimos que não utilize nossos canais digitais.</p><p><strong>Controladora:</strong> Dona Rosa Pizzaria — São Paulo, SP. Dúvidas sobre privacidade: <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a>.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-collected',
      null::text,
      '<p>Podemos tratar, conforme o canal utilizado:</p><ul><li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas e preferências salvas no seu dispositivo (por exemplo, consentimento de cookies).</li><li><strong>Dados de contato:</strong> nome, telefone, e-mail e mensagens enviadas por formulários do site ou WhatsApp.</li><li><strong>Dados de pedido e atendimento:</strong> informações necessárias para delivery, reservas, dúvidas sobre cardápio ou promoções autorizadas por você.</li></ul><p>Não solicitamos dados sensíveis pelo site. Evite enviar informações desnecessárias nas mensagens.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-cookies',
      null::text,
      '<p>Utilizamos cookies e armazenamento local do navegador para:</p><ul><li>Registrar se você aceitou o uso de cookies de medição;</li><li>Medir visitas e desempenho do site por meio do Google Tag Manager, somente após o seu consentimento.</li></ul><p>Você pode recusar cookies não essenciais fechando o aviso sem aceitar ou removendo os dados do site nas configurações do navegador. Nesse caso, o banner poderá ser exibido novamente na próxima visita.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-whatsapp',
      null::text,
      '<p>Quando você inicia uma conversa pelo botão de WhatsApp do site, pedimos nome, telefone e mensagem, além da confirmação dos Termos de Uso e desta Política.</p><p>As mensagens são processadas pela plataforma WhatsApp (Meta) e armazenadas em nossos sistemas de atendimento para responder você, registrar pedidos e manter histórico de conversas conforme a legislação aplicável.</p><p>Para solicitar exclusão ou atualização de dados tratados nesse canal, consulte nossa página de <a href="/exclusao-de-dados">Exclusão de Dados</a>.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-why',
      null::text,
      '<p>Tratamos dados pessoais para:</p><ul><li>Responder contatos, pedidos, reservas e dúvidas;</li><li>Prestar atendimento pelo WhatsApp;</li><li>Melhorar o site e a experiência de navegação (com seu consentimento para cookies de medição);</li><li>Cumprir obrigações legais e exercer direitos em processos administrativos ou judiciais, quando necessário.</li></ul><p>As bases legais incluem execução de contrato ou procedimentos preliminares, legítimo interesse (com medidas de transparência e minimização) e consentimento, quando exigido.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-rights',
      null::text,
      '<p>Nos termos da Lei Geral de Proteção de Dados (LGPD), você pode solicitar:</p><ul><li>Confirmação da existência de tratamento;</li><li>Acesso, correção ou atualização de dados;</li><li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li><li>Portabilidade, quando aplicável;</li><li>Revogação de consentimento e informações sobre compartilhamentos.</li></ul><p>Para exercer seus direitos, acesse <a href="/exclusao-de-dados">Exclusão de Dados</a> ou escreva para <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a>.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-links',
      null::text,
      '<p>Nosso site pode conter links para redes sociais ou serviços de terceiros (por exemplo, WhatsApp e ferramentas de medição). Ao sair do nosso site, aplicam-se as políticas desses serviços. Recomendamos a leitura antes de compartilhar dados.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-security',
      null::text,
      '<p>Adotamos medidas técnicas e organizacionais para proteger dados pessoais, como controle de acesso, criptografia em trânsito (HTTPS) e provedores com padrões de segurança reconhecidos.</p><p>Nenhum sistema é totalmente imune a incidentes. Se identificarmos risco relevante aos seus dados, buscaremos adotar medidas de mitigação e comunicação conforme a lei.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-legal',
      null::text,
      '<p>Esta política pode ser atualizada para refletir mudanças legais ou novas funcionalidades do site. A versão vigente estará sempre publicada nesta página, com indicação de data quando aplicável.</p>'::text,
      null::text
    ),
    (
      'politica-privacidade',
      'privacy-contact',
      null::text,
      '<p><strong>Encarregado / canal de privacidade:</strong> Dona Rosa Pizzaria<br>E-mail: <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a><br>Endereço: Rua Caminha de Amorim, 242 — Vila Madalena, São Paulo — SP, CEP 05451-020</p>'::text,
      null::text
    ),

    -- Termos de uso
    ('termos-de-uso', 'terms-page-title', 'Termos de Uso'::text, null::text, null::text),
    (
      'termos-de-uso',
      'terms-intro',
      null::text,
      '<p>Estes Termos de Uso regulam o acesso e a utilização do site da <strong>Dona Rosa Pizzaria</strong>. Ao navegar, enviar formulários ou iniciar conversas pelo WhatsApp a partir do site, você concorda com estas condições.</p><p>Se não concordar, interrompa o uso do site.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-1',
      null::text,
      '<p>Podemos alterar estes Termos a qualquer momento. A versão publicada nesta página prevalece. O uso continuado após alterações significa concordância com a nova versão.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-2',
      null::text,
      '<p>O site destina-se a informar sobre a Dona Rosa, cardápio, contatos, eventos e demais conteúdos institucionais. Você concorda em:</p><ul><li>Utilizar o site de forma lícita e respeitosa;</li><li>Não tentar comprometer a segurança, disponibilidade ou integridade do site;</li><li>Fornecer informações verdadeiras quando entrar em contato conosco.</li></ul>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-3',
      null::text,
      '<p>Textos, imagens, logotipos, layout e demais conteúdos do site são de propriedade da Dona Rosa Pizzaria ou licenciados para uso. É proibida a reprodução sem autorização prévia, salvo citações breves com indicação da fonte.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-4',
      null::text,
      '<p>Links externos podem direcionar a serviços de terceiros. Não nos responsabilizamos por conteúdo, políticas ou práticas de sites ou aplicativos que não operamos.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-5',
      null::text,
      '<p>O site é fornecido &quot;no estado em que se encontra&quot;. Empregamos esforços razoáveis para manter informações atualizadas, mas cardápio, preços, horários e promoções podem variar. Confirme detalhes de pedidos e reservas pelos canais oficiais de atendimento.</p><p>Na extensão permitida pela lei, não nos responsabilizamos por danos indiretos decorrentes do uso ou impossibilidade de uso do site.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-6',
      null::text,
      '<p>Podemos suspender ou encerrar o acesso ao site para manutenção, segurança ou descumprimento destes Termos, sem prejuízo de medidas legais cabíveis.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-7',
      null::text,
      '<p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo — SP, salvo disposição legal em contrário aplicável ao consumidor.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-section-8',
      null::text,
      '<p>Dúvidas sobre estes Termos: <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a> ou página de <a href="/contato">Contato</a>.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-whatsapp',
      null::text,
      '<p>Ao usar o formulário de WhatsApp do site, você declara ter lido e concordado com estes Termos e com a <a href="/politica-de-privacidade">Política de Privacidade</a>.</p><p>Você autoriza o tratamento dos dados informados (nome, telefone e mensagem) para atendimento. A conversa continua na plataforma WhatsApp, regida também pelos termos da Meta.</p><p>Mensagens promocionais ou informativas só serão enviadas quando houver base legal e, quando necessário, consentimento prévio.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-cookies',
      null::text,
      '<p>O site exibe aviso sobre cookies. Cookies essenciais ao funcionamento básico podem ser utilizados; cookies de medição (Google Tag Manager) são ativados somente após o seu aceite no banner.</p><p>Você pode revogar o consentimento apagando os dados de navegação do site. Detalhes estão na Política de Privacidade.</p>'::text,
      null::text
    ),
    (
      'termos-de-uso',
      'terms-vigencia',
      null::text,
      '<p><strong>Vigência:</strong> junho de 2026.</p>'::text,
      null::text
    ),

    -- Exclusão de dados
    ('exclusao-de-dados', 'deletion-page-title', 'Exclusão de Dados'::text, null::text, null::text),
    (
      'exclusao-de-dados',
      'deletion-intro',
      null::text,
      '<p>Esta página explica como você pode solicitar a <strong>exclusão</strong> ou <strong>atualização</strong> dos seus dados pessoais tratados pela Dona Rosa Pizzaria, conforme a Lei Geral de Proteção de Dados (LGPD).</p><p>Queremos que o processo seja simples e transparente.</p>'::text,
      null::text
    ),
    (
      'exclusao-de-dados',
      'deletion-rights',
      null::text,
      '<p>Você pode pedir:</p><ul><li>Exclusão de dados desnecessários ou tratados com base no consentimento revogado;</li><li>Correção de dados incompletos ou desatualizados;</li><li>Informações sobre como seus dados são utilizados.</li></ul><p>Em alguns casos, a lei exige que mantenhamos registros mínimos (por exemplo, por obrigação fiscal ou defesa em processos). Quando isso ocorrer, explicaremos o motivo na resposta à sua solicitação.</p>'::text,
      null::text
    ),
    (
      'exclusao-de-dados',
      'deletion-how',
      null::text,
      '<p><strong>Como solicitar:</strong></p><ol><li>Envie um e-mail para <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a> com o assunto &quot;Exclusão de dados&quot;;</li><li>Informe nome completo e telefone ou e-mail usados no contato conosco;</li><li>Descreva o que deseja (exclusão total, correção ou apenas informações).</li></ol><p>Se preferir, utilize o WhatsApp oficial informado na página de <a href="/contato">Contato</a>, identificando-se e pedindo exclusão de dados.</p>'::text,
      null::text
    ),
    (
      'exclusao-de-dados',
      'deletion-whatsapp',
      null::text,
      '<p>Se você conversou conosco pelo WhatsApp, podemos tratar nome, número de telefone, histórico de mensagens e informações relacionadas ao atendimento.</p><p>Ao solicitar exclusão, analisaremos conversas e registros associados ao seu número. Parte dos dados pode permanecer anonimizada em logs de segurança pelo tempo estritamente necessário.</p>'::text,
      null::text
    ),
    (
      'exclusao-de-dados',
      'deletion-deadline',
      null::text,
      '<p>Responderemos sua solicitação em prazo razoável, conforme a LGPD — em geral em até <strong>15 dias</strong>, podendo ser prorrogado em casos complexos, com comunicação a você.</p><p>Após a exclusão confirmada, dados em backups rotativos serão removidos ou anonimizados no ciclo normal de retenção dos sistemas.</p>'::text,
      null::text
    ),
    (
      'exclusao-de-dados',
      'deletion-contact',
      null::text,
      '<p><strong>Canal de privacidade</strong><br>Dona Rosa Pizzaria<br>E-mail: <a href="mailto:contato@donarosa.com.br">contato@donarosa.com.br</a><br>Endereço: Rua Caminha de Amorim, 242 — Vila Madalena, São Paulo — SP</p><p>Consulte também nossa <a href="/politica-de-privacidade">Política de Privacidade</a>.</p>'::text,
      null::text
    )
) as v (page_key, section_key, title, content, subtitle)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);

-- Marca data de publicação inicial nas seções jurídicas recém-inseridas.
update public.page_contents
set content_published_at = coalesce(content_published_at, now())
where page_key in ('politica-privacidade', 'termos-de-uso', 'exclusao-de-dados')
  and content_published_at is null
  and (content is not null or title is not null);
