#!/usr/bin/env bash
# Fluxo completo: status → push migrations → gerar tipos TypeScript
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Migration status ==="
supabase migration list

echo ""
echo "=== Applying pending migrations (--yes --include-all) ==="
supabase db push --yes --include-all

echo ""
echo "=== Regenerating TypeScript types ==="
npm run db:types

echo ""
echo "✓ Banco remoto sincronizado e types.ts atualizado."
