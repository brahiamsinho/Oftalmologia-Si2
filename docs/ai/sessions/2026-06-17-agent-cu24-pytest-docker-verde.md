# Sesión 2026-06-17 — CU24 pytest Docker verde

## Objetivo

Corregir los 404 en los tests API de CU24 para `POST /t/<slug>/api/ia/urgency-classification/` sin tocar código productivo.

## Hallazgo

- `TenantSubfolderMiddleware` resuelve el tenant del path `/t/<slug>/...` contra `Domain.domain`.
- Los fixtures de `backend/apps/ia/tests/test_urgency_classification_api.py` creaban dominios tipo `tenant-cu24-xxx.localhost`, pero el path usaba `tenant_cu24_xxx`.
- En seeders, serializer y comando productivo se usa `Domain.domain=slug`, por lo que el bug estaba en el setup del test.

## Cambio aplicado

- En `test_urgency_classification_api.py`:
  - `domain=tenant.slug`
  - `domain=other_tenant.slug`

## Validación

- `docker compose exec backend pytest apps/ia/tests -q`
- Resultado: `13 passed in 89.54s`.

## Impacto

- Sin cambios productivos.
- Sin cambios de contrato API.
- Sin build ni commit.
