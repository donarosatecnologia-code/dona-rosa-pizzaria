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

# Cópia visível para cPanel quando o FTP não envia arquivos ocultos
cp dist/.htaccess dist/hostgator-htaccess.txt

echo ""
echo "✓ Build pronto em dist/"
echo ""
echo "Upload na HostGator (public_html/):"
echo "  1. Envie TODO o conteúdo de dist/ (index.html, assets/, etc.)"
echo "  2. Confirme .htaccess na raiz — FTP: ative 'mostrar arquivos ocultos'"
echo "  3. Se .htaccess não subir: no cPanel, renomeie hostgator-htaccess.txt → .htaccess"
echo "  4. Teste https://donarosapizzaria.com.br/spa-deploy-marker.txt (confirma upload)"
echo ""
echo "URLs para verificação Meta:"
echo "  https://donarosapizzaria.com.br/politica-de-privacidade"
echo "  https://donarosapizzaria.com.br/termos-de-uso"
