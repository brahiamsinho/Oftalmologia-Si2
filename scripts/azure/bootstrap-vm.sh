#!/usr/bin/env bash
# Bootstrap completo en Azure VM — desde repo clonado hasta stack arriba.
#
# Automatiza:
#   - Instalación Docker + Compose v2 (si faltan)
#   - .env con secretos + URLs del dominio (generate-env.sh)
#   - nginx server_name (patch-nginx-domain.sh)
#   - Build prod + up (deploy.sh)
#
# Uso (dentro de ~/Oftalmologia-Si2 después de git clone):
#   chmod +x scripts/azure/*.sh
#   ./scripts/azure/bootstrap-vm.sh oftalmologia-si2.westus3.cloudapp.azure.com
#
# Con IP pública en ALLOWED_HOSTS (opcional):
#   ./scripts/azure/bootstrap-vm.sh oftalmologia-si2.westus3.cloudapp.azure.com 20.150.149.206
#
# El DNS cloudapp (*.cloudapp.azure.com) se configura UNA VEZ en Azure Portal
# (Public IP → DNS name label). Este script no puede crearlo sin Azure CLI + login.

set -euo pipefail

DOMAIN="${1:-oftalmologia-si2.westus3.cloudapp.azure.com}"
VM_IP="${2:-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo " Bootstrap Azure VM — Oftalmología Si2"
echo " Dominio: ${DOMAIN}"
echo "=============================================="

# --- Docker ---
if ! command -v docker >/dev/null 2>&1; then
  echo "→ Instalando Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y docker.io docker-compose-v2 curl
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  echo "   Docker instalado. Si falla 'permission denied', ejecutá: newgrp docker"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose v2 no disponible."
  echo "       sudo apt install -y docker-compose-v2"
  exit 1
fi

# --- .env ---
if [ ! -f .env ]; then
  echo "→ Generando .env..."
  bash scripts/azure/generate-env.sh "${DOMAIN}" "${VM_IP}" > .env
  echo "   .env creado. Opcional: nano .env (GEMINI_API_KEY, etc.)"
else
  echo "→ .env ya existe — se reutiliza (no se sobrescribe)."
  echo "   Para regenerar: mv .env .env.bak && ./scripts/azure/bootstrap-vm.sh ${DOMAIN}"
fi

# --- Deploy ---
bash scripts/azure/deploy.sh "${DOMAIN}"

echo ""
echo "=============================================="
echo " Bootstrap terminado"
echo "=============================================="
echo ""
echo "Abrí en el navegador:"
echo "  App:     http://${DOMAIN}"
echo "  Mailhog: http://${DOMAIN}:8025"
echo ""
echo "Azure NSG (Portal → VM → Networking): puertos 80, 8025, 22"
echo "Credenciales demo: docs/ai/DEMO_CREDENTIALS.md"
