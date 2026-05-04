# HANDOFF LATEST

## Resumen
**Fecha:** 2026-05-01 (Fase 3 CU14 cirugias)

**Backend:** nuevo modulo `apps.atencionClinica.cirugias` con CRUD en `/api/cirugias/` y accion `POST /api/cirugias/{id}/reprogramar/`.

**Datos/negocio:** estado de cirugia, fecha programada/real, cirujano, resultado y complicaciones; validaciones de coherencia paciente-historia-preoperatorio-cita y regla de cierre (`FINALIZADA` requiere fechas reales).

**Permisos/bitacora:** mutaciones y reprogramacion restringidas a `IsMedicoOrAdmin`; bitacora en create/update/delete/reprogramar con `modulo='cirugias'`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/cirugias/tests/test_cirugias.py` (permisos, validaciones, CRUD, reprogramacion). En host local no corre por falta de Django/DRF.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu14-fase3.md`

---

**Fecha:** 2026-05-01 (Fase 2 CU13 preoperatorio)

**Backend:** nuevo modulo `apps.atencionClinica.preoperatorio` con CRUD en `/api/preoperatorios/`, estado preoperatorio + checklist/examenes, validaciones de coherencia paciente-historia-evaluacion-cita y regla de aprobacion (checklist + apto anestesia).

**Permisos/bitacora:** mutaciones restringidas a `IsMedicoOrAdmin`; bitacora en create/update/delete con `modulo='preoperatorio'`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/preoperatorio/tests/test_preoperatorio.py` (permisos, validaciones, CRUD base, bitacora). En host local no corre por dependencia faltante DRF.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu13-fase2.md`

---

**Fecha:** 2026-05-01 (Fase 1 CU12 evaluacion quirurgica)

**Backend:** nuevo modulo `apps.atencionClinica.evaluacion_quirurgica` con CRUD en `/api/evaluaciones-quirurgicas/`, validaciones de coherencia paciente-historia-consulta, permisos por rol y bitacora en mutaciones.

**Integracion:** `INSTALLED_APPS` actualizado en `config/settings.py` y ruta incluida en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/evaluacion_quirurgica/tests/test_evaluacion_quirurgica.py` (permisos, validaciones, CRUD, bitacora). En host local no corre por dependencias faltantes de DRF; ejecutar en entorno backend Docker/venv del proyecto.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu12-fase1.md`

---

**Fecha:** 2026-04-12 (mobile paciente + API consultas/estudios)

**Mobile (paciente):** tarjeta del home muestra **última cita** si no hay próximas; accesos rápidos enlazan a pestaña **Citas** y a pantalla **Historial clínico** (consultas + estudios); contacto/emergencias con `CLINIC_PHONE` en `mobile/.env` (opcional). Repositorio `ClinicalRepository` → `consultas/lista/`, `consultas/estudios/`.

**Backend:** `ConsultaViewSet` y `EstudioViewSet` filtran por rol (PACIENTE por ficha vinculada al usuario; médico por `especialista`; admin todo + `paciente_id`).

Detalle: `docs/ai/sessions/2026-04-12-mobile-paciente-clinical-api.md`

---

**Fecha:** 2026-04-12 (actualización posterior)

**Docker backend:** `entrypoint.sh` ejecuta **`migrate --noinput`** antes de `collectstatic`, para que una Postgres nueva no quede sin tablas (sesiones, JWT blacklist, usuarios). El **seed** sigue manual.

**Roles / permisos en UI:** el modelo `Permiso` no tiene campo `activo`; el listado del modal filtraba `x.activo` (siempre `undefined` → vacío). Corregido a **`activo !== false`** y tipo opcional.

**Consultas:** nueva pantalla **`/consultas`** (sidebar Atención clínica); tras **Registrar consulta** redirige allí. **Lógica cita–paciente:** al elegir cita se completa paciente; citas filtradas por paciente y sin canceladas; **backend** valida que cita y paciente coincidan y marca la cita **ATENDIDA** al crear la consulta (estados programada/confirmada/reprogramada).

**Pacientes:** modal muestra error genérico si la API devuelve `detail` / `non_field_errors` o 500 sin mapa de campos.

**Axios `fetchAll`:** reescribe `next` con host `0.0.0.0` o `backend` al origen de `NEXT_PUBLIC_API_URL`.

---

Corrección integral del **frontend Next.js** respecto al prefijo API: el `baseURL` de Axios ya incluye `/api`, por lo que las páginas no deben llamar `/api/pacientes/` (eso generaba **`/api/api/...`** y 404). **Registrar consulta** y **medición** ahora usan **`POST /consultas/lista/`** y **`POST /consultas/estudios/`** con payload alineado al modelo Django.

**Backend:** `TIME_ZONE = America/La_Paz`; catálogo de permisos **solo lectura** en API para ADMIN/ADMINISTRATIVO; más eventos de **bitácora** (consultas, estudios, citas update/delete, roles, delete paciente); serializer de bitácora expone **`usuario_email`**.

**UX:** sidebar **drawer en móvil**; bitácora con contadores reales (`count`) y hora Bolivia; dashboard sin dato hardcodeado “24”; pantalla **Permisos** solo lectura; **Roles** carga permisos y roles en bloques independientes (un fallo no vacía el otro).

Detalle: `docs/ai/sessions/2026-04-12-frontend-api-bitacora-permisos.md`

## Qué debe hacer el siguiente agente
1. Leer `docs/ai/CURRENT_STATE.md` y la sesión citada arriba.
2. Verificar `.env`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api` (o equivalente; una sola URL).
3. Tras pull: probar flujo paciente → consulta → bitácora y creación de rol con permisos.
4. Si hace falta **export CSV** en bitácora, implementar endpoint o generación en cliente (botón deshabilitado con título “Próximamente”).

## Variables (recordatorio)
```
NEXT_PUBLIC_API_URL=.../api     # sin segunda barra /api en paths del cliente
```
