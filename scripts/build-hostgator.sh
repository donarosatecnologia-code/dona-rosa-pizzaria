#!/usr/bin/env bash
# Build de produção para upload na HostGator (donarosapizzaria.com.br)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Erro: arquivo .env não encontrado. Copie .env.example e preencha VITE_* antes do build."
  exit 1
fi

export VITE_PUBLIC_SITE_URL="${VITE_PUBLIC_SITE_URL:-https://donarosapizzaria.com.br}"

echo "→ Build com VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL"
npm run build

if [[ ! -f dist/.htaccess ]]; then
  echo "Erro: dist/.htaccess não encontrado. Verifique public/.htaccess"
  exit 1
fi

echo ""
echo "✓ Build pronto em dist/"
echo "  Envie TODO o conteúdo de dist/ para public_html/ na HostGator"
echo "  (incluindo .htaccess — arquivos ocultos devem ser visíveis no FTP)"
echo ""
echo "URLs para verificação Meta:"
echo "  https://donarosapizzaria.com.br/politica-de-privacidade"
echo "  https://donarosapizzaria.com.br/termos-de-uso"
