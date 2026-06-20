from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

from apps.InteligenciaArtificial.models import (
    EstadoRespuestaAsistente,
    IntencionAsistente,
    NivelPrioridadUrgencia,
)


@dataclass(frozen=True)
class ResultadoAsistenteVirtual:
    respuesta: str
    intencion: str
    estado: str
    requiere_clasificacion_urgencia: bool = False
    nivel_prioridad: str = NivelPrioridadUrgencia.NO_APLICA
    sintomas_detectados: list[str] = field(default_factory=list)
    metadata: dict[str, object] = field(default_factory=dict)


def _normalizar(texto: str) -> str:
    normalized = unicodedata.normalize('NFKD', texto or '')
    ascii_text = ''.join(ch for ch in normalized if not unicodedata.combining(ch))
    return ascii_text.lower().strip()


def _contiene(texto: str, terminos: tuple[str, ...]) -> bool:
    return any(termino in texto for termino in terminos)


class AsistenteVirtualService:
    """
    Motor deterministico de CU23.

    Mantiene el alcance en informacion general/autorizada y marca la derivacion a
    CU24 cuando detecta sintomas o expresiones de riesgo.
    """

    _PATRONES_URGENCIA_ALTA = {
        'perdida subita de vision': ('perdida subita de vision', 'vision perdida', 'no veo'),
        'dolor ocular intenso': ('dolor intenso', 'dolor muy fuerte', 'dolor insoportable'),
        'trauma ocular': ('golpe en el ojo', 'trauma ocular', 'accidente en el ojo'),
        'quimico en el ojo': ('quimico', 'lejia', 'acido', 'quemadura'),
        'sangrado ocular': ('sangre en el ojo', 'sangrado ocular'),
        'cortina o sombra visual': ('cortina', 'sombra negra', 'mancha negra'),
    }
    _PATRONES_URGENCIA_MEDIA = {
        'destellos o moscas volantes': ('destellos', 'flashes', 'moscas volantes'),
        'ojo rojo doloroso': ('ojo rojo', 'enrojecido con dolor'),
        'vision borrosa reciente': ('vision borrosa', 'veo borroso'),
        'secrecion ocular': ('pus', 'secrecion', 'legana'),
    }

    _INTENCIONES = (
        (
            IntencionAsistente.CITAS_HORARIOS,
            ('cita', 'turno', 'agenda', 'horario', 'agendar', 'reprogramar', 'cancelar'),
            (
                'Puedo orientarte sobre citas y horarios. Para agendar, reprogramar o cancelar, '
                'usa el modulo de citas o comunicate con recepcion si necesitas ayuda inmediata. '
                'Ten a mano tu documento y el motivo de consulta.'
            ),
        ),
        (
            IntencionAsistente.PREOPERATORIO,
            ('preoperatorio', 'antes de la cirugia', 'ayuno', 'anestesia', 'operacion manana'),
            (
                'Para indicaciones preoperatorias, sigue siempre la orden entregada por la clinica. '
                'En general, confirma ayuno, medicamentos permitidos, estudios solicitados y hora de llegada. '
                'Si no recibiste instrucciones personalizadas, comunicate con el personal de la clinica.'
            ),
        ),
        (
            IntencionAsistente.POSTOPERATORIO,
            ('postoperatorio', 'despues de la cirugia', 'gotas', 'reposo', 'parche', 'control'),
            (
                'Para cuidados postoperatorios, respeta las gotas, reposo y controles indicados por tu medico. '
                'Evita frotarte el ojo y no suspendas medicacion sin autorizacion. '
                'Si aparece dolor fuerte, perdida de vision o secrecion abundante, requiere clasificacion de urgencia.'
            ),
        ),
        (
            IntencionAsistente.PROCEDIMIENTOS,
            ('procedimiento', 'cirugia', 'laser', 'catarata', 'examen', 'fondo de ojo', 'medicion'),
            (
                'Puedo darte informacion general sobre procedimientos oftalmologicos. '
                'La preparacion, riesgos y tiempos dependen de tu caso clinico, por eso la indicacion final '
                'debe venir del especialista o del personal autorizado.'
            ),
        ),
        (
            IntencionAsistente.SEGUROS_FACTURACION,
            ('seguro', 'cobertura', 'factura', 'pago', 'copago', 'descuento', 'convenio'),
            (
                'Para seguros, cobertura, descuentos o pagos, revisa el modulo financiero o consulta con administracion. '
                'La confirmacion depende de tu afiliacion, convenio vigente y servicios realizados.'
            ),
        ),
        (
            IntencionAsistente.SISTEMA,
            ('contrasena', 'login', 'iniciar sesion', 'cuenta', 'usuario', 'app', 'sistema'),
            (
                'Si tienes problemas con tu cuenta, verifica tu correo, contrasena y clinica seleccionada. '
                'Si la sesion vencio, vuelve a iniciar sesion. Para recuperar acceso, usa la opcion de recuperacion.'
            ),
        ),
    )

    _FUERA_ALCANCE = (
        'clima',
        'futbol',
        'receta de cocina',
        'inversion',
        'criptomoneda',
        'politica',
        'tarea escolar',
    )

    @classmethod
    def responder(cls, mensaje: str) -> ResultadoAsistenteVirtual:
        texto = (mensaje or '').strip()
        if not texto:
            return ResultadoAsistenteVirtual(
                respuesta='Escribe un mensaje para que pueda orientarte.',
                intencion=IntencionAsistente.NO_COMPRENDIDA,
                estado=EstadoRespuestaAsistente.NO_COMPRENDIDA,
                metadata={'motivo': 'mensaje_vacio'},
            )

        normalizado = _normalizar(texto)
        sintomas, prioridad = cls._detectar_urgencia(normalizado)
        if sintomas:
            return cls._respuesta_urgencia(sintomas, prioridad)

        if re.fullmatch(r'(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches)[!. ]*', normalizado):
            return ResultadoAsistenteVirtual(
                respuesta=(
                    'Hola. Puedo orientarte sobre citas, horarios, procedimientos, indicaciones '
                    'preoperatorias, cuidados postoperatorios, seguros, pagos y uso del sistema.'
                ),
                intencion=IntencionAsistente.SALUDO,
                estado=EstadoRespuestaAsistente.RESPONDIDA,
            )

        if _contiene(normalizado, cls._FUERA_ALCANCE):
            return ResultadoAsistenteVirtual(
                respuesta=(
                    'Tu pregunta esta fuera del alcance del asistente de la clinica. '
                    'Para temas no relacionados con tu atencion oftalmologica, comunicate con el personal correspondiente.'
                ),
                intencion=IntencionAsistente.FUERA_ALCANCE,
                estado=EstadoRespuestaAsistente.FUERA_ALCANCE,
            )

        for intencion, terminos, respuesta in cls._INTENCIONES:
            if _contiene(normalizado, terminos):
                return ResultadoAsistenteVirtual(
                    respuesta=respuesta,
                    intencion=intencion,
                    estado=EstadoRespuestaAsistente.RESPONDIDA,
                )

        return ResultadoAsistenteVirtual(
            respuesta=(
                'No pude interpretar con seguridad tu consulta. Reformulala indicando si necesitas ayuda con '
                'citas, horarios, procedimientos, preoperatorio, postoperatorio, seguros, pagos o uso del sistema.'
            ),
            intencion=IntencionAsistente.NO_COMPRENDIDA,
            estado=EstadoRespuestaAsistente.NO_COMPRENDIDA,
        )

    @classmethod
    def _detectar_urgencia(cls, texto: str) -> tuple[list[str], str]:
        sintomas: list[str] = []
        for etiqueta, patrones in cls._PATRONES_URGENCIA_ALTA.items():
            if _contiene(texto, patrones):
                sintomas.append(etiqueta)
        if sintomas:
            return sintomas, NivelPrioridadUrgencia.ALTA

        for etiqueta, patrones in cls._PATRONES_URGENCIA_MEDIA.items():
            if _contiene(texto, patrones):
                sintomas.append(etiqueta)
        if sintomas:
            return sintomas, NivelPrioridadUrgencia.MEDIA

        return [], NivelPrioridadUrgencia.NO_APLICA

    @staticmethod
    def _respuesta_urgencia(sintomas: list[str], prioridad: str) -> ResultadoAsistenteVirtual:
        if prioridad == NivelPrioridadUrgencia.ALTA:
            respuesta = (
                'Detecte sintomas o senales de riesgo. Este caso debe pasar a valoracion clinica para clasificar la urgencia. '
                'Si presentas perdida subita de vision, dolor ocular intenso, trauma, quimicos en el ojo o sangrado, '
                'busca atencion medica inmediata o comunicate con urgencias de la clinica.'
            )
        else:
            respuesta = (
                'Detecte sintomas que requieren clasificacion de prioridad clinica. '
                'Evita automedicarte y solicita orientacion de la clinica, especialmente si el cuadro empeora.'
            )
        return ResultadoAsistenteVirtual(
            respuesta=respuesta,
            intencion=IntencionAsistente.URGENCIA,
            estado=EstadoRespuestaAsistente.REQUIERE_CU24,
            requiere_clasificacion_urgencia=True,
            nivel_prioridad=prioridad,
            sintomas_detectados=sintomas,
            metadata={'cu24_activado': True},
        )
