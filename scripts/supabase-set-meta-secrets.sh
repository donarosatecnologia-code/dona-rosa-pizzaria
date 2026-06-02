#!/usr/bin/env bash
# Carrega secrets Meta de supabase/secrets.meta.env e aplica no projeto linkado.
# Uso: npm run secrets:meta
set -euo pipefail

cd "$(dirname "$0")/.."

SECRETS_FILE="supabase/secrets.meta.env"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Arquivo $SECRETS_FILE não encontrado."
  echo "Copie o exemplo: cp supabase/secrets.meta.env.example supabase/secrets.meta.env"
  echo "Preencha os valores e rode novamente."
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS_FILE"

missing=()
for var in META_APP_SECRET META_ACCESS_TOKEN META_PHONE_NUMBER_ID META_VERIFY_TOKEN; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Variáveis vazias em $SECRETS_FILE:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "=== Aplicando secrets Meta no Supabase (pptgzavxpdltcuqpcovo) ==="
SECRET_ARGS=(
  META_APP_SECRET="$META_APP_SECRET"
  META_ACCESS_TOKEN="$META_ACCESS_TOKEN"
  META_PHONE_NUMBER_ID="$META_PHONE_NUMBER_ID"
  META_VERIFY_TOKEN="$META_VERIFY_TOKEN"
)

# Dry-run: simula envio sem chamar Graph API (dev com número teste US)
BROADCAST_DRY_RUN="${BROADCAST_DRY_RUN:-true}"
SECRET_ARGS+=(BROADCAST_DRY_RUN="$BROADCAST_DRY_RUN")

if [[ -n "${META_WABA_ID:-}" ]]; then
  SECRET_ARGS+=(META_WABA_ID="$META_WABA_ID")
fi

if [[ -n "${META_API_VERSION:-}" ]]; then
  SECRET_ARGS+=(META_API_VERSION="$META_API_VERSION")
fi

supabase secrets set "${SECRET_ARGS[@]}"

echo ""
echo "✓ Secrets Meta configurados."
echo "  BROADCAST_DRY_RUN=$BROADCAST_DRY_RUN (false = envio real via Meta)"
echo "  Webhook URL: https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook"
echo "  Health-check: https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-verify?secret=<META_VERIFY_TOKEN>"
echo "  Verify Token: (valor de META_VERIFY_TOKEN em $SECRETS_FILE)"
