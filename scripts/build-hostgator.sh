#!/usr/bin/env bash
# Build de produção para upload na HostGator (donarosapizzaria.com.br)
# Preferir: npm run build:hostgator (Node, funciona no Windows/PowerShell).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec node "$ROOT/scripts/build-hostgator.mjs"
