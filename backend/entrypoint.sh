#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

while ! nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 1
done

echo "PostgreSQL is ready!"

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "Applying public/shared schema migrations..."
  python manage.py migrate_schemas --shared --noinput

  echo "Ensuring public tenant..."
  python manage.py bootstrap_public_tenant --domain "${PUBLIC_DOMAIN:-localhost}" || true

  echo "Applying tenant schema migrations..."
  python manage.py migrate_schemas --tenant --noinput
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

exec "$@"