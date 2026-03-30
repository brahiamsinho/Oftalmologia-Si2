#!/bin/sh
set -e
cd /app

STAMP=/app/node_modules/.docker-install-stamp
LOCK=package-lock.json

need_install=0
if [ ! -x node_modules/.bin/next ]; then
  need_install=1
fi
if [ ! -f "$STAMP" ]; then
  need_install=1
fi
if [ -f "$LOCK" ] && [ -f "$STAMP" ] && [ "$LOCK" -nt "$STAMP" ]; then
  need_install=1
fi

if [ "$need_install" = "1" ]; then
  echo "[frontend] Instalando dependencias npm (volumen node_modules o lockfile desactualizado)..."
  if [ -f "$LOCK" ]; then
    npm ci
  else
    npm install
  fi
  touch "$STAMP"
  # Evita CSS/layout rotos por caché de Tailwind/PostCSS de un build anterior
  rm -rf .next
  echo "[frontend] Dependencias listas."
fi

exec "$@"
