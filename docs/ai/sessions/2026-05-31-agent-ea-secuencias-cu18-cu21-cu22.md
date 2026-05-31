# Session Log - 2026-05-31 - EA Secuencias CU18 CU21 CU22

## Objetivo

Crear diagramas de secuencia UML 2.5 en Enterprise Architect para:
- CU18 Gestionar recordatorios y notificaciones automaticas
- CU21 Gestionar facturacion, cobros y pasarela de pago
- CU22 Generar informes personalizados

## Fuente de verdad usada

### CU18
- `frontend/src/lib/services/notificaciones.ts`
- `frontend/src/app/(dashboard)/(gestion-crm)/crm/recordatorios/page.tsx`
- `backend/apps/crm/notificaciones/automatizaciones/views.py`
- `backend/apps/crm/notificaciones/automatizaciones/services/processing.py`

### CU21
- `frontend/src/lib/services/facturacion.ts`
- `backend/apps/administracionFinanciera/facturacion/views.py`
- `backend/apps/administracionFinanciera/facturacion/services/pasarela.py`

### CU22
- `frontend/src/lib/services/reportes.ts`
- `frontend/src/components/reportes/PredefinedReportsPanel.tsx`
- `frontend/src/components/reportes/SaveReportTemplateDialog.tsx`
- `backend/apps/reportes/views.py`
- `backend/apps/reportes/urls.py`

## Cambios en EA

- Package creado: `/Model/2.6 Diagramas de Secuencia` (ID 20)
- Diagramas creados:
  - `SD-CU18 Gestionar recordatorios y notificaciones` (ID 53)
  - `SD-CU21 Gestionar facturacion, cobros y pasarela` (ID 54)
  - `SD-CU22 Generar informes personalizados` (ID 55)

## Notas

- Se uso modelado de interacciones actor -> frontend -> service -> viewset -> servicio dominio -> persistencia.
- Diagramas abiertos en EA para ajuste visual final por parte del usuario (alineacion/estetica segun plantilla de catedra).
