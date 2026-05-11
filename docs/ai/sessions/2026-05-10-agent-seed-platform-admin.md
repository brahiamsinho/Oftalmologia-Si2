# Sesión: seeder superadmin plataforma

**Fecha:** 2026-05-10

## Qué se hizo

- Nuevo `backend/seeders/seed_platform_admin.py`: crea `PlatformAdministrator` en schema `public`, reutilizable por `manage.py seed` y por `ensure_platform_admin`.
- Credenciales: `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD`; si faltan y `DEBUG=True`, fallback documentado (`platform@oftalmologia.local` / `platform123`).
- `manage.py seed`: opción `--only platform_admin`; en schema distinto de `public` el seeder no corre en bundle tenant; `--schema public` sin `--only` ahora exige seeder explícito (evita correr `seed_admin` en `public`).
- `entrypoint.sh`: `public_seeders = ['seeders.seed_platform_admin']` cuando `RUN_SEEDERS=1`.
- Documentación: README, `.env.example`, `PLATFORM_SAAS.md`, `CURRENT_STATE`, `HANDOFF_LATEST`.
