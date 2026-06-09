# QA Sample — Dona Rosa Pizzaria

Artefatos e roteiros de homologação **somente para WhatsApp / CRM admin**.

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `contatos-qa-homologacao.csv` | 3 contatos de teste para fila `homologacao-qa` |
| `REGRESSAO-E2E-COMPLETO.md` | Checklist regressivo + e2e (manual e automatizado) |
| `seed-campanha-pesquisa-qa.sql` | Campanha de pesquisa sequencial na fila QA |

## Regra de ouro — não alterar o site

Os cadastros de **textos, imagens, cardápio, páginas do site e topo/rodapé** estão validados em produção.

**Proibido nestes testes:**

- Salvar rascunho ou publicar no espelho CMS (`/admin/mirror/*`, `/admin/pages`)
- Editar produtos, preços ou imagens em `/admin/cardapio`
- Alterar topo/rodapé em `/admin/header-footer`
- Enviar formulários do site público que persistam conteúdo editorial

**Permitido:**

- Navegar no site público e no admin **somente leitura** (conferir que carrega)
- Criar/alterar dados de **WhatsApp**: contatos QA, etiquetas `[QA]`, segmentos de teste, pesquisas, campanhas dry-run

## Execução rápida

```bash
# Automatizado (sem tocar CMS)
npm run test:regression

# Ou passo a passo
npm run meta:verify
npm run test
npm run test:e2e:regression
bash scripts/regression-api-whatsapp.sh   # requer E2E_ADMIN_EMAIL/PASSWORD no .env
```

Credenciais opcionais no `.env` (não commitar):

```env
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

Documentação completa: [REGRESSAO-E2E-COMPLETO.md](./REGRESSAO-E2E-COMPLETO.md)
