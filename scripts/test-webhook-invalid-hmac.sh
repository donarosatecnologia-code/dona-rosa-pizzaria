#!/usr/bin/env bash
# T02 — webhook com HMAC inválido deve retornar 403
set -euo pipefail

WEBHOOK_URL="https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook"
BODY='{"object":"whatsapp_business_account","entry":[]}'

HTTP=$(curl -sS -o /tmp/webhook-bad-hmac.json -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=deadbeef" \
  -d "$BODY")

echo "HTTP $HTTP"
cat /tmp/webhook-bad-hmac.json
echo ""

if [[ "$HTTP" == "403" ]]; then
  echo "✓ T02 OK — assinatura inválida rejeitada"
  exit 0
fi

echo "✗ T02 FALHOU — esperado HTTP 403"
exit 1
