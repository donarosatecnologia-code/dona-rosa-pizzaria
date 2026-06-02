#!/usr/bin/env bash
# Sobe Supabase local da Dona Rosa (portas 54331+ — não conflita com auto-painel).
set -euo pipefail

cd "$(dirname "$0")/.."

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'supabase_db_auto-painel'; then
  echo "ℹ️  Projeto 'auto-painel' detectado nas portas padrão (54321–54324)."
  echo "   Dona Rosa usa portas 54331–54334 (config.toml)."
  echo ""
fi

supabase start

echo ""
echo "=== Dona Rosa — URLs locais ==="
supabase status
