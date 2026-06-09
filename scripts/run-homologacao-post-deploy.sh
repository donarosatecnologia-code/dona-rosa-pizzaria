#!/usr/bin/env bash
# Roteiro automatizado pós-deploy (T03 + testes locais + checklist manual)
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Homologação pós-deploy — Dona Rosa WhatsApp ==="
echo ""

PASS=0
FAIL=0

run_check() {
  local label="$1"
  shift
  echo "--- $label ---"
  if "$@"; then
    echo "  ✓ OK"
    PASS=$((PASS + 1))
  else
    echo "  ✗ FALHOU"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

echo "--- T03 — meta:verify (webhook + secrets) ---"
META_OUT=$(bash scripts/verify-meta-integration.sh 2>&1) || META_EXIT=$?
echo "$META_OUT"
if [[ "${META_EXIT:-0}" -eq 0 ]]; then
  echo "  ✓ OK"
  PASS=$((PASS + 1))
elif echo "$META_OUT" | grep -q "11 ok" && echo "$META_OUT" | grep -qi "DISCONNECTED"; then
  echo "  ✓ OK infra (coexistência DISCONNECTED — esperado até App Review)"
  PASS=$((PASS + 1))
else
  echo "  ✗ FALHOU"
  FAIL=$((FAIL + 1))
fi
echo ""

run_check "Unit tests (vitest)" npm run test --silent

run_check "E2E smoke (login + guard disparos)" npm run test:e2e:smoke --silent

run_check "Regressão e2e (CMS intocado)" npm run test:e2e:regression --silent

echo "=== Próximos passos MANUAIS (painel) ==="
cat <<'EOF'

1. Contatos QA (T05–T10b)
   • /admin/contatos → Importar docs/qa-sample/contatos-qa-homologacao.csv
   • Marque o checkbox LGPD na importação
   • Troque os telefones do CSV pelos 3 números reais da equipe
   • Em cada contato: botão "Usar em homologação" (ou rode scripts/sql/setup-qa-homologacao-contacts.sql)

2. Campanha dry-run (T15–T17)
   • Confirme BROADCAST_DRY_RUN=true: npm run secrets:meta (ou Supabase Dashboard → Secrets)
   • SQL Editor: scripts/sql/seed-homologacao-campaign.sql
   • npm run broadcast:send -- <campaign_id>
   • /admin/disparos → Ver relatório → destinatários com status sent (dry_run_*)

3. UI (T16, T24–T27)
   • Disparar pelo painel → modal de custo R$ 0,35 × N
   • Exportar CSV de respostas (quando houver)

4. Bloqueado pela Meta (T01, T19–T23 real, T28–T30)
   • Aguardar App Review + coexistência CONNECTED

Documentação: docs/HOMOLOGACAO-T01-T30.md · docs/GUIA-ROSA-WHATSAPP.md
EOF

echo ""
echo "=== Resumo automatizado: ${PASS} ok | ${FAIL} falhas ==="
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
