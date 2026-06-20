from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.InteligenciaArtificial.models import (
    ClasificacionUrgencia,
    EstadoClasificacionUrgencia,
    InteraccionAsistenteVirtual,
    NivelPrioridadUrgencia,
    NivelUrgenciaClasificacion,
)


@dataclass(frozen=True)
class ResultadoClasificacionUrgencia:
    nivel_urgencia: str
    puntaje_riesgo: int
    factores_clinicos: list[dict[str, Any]]
    criterios_evaluados: dict[str, Any]
    recomendacion: str
    requiere_derivacion: bool


class ClasificadorUrgenciaService:
    """
    Clasificador formal de CU24.

    Toma una interaccion ya marcada por CU23 y calcula una prioridad explicable
    usando reglas deterministicas y trazables.
    """

    _PALABRAS_TEMPRANA = (
        'ahora',
        'urgente',
        'inmediato',
        'repentino',
        'subito',
        'desde hace minutos',
        'desde hace horas',
        'empeoro',
        'empeorando',
        'hoy mismo',
    )

    _PATRONES_RELEVANTES = (
        ('perdida subita de vision', ('perdida subita de vision', 'vision perdida', 'no veo')),
        ('dolor ocular intenso', ('dolor intenso', 'dolor muy fuerte', 'dolor insoportable')),
        ('trauma ocular', ('golpe en el ojo', 'trauma ocular', 'accidente en el ojo')),
        ('quimico en el ojo', ('quimico', 'lejia', 'acido', 'quemadura')),
        ('sangrado ocular', ('sangre en el ojo', 'sangrado ocular')),
        ('cortina o sombra visual', ('cortina', 'sombra negra', 'mancha negra')),
        ('destellos o moscas volantes', ('destellos', 'flashes', 'moscas volantes')),
        ('ojo rojo doloroso', ('ojo rojo', 'enrojecido con dolor')),
        ('vision borrosa reciente', ('vision borrosa', 'veo borroso')),
        ('secrecion ocular', ('pus', 'secrecion', 'legana')),
    )

    @classmethod
    def clasificar_interaccion(
        cls,
        interaccion: InteraccionAsistenteVirtual,
        *,
        revisar_existente: bool = True,
    ) -> ClasificacionUrgencia:
        resultado = cls._evaluar_interaccion(interaccion)

        defaults = {
            'id_usuario': interaccion.id_usuario,
            'nivel_urgencia': resultado.nivel_urgencia,
            'puntaje_riesgo': resultado.puntaje_riesgo,
            'factores_clinicos': resultado.factores_clinicos,
            'criterios_evaluados': resultado.criterios_evaluados,
            'recomendacion': resultado.recomendacion,
            'requiere_derivacion': resultado.requiere_derivacion,
            'estado': EstadoClasificacionUrgencia.PENDIENTE,
        }

        with transaction.atomic():
            if revisar_existente:
                clasificacion, _ = ClasificacionUrgencia.objects.update_or_create(
                    id_interaccion=interaccion,
                    defaults=defaults,
                )
            else:
                clasificacion = ClasificacionUrgencia.objects.create(
                    id_interaccion=interaccion,
                    **defaults,
                )
        return clasificacion

    @classmethod
    def revisar_clasificacion(
        cls,
        clasificacion: ClasificacionUrgencia,
        *,
        revisado_por=None,
        derivado: bool | None = None,
        notas_internas: str | None = None,
    ) -> ClasificacionUrgencia:
        if revisado_por is not None:
            clasificacion.revisado_por = revisado_por
            clasificacion.fecha_revision = timezone.now()
            clasificacion.estado = (
                EstadoClasificacionUrgencia.DERIVADO
                if derivado
                else EstadoClasificacionUrgencia.REVISADO
            )
        if notas_internas is not None:
            clasificacion.notas_internas = notas_internas
        if derivado is not None:
            clasificacion.requiere_derivacion = derivado
        clasificacion.save(update_fields=['revisado_por', 'fecha_revision', 'estado', 'notas_internas', 'requiere_derivacion'])
        return clasificacion

    @classmethod
    def _evaluar_interaccion(cls, interaccion: InteraccionAsistenteVirtual) -> ResultadoClasificacionUrgencia:
        mensaje = (interaccion.mensaje or '').lower()
        sintomas = [s.strip() for s in (interaccion.sintomas_detectados or []) if str(s).strip()]

        factores: list[dict[str, Any]] = []
        puntaje = 0

        base = cls._puntaje_base(interaccion.nivel_prioridad)
        puntaje += base
        factores.append({'criterio': 'nivel_prioridad_cu23', 'valor': interaccion.nivel_prioridad, 'puntos': base})

        sintomas_puntaje = cls._puntaje_por_sintomas(sintomas)
        puntaje += sintomas_puntaje['total']
        factores.extend(sintomas_puntaje['factores'])

        temporal_puntos = cls._puntaje_temporal(mensaje)
        puntaje += temporal_puntos
        if temporal_puntos:
            factores.append({'criterio': 'urgencia_temporal', 'valor': 'detectada', 'puntos': temporal_puntos})

        if interaccion.requiere_clasificacion_urgencia:
            puntaje += 5
            factores.append({'criterio': 'flag_cu24', 'valor': True, 'puntos': 5})

        if interaccion.intencion == 'URGENCIA':
            puntaje += 5
            factores.append({'criterio': 'intencion_urgencia', 'valor': interaccion.intencion, 'puntos': 5})

        puntaje = max(0, min(100, puntaje))
        nivel = cls._nivel_desde_puntaje(puntaje)
        requiere_derivacion = nivel in (NivelUrgenciaClasificacion.ALTA, NivelUrgenciaClasificacion.CRITICA)

        recomendacion = cls._recomendacion_para(nivel, requiere_derivacion)

        return ResultadoClasificacionUrgencia(
            nivel_urgencia=nivel,
            puntaje_riesgo=puntaje,
            factores_clinicos=factores,
            criterios_evaluados={
                'base_cu23': interaccion.nivel_prioridad,
                'sintomas_detectados': sintomas,
                'temporales': temporal_puntos,
                'requiere_clasificacion_urgencia': interaccion.requiere_clasificacion_urgencia,
            },
            recomendacion=recomendacion,
            requiere_derivacion=requiere_derivacion,
        )

    @classmethod
    def _puntaje_base(cls, nivel_prioridad: str) -> int:
        return {
            NivelPrioridadUrgencia.ALTA: 50,
            NivelPrioridadUrgencia.MEDIA: 25,
            NivelPrioridadUrgencia.BAJA: 10,
            NivelPrioridadUrgencia.NO_APLICA: 0,
        }.get(nivel_prioridad, 0)

    @classmethod
    def _puntaje_por_sintomas(cls, sintomas: list[str]) -> dict[str, Any]:
        total = 0
        factores: list[dict[str, Any]] = []
        if not sintomas:
            return {'total': 0, 'factores': factores}

        mapa = {etiqueta: patrones for etiqueta, patrones in cls._PATRONES_RELEVANTES}
        for sintoma in sintomas:
            puntos = 0
            if sintoma in mapa:
                puntos = 18 if sintoma in {
                    'perdida subita de vision',
                    'dolor ocular intenso',
                    'trauma ocular',
                    'quimico en el ojo',
                    'sangrado ocular',
                    'cortina o sombra visual',
                } else 10
            else:
                puntos = 6
            total += puntos
            factores.append({'criterio': 'sintoma_detectado', 'valor': sintoma, 'puntos': puntos})

        if len(sintomas) > 1:
            extra = min(12, (len(sintomas) - 1) * 4)
            total += extra
            factores.append({'criterio': 'multiples_sintomas', 'valor': len(sintomas), 'puntos': extra})

        return {'total': total, 'factores': factores}

    @classmethod
    def _puntaje_temporal(cls, mensaje: str) -> int:
        return 12 if any(termino in mensaje for termino in cls._PALABRAS_TEMPRANA) else 0

    @staticmethod
    def _nivel_desde_puntaje(puntaje: int) -> str:
        if puntaje >= 75:
            return NivelUrgenciaClasificacion.CRITICA
        if puntaje >= 50:
            return NivelUrgenciaClasificacion.ALTA
        if puntaje >= 25:
            return NivelUrgenciaClasificacion.MEDIA
        return NivelUrgenciaClasificacion.BAJA

    @staticmethod
    def _recomendacion_para(nivel: str, requiere_derivacion: bool) -> str:
        if nivel == NivelUrgenciaClasificacion.CRITICA:
            return (
                'Caso critico: derivacion humana inmediata, evaluacion prioritaria y contacto urgente con personal de guardia.'
            )
        if nivel == NivelUrgenciaClasificacion.ALTA or requiere_derivacion:
            return (
                'Caso de alta prioridad: derivar a personal humano para evaluacion clinica y seguimiento en el menor tiempo posible.'
            )
        if nivel == NivelUrgenciaClasificacion.MEDIA:
            return 'Clasificacion media: orientar y escalar a personal humano si los sintomas empeoran o persisten.'
        return 'Clasificacion baja: seguimiento informativo y reconsulta si aparecen nuevos sintomas.'
