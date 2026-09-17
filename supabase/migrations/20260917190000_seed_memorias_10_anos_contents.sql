-- Seed CMS da página Memórias — campanha 10 anos de forno (março).
-- Idempotente: só insere section_keys que ainda não existem.
-- Atualiza o título placeholder "Memórias" se ainda estiver assim.

update public.page_contents
set title = '10 anos de forno'
where page_key = 'memorias'
  and section_key = 'mem-page-title'
  and coalesce(title, '') in ('', 'Memórias');

insert into public.page_contents (page_key, section_key, title, content, is_active)
select v.page_key, v.section_key, v.title, v.content, true
from (
  values
    (
      'memorias',
      'mem-page-title',
      '10 anos de forno'::text,
      null::text
    ),
    (
      'memorias',
      'mem-page-subtitle',
      'Celebração dos 10 anos da Dona Rosa Pizzaria'::text,
      null::text
    ),
    (
      'memorias',
      'mem-page-anchor',
      'Forno como útero do fogo, lugar onde tudo pode brotar.'::text,
      null::text
    ),
    (
      'memorias',
      'mem-intro-body',
      null::text,
      $mem$<p>Esta semana iniciamos a celebração dos 10 anos da Dona Rosa Pizzaria com 10 dias de experiências no forno. Ele será o grande protagonista por tudo o que representa: sua história, evolução e diferentes formas de uso.</p><p>Forno como elemento ancestral que transforma alimentos, aquece espaços, acolhe encontros e experimentos. Forno como útero do fogo, lugar onde tudo pode brotar.</p><p>Para este momento especial convidamos amigos e parceiros queridos para cozinhar com a gente. Tudo assado no forno!</p><p>O que você gostaria de ver se transformando no forno? Conta pra gente. Vamos compartilhar as ideias nas Lives, de terça a domingo a partir das 19h.</p>$mem$
    ),
    (
      'memorias',
      'mem-concepts',
      'Ancestralidade · Transformação · Elemento Fogo · Acolhimento · Encontro e troca · Da fogueira pro forno'::text,
      null::text
    ),
    (
      'memorias',
      'mem-index-label',
      'Os 10 dias'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-15-title',
      'Marco zero'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-15-guest',
      'Faça a sua pizza com Cecilia Lotufo'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-15-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 1 das comemorações</p><p>Dia 1, nosso marco zero. Dona Rosa, 10 anos de forno e muita história.</p><p>Da pizza na família Lotufo à Cilinha com a pizza; o porquê do nome Dona Rosa; a proposta e o propósito desta casa; a escolha do lugar — o endereço, o antes e o depois; a criação das pizzas; e as pessoas que passam e fazem a Dona Rosa todos os dias: equipe, clientes e parcerias.</p><p>Venha celebrar conosco ou participe da Live no Insta às 19h.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-16-title',
      'Japa no forno!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-16-guest',
      'Peixe assado com @vilajapai'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-16-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 2 das comemorações</p><p>Japa no forno!</p><p>Convidamos nossos amigos e vizinhos da @vilajapai, restaurante japonês descomplicado e informal, para assar um delicioso peixe mergulhado em temperos orientais. Outros aromas saindo do nosso forno democrático. Um convite à experimentação, novos sabores e muitas trocas.</p><p>Venha participar da nossa celebração ou converse com a gente na Live aqui no Insta às 19h, transmissão ao vivo deste momento.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-17-title',
      'Pão nosso de todo dia!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-17-guest',
      'Claudio Lorenzo · @masseriavilaromana'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-17-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 3 das comemorações</p><p>Pão nosso de todo dia!</p><p>Hoje, vamos recriar o ritual do pão feito na lenha. Nosso convidado especial é Claudio Lorenzo da @masseriavilaromana — 17 anos preservando a tradição do autêntico pão artesanal, maturado no tempo certo, hidratado corretamente e livre de aditivos.</p><p>O Claudio vai preparar uma focaccia perfumada com alecrim e ervas do jardim. Teremos também pãezinhos de girassol germinado. Delícia pura!</p><p>O pão é um alimento que permeia todas as culturas, com mais de 6 mil anos de história. Uma delas é sobre o forno de formato cônico, criado pelos egípcios: dentro, o fogo; por fora, os pãezinhos grudados na parede externa até o momento de caírem e voltarem a ser grudados para assar o outro lado. Puro experimento empírico que evoluiu e ganhou diferentes formatos, tamanhos, sabores e recheios.</p><p>Versátil, combina com tudo, aquece alma e coração. Hoje é dia de pão!</p><p>Venha saborear, celebrar ou participe ao vivo da Live aqui no Insta, hoje às 19h. Faça perguntas e comentários. Vamos adorar!</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-18-title',
      'Doçura no forno!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-18-guest',
      'Pizzas com méis da @hebora'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-18-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 4 das comemorações</p><p>Doçura no forno!</p><p>A pizza é um alimento polivalente. Com criatividade e ótimos ingredientes, o resultado é surpreendente. Hoje, tem pizza com méis da @hebora, que faz um lindo trabalho com abelhas nativas, priorizando a preservação, a biodiversidade e o consumo consciente.</p><p>Jardim polinizado, fogo no forno e coração quentinho!</p><p>Venha provar, curtir com a gente e celebrar este momento especial. Transmitiremos ao vivo no Insta hoje às 19h. Participe também mandando perguntas e sugestões.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-19-title',
      'Forno na praça!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-19-guest',
      'Pizza na praça com Cecilia Lotufo'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-19-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 5 das comemorações</p><p>Forno na praça!</p><p>Sábado é dia de festa e nosso forno vai para a praça. Livre, democrático, pronto para receber, preparar, surpreender e aquecer quem estiver perto.</p><p>Estaremos juntos, comemorando 10 anos de história da Dona Rosa, ao ar livre, fazendo o que amamos: pizzas, amigos, encontros e festa!</p><p>Venha comemorar com a gente na praça, convide amigos e amigas ou venha sozinho e encontre novas possibilidades. Juntos tudo fica mais leve e divertido!</p><p>A festa será transmitida ao vivo aqui no Insta a partir das 19h — mas será muito melhor se você vier.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-22-title',
      'Lasanha na lenha!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-22-guest',
      'Lasanheria das Manas'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-22-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 6 das comemorações</p><p>Lasanha na lenha!</p><p>Hoje, nosso forno tem sabor de infância. Memórias que constroem histórias e recheiam novos caminhos. Terça é dia de lasanha e cada um tem a sua preferida.</p><p>A Lasanheria das Manas vai preparar deliciosas lasanhas com os melhores ingredientes, orgânicos e frescos.</p><p>Venha curtir este momento e celebre com a gente 10 anos de forno e afeto! Vai ter Live a partir das 19h, aqui no Insta da Dona Rosa, registrando tudo. Participe!</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-23-title',
      'Hoje o forno é libanês!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-23-guest',
      'Mariana David · Cozinha como Experiência'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-23-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 7 das comemorações</p><p>Hoje o forno é libanês!</p><p>Convidamos a Mariana David, psicóloga e idealizadora do Cozinha como Experiência, para preparar deliciosas receitas da tradição libanesa no forno da Dona Rosa.</p><p>Como a gente, a Mari também vive a cozinha como lugar de encontro, trocas, criações, mil histórias e muito afeto. Verdadeiro despertar de sabores e sentimentos. Vem contar sua história em volta do forno!</p><p>Na Live de hoje a Mari vai dar dicas e falar sobre sua relação com a culinária e experiências na cozinha.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-24-title',
      'Forno PANC!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-24-guest',
      'União de Hortas Comunitárias de São Paulo'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-24-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 8 das comemorações</p><p>Forno PANC!</p><p>Você curte as PANC? Se ainda não conhece, hoje é dia de experimentar as Plantas Alimentícias Não Convencionais e se abrir para um novo mundo de texturas, sabores e aromas. Convidamos a União de Hortas Comunitárias de São Paulo para revolucionar o forno da Dona Rosa com plantas e ervas que não encontramos no varejo tradicional, mas trombamos com elas em vários cantos da cidade — matinhos espontâneos, hortas e cultivo orgânico. Azedinha, taioba, mostarda, ora-pro-nóbis, entre tantas outras.</p><p>O acrônimo PANC foi criado em 2008 pela nutricionista gaúcha Irany Arteche, inspirada na tese de doutorado do botânico Valdely Kinupp. Em 2014 o termo ficou mais conhecido, após o lançamento do primeiro guia brasileiro sobre o assunto, com informações nutricionais e receitas elaboradas com mais de 350 vegetais menosprezados em todo o país.</p><p>É PANC PUNK no forno!</p><p>E como todos os dias, transmitiremos ao vivo o dia de celebração no Insta da Dona Rosa. Participe!</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-25-title',
      'Quibe no forno!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-25-guest',
      'Eliana Boarini'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-25-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 9 das comemorações</p><p>Quibe no forno!</p><p>Hoje, temos experiência para todos os sentidos. Eliana Boarini fará uma receita autoral de quibe de abóbora kabocha com quinoa colorida, recheado de tofupiri e abobrinha, regado com muito limão e folhas de hortelã. Pesquisadora de sabores, nutrientes e texturas, Eliana trabalha o aproveitamento integral dos alimentos, inspirada no conceito de upcycling (reutilização). Ela vai contar pra gente todos os segredos deste processo — e também como aprendeu a costurar com retalhos da avó.</p><p>Da natureza tudo se transforma! Basta querer.</p><p>Venha experimentar, celebrar e contar suas histórias. Transmitiremos ao vivo no Insta da Dona Rosa. Participe!</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-dia-26-title',
      'Doutores ao forno!'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-26-guest',
      'Medicina culinária · FMUSP'::text,
      null::text
    ),
    (
      'memorias',
      'mem-dia-26-body',
      null::text,
      $mem$<p>10 anos da Dona Rosa! Dia 10 das comemorações</p><p>Doutores ao forno!</p><p>Hoje é o último dia de celebração dos 10 anos da Dona Rosa e teremos os professores do curso de medicina culinária da Faculdade de Medicina da USP elaborando pratos indianos. Uau! Papo bom, conhecimento e boas risadas no caminho.</p><p>Eles vão conversar com a gente sobre alimentação saudável, benefícios dos nutrientes e tudo que cair na mesa e estiver no ar.</p><p>Venha participar do último dia de celebração! Ao vivo é sempre mais gostoso.</p><p>#donarosa10anosdeforno<br/>#vaiproforno10anosDonaRosa</p>$mem$
    ),
    (
      'memorias',
      'mem-closing-body',
      null::text,
      $mem$<p>Depois de 10 dias de experiências incríveis, encontros, abraços e muitos brindes, nosso forno agradece o acolhimento, o alto astral e os momentos mais felizes que vivemos estes dias.</p><p>Vida longa para a Dona Rosa Pizzaria! Salve o forno — útero do fogo que prepara, aquece e acolhe.</p>$mem$
    ),
    (
      'memorias',
      'mem-closing-hashtags',
      '#donarosa10anosdeforno · #vaiproforno10anosDonaRosa'::text,
      null::text
    )
) as v (page_key, section_key, title, content)
where not exists (
  select 1
  from public.page_contents as p
  where p.page_key = v.page_key
    and p.section_key = v.section_key
);
