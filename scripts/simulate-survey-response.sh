#!/usr/bin/env bash
# Simula resposta de pesquisa via webhook (T19–T21) — sem depender da Meta.
# Uso:
#   npm run homologacao:simulate-response -- 412799c7-b9d4-48d3-b683-3439aef3ca3f
#   npm run homologacao:simulate-response -- <campaign_id> "Sim"
set -euo pipefail

cd "$(dirname "$0")/.."

CAMPAIGN_ID="${1:-}"
RESPONSE_VALUE="${2:-Sim}"

if [[ -z "$CAMPAIGN_ID" ]]; then
  echo "Uso: npm run homologacao:simulate-response -- <campaign_id> [resposta]"
  exit 1
fi

if [[ ! -f .env ]] || [[ ! -f supabase/secrets.meta.env ]]; then
  echo "Requer .env e supabase/secrets.meta.env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
source supabase/secrets.meta.env
set +a

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/whatsapp-webhook"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" || -z "${META_APP_SECRET:-}" ]]; then
  echo "Variáveis ausentes (URL, ANON_KEY, META_APP_SECRET)"
  exit 1
fi

if [[ -z "${ADMIN_EMAIL:-}" ]]; then
  read -r -p "Email admin: " ADMIN_EMAIL
fi
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -r -s -p "Senha admin: " ADMIN_PASSWORD
  echo ""
fi

echo "=== Login admin ==="
AUTH_JSON=$(curl -sS "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Falha no login"
  exit 1
fi

echo "=== Buscando destinatário sent da campanha ==="
RECIPIENT_JSON=$(curl -sS \
  "${SUPABASE_URL}/rest/v1/broadcast_campaign_recipients?campaign_id=eq.${CAMPAIGN_ID}&send_status=eq.sent&select=id,meta_message_id,contact_id&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

META_MSG_ID=$(echo "$RECIPIENT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['meta_message_id'] if d else '')" 2>/dev/null || true)
CONTACT_ID=$(echo "$RECIPIENT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['contact_id'] if d else '')" 2>/dev/null || true)

if [[ -z "$META_MSG_ID" || -z "$CONTACT_ID" ]]; then
  echo "Nenhum destinatário com status sent. Rode o dry-run antes."
  echo "$RECIPIENT_JSON"
  exit 1
fi

CONTACT_JSON=$(curl -sS \
  "${SUPABASE_URL}/rest/v1/whatsapp_contacts?id=eq.${CONTACT_ID}&select=phone_number&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

PHONE=$(echo "$CONTACT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['phone_number'] if d else '')" 2>/dev/null || true)
if [[ -z "$PHONE" ]]; then
  echo "Telefone do contato não encontrado"
  exit 1
fi

INBOUND_ID="wamid.simulate.$(date +%s).$(openssl rand -hex 4)"

echo "  Contato: ${PHONE}"
echo "  context.message_id: ${META_MSG_ID}"
echo "  Resposta: ${RESPONSE_VALUE}"

echo "=== POST webhook (HMAC válido) ==="
POST_RESULT=$(META_APP_SECRET="$META_APP_SECRET" \
  WEBHOOK_URL="$WEBHOOK_URL" \
  PHONE="$PHONE" \
  META_MSG_ID="$META_MSG_ID" \
  INBOUND_ID="$INBOUND_ID" \
  RESPONSE_VALUE="$RESPONSE_VALUE" \
  python3 - <<'PY'
import json, hmac, hashlib, os, urllib.request, time

app_secret = os.environ["META_APP_SECRET"]
webhook_url = os.environ["WEBHOOK_URL"]
phone = os.environ["PHONE"]
context_id = os.environ["META_MSG_ID"]
inbound_id = os.environ["INBOUND_ID"]
response = os.environ["RESPONSE_VALUE"]

payload = {
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "simulate",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {"phone_number_id": "115847421431608"},
        "contacts": [{"profile": {"name": "QA Teste"}, "wa_id": phone}],
        "messages": [{
          "from": phone,
          "id": inbound_id,
          "timestamp": str(int(time.time())),
          "type": "interactive",
          "context": {"id": context_id},
          "interactive": {
            "type": "button_reply",
            "button_reply": {"id": "btn_sim", "title": response},
          },
        }],
      },
    }],
  }],
}

body = json.dumps(payload, separators=(",", ":"))
sig = hmac.new(app_secret.encode(), body.encode(), hashlib.sha256).hexdigest()
req = urllib.request.Request(
  webhook_url,
  data=body.encode(),
  headers={
    "Content-Type": "application/json",
    "X-Hub-Signature-256": f"sha256={sig}",
  },
  method="POST",
)
try:
  with urllib.request.urlopen(req, timeout=20) as r:
    print(r.status, r.read().decode())
except Exception as e:
  print("ERR", getattr(e, "code", "?"), getattr(e, "reason", str(e)))
PY
)

echo "$POST_RESULT"
sleep 2

echo ""
echo "=== Verificando broadcast_responses ==="
curl -sS \
  "${SUPABASE_URL}/rest/v1/broadcast_responses?campaign_id=eq.${CAMPAIGN_ID}&select=response_value,contact_id,received_at&order=received_at.desc&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | python3 -m json.tool

echo ""
echo "T19–T21: confira no /admin/disparos/${CAMPAIGN_ID} — gráfico e export CSV."
echo "Para T21 (dedupe): rode o mesmo comando de novo; não deve duplicar voto."
