#!/usr/bin/env bash
# Regressão completa — automatizada, sem alterar CMS editorial.
set -euo pipefail

cd "$(dirname "$0")/.."

PASS=0
FAIL=0

run_step() {
  local label="$1"
  shift
  echo ""
  echo "=== ${label} ==="
  if "$@"; then
    echo "  ✓ OK"
    PASS=$((PASS + 1))
  else
    echo "  ✗ FALHOU"
    FAIL=$((FAIL + 1))
  fi
}

run_step "Unit tests (vitest)" npm run test --silent
run_step "E2E smoke (login + guard)" npm run test:e2e:smoke --silent
run_step "E2E regressão (público + admin readonly)" npm run test:e2e:regression --silent
run_step "API WhatsApp (readonly)" bash scripts/regression-api-whatsapp.sh

echo ""
echo "=== Resumo regressão: ${PASS} ok | ${FAIL} falhas ==="
echo "Manual + Meta: docs/qa-sample/REGRESSAO-E2E-COMPLETO.md"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
