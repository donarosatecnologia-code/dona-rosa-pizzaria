#!/usr/bin/env bash
# Repara histórico quando o remoto tem timestamps diferentes dos arquivos locais.
# Causa comum: migrations aplicadas pelo Dashboard/Lovable com +3s nos nomes.
#
# Uso: ./scripts/supabase-repair-history.sh
# Depois: npm run db:push

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Revertendo versões fantasma no remoto (timestamps antigos)..."
supabase migration repair --status reverted \
  20260323213931 \
  20260323223045 \
  20260324000705

echo "→ Marcando equivalentes locais como já aplicadas..."
supabase migration repair --status applied \
  20260323213934 \
  20260323223047 \
  20260324000708

echo ""
echo "✓ Histórico reparado. Confira:"
supabase migration list

echo ""
echo "Próximo passo: npm run db:push"
