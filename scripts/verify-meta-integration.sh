#!/usr/bin/env bash
# Verifica integração Meta (modo teste) — webhook + Graph API + secrets Supabase.
set -euo pipefail

cd "$(dirname "$0")/.."

SECRETS_FILE="supabase/secrets.meta.env"
WEBHOOK_URL="https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-webhook"
VERIFY_URL="https://pptgzavxpdltcuqpcovo.supabase.co/functions/v1/whatsapp-verify"
PASS=0
FAIL=0
WARN=0

ok() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
bad() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠ $1"; WARN=$((WARN + 1)); }

echo "=== Verificação Meta WhatsApp (Dona Rosa) ==="
echo ""

# 1. Arquivo local de secrets
if [[ ! -f "$SECRETS_FILE" ]]; then
  bad "Arquivo $SECRETS_FILE ausente"
else
  ok "Arquivo $SECRETS_FILE encontrado"
  # shellcheck disable=SC1090
  set -a
  source "$SECRETS_FILE"
  set +a
  for var in META_APP_SECRET META_ACCESS_TOKEN META_PHONE_NUMBER_ID META_VERIFY_TOKEN; do
    if [[ -z "${!var:-}" ]]; then
      bad "$var vazio em $SECRETS_FILE"
    fi
  done
fi

echo ""
echo "--- Webhook GET (verificação Meta) ---"
HTTP=$(curl -sS -o /tmp/meta-challenge.txt -w "%{http_code}" \
  "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${META_VERIFY_TOKEN}&hub.challenge=VERIFY_OK" || true)
if [[ "$HTTP" == "200" ]] && grep -q "VERIFY_OK" /tmp/meta-challenge.txt 2>/dev/null; then
  ok "Webhook responde hub.challenge (HTTP 200)"
else
  bad "Webhook GET falhou (HTTP ${HTTP:-?})"
fi

echo ""
echo "--- Webhook POST (HMAC / App Secret) ---"
POST_RESULT=$(python3 - <<PY
import json, hmac, hashlib, urllib.request, os
app_secret = os.environ.get("META_APP_SECRET", "")
body = json.dumps({"object": "whatsapp_business_account", "entry": []})
sig = hmac.new(app_secret.encode(), body.encode(), hashlib.sha256).hexdigest()
req = urllib.request.Request(
  "${WEBHOOK_URL}",
  data=body.encode(),
  headers={"Content-Type": "application/json", "X-Hub-Signature-256": f"sha256={sig}"},
  method="POST",
)
try:
  with urllib.request.urlopen(req, timeout=15) as r:
    print(r.status, r.read().decode())
except Exception as e:
  print("ERR", getattr(e, "code", "?"), getattr(e, "reason", str(e)))
PY
)
if echo "$POST_RESULT" | grep -q '^200'; then
  ok "Webhook aceita POST com assinatura HMAC válida"
else
  bad "Webhook POST/HMAC falhou: $POST_RESULT"
fi

echo ""
echo "--- Health-check whatsapp-verify ---"
VERIFY_HTTP=$(curl -sS -o /tmp/meta-verify.json -w "%{http_code}" \
  "${VERIFY_URL}?secret=${META_VERIFY_TOKEN}" || true)
if [[ "$VERIFY_HTTP" == "200" ]] && python3 -c "import json,sys; d=json.load(open('/tmp/meta-verify.json')); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
  VERIFY_DISPLAY=$(python3 -c "import json; print(json.load(open('/tmp/meta-verify.json')).get('meta',{}).get('display_phone_number','?'))" 2>/dev/null || echo "?")
  ok "whatsapp-verify OK — Meta: ${VERIFY_DISPLAY}"
else
  bad "whatsapp-verify falhou (HTTP ${VERIFY_HTTP:-?}) — rode npm run functions:deploy:verify"
  if [[ -f /tmp/meta-verify.json ]]; then
    python3 -c "import json; print(json.dumps(json.load(open('/tmp/meta-verify.json')), indent=2))" 2>/dev/null || cat /tmp/meta-verify.json
  fi
fi

echo ""
echo "--- Graph API (Access Token + Phone Number ID) ---"
if [[ "${META_ACCESS_TOKEN:-}" == EAA* ]] && [[ ${#META_ACCESS_TOKEN} -gt 50 ]]; then
  ok "Formato do access token parece válido (EAA…)"
elif [[ ${#META_ACCESS_TOKEN} -eq 32 ]] && [[ "${META_ACCESS_TOKEN}" =~ ^[0-9a-fA-F]+$ ]]; then
  warn "META_ACCESS_TOKEN parece Token de cliente ou App Secret (32 hex) — use Temporary access token (EAA…) em WhatsApp → API Setup"
else
  warn "META_ACCESS_TOKEN não parece um token OAuth (esperado: string longa iniciando com EAA)"
fi

GRAPH=$(curl -sS "https://graph.facebook.com/v21.0/${META_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,status,platform_type,is_on_biz_app" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}" || true)

if echo "$GRAPH" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'display_phone_number' in d else 1)" 2>/dev/null; then
  DISPLAY=$(echo "$GRAPH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('display_phone_number','?'))")
  VERIFIED=$(echo "$GRAPH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verified_name',''))" 2>/dev/null || true)
  PHONE_STATUS=$(echo "$GRAPH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
  PLATFORM_TYPE=$(echo "$GRAPH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('platform_type','?'))" 2>/dev/null || echo "?")
  IS_ON_BIZ_APP=$(echo "$GRAPH" | python3 -c "import sys,json; print(str(json.load(sys.stdin).get('is_on_biz_app','')).lower())" 2>/dev/null || echo "false")
  ok "Phone Number ID válido — display: ${DISPLAY}${VERIFIED:+ ($VERIFIED)}"
  if [[ "$DISPLAY" == *"555"* ]] || [[ "$DISPLAY" == *"15556523526"* ]]; then
    IS_TEST_NUMBER=1
    ok "Número de teste Meta detectado (+1 555-652-3526 ou similar)"
  else
    IS_TEST_NUMBER=0
    ok "Número de produção detectado (não é o +1 555 de teste)"
  fi
  echo ""
  echo "--- Status Cloud API / Coexistência ---"
  if [[ "$PHONE_STATUS" == "CONNECTED" ]] && [[ "$PLATFORM_TYPE" == "CLOUD_API" ]]; then
    ok "Número CONNECTED na Cloud API (coexistência ativa se is_on_biz_app=true)"
  elif [[ "$PHONE_STATUS" == "DISCONNECTED" ]] || [[ "$PLATFORM_TYPE" == "ON_PREMISE" ]]; then
    bad "Número ${PHONE_STATUS} / ${PLATFORM_TYPE} — mensagens chegam no celular mas a Meta NÃO envia webhooks"
    echo ""
    echo "  → No celular da pizzaria (WhatsApp Business):"
    echo "    Configurações → Conta → Plataforma comercial → Conectar"
    echo "  → Ou refaça o Embedded Signup escolhendo \"Conectar app WhatsApp Business\""
    echo "  → Esperado após reconectar: status=CONNECTED, platform_type=CLOUD_API"
  else
    warn "Status inesperado: ${PHONE_STATUS} / ${PLATFORM_TYPE} (is_on_biz_app=${IS_ON_BIZ_APP})"
  fi
else
  MSG=$(echo "$GRAPH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','erro desconhecido'))" 2>/dev/null || echo "resposta inválida")
  bad "Graph API falhou: $MSG"
  echo ""
  echo "  → Gere um Temporary access token em:"
  echo "    developers.facebook.com → App → WhatsApp → API Setup"
  echo "  → Cole em supabase/secrets.meta.env e rode: npm run secrets:meta"
fi

echo ""
echo "--- Supabase secrets remotos ---"
REMOTE=$(supabase secrets list 2>/dev/null || true)
for s in META_APP_SECRET META_ACCESS_TOKEN META_PHONE_NUMBER_ID META_VERIFY_TOKEN; do
  if echo "$REMOTE" | grep -q "$s"; then
    ok "Secret remoto: $s"
  else
    bad "Secret remoto ausente: $s — rode npm run secrets:meta"
  fi
done

echo ""
echo "=== Resumo: ${PASS} ok | ${WARN} avisos | ${FAIL} falhas ==="

if [[ $FAIL -eq 0 ]]; then
  echo ""
  if [[ "${IS_TEST_NUMBER:-0}" == "1" ]]; then
    echo "--- Próximos passos (modo teste) ---"
    echo "  • Envie mensagem do celular PARA +1 555-652-3526 para testar recebimento."
  else
    echo "--- Próximos passos (produção) ---"
    echo "  • Envie mensagem do celular PARA +55 11 93061-7116 (ou ${DISPLAY:-seu número BR})."
    echo "  • Confira em /admin/conversas se a thread apareceu."
  fi
  echo "  • META_ACCESS_TOKEN afeta ENVIO; recebimento usa webhook + META_APP_SECRET."
  echo "  • Token de System User (Employee) no Business Manager é permanente — mantenha-o seguro."
  echo "  • SQL: select phone_number, last_inbound_at from public.whatsapp_contacts;"
fi

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
