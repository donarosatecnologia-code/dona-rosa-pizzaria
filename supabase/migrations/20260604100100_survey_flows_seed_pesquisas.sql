-- migration: pesquisas Dona Rosa — delivery e reativação de inativos
-- purpose: fluxos sequenciais prontos para campanhas (resposta no WhatsApp, sem link)

insert into public.survey_flows (
  slug,
  name,
  description,
  intro_message,
  suggested_queue_slug,
  steps
)
values
  (
    'pesquisa-delivery-2025',
    'Pesquisa delivery — clientes ativos',
    'Pesquisa rápida sobre frequência, motivos e melhorias no delivery.',
    E'Oi! Tudo bem?\n\nEstamos fazendo uma pesquisa rápida para melhorar o delivery da Dona Rosa 🍕\n\nLeva menos de 2 minutos e sua resposta ajuda bastante.\n\nVou te mandar as perguntas aqui mesmo no WhatsApp — é só tocar nas opções ou digitar quando pedir.',
    'clientes-ativos',
    $json$[
      {
        "id": "frequencia",
        "question": "Com que frequência você costuma pedir na Dona Rosa?",
        "kind": "choice",
        "options": [
          {"id": "semana", "label": "Toda semana"},
          {"id": "mes", "label": "Algumas vezes no mês"},
          {"id": "raro", "label": "Raramente"}
        ]
      },
      {
        "id": "motivo_pedir",
        "question": "O que mais te faz pedir com a gente?",
        "kind": "choice",
        "options": [
          {"id": "sabor", "label": "Sabor"},
          {"id": "ingredientes", "label": "Ingredientes"},
          {"id": "atendimento", "label": "Atendimento"},
          {"id": "entrega", "label": "Entrega"},
          {"id": "confianca", "label": "Confiança"},
          {"id": "outro", "label": "Outro"}
        ]
      },
      {
        "id": "avaliacao_delivery",
        "question": "Como você avalia o delivery atualmente?",
        "kind": "choice",
        "options": [
          {"id": "otimo", "label": "Ótimo"},
          {"id": "bom", "label": "Bom"},
          {"id": "regular", "label": "Regular"},
          {"id": "ruim", "label": "Ruim"}
        ]
      },
      {
        "id": "melhorar",
        "question": "O que poderíamos melhorar mais?",
        "kind": "choice",
        "options": [
          {"id": "tempo", "label": "Tempo de entrega"},
          {"id": "temperatura", "label": "Temperatura da pizza"},
          {"id": "embalagem", "label": "Embalagem"},
          {"id": "atendimento", "label": "Atendimento"},
          {"id": "cardapio", "label": "Cardápio"},
          {"id": "preco", "label": "Preço"},
          {"id": "nada", "label": "Nada no momento"}
        ]
      },
      {
        "id": "novidade",
        "question": "Tem alguma pizza, ingrediente ou novidade que gostaria de ver por aqui?",
        "kind": "text"
      },
      {
        "id": "uma_palavra",
        "question": "Em uma palavra: o que é a Dona Rosa pra você?",
        "kind": "text"
      }
    ]$json$::jsonb
  ),
  (
    'pesquisa-reativacao-inativos',
    'Pesquisa reativação — clientes inativos',
    'Entender por que clientes pararam de pedir e o que traria de volta.',
    E'Oi! Tudo bem?\n\nPercebemos que faz um tempo que você não pede na Dona Rosa e resolvemos perguntar uma coisa bem rapidinha 🍕\n\nSua resposta ajuda muito a gente a entender e melhorar.\n\nResponda aqui no chat — toque nas opções ou digite quando for pergunta aberta 🙂',
    'clientes-inativos',
    $json$[
      {
        "id": "motivo_parou",
        "question": "Qual foi o principal motivo de ter parado de pedir?",
        "kind": "choice",
        "options": [
          {"id": "menos_delivery", "label": "Pedi menos delivery no geral"},
          {"id": "preco", "label": "Preço"},
          {"id": "rotina", "label": "Mudança de rotina"},
          {"id": "entrega", "label": "Entrega"},
          {"id": "qualidade", "label": "Qualidade da pizza"},
          {"id": "atendimento", "label": "Atendimento"},
          {"id": "outro_lugar", "label": "Passei a pedir em outro lugar"},
          {"id": "outro", "label": "Outro motivo"}
        ]
      },
      {
        "id": "voltaria",
        "question": "Você voltaria a pedir da Dona Rosa?",
        "kind": "choice",
        "options": [
          {"id": "sim", "label": "Sim"},
          {"id": "talvez", "label": "Talvez"},
          {"id": "nao", "label": "Não"}
        ]
      },
      {
        "id": "o_que_voltar",
        "question": "O que faria você voltar a pedir?",
        "kind": "text"
      },
      {
        "id": "incomodou",
        "question": "Tem algo que te incomodou na última experiência com a gente?",
        "kind": "text"
      }
    ]$json$::jsonb
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  intro_message = excluded.intro_message,
  suggested_queue_slug = excluded.suggested_queue_slug,
  steps = excluded.steps,
  updated_at = now();

-- tags sugeridas para segmentação manual (além das automáticas)
insert into public.whatsapp_tags (name, slug, description, color, is_system)
values
  ('Pesquisa delivery respondida', 'pesquisa-delivery-respondeu', 'Concluiu a pesquisa de delivery', '#22c55e', false),
  ('Pesquisa reativação respondida', 'pesquisa-reativacao-respondeu', 'Concluiu a pesquisa de reativação', '#3b82f6', false),
  ('Cliente frequente', 'cliente-frequente', 'Marcação manual — pede com frequência', '#a855f7', false),
  ('Zona sul', 'zona-sul', 'Marcação manual — região de entrega', '#f97316', false)
on conflict (slug) do nothing;
