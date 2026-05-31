#!/usr/bin/env bash
# Genera un .env listo para Azure VM a partir del FQDN público.
# Uso: ./scripts/azure/generate-env.sh oftalmologia-si2.westus3.cloudapp.azure.com > .env

set -euo pipefail

DOMAIN="${1:-oftalmologia-si2.westus3.cloudapp.azure.com}"
VM_IP="${2:-}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"

ALLOWED_HOSTS="localhost,127.0.0.1,${DOMAIN}"
if [ -n "${VM_IP}" ]; then
  ALLOWED_HOSTS="${ALLOWED_HOSTS},${VM_IP}"
fi

SECRET_KEY="$(openssl rand -hex 32 2>/dev/null || python3 -c 'import secrets; print(secrets.token_hex(32))')"
DB_PASS="$(openssl rand -hex 16 2>/dev/null || python3 -c 'import secrets; print(secrets.token_hex(16))')"
PASARELA_SECRET="$(openssl rand -hex 24 2>/dev/null || python3 -c 'import secrets; print(secrets.token_hex(24))')"

cat <<EOF
# Generado por scripts/azure/generate-env.sh — $(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMPOSE_PROJECT_NAME=oftalmologia-si2

PUBLIC_DOMAIN=${DOMAIN}
AZURE_PUBLIC_FQDN=${DOMAIN}

POSTGRES_DB=oftalmologia
POSTGRES_USER=oftalmologia
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_HOST=db
POSTGRES_PORT=5432

DJANGO_SECRET_KEY=${SECRET_KEY}
DJANGO_DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings
DJANGO_ALLOWED_HOSTS=${ALLOWED_HOSTS}
DJANGO_SECURE_SSL_REDIRECT=False

CORS_ALLOWED_ORIGINS=http://${DOMAIN},https://${DOMAIN}
FRONTEND_URL=http://${DOMAIN}

JWT_ACCESS_TOKEN_LIFETIME=30
JWT_REFRESH_TOKEN_LIFETIME=7
PASARELA_MOCK_SECRET=${PASARELA_SECRET}

DEMO_TENANT_SCHEMA=clinica_demo
DEMO_TENANT_SLUG=clinica-demo
DEMO_TENANT_NAME=Clínica Demo
DEMO_TENANT_EMAIL=demo@oftalmologia.local
DEMO_TENANT_DOMAIN=clinica-demo
RUN_SEEDERS=1

NEXT_PUBLIC_API_URL=http://${DOMAIN}/api
NEXT_PUBLIC_APP_NAME=OftalmoCRM

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mailhog
EMAIL_PORT=1025
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=False
DEFAULT_FROM_EMAIL=noreply@${DOMAIN}
HOST_PORT_MAILHOG_UI=8025

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

HOST_PORT_POSTGRES=5432
HOST_PORT_BACKEND=8000
HOST_PORT_FRONTEND=3000
EOF
