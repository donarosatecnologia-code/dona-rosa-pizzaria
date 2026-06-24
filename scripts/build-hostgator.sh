#!/usr/bin/env bash
# Build de produção para upload na HostGator (donarosapizzaria.com.br)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Vite 7 + SWC: use Node 20/22 LTS (Node 26 pode travar ou falhar no build).
if [[ -x /usr/local/opt/node@22/bin/node ]]; then
  export PATH="/usr/local/opt/node@22/bin:$PATH"
elif [[ -x /opt/homebrew/opt/node@22/bin/node ]]; then
  export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -ge 26 ]]; then
  echo "Aviso: Node $(node -v) detectado. Prefira Node 22 LTS (nvm use / .nvmrc)."
fi

if pgrep -f "vite build" >/dev/null 2>&1; then
  echo "Erro: já existe um 'vite build' em execução. Aguarde ou encerre com: pkill -f \"vite build\""
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Erro: arquivo .env não encontrado. Copie .env.example e preencha VITE_* antes do build."
  exit 1
fi

export VITE_PUBLIC_SITE_URL="${VITE_PUBLIC_SITE_URL:-https://donarosapizzaria.com.br}"

echo "→ Build com Node $(node -v) e VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL"
echo "  (pode levar 20–60s; não interrompa enquanto aparecer 'transforming...')"
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
