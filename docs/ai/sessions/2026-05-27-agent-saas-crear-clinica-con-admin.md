# Sesion 2026-05-27 - SaaS crear clinica con administrador

## Objetivo

Garantizar que cada nueva clínica creada desde el panel SaaS tenga administrador inicial en su propio tenant.

## Cambios aplicados

- Backend (`backend/apps/tenant/serializers.py`)
  - `TenantCreateSerializer` ahora requiere:
    - `admin_email`
    - `admin_password`
    - `admin_nombres`
    - `admin_apellidos`
    - `admin_username` opcional
  - Creación de admin dentro del schema del tenant usando `schema_context`.
  - Alta vía `create_superuser` con `tipo_usuario=ADMIN`.
  - Validaciones mínimas de nombres/apellidos y control de email duplicado dentro del tenant.

- Frontend (`frontend/src/app/platform/dashboard/page.tsx`)
  - Modal "Nueva clínica" ampliado con bloque "Administrador inicial (obligatorio)".
  - Envío de nuevos campos al `POST /api/public/tenants/`.

## Verificación funcional esperada

1. En `/platform/dashboard` crear clínica con los nuevos campos de admin.
2. Ingresar por `/login` al workspace recién creado con ese correo/password admin.
3. Confirmar acceso al dashboard de clínica.

## Nota de estado (backup y pagos)

- Backup: implementado (app `apps.backup`, scheduler, restore, límites por plan, endpoints y tests en repo).
- Pagos: existe base de datos/campos para suscripción (`proveedor_pago`, `referencia_pago`, etc.) y flujo de cambio de plan, pero no se ve integración completa de checkout/pasarela activa en backend dentro de este ajuste.
