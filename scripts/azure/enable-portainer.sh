#!/usr/bin/env bash
# Activa Portainer en el stack de producción (sin tocar la app).
#
# Uso en VM:
#   chmod +x scripts/azure/enable-portainer.sh
#   ./scripts/azure/enable-portainer.sh
#
# Luego abrí: https://TU-DOMINIO/portainer/
# Primer acceso: creá usuario admin en Portainer.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(
  docker compose
  -f docker-compose.yml
  -f docker-compose.prod.yml
)

if [ -f docker-compose.https.yml ] && [ -d /etc/letsencrypt/live ]; then
  COMPOSE+=(-f docker-compose.https.yml)
fi

COMPOSE+=(-f docker-compose.portainer.yml)

echo "→ Levantando Portainer..."
"${COMPOSE[@]}" up -d portainer

echo "→ Recreando nginx (ruta /portainer/)..."
"${COMPOSE[@]}" up -d --force-recreate nginx

DOMAIN="${PUBLIC_DOMAIN:-}"
if [ -z "$DOMAIN" ] && [ -f .env ]; then
  DOMAIN="$(grep -E '^PUBLIC_DOMAIN=' .env | cut -d= -f2- | tr -d '\r' || true)"
fi

echo ""
echo "=============================================="
echo " Portainer activo"
echo "=============================================="
if [ -n "$DOMAIN" ]; then
  echo "  Web:  https://${DOMAIN}/portainer/"
else
  echo "  Web:  https://TU-DOMINIO/portainer/"
fi
echo "  SSH:  ssh -L 9000:127.0.0.1:9000 user@vm  →  http://127.0.0.1:9000"
echo ""
echo "  Primer acceso: definí usuario/contraseña admin en Portainer."
echo "  El socket Docker da control total — usá contraseña fuerte."
