#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
while ! nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Applying database migrations..."
# migrate_safe usa un advisory lock de PostgreSQL → es imposible que dos procesos
# corran migraciones al mismo tiempo, sin importar desde dónde se lance el comando.
#python manage.py migrate_safe --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

exec "$@"
