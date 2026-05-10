"""
Motor QBE (Query By Example) — puente seguro entre entrada estructurada y el ORM.

Propósito
---------
Este módulo es el **único punto autorizado** para traducir un `qbe_payload` (JSON
con forma declarada) a consultas Django (`filter`, `Q`, `annotate`, etc.).

Seguridad e integración futura con IA
-------------------------------------
- **Prohibido**: ejecutar SQL textual generado desde texto libre, prompts o
  parámetros sin validar (riesgo de inyección y exfiltración).
- **Obligatorio**: cualquier agente o asistente que “arme reportes” debe
  limitarse a producir **solo** JSON que cumpla el contrato QBE validado aquí
  y en `ReportExecutionSerializer`. La IA nunca debe enviar SQL ni fragmentos
  de ORM crudos.
- **Whitelist**: solo los modelos listados en `ALLOWED_MODELS` son consultables;
  cualquier otro nombre de modelo debe rechazarse (p. ej. con `ValidationError`).

Referencias de implementación futura
------------------------------------
- Construcción de `django.db.models.Q` a partir de grupos OR/AND en el JSON.
- `annotate` / agregaciones declarativas con lista blanca de funciones.
"""
from __future__ import annotations

import re
from typing import Any

from django.apps import apps
from django.core.exceptions import FieldDoesNotExist, FieldError, ValidationError
from django.db import models
from django.db.models import QuerySet
from django.db.models.fields.related import ForeignObjectRel

from apps.atencionClinica.citas.models import Cita
from apps.pacientes.pacientes.models import Paciente

# ---------------------------------------------------------------------------
# Whitelist estricta de modelos (solo estos nombres lógicos son ejecutables).
# Ampliar aquí cuando negocio autorice más entidades de solo lectura.
# ---------------------------------------------------------------------------
ALLOWED_MODELS: dict[str, type[models.Model]] = {
    'Paciente': Paciente,
    'Cita': Cita,
}

# Registro adicional poblado en runtime (p. ej. AppConfig.ready); se fusiona
# al resolver modelos en `QBEQueryBuilder`, no sustituye la whitelist del motor.
_QBE_MODEL_REGISTRY: dict[str, type[models.Model]] = {}

# Nombre lógico → "app_label.ModelName" solo para rutas internas auditadas.
_QBE_MODEL_IMPORT_PATH: dict[str, str] = {}


class QBESafeQueryError(ValueError):
    """Entrada QBE inválida o modelo no autorizado (flujos legacy / builder)."""


_ALLOWED_ROOT_KEYS = frozenset({'model', 'filters', 'aggregations', 'order_by', 'fields'})
_ALLOWED_AGGREGATIONS = frozenset({'count'})
_ALLOWED_LOOKUP_SUFFIXES = frozenset({
    'exact', 'iexact', 'contains', 'icontains',
    'gte', 'lte', 'gt', 'lt', 'in', 'isnull',
})
_FIELD_OR_LOOKUP_KEY = re.compile(
    r'^(?P<field>[a-zA-Z_][a-zA-Z0-9_]*)'
    r'(?:__(?P<lookup>[a-zA-Z_]+))?$',
)


def register_qbe_model(logical_name: str, model: type[models.Model]) -> None:
    """
    Registra un modelo Django ejecutable vía QBE bajo un nombre lógico estable.

    Debe invocarse desde código de aplicación (startup o AppConfig.ready),
    nunca desde entrada de usuario.
    """
    if not logical_name or not re.match(r'^[A-Za-z][A-Za-z0-9_]*$', logical_name):
        raise ValueError('logical_name inválido')
    if not issubclass(model, models.Model):
        raise TypeError('model debe ser una subclase de models.Model')
    _QBE_MODEL_REGISTRY[logical_name] = model


def resolve_model_class(logical_name: str) -> type[models.Model]:
    """
    Resuelve el nombre lógico del QBE a una clase Model.

    Orden: whitelist `ALLOWED_MODELS` → registro runtime → ruta interna
    `_QBE_MODEL_IMPORT_PATH` (nunca desde strings arbitrarios del cliente).
    """
    if logical_name in ALLOWED_MODELS:
        return ALLOWED_MODELS[logical_name]
    if logical_name in _QBE_MODEL_REGISTRY:
        return _QBE_MODEL_REGISTRY[logical_name]
    import_path = _QBE_MODEL_IMPORT_PATH.get(logical_name)
    if not import_path:
        raise QBESafeQueryError(
            'El modelo indicado no está habilitado para consultas QBE. '
            'Contacte al administrador para registrar modelos permitidos.',
        )
    try:
        model_cls = apps.get_model(import_path)
    except (LookupError, ValueError) as exc:
        raise QBESafeQueryError('No se pudo resolver el modelo permitido.') from exc
    if not issubclass(model_cls, models.Model):
        raise QBESafeQueryError('Referencia de modelo inválida.')
    return model_cls


def _reject_dangerous_key(key: str) -> None:
    lowered = key.lower()
    if '__' in key and key.count('__') > 1:
        raise QBESafeQueryError('No se permiten rutas de lookup anidadas en esta fase.')
    for token in (';', '--', '/*', '*/', ' ', '\n', '\r', '\t'):
        if token in key:
            raise QBESafeQueryError(f'Caracteres no permitidos en clave de filtro: {key!r}.')
    if 'raw' in lowered or 'extra' in lowered:
        raise QBESafeQueryError('Claves de filtro no permitidas (uso de ORM inseguro).')


def _validate_filter_value(lookup: str | None, value: Any) -> None:
    if lookup == 'in':
        if not isinstance(value, (list, tuple)):
            raise QBESafeQueryError('Para __in el valor debe ser una lista o tupla.')
        if len(value) > 500:
            raise QBESafeQueryError('Lista __in demasiado grande.')
        for item in value:
            if not isinstance(item, (str, int, float, bool, type(None))):
                raise QBESafeQueryError('Valores en __in deben ser primitivos JSON.')
        return
    if isinstance(value, (dict, list)):
        raise QBESafeQueryError('No se permiten objetos o listas anidadas como valor de filtro.')
    if not isinstance(value, (str, int, float, bool, type(None))):
        raise QBESafeQueryError('Tipo de valor de filtro no permitido.')


def _normalize_filters(filters: Any) -> dict[str, Any]:
    if filters is None:
        return {}
    if not isinstance(filters, dict):
        raise QBESafeQueryError('"filters" debe ser un objeto JSON.')
    out: dict[str, Any] = {}
    for key, value in filters.items():
        if not isinstance(key, str):
            raise QBESafeQueryError('Las claves de filtro deben ser cadenas.')
        _reject_dangerous_key(key)
        m = _FIELD_OR_LOOKUP_KEY.match(key)
        if not m:
            raise QBESafeQueryError(f'Clave de filtro con formato no permitido: {key!r}.')
        lookup = m.group('lookup')
        if lookup is not None and lookup not in _ALLOWED_LOOKUP_SUFFIXES:
            raise QBESafeQueryError(f'Lookup no permitido en clave: {key!r}.')
        _validate_filter_value(lookup, value)
        out[key] = value
    if len(out) > 50:
        raise QBESafeQueryError('Demasiadas claves en filters.')
    return out


def _normalize_aggregations(aggregations: Any) -> list[str]:
    if aggregations is None:
        return []
    if not isinstance(aggregations, list):
        raise QBESafeQueryError('"aggregations" debe ser una lista.')
    for item in aggregations:
        if not isinstance(item, str):
            raise QBESafeQueryError('Cada agregación debe ser una cadena.')
        if item not in _ALLOWED_AGGREGATIONS:
            raise QBESafeQueryError(f'Agregación no permitida: {item!r}.')
    return list(aggregations)


def _normalize_order_by(order_by: Any) -> list[str]:
    if order_by is None:
        return []
    if not isinstance(order_by, list):
        raise QBESafeQueryError('"order_by" debe ser una lista de cadenas.')
    for item in order_by:
        if not isinstance(item, str):
            raise QBESafeQueryError('order_by debe contener solo cadenas.')
        stripped = item.removeprefix('-')
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', stripped):
            raise QBESafeQueryError(f'Campo order_by no permitido: {item!r}.')
    return list(order_by)


def _normalize_fields_list(fields: Any) -> list[str] | None:
    """None = todas las columnas; lista = solo esos nombres de campo."""
    if fields is None:
        return None
    if not isinstance(fields, list):
        raise QBESafeQueryError('"fields" debe ser una lista de cadenas o null.')
    if len(fields) == 0:
        return None
    out: list[str] = []
    for item in fields:
        if not isinstance(item, str) or not item.strip():
            raise QBESafeQueryError('Cada elemento de "fields" debe ser una cadena no vacía.')
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', item):
            raise QBESafeQueryError(f'Nombre de campo no permitido en fields: {item!r}.')
        out.append(item)
    if len(out) > 80:
        raise QBESafeQueryError('Demasiados campos en "fields".')
    return out


def _validate_fields_against_model(model_cls: type[models.Model], names: list[str]) -> None:
    for name in names:
        try:
            field = model_cls._meta.get_field(name)
        except FieldDoesNotExist as exc:
            raise ValidationError(
                f'El campo "{name}" no existe en el modelo "{model_cls.__name__}".',
            ) from exc
        if isinstance(field, ForeignObjectRel):
            raise ValidationError(
                f'El nombre "{name}" no es un campo válido para proyección en este reporte.',
            )


def validate_qbe_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Valida la forma del documento QBE antes de tocar el ORM.

    Retorna un dict normalizado con claves: model, filters, aggregations, order_by, fields.
    """
    if not isinstance(payload, dict):
        raise QBESafeQueryError('El payload QBE debe ser un objeto JSON.')
    extra = set(payload.keys()) - _ALLOWED_ROOT_KEYS
    if extra:
        raise QBESafeQueryError(f'Claves no permitidas en el payload: {sorted(extra)}.')
    model_name = payload.get('model')
    if not model_name or not isinstance(model_name, str):
        raise QBESafeQueryError('Se requiere "model" como cadena no vacía.')
    if not re.match(r'^[A-Za-z][A-Za-z0-9_]*$', model_name):
        raise QBESafeQueryError('Nombre de modelo con formato no permitido.')
    filters = _normalize_filters(payload.get('filters'))
    aggregations = _normalize_aggregations(payload.get('aggregations'))
    order_by = _normalize_order_by(payload.get('order_by'))
    fields = _normalize_fields_list(payload.get('fields'))
    return {
        'model': model_name,
        'filters': filters,
        'aggregations': aggregations,
        'order_by': order_by,
        'fields': fields,
    }


def _default_column_names(model_cls: type[models.Model]) -> list[str]:
    return [f.name for f in model_cls._meta.concrete_fields]


class QBEEngine:
    """
    Motor principal QBE: whitelist, filtros ORM, proyección de columnas y salida tabular.

    Este es el punto de integración previsto para UI y, en el futuro, agentes IA
    que solo generen JSON estructurado (nunca SQL).
    """

    MAX_ROWS = 500

    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Ejecuta un reporte QBE seguro.

        Payload esperado::

            {
                "model": "Paciente",
                "fields": ["id_paciente", "nombres"],  // opcional → todas las columnas
                "filters": {"estado_paciente": "ACTIVO"},  // opcional
                "order_by": ["-fecha_registro"]  // opcional
            }

        Returns:
            dict con ``meta`` (model, total_records, columns) y ``data`` (filas).

        Raises:
            django.core.exceptions.ValidationError: modelo no autorizado, campos
            inválidos o filtros/orden que el ORM no puede aplicar.
        """
        if not isinstance(payload, dict):
            raise ValidationError('El payload debe ser un objeto JSON.')

        model_key = payload.get('model')
        if not model_key or not isinstance(model_key, str):
            raise ValidationError('Se requiere "model" como cadena no vacía.')

        if model_key not in ALLOWED_MODELS:
            raise ValidationError(
                f'Modelo "{model_key}" no está autorizado para consultas QBE.',
            )

        model_cls = ALLOWED_MODELS[model_key]
        try:
            filters = _normalize_filters(payload.get('filters'))
        except QBESafeQueryError as exc:
            raise ValidationError(str(exc)) from exc

        fields_raw = payload.get('fields')
        fields: list[str] | None
        if fields_raw is None:
            fields = None
        elif isinstance(fields_raw, list):
            if len(fields_raw) == 0:
                fields = None
            else:
                fields = []
                for item in fields_raw:
                    if not isinstance(item, str) or not item.strip():
                        raise ValidationError('Cada elemento de "fields" debe ser una cadena no vacía.')
                    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', item):
                        raise ValidationError(f'Nombre de campo no permitido: {item!r}.')
                    fields.append(item)
                if len(fields) > 80:
                    raise ValidationError('Demasiados campos en "fields".')
                _validate_fields_against_model(model_cls, fields)
        else:
            raise ValidationError('"fields" debe ser una lista o null.')

        try:
            order_by = _normalize_order_by(payload.get('order_by'))
        except QBESafeQueryError as exc:
            raise ValidationError(str(exc)) from exc

        qs: QuerySet = model_cls.objects.all()

        if filters:
            try:
                qs = qs.filter(**filters)
            except FieldError as exc:
                raise ValidationError(
                    'No se pudieron aplicar los filtros: compruebe nombres de campos '
                    'y tipos de valor respecto al modelo.',
                ) from exc

        if order_by:
            try:
                qs = qs.order_by(*order_by)
            except FieldError as exc:
                raise ValidationError(
                    'No se pudo ordenar por los campos indicados.',
                ) from exc

        try:
            total_records = qs.count()
        except FieldError as exc:
            raise ValidationError('Error al contar resultados con los filtros indicados.') from exc

        try:
            if fields:
                values_qs = qs.values(*fields)
            else:
                values_qs = qs.values()
            rows_qs = values_qs[: self.MAX_ROWS]
            data = list(rows_qs)
        except FieldError as exc:
            raise ValidationError(
                'No se pudieron proyectar los campos solicitados.',
            ) from exc

        if fields:
            columns = list(fields)
        elif data:
            columns = list(data[0].keys())
        else:
            columns = _default_column_names(model_cls)

        meta = {
            'model': model_key,
            'total_records': total_records,
            'columns': columns,
            'returned': len(data),
            'truncated': total_records > len(data),
            'max_rows': self.MAX_ROWS,
        }
        return {'meta': meta, 'data': data}


class QBEQueryBuilder:
    """
    Constructor seguro de querysets a partir de un payload QBE ya validado
    (validación estricta vía ``validate_qbe_payload``).

    La ejecución material de filas delega en ``QBEEngine`` para una sola forma
    de salida (`meta` + `data`).
    """

    MAX_ROWS = 500

    def __init__(self, payload: dict[str, Any]) -> None:
        self._raw = payload
        self._normalized: dict[str, Any] | None = None

    def normalized(self) -> dict[str, Any]:
        if self._normalized is None:
            self._normalized = validate_qbe_payload(self._raw)
        return self._normalized

    def get_queryset(self) -> QuerySet:
        """
        Construye y retorna un queryset del ORM (sin evaluarlo aún del todo).

        Raises:
            QBESafeQueryError: modelo no permitido o payload inválido.
        """
        data = self.normalized()
        model_cls = resolve_model_class(data['model'])
        qs: QuerySet = model_cls.objects.all()
        if data['filters']:
            qs = qs.filter(**data['filters'])
        if data['order_by']:
            qs = qs.order_by(*data['order_by'])
        return qs

    def execute(self) -> dict[str, Any]:
        """
        Ejecuta vía ``QBEEngine`` con el payload normalizado (misma forma de respuesta).
        """
        data = self.normalized()
        engine = QBEEngine()
        inner = {
            'model': data['model'],
            'filters': data.get('filters') or {},
            'fields': data.get('fields'),
            'order_by': data.get('order_by') or [],
        }
        result = engine.execute(inner)
        if data.get('aggregations') and 'count' in data['aggregations']:
            result['meta']['count_requested'] = True
        return result
