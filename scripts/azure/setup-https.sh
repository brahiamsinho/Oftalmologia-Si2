#!/usr/bin/env bash
# Certificado Let's Encrypt + nginx HTTPS (micrófono / PWA / contexto seguro).
#
# Uso:
#   chmod +x scripts/azure/setup-https.sh
#   ./scripts/azure/setup-https.sh oftalmologia-si2.westus3.cloudapp.azure.com tu@email.com
#
# Requisitos: puerto 80 abierto en Azure NSG, DNS apuntando a la VM.

set -euo pipefail

DOMAIN="${1:?Dominio requerido}"
EMAIL="${2:-admin@${DOMAIN}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.https.yml)

echo "==> HTTPS setup: ${DOMAIN}"

if ! command -v certbot >/dev/null 2>&1; then
  echo "→ Instalando certbot..."
  sudo apt-get update -qq
  sudo apt-get install -y certbot
fi

bash scripts/azure/patch-nginx-domain.sh "${DOMAIN}"

# Parchear rutas SSL en nginx https conf
sed -i.bak "s|/etc/letsencrypt/live/[^/]*/|/etc/letsencrypt/live/${DOMAIN}/|g" nginx/default.prod.https.conf
sed -i.bak "s/server_name .*;/server_name ${DOMAIN};/g" nginx/default.prod.https.conf
rm -f nginx/default.prod.https.conf.bak

echo "→ Deteniendo nginx (liberar puerto 80 para certbot)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

echo "→ Solicitando certificado Let's Encrypt..."
sudo certbot certonly --standalone \
  -d "${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  -m "${EMAIL}" \
  --preferred-challenges http

echo "→ Levantando stack con HTTPS..."
"${COMPOSE[@]}" up -d --force-recreate nginx

sleep 2
if docker ps --format '{{.Names}} {{.Ports}}' | grep nginx | grep -q '443'; then
  echo "✓ nginx publica puerto 443"
else
  echo "⚠ nginx NO muestra 443 — ejecutá:"
  echo "  ${COMPOSE[*]} up -d --force-recreate nginx"
  echo "  docker ps | grep nginx"
fi

echo ""
echo "=============================================="
echo " HTTPS activo: https://${DOMAIN}"
echo "=============================================="
echo ""
echo "Actualizá .env y rebuild frontend:"
echo "  FRONTEND_URL=https://${DOMAIN}"
echo "  NEXT_PUBLIC_API_URL=https://${DOMAIN}/api"
echo "  CORS_ALLOWED_ORIGINS=https://${DOMAIN}"
echo "  DJANGO_SECURE_SSL_REDIRECT=True"
echo ""
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.https.yml up -d --build frontend backend"
echo ""
echo "Azure NSG: abrir puerto 443 TCP"
