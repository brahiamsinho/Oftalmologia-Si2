#!/usr/bin/env bash
# Actualiza server_name en configs nginx para el dominio Azure.
# Uso: ./scripts/azure/patch-nginx-domain.sh oftalmologia-si2.westus3.cloudapp.azure.com

set -euo pipefail

DOMAIN="${1:?FQDN requerido, ej: oftalmologia-si2.westus3.cloudapp.azure.com}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

for conf in "${ROOT}/nginx/default.conf" "${ROOT}/nginx/default.prod.conf"; do
  if [ -f "$conf" ]; then
    sed -i.bak "s/server_name .*;/server_name ${DOMAIN};/" "$conf"
    rm -f "${conf}.bak"
    echo "✓ server_name → ${DOMAIN} en $(basename "$conf")"
  fi
done
