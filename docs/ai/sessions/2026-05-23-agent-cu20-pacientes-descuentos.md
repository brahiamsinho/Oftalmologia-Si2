# Sesión 2026-05-23 — CU19 en pacientes + CU20 backend

## Objetivo

1. Mostrar cobertura de seguros en ficha de paciente (web).
2. Implementar CU20 (descuentos/campañas clínicas) en backend, distinto de CRM.

## Hecho

### Frontend — pacientes

- `components/seguros/PatientSeguroPanel.tsx`: verificar cobertura + listar afiliaciones.
- `components/descuentos/PatientBeneficiosPanel.tsx`: promociones aplicables vía API CU20.
- `pacientes/page.tsx`: sección "Seguros y beneficios" en modal de edición.

### Backend — CU20

- App `apps.descuentos` con modelos, migración `0001_initial`, views, serializers, services.
- Rutas: `/api/descuentos/promociones/`, `/beneficios/`, acciones `aplicables` y `verificar-aplicacion`.
- Seeder `seed_descuentos` registrado en `seed.py` y `entrypoint.sh`.
- Migración y seed aplicados en Docker (`clinica_demo`).

## Probar

1. Login `admin@clinica-demo.local` / `admin123`.
2. Pacientes → editar un paciente con afiliación (seed seguros).
3. Ver bloques de cobertura y descuentos.
4. API: `GET /api/descuentos/promociones/aplicables/?paciente_id=1`

## Pendiente

- Pantalla admin `/descuentos` (CRUD promociones y asignaciones).
- Notificación automática al asignar beneficio (paso 9 del CU20).
- Tests pytest con `tenant_context`.
- CU18: cron, UI recordatorios.
