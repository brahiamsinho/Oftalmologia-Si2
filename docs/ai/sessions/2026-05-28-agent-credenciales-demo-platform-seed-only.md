# Sesión 2026-05-28 - credenciales demo + platform admin seed-only

## Objetivo
- Entregar un `.md` con todas las credenciales demo.
- Verificar y asegurar que el `platform admin` se cree por seeders y no por `.env`.

## Cambios realizados

### 1) Archivo central de credenciales demo
- Nuevo: `docs/ai/DEMO_CREDENTIALS.md`
- Incluye:
  - Platform admin (`public`)
  - Flota SaaS 5 clínicas (2 FREE, 2 PLUS, 1 PRO)
  - Admin/paciente/médicos demo de `clinica-demo`

### 2) Platform admin sin dependencia de `.env`
- Editado: `backend/seeders/seed_platform_admin.py`
  - removida lectura de `settings.PLATFORM_ADMIN_EMAIL/PASSWORD`
  - ahora usa credenciales demo fijas del seeder:
    - `platform@oftalmologia.local`
    - `platform123`

- Editado: `backend/apps/platform_admin/management/commands/ensure_platform_admin.py`
  - actualizado help/mensajes para reflejar flujo seed-only.

- Editado: `backend/entrypoint.sh`
  - removido bloque opcional `6b` que intentaba crear platform admin vía variables de entorno.

- Editado: `backend/config/settings.py`
  - removidas variables `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` (ya no usadas).

## Verificación

Comando ejecutado:

```bash
docker compose exec backend python manage.py seed --schema public --only platform_admin
```

Resultado:
- `✓ 0 creados, 1 ya existían` (idempotente y activo por seeder).

## Resultado
- Platform admin queda estandarizado por seeder.
- Credenciales demo quedan documentadas en un único archivo.
