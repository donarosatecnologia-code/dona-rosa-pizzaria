#!/usr/bin/env bash
# Configuração manual de coexistência WhatsApp (sem Embedded Signup).
# Rode DEPOIS de conectar no celular: Configurações → Conta → Plataforma comercial.
#
# Uso:
#   npm run meta:coexistence          # inscreve app na WABA + mostra status
#   META_REGISTRATION_PIN=123456 npm run meta:coexistence   # tenta register na Cloud API
#   npm run meta:verify               # confirma CONNECTED + CLOUD_API
set -euo pipefail

cd "$(dirname "$0")/.."

SECRETS_FILE="supabase/secrets.meta.env"
API_VERSION="${META_API_VERSION:-v21.0}"
WEBHOOK_URL="https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Arquivo $SECRETS_FILE não encontrado."
  echo "cp supabase/secrets.meta.env.example supabase/secrets.meta.env"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$SECRETS_FILE"
set +a

for var in META_ACCESS_TOKEN META_PHONE_NUMBER_ID META_VERIFY_TOKEN META_WABA_ID; do
  if [[ -z "${!var:-}" ]]; then
    echo "Defina $var em $SECRETS_FILE"
    exit 1
  fi
done

echo "=== Coexistência WhatsApp (caminho alternativo) ==="
echo ""

echo "--- 1) Inscrever app na WABA (webhook override) ---"
SUBSCRIBE=$(curl -sS -X POST \
  "https://graph.facebook.com/${API_VERSION}/${META_WABA_ID}/subscribed_apps?override_callback_uri=${WEBHOOK_URL}&verify_token=${META_VERIFY_TOKEN}" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}")
if echo "$SUBSCRIBE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else 1)" 2>/dev/null; then
  echo "  ✓ App inscrito na WABA — webhook: $WEBHOOK_URL"
else
  echo "  ✗ Falha ao inscrever:"
  echo "$SUBSCRIBE" | python3 -m json.tool 2>/dev/null || echo "$SUBSCRIBE"
fi

echo ""
echo "--- 2) Status do número (Graph API) ---"
STATUS_JSON=$(curl -sS \
  "https://graph.facebook.com/${API_VERSION}/${META_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,status,platform_type,is_on_biz_app" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}")
echo "$STATUS_JSON" | python3 -m json.tool

PHONE_STATUS=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
PLATFORM_TYPE=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('platform_type','?'))" 2>/dev/null || echo "?")

if [[ "$PHONE_STATUS" == "CONNECTED" ]] && [[ "$PLATFORM_TYPE" == "CLOUD_API" ]]; then
  echo ""
  echo "  ✓ Número pronto na Cloud API."
else
  echo ""
  echo "  ⚠ Ainda não está CONNECTED + CLOUD_API."
  echo "  No celular (WhatsApp Business da pizzaria):"
  echo "    Configurações → Conta → Plataforma comercial → Conectar"
  echo "  Antes: desconecte WhatsApp Web em Aparelhos conectados."
fi

if [[ -n "${META_REGISTRATION_PIN:-}" ]]; then
  echo ""
  echo "--- 3) Register na Cloud API (PIN informado) ---"
  REGISTER=$(curl -sS -X POST \
    "https://graph.facebook.com/${API_VERSION}/${META_PHONE_NUMBER_ID}/register" \
    -H "Authorization: Bearer ${META_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"messaging_product\":\"whatsapp\",\"pin\":\"${META_REGISTRATION_PIN}\"}")
  echo "$REGISTER" | python3 -m json.tool
else
  echo ""
  echo "--- 3) Register (opcional) ---"
  echo "  Se a Meta pedir PIN de verificação em dois fatores:"
  echo "    Gerenciador WhatsApp → Telefones → seu número → Verificação em duas etapas"
  echo "  Depois rode:"
  echo "    META_REGISTRATION_PIN=123456 npm run meta:coexistence"
fi

echo ""
echo "--- Próximo passo ---"
echo "  npm run secrets:meta    # se atualizou META_ACCESS_TOKEN"
echo "  npm run meta:verify     # checklist completo"
