# Sesión 2026-06-17 — CU24 backend urgency classification

## Objetivo

Implementar CU24 en backend: clasificar nivel de urgencia de consultas de pacientes mediante endpoint separado del chatbot CU23.

## Cambios realizados

- Endpoint nuevo tenant:
  - `POST /t/<slug>/api/ia/urgency-classification/`
- Modelo nuevo:
  - `ChatbotUrgencyClassification` en `backend/apps/ia/models.py`.
  - Tabla: `ia_chatbot_urgency_classifications`.
  - Sin `tenant_id` porque `apps.ia` está en `TENANT_APPS` y el aislamiento es por schema.
- Service nuevo:
  - `backend/apps/ia/services/urgency_classifier.py`.
  - Reglas determinísticas para `BAJO`, `MEDIO`, `ALTO`, `CRITICO`, `INSUFICIENTE`, `INDETERMINADO`.
  - No depende de Gemini.
- API:
  - `UrgencyClassificationView` resuelve paciente desde `request.user`.
  - Permisos: `IsAuthenticated + IsPaciente`.
  - Rechaza campos de spoofing desde frontend (`paciente_id`, `nivel`, `estado_derivacion`, etc.).
  - Registra bitácora sin incluir el mensaje clínico completo.
- Tests agregados:
  - `backend/apps/ia/tests/test_urgency_classifier.py`.
  - `backend/apps/ia/tests/test_urgency_classification_api.py`.
- Trazabilidad PUDS:
  - `docs/ai/PACKAGE_CU_MAP.md` actualizado: CU24 backend implementado; CU25 sigue pendiente.

## Validación ejecutada

- `python -m py_compile ...` sobre archivos IA modificados/agregados: OK.
- `python manage.py makemigrations ia`: no ejecutó por falta de Django en Python local.
- `docker compose ps`: no ejecutó porque Docker Desktop no está levantado (`dockerDesktopLinuxEngine` no disponible).
- `python manage.py check`: no ejecutó por falta de Django.
- `pytest apps/ia/tests`: no coleccionó por falta de `django` y `rest_framework`.

## Pendientes

- En entorno correcto Docker/venv:
  - `python manage.py check`
  - `pytest apps/ia/tests`
  - `python manage.py makemigrations ia --check --dry-run` para contrastar migración manual.
  - `python manage.py migrate_schemas --tenant` cuando toque aplicar.
- CU25 sigue pendiente: usar `estado_derivacion=PENDIENTE` para crear flujo humano real, pero NO fue implementado en esta sesión.

## Riesgos

- La migración `backend/apps/ia/migrations/0001_initial.py` fue creada manualmente por falta de runtime Django local/Docker; debe contrastarse con `makemigrations --check --dry-run` en un entorno válido.
- Las reglas clínicas son iniciales y conservadoras; requieren revisión funcional/oftalmológica si se quiere usarlas como criterio operativo real.
