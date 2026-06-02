#!/usr/bin/env bash
# Verifica se o fallback SPA está ativo na HostGator
set -euo pipefail

BASE="${1:-https://donarosapizzaria.com.br}"
FAIL=0

check() {
  local path="$1"
  local label="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE}${path}")"
  if [[ "$code" == "200" ]]; then
    echo "✓ ${label} (${path}) → HTTP ${code}"
  else
    echo "✗ ${label} (${path}) → HTTP ${code}"
    FAIL=1
  fi
}

echo "Verificando ${BASE} ..."
echo ""

check "/" "Home"
check "/spa-deploy-marker.txt" "Marcador de deploy"
check "/politica-de-privacidade" "Política de privacidade"
check "/termos-de-uso" "Termos de uso"
check "/login" "Login"
check "/admin" "Admin"

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "SPA routing OK."
else
  echo "Falha: rotas SPA ainda retornam 404."
  echo "→ Confirme .htaccess na raiz de public_html (renomeie hostgator-htaccess.txt se necessário)."
  exit 1
fi
