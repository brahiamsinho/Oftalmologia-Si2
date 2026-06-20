# Sesion 2026-06-17 - CU23 backend asistente virtual para Paciente

## Objetivo

Implementar el backend de CU23 dentro de `backend/apps/InteligenciaArtificial`, permitiendo que un Paciente autenticado consulte al asistente virtual en lenguaje natural, reciba orientacion automatica autorizada y deje la interaccion registrada.

## Alcance implementado

- App Django tenant nueva: `apps.InteligenciaArtificial`.
- Modelo `InteraccionAsistenteVirtual` con usuario, conversacion, mensaje, respuesta, intencion, estado, prioridad, sintomas detectados, metadata, IP/user-agent y fecha.
- Servicio `AsistenteVirtualService` para clasificacion deterministica: citas/horarios, procedimientos, preoperatorio, postoperatorio, seguros/facturacion, sistema, saludo, fuera de alcance, no comprendida y urgencia.
- Endpoint principal: `POST /t/<slug>/api/inteligencia-artificial/asistente-virtual/`.
- Alias: `POST /t/<slug>/api/ia/asistente-virtual/`.
- Historial: `GET /t/<slug>/api/inteligencia-artificial/interacciones-asistente/` con filtro opcional `?id_conversacion=<uuid>`.
- Seguridad: `IsAuthenticated` + `IsPaciente`.
- Auditoria: crea evento en `Bitacora` con modulo `inteligencia_artificial`, sin copiar el mensaje completo en la descripcion.

## Archivos creados

- `backend/apps/InteligenciaArtificial/apps.py`
- `backend/apps/InteligenciaArtificial/models.py`
- `backend/apps/InteligenciaArtificial/serializers.py`
- `backend/apps/InteligenciaArtificial/views.py`
- `backend/apps/InteligenciaArtificial/urls.py`
- `backend/apps/InteligenciaArtificial/admin.py`
- `backend/apps/InteligenciaArtificial/services/asistente_virtual.py`
- `backend/apps/InteligenciaArtificial/migrations/0001_initial.py`
- `backend/apps/InteligenciaArtificial/tests/test_asistente_virtual.py`

## Archivos modificados

- `backend/config/settings.py`
- `backend/config/urls.py`
- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`
- `docs/ai/PACKAGE_CU_MAP.md`
- `docs/ai/DECISIONS_LOG.md`

## Contrato de respuesta

Respuesta exitosa `201`:

```json
{
  "id_interaccion": 1,
  "id_conversacion": "uuid",
  "id_usuario": 3,
  "mensaje": "Necesito saber horarios",
  "respuesta": "Puedo orientarte...",
  "intencion": "CITAS_HORARIOS",
  "estado": "RESPONDIDA",
  "requiere_clasificacion_urgencia": false,
  "nivel_prioridad": "NO_APLICA",
  "sintomas_detectados": [],
  "metadata": {},
  "fecha_creacion": "..."
}
```

Si detecta sintomas:

```json
{
  "intencion": "URGENCIA",
  "estado": "REQUIERE_CU24",
  "requiere_clasificacion_urgencia": true,
  "nivel_prioridad": "ALTA",
  "metadata": {
    "cu24_activado": true
  }
}
```

## Validacion ejecutada

- No se pudo ejecutar `python manage.py check` en host: falta Django en el Python local.
- No se pudo ejecutar pytest en host: falta DRF en el Python local.
- No se pudo ejecutar Docker: Docker Desktop no estaba levantado (`dockerDesktopLinuxEngine` no disponible).
- Si se ejecuto validacion sintactica sin imports de Django: `compile(...)` sobre archivos nuevos: OK.

## Validacion pendiente

Cuando Docker este disponible:

```bash
docker compose exec backend python manage.py check
docker compose exec backend pytest apps/InteligenciaArtificial/tests/test_asistente_virtual.py -q
docker compose exec backend python manage.py migrate_schemas --tenant
```

## Relacion PUDS

- Analisis: el CU23 queda trazado como caso de uso del paquete Inteligencia artificial.
- Diseno: se separan vista, serializador, servicio de dominio y modelo persistente.
- Implementacion: app tenant modular dentro del backend Django.
- Pruebas: tests unitarios/API basicos agregados; falta ejecucion real en entorno Docker.
- Pendiente de diseno: CU24 debe convertirse en flujo formal de clasificacion de urgencia, consumiendo el flag generado por CU23.
