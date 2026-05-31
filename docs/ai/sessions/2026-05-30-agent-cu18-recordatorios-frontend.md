# Sesión 2026-05-30 — CU18 Recordatorios: Frontend + Cron Docker

## Resumen de la sesión

Se completó el frontend del CU18 (Gestionar recordatorios y notificaciones automáticas) y se cerró el gap crítico del cron job en Docker Compose.

## Cambios implementados

### 1. Docker Compose — `recordatorios-scheduler`
- **Archivo:** `docker-compose.yml`
- **Qué hace:** Servicio nuevo que ejecuta `python manage.py procesar_recordatorios` cada 60 segundos.
- **Por qué era crítico:** Sin este servicio, las tareas `PENDIENTE` se acumulaban en la BD pero nunca se enviaban automáticamente.
- **Patrón:** Idéntico al `backup-scheduler` ya existente.

### 2. Servicio API — `notificaciones.ts`
- **Archivo:** `frontend/src/lib/services/notificaciones.ts`
- **Interfaces:** `Notificacion`, `ReglaRecordatorio`, `TareaRecordatorioProgramada`, `LogEjecucion` + payloads.
- **Métodos cubren:** historial, marcar leída/todas, dispositivos FCM, CRUD reglas, tareas, procesarLote, logs.

### 3. Header — Campana conectada al API real
- **Archivo:** `frontend/src/components/layout/Header.tsx`
- **Cambios:**
  - Badge dinámico (contador real de no leídas).
  - Panel dropdown `NotifPanel` con lista, botón "Leídas", link "Ver todo" y link a reglas.
  - Marcar una notificación como leída al hacer click (optimistic update).
  - Los dos dropdowns (notificaciones + usuario) son mutuamente exclusivos.

### 4. Página Recordatorios — `/crm/recordatorios`
- **Archivo:** `frontend/src/app/(dashboard)/(gestion-crm)/crm/recordatorios/page.tsx`
- **Tabs:**
  - **Reglas:** CRUD con modal (crear/editar), toggle activa, eliminar con confirm.
  - **Tareas:** tabla filtrable por estado, botón "Procesar pendientes".
  - **Logs:** historial INFO/ERROR de ejecuciones.
- **UX:** chips de estado (cron activo, push FCM), estados vacíos, skeletons de carga.

### 5. Sidebar — Recordatorios bajo CRM
- **Archivo:** `frontend/src/components/layout/Sidebar.tsx`
- **Cambios:** NavItem "Recordatorios" con icono Bell bajo NavGroup CRM. Keywords CU18 en NAV_CATALOG.

## Estado del CU18 al cerrar sesión

| Componente | Estado |
|-----------|--------|
| Backend (reglas, señales, FCM, command) | Parcial → núcleo completo |
| Docker cron (envío automático) | ✅ Implementado |
| Servicio API frontend | ✅ Implementado |
| Campana notificaciones Header | ✅ Conectada al API real |
| Página /crm/recordatorios | ✅ Implementada |
| Sidebar CRM > Recordatorios | ✅ Agregado |
| Email/SMS/WhatsApp automáticos | ❌ Pendiente (no solicitado) |

## Próximos pasos sugeridos

1. Probar en Docker con `docker compose up --build recordatorios-scheduler`
2. Registrar un token FCM desde la app móvil y verificar que las notificaciones llegan
3. Implementar canales email/SMS si se requiere cobertura completa del CU18
