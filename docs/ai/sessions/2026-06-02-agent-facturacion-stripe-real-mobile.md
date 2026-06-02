# Sesión 2026-06-02 — Facturación: Stripe real en mobile/web

## Objetivo

Reemplazar flujo percibido como "simulación" por pasarela real Stripe para pagos en línea de facturas clínicas desde mobile.

## Cambios técnicos

- Archivo: `backend/apps/administracionFinanciera/facturacion/services/pasarela.py`
  - Se agregó activación condicional de Stripe (`STRIPE_SECRET_KEY` + dependencia instalada).
  - Nuevo helper para URLs de retorno de Stripe (`success_url`, `cancel_url`) con contexto tenant.
  - `iniciar_pago_en_linea(...)` ahora usa Stripe Checkout en modo real cuando está habilitado.
  - Se reutiliza sesión Stripe previa en cobro pendiente cuando aplica.
  - Si Stripe indica que la sesión ya pagó (`payment_status=paid`), confirma internamente el cobro.
  - Se mantiene fallback mock para entornos sin Stripe.

- Archivo: `backend/apps/administracionFinanciera/facturacion/views.py`
  - `iniciar_pago_en_linea_action` ahora envía `tenant_slug` al servicio de pasarela.

## Estado funcional esperado

- Con `STRIPE_SECRET_KEY` configurada:
  - `Pagar en línea` abre Stripe Checkout real.
  - No debería aparecer flujo de simulación mock.
- Sin `STRIPE_SECRET_KEY`:
  - se conserva comportamiento mock para desarrollo.

## Validación

- `docker compose exec backend python manage.py check` -> OK.
- Linter IDE en archivos backend modificados -> sin errores.

## Pendiente

- Automatizar confirmación post-checkout (webhook/polling app) para actualizar factura sin depender de refresh manual.
