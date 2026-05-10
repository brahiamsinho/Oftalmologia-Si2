# Sesión 2026-05-09 — Esqueleto Reportes QBE (CU21/CU22)

## Qué se hizo
- App Django `apps.reportes` (tenant): modelo `ReportTemplate`, DRF ViewSet + acción `execute`, serializers, admin.
- Servicio `services/qbe_engine.py`: validación de payload, `QBEQueryBuilder`, documentación del rol “puente seguro” para integración IA.
- `TENANT_APPS`, rutas en `config/urls.py`, migración `0001_initial`. Rutas bajo `/api/reportes-qbe/plantillas/` (evita conflicto con CRM CU17 en `/api/reportes/`).

## Pendiente
- Registrar modelos en whitelist (`register_qbe_model` o `_QBE_MODEL_IMPORT_PATH` solo desde código de dominio).
- Ampliar motor: `Q` compuestos, agregaciones reales, permisos por rol para plantillas sistema vs usuario.
- Tests automatizados y documentación API en `docs/api/` si se expone a frontend.
