# Sesion 2026-05-27 - Stripe planes + reportes 6 meses

## Objetivo

1. Activar pasarela de pago para cambios de plan.
2. Verificar estado de backup/reportes IA.
3. Generar data semilla histórica para reportes (mínimo 6 meses).

## Cambios implementados

### 1) Stripe para planes

- Backend:
  - `POST /t/<slug>/api/organization/change-plan/checkout/`
    - crea sesión Stripe Checkout para planes pagados.
  - `POST /t/<slug>/api/organization/change-plan/confirm-stripe/`
    - confirma sesión pagada y aplica nuevo plan.
  - `POST /api/public/stripe/webhook/`
    - webhook opcional para eventos `checkout.session.completed`.
- Settings:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_CURRENCY` (default `usd`)
- Dependencia:
  - `stripe` agregada en `requirements/base.txt`.
- Frontend:
  - `planes/page.tsx` ahora envía upgrades a checkout Stripe.
  - Al retornar con `checkout=success&session_id=...`, confirma contra backend y refresca plan actual.

### 2) Reportes IA (Gemini) y backup: revisión

- Gemini NL→QBE:
  - Endpoint `POST /t/<slug>/api/ia/nlp-to-report/` activo.
  - Traducción por `GeminiQBETranslator` y ejecución segura en `QBEEngine`.
  - Requiere `GEMINI_API_KEY` configurada.
- Backup:
  - Módulo `apps.backup` activo con create/list/restore/download/config + scheduler `backup_automatico`.
  - Validaciones por plan y bitácora implementadas.

### 3) Seeder histórico 6 meses

- Nuevo: `backend/seeders/seed_reporting_6months.py`
  - Genera pacientes y citas distribuidos en 6 meses con estados variados.
  - Diseñado para explotar reportes (QBE + IA).
- Integración:
  - `backend/apps/core/management/commands/seed.py` agrega opción `--only reporting_6months`.
  - `backend/entrypoint.sh` lo incluye en seeders tenant por defecto.

## Cómo probar rápido

1. Rebuild backend por nueva dependencia:
   - `docker compose build backend backup-scheduler`
2. Levantar:
   - `docker compose up -d`
3. Stripe:
   - configurar `STRIPE_SECRET_KEY` (y opcional webhook secret) en `.env`.
   - ir a `/planes`, elegir upgrade pago, completar checkout.
4. Seed histórico manual (si hace falta):
   - `docker compose exec backend python manage.py seed --tenant clinica-demo --only reporting_6months`
