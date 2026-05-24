# Sesión 2026-05-23 — CU22 Reportes (web)

## Objetivo

Cerrar **CU22 Informes personalizados** en web sobre rama `sprint3-comienzo`, reutilizando `apps.reportes` + pantalla `/reportes`.

## Hecho

### Backend

- `ReportTemplateViewSet` ampliado: bitácora, filtro sistema/personalizado, `run/`, protección plantillas `is_system_report=True`.

### Frontend

- `lib/services/reportes.ts` — API plantillas y export Excel.
- Componentes: `PredefinedReportsPanel`, `SavedReportsPanel`, `SaveReportTemplateDialog`, `ReportExportButton`.
- `reportes/page.tsx` — integración CU22 (predefinidos, guardar, exportar, lista personalizada).
- `useSmartReport` — `loadReportResult` para ejecutar plantillas sin IA.

## Pendiente / validación manual

1. Docker: migración `reportes.0002` en tenant demo; login `admin@clinica-demo.local`.
2. Probar: ejecutar “Pacientes Nuevos” / “Ausentismo”; guardar plantilla; export Excel; bitácora módulo `reportes`.
3. Registrar modelos en whitelist QBE si algún informe falla por modelo no permitido.
4. Mobile CU22: recuperar stash o cherry-pick de `f11f9b9` si se desea paridad app.

## Archivos tocados

- `backend/apps/reportes/views.py`
- `frontend/src/lib/services/reportes.ts`
- `frontend/src/components/reportes/*.tsx` (nuevos)
- `frontend/src/app/(dashboard)/(gestion-reportes)/reportes/page.tsx`
- `frontend/src/hooks/useSmartReport.ts`
