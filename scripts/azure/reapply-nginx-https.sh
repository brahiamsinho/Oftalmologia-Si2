#!/usr/bin/env bash
# Recrear nginx con puerto 443 (fix tras git pull; certificado ya debe existir).
#
# Uso en VM:
#   ./scripts/azure/reapply-nginx-https.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.https.yml)

echo "→ Recreando nginx (80 + 443 + SSL)..."
"${COMPOSE[@]}" up -d --force-recreate nginx

sleep 2
echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'nginx|NAMES'

echo ""
if curl -sf "https://127.0.0.1/api/health/" -k >/dev/null 2>&1; then
  echo "✓ HTTPS local OK"
else
  echo "⚠ curl https local falló — revisá: docker compose logs nginx --tail 30"
fi
