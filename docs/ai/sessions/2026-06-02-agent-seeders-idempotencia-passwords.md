# Sesión 2026-06-02 — Seeders idempotentes y sync de contraseñas demo

## Problema reportado

Al reconstruir contenedores Docker, el usuario percibía que los seeders “sobreescribían” datos y el login de plataforma fallaba con credenciales demo.

## Diagnóstico

1. PostgreSQL **persiste** en volumen `postgres_data` — log: `Database directory appears to contain a database; Skipping initialization`.
2. Seeders son **idempotentes**: `creados=0, existentes=N` = no se creó nada nuevo, no borrado masivo.
3. El login fallaba cuando la BD tenía usuarios viejos con contraseña distinta a la del código demo.
4. API backend OK tras sync: `POST /api/public/platform/auth/login/` → 200.

## Cambios

- `seeders/demo_password_sync.py` + env `SYNC_DEMO_PASSWORDS=1`
- `seed_platform_admin.py`: status `synced`, IntegrityError también sincroniza password
- `seed_admin.py`: sync password `admin123` si usuario existe
- `entrypoint.sh` + `seed.py`: log `passwords_synced`
- `PlatformLoginSerializer`: lookup `email__iexact`
- Frontend `/platform/login`: mensaje distinto si error de red

## Reset total de datos (solo si lo necesitas)

```bash
docker compose down -v   # borra postgres_data
docker compose up -d --build
```
