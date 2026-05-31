#!/usr/bin/env bash
# Despliegue producción automatizado — Azure VM
#
# Hace todo el flujo:
#   1. Verifica Docker
#   2. Genera .env si no existe (secretos aleatorios + URLs del dominio)
#   3. Parchea nginx con tu FQDN
#   4. Build de imágenes prod (NEXT_PUBLIC_* en build del frontend)
#   5. Levanta stack (migraciones/seeders vía entrypoint del backend)
#   6. Smoke test local
#
# Uso:
#   chmod +x scripts/azure/*.sh
#   ./scripts/azure/deploy.sh oftalmologia-si2.westus3.cloudapp.azure.com

set -euo pipefail

DOMAIN="${1:-oftalmologia-si2.westus3.cloudapp.azure.com}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "=========================================="
echo " Oftalmología Si2 — DEPLOY PRODUCCIÓN"
echo " Dominio: ${DOMAIN}"
echo "=========================================="

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Instalá Docker: sudo apt install -y docker.io docker-compose-v2"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Necesitás docker compose v2 (plugin)."
  exit 1
fi

# --- 1. .env ---
if [ ! -f .env ]; then
  echo "→ Generando .env automático..."
  bash scripts/azure/generate-env.sh "${DOMAIN}" > .env
  echo "   Creado .env con secretos aleatorios."
  echo "   Editá EMAIL/GEMINI si hace falta: nano .env"
  echo "   Luego volvé a ejecutar este script."
  exit 0
fi

# Validar que NEXT_PUBLIC_API_URL esté definida (se usa en build del frontend)
if ! grep -q '^NEXT_PUBLIC_API_URL=.' .env; then
  echo "ERROR: NEXT_PUBLIC_API_URL vacía en .env"
  exit 1
fi

# --- 2. nginx server_name ---
echo "→ Actualizando server_name en nginx..."
bash scripts/azure/patch-nginx-domain.sh "${DOMAIN}"

# --- 3. Build imágenes prod ---
echo "→ Construyendo imágenes (backend Gunicorn + frontend Next standalone)..."
echo "   (La primera vez puede tardar 5-15 min)"
"${COMPOSE[@]}" build --pull

# --- 4. Levantar ---
echo "→ Levantando contenedores..."
"${COMPOSE[@]}" up -d

# --- 5. Esperar backend (migraciones/seeders) ---
echo "→ Esperando backend (migraciones + seeders en entrypoint)..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1/api/health/" >/dev/null 2>&1; then
    echo "   API respondió OK (intento ${i})"
    break
  fi
  sleep 5
  if [ "$i" -eq 30 ]; then
    echo "   ⚠ API no respondió en 150s — revisá: ${COMPOSE[*]} logs -f backend"
  fi
done

# --- 6. Estado ---
echo ""
"${COMPOSE[@]}" ps

echo ""
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1/" 2>/dev/null || echo "000")
if echo "$HTTP_CODE" | grep -qE '200|307|308'; then
  echo "✓ Frontend/nginx OK (HTTP ${HTTP_CODE})"
else
  echo "⚠ Frontend HTTP ${HTTP_CODE} — revisá: ${COMPOSE[*]} logs -f frontend nginx"
fi

echo ""
echo "=========================================="
echo " LISTO: http://${DOMAIN}"
echo "=========================================="
echo ""
echo "Comandos útiles:"
echo "  ${COMPOSE[*]} logs -f backend"
echo "  ${COMPOSE[*]} logs -f frontend"
echo "  ${COMPOSE[*]} ps"
echo ""
echo "Actualizar código:"
echo "  git pull && ./scripts/azure/deploy.sh ${DOMAIN}"
