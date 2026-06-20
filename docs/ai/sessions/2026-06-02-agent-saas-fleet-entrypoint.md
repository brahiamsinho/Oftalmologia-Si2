# Sesión 2026-06-02 — Flota SaaS en entrypoint

## Objetivo
Exponer 5 clínicas demo con credenciales en arranque Docker y datos operativos por tenant.

## Cambios
- `seed_saas_demo_fleet.py`: seeders tenant completos vía `tenant_seeders.run_tenant_seeders()`.
- Nuevo `seeders/tenant_seeders.py`: lista canónica de seeders por clínica.
- `entrypoint.sh`: `RUN_SAAS_DEMO_FLEET=1` (default) ejecuta flota tras `seed_platform_admin`.
- `seed.py`: fix sintaxis `reporting_6months`; excluir `saas_demo_fleet` fuera de public.
- `seed_platform_admin.py`: sincroniza password demo si el usuario ya existe.

## Validación
```bash
docker compose exec backend python manage.py seed --schema public --only saas_demo_fleet
```
→ 1250 creados (5 tenants + datos).

## Credenciales
Ver `docs/ai/DEMO_CREDENTIALS.md` §2.
