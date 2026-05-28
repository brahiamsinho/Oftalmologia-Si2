# Sesion 2026-05-27 - Fix Docker frontend/scheduler

## Problema reportado

En arranque local con Docker se observaban:

- `frontend` con `GET / 500` por `next/image` y host remoto no permitido (`images.unsplash.com`).
- `backup-scheduler` con tracebacks tempranos (`relation ... does not exist`) al ejecutar antes de que terminaran migraciones/bootstrap inicial.
- Ruido en frontend entrypoint: `rm: can't remove '.next': Resource busy`.

## Cambios aplicados

- `frontend/next.config.js`
  - Se agregó `images.unsplash.com` a `images.remotePatterns`.
  - Se mantiene además el patrón dinámico derivado de `NEXT_PUBLIC_API_URL`.

- `backend/apps/backup/management/commands/backup_automatico.py`
  - Guardas para `ProgrammingError`/`OperationalError` al consultar tenants al inicio.
  - Si tablas base no existen aún, el comando avisa y finaliza ese ciclo sin traceback.

- `frontend/docker-entrypoint.sh`
  - Limpieza de `.next` tolerante: `rm -rf .next || true`.

## Resultado esperado

- La landing del frontend deja de devolver `500` por configuración de imágenes.
- El scheduler ya no ensucia logs con errores críticos durante bootstrap temprano.
- Menos ruido en startup del contenedor frontend.
