"""
apps/crm/reportes/views.py
CU17 — Generar y exportar reportes

Endpoints:
    GET  /reportes/tipos/       — lista de tipos de reporte disponibles
    GET  /reportes/             — historial de reportes generados
    POST /reportes/generar/     — generar un reporte nuevo
    GET  /reportes/{id}/        — detalle de un reporte (metadatos)
    POST /reportes/{id}/regenerar/ — re-ejecutar el mismo reporte y obtener datos actualizados

Tipos de reporte implementados:
    RESUMEN_PACIENTES   — totales y distribución de pacientes
    CITAS               — citas en rango de fechas
    CONSULTAS           — consultas clínicas en rango de fechas
    MEDICIONES_VISUALES — mediciones en rango de fechas
    CIRUGIAS            — cirugías en rango de fechas
    POSTOPERATORIO      — controles postoperatorios en rango de fechas
    CRM_COMUNICACIONES  — comunicaciones CRM en rango de fechas

Exportación CSV:
    El generador retorna siempre un dict Python.
    Si formato='CSV', se convierte a HttpResponse con Content-Type text/csv.

Permisos:
    Lectura (tipos, historial, detalle): IsAuthenticated
    Generación: IsAuthenticated + IsAdministrativoOrAdmin
"""

import csv
import io
import datetime

from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import EstadoReporte, ReporteGenerado, TipoReporte
from .serializers import GenerarReporteRequestSerializer, ReporteGeneradoSerializer


# ── Definición pública de tipos de reporte ────────────────────────────────────

TIPOS_DISPONIBLES = [
    {
        'tipo':        TipoReporte.RESUMEN_PACIENTES,
        'label':       'Resumen de pacientes',
        'descripcion': 'Total de pacientes registrados, distribución por estado, sexo y nuevos en el período.',
        'requiere_fechas': False,
    },
    {
        'tipo':        TipoReporte.CITAS,
        'label':       'Citas y agenda',
        'descripcion': 'Citas programadas en el rango de fechas seleccionado, agrupadas por estado.',
        'requiere_fechas': True,
    },
    {
        'tipo':        TipoReporte.CONSULTAS,
        'label':       'Consultas clínicas',
        'descripcion': 'Consultas clínicas registradas en el período, con motivo y especialista.',
        'requiere_fechas': True,
    },
    {
        'tipo':        TipoReporte.MEDICIONES_VISUALES,
        'label':       'Mediciones visuales',
        'descripcion': 'Mediciones de agudeza visual registradas en el período.',
        'requiere_fechas': True,
    },
    {
        'tipo':        TipoReporte.CIRUGIAS,
        'label':       'Cirugías',
        'descripcion': 'Cirugías programadas y realizadas en el período, con estado y procedimiento.',
        'requiere_fechas': True,
    },
    {
        'tipo':        TipoReporte.POSTOPERATORIO,
        'label':       'Seguimiento postoperatorio',
        'descripcion': 'Controles postoperatorios registrados, indicando complicaciones y próximos controles.',
        'requiere_fechas': True,
    },
    {
        'tipo':        TipoReporte.CRM_COMUNICACIONES,
        'label':       'Comunicaciones CRM',
        'descripcion': 'Historial de comunicaciones con pacientes, con tasa de respuesta y distribución por canal.',
        'requiere_fechas': False,
    },
]


# ── ViewSet ───────────────────────────────────────────────────────────────────

class ReportesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    CU17 — Reportes y exportaciones.
    Hereda de ReadOnlyModelViewSet para exponer lista + detalle del historial.
    La generación se hace a través del @action 'generar'.
    """
    queryset = ReporteGenerado.objects.select_related('generado_por').all()
    serializer_class = ReporteGeneradoSerializer

    def get_permissions(self):
        if self.action in ('generar', 'regenerar'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    # ── Listar tipos disponibles ──────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='tipos')
    def tipos(self, request):
        """GET /reportes/tipos/ — catálogo de tipos de reporte disponibles."""
        return Response(TIPOS_DISPONIBLES)

    # ── Generar un reporte nuevo ──────────────────────────────────────────────

    @action(detail=False, methods=['post'], url_path='generar')
    def generar(self, request):
        """
        POST /reportes/generar/

        Body esperado:
            tipo_reporte    (obligatorio)
            formato         'JSON' | 'CSV'  (default: JSON)
            fecha_desde     YYYY-MM-DD  (opcional según tipo)
            fecha_hasta     YYYY-MM-DD  (opcional según tipo)
            id_paciente     int  (filtro extra opcional)
            id_especialista int  (filtro extra opcional)
            id_campana      int  (filtro extra opcional)
            canal           str  (filtro extra opcional para CRM)
            tipo_mensaje    str  (filtro extra opcional para CRM)
            estado          str  (filtro extra opcional)
        """
        serializer = GenerarReporteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data      = serializer.validated_data
        tipo      = data['tipo_reporte']
        formato   = data.get('formato', 'JSON')
        f_desde   = data.get('fecha_desde')
        f_hasta   = data.get('fecha_hasta')

        generadores = {
            TipoReporte.RESUMEN_PACIENTES:   self._resumen_pacientes,
            TipoReporte.CITAS:               self._reporte_citas,
            TipoReporte.CONSULTAS:           self._reporte_consultas,
            TipoReporte.MEDICIONES_VISUALES: self._reporte_mediciones,
            TipoReporte.CIRUGIAS:            self._reporte_cirugias,
            TipoReporte.POSTOPERATORIO:      self._reporte_postoperatorio,
            TipoReporte.CRM_COMUNICACIONES:  self._reporte_crm,
        }

        try:
            resultado, total = generadores[tipo](f_desde, f_hasta, data)
            estado_gen = EstadoReporte.GENERADO
            mensaje_err = None
        except Exception as exc:
            resultado = {}
            total = 0
            estado_gen = EstadoReporte.ERROR
            mensaje_err = str(exc)

        # Guardar registro de auditoría
        reporte = ReporteGenerado.objects.create(
            tipo_reporte    = tipo,
            formato         = formato,
            fecha_desde     = f_desde,
            fecha_hasta     = f_hasta,
            filtros_extra   = {
                k: str(v) for k, v in data.items()
                if k not in ('tipo_reporte', 'formato', 'fecha_desde', 'fecha_hasta') and v
            },
            estado          = estado_gen,
            total_registros = total,
            mensaje_error   = mensaje_err,
            generado_por    = request.user,
        )

        registrar_bitacora(
            usuario=request.user,
            modulo='reportes',
            accion=AccionBitacora.CREAR,
            descripcion=f'Genero reporte {tipo} ({formato}) — {total} registros',
            tabla_afectada='crm_reportes_generados',
            id_registro_afectado=reporte.id_reporte,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        if estado_gen == EstadoReporte.ERROR:
            return Response(
                {'detail': mensaje_err, 'reporte': ReporteGeneradoSerializer(reporte).data},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if formato == 'CSV':
            return self._csv_response(tipo, resultado)

        return Response({
            'reporte': ReporteGeneradoSerializer(reporte).data,
            'datos': resultado,
        }, status=status.HTTP_201_CREATED)

    # ── Regenerar un reporte existente ────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='regenerar')
    def regenerar(self, request, pk=None):
        """
        POST /reportes/{id}/regenerar/
        Re-ejecuta el reporte original con los mismos parámetros y retorna datos actualizados.
        """
        reporte_orig = self.get_object()

        data_orig = {
            'tipo_reporte': reporte_orig.tipo_reporte,
            'formato':      reporte_orig.formato,
            'fecha_desde':  reporte_orig.fecha_desde,
            'fecha_hasta':  reporte_orig.fecha_hasta,
        }
        if reporte_orig.filtros_extra:
            data_orig.update(reporte_orig.filtros_extra)

        # Reutilizamos el serializer de request para validar
        ser = GenerarReporteRequestSerializer(data=data_orig)
        ser.is_valid(raise_exception=True)

        # Delegamos al mismo flujo de generación via nueva request simulada
        request._data = data_orig
        return self.generar(request)

    # ── Generadores privados ──────────────────────────────────────────────────

    def _apply_date_filter(self, qs, campo_fecha, f_desde, f_hasta):
        """Aplica filtro de rango de fechas al queryset dado."""
        if f_desde:
            qs = qs.filter(**{f'{campo_fecha}__gte': f_desde})
        if f_hasta:
            qs = qs.filter(**{f'{campo_fecha}__lte': f_hasta})
        return qs

    def _resumen_pacientes(self, f_desde, f_hasta, filtros):
        from apps.pacientes.pacientes.models import Paciente

        qs = Paciente.objects.all()
        if filtros.get('id_paciente'):
            qs = qs.filter(id_paciente=filtros['id_paciente'])

        total = qs.count()

        por_estado = list(
            qs.values('estado_paciente').annotate(total=Count('id_paciente'))
              .order_by('estado_paciente')
        )
        por_sexo = list(
            qs.values('sexo').annotate(total=Count('id_paciente'))
              .order_by('sexo')
        )

        nuevos_periodo = 0
        if f_desde or f_hasta:
            qs_nuevos = qs
            if f_desde:
                qs_nuevos = qs_nuevos.filter(fecha_registro__date__gte=f_desde)
            if f_hasta:
                qs_nuevos = qs_nuevos.filter(fecha_registro__date__lte=f_hasta)
            nuevos_periodo = qs_nuevos.count()

        listado = list(
            qs.order_by('apellidos', 'nombres')
              .values(
                  'id_paciente', 'nombres', 'apellidos',
                  'tipo_documento', 'numero_documento',
                  'sexo', 'telefono', 'email',
                  'estado_paciente', 'fecha_registro',
              )[:500]
        )

        datos = {
            'total':           total,
            'por_estado':      por_estado,
            'por_sexo':        por_sexo,
            'nuevos_periodo':  nuevos_periodo,
            'listado':         listado,
        }
        return datos, total

    def _reporte_citas(self, f_desde, f_hasta, filtros):
        from apps.atencionClinica.citas.models import Cita

        qs = Cita.objects.select_related('id_paciente', 'id_especialista', 'id_tipo_cita')

        # Filtro de fechas sobre fecha_hora_inicio
        if f_desde:
            qs = qs.filter(fecha_hora_inicio__date__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha_hora_inicio__date__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(id_paciente=filtros['id_paciente'])
        if filtros.get('id_especialista'):
            qs = qs.filter(id_especialista=filtros['id_especialista'])
        if filtros.get('estado'):
            qs = qs.filter(estado=filtros['estado'])

        total = qs.count()
        por_estado = list(
            qs.values('estado').annotate(total=Count('id_cita')).order_by('estado')
        )

        listado = []
        for c in qs.order_by('fecha_hora_inicio')[:500]:
            listado.append({
                'id_cita':          c.id_cita,
                'paciente_id':      c.id_paciente_id,
                'paciente_nombres': f'{c.id_paciente.nombres} {c.id_paciente.apellidos}',
                'especialista_id':  c.id_especialista_id,
                'tipo_cita':        c.id_tipo_cita.get_nombre_display() if c.id_tipo_cita else '',
                'fecha_inicio':     c.fecha_hora_inicio.isoformat(),
                'fecha_fin':        c.fecha_hora_fin.isoformat(),
                'estado':           c.estado,
                'motivo':           c.motivo or '',
            })

        return {'total': total, 'por_estado': por_estado, 'listado': listado}, total

    def _reporte_consultas(self, f_desde, f_hasta, filtros):
        from apps.atencionClinica.consultas.models import Consulta

        qs = Consulta.objects.select_related('paciente', 'especialista')

        # Consulta.fecha es DateTimeField (auto_now_add) — filtramos por __date
        if f_desde:
            qs = qs.filter(fecha__date__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha__date__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(paciente_id=filtros['id_paciente'])
        if filtros.get('id_especialista'):
            qs = qs.filter(especialista_id=filtros['id_especialista'])

        total = qs.count()

        listado = []
        for c in qs.order_by('-fecha')[:500]:
            especialista_nombre = ''
            if c.especialista:
                especialista_nombre = f'{c.especialista.nombres} {c.especialista.apellidos}'.strip()
            listado.append({
                'id_consulta':      c.pk,
                'paciente_id':      c.paciente_id,
                'paciente_nombres': f'{c.paciente.nombres} {c.paciente.apellidos}',
                'especialista':     especialista_nombre,
                'fecha':            c.fecha.isoformat(),
                'motivo':           c.motivo or '',
                'sintomas':         c.sintomas or '',
            })

        return {'total': total, 'listado': listado}, total

    def _reporte_mediciones(self, f_desde, f_hasta, filtros):
        from apps.atencionClinica.medicion_visual.models import MedicionVisual

        qs = MedicionVisual.objects.select_related('paciente')

        if f_desde:
            qs = qs.filter(fecha__date__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha__date__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(paciente_id=filtros['id_paciente'])

        total = qs.count()

        listado = []
        for m in qs.order_by('-fecha')[:500]:
            listado.append({
                'id_medicion':      m.pk,
                'paciente_id':      m.paciente_id,
                'paciente_nombres': f'{m.paciente.nombres} {m.paciente.apellidos}',
                'fecha':            m.fecha.isoformat(),
                'ojo_derecho':      m.ojo_derecho or '',
                'ojo_izquierdo':    m.ojo_izquierdo or '',
                'observaciones':    m.observaciones or '',
            })

        return {'total': total, 'listado': listado}, total

    def _reporte_cirugias(self, f_desde, f_hasta, filtros):
        from apps.atencionClinica.cirugias.models import Cirugia

        qs = Cirugia.objects.select_related('id_paciente', 'cirujano')

        if f_desde:
            qs = qs.filter(fecha_programada__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha_programada__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(id_paciente=filtros['id_paciente'])
        if filtros.get('estado'):
            qs = qs.filter(estado_cirugia=filtros['estado'])

        total = qs.count()
        por_estado = list(
            qs.values('estado_cirugia').annotate(total=Count('id_cirugia')).order_by('estado_cirugia')
        )

        listado = []
        for c in qs.order_by('-fecha_programada')[:500]:
            cirujano_nombre = ''
            if c.cirujano:
                cirujano_nombre = f'{c.cirujano.nombres} {c.cirujano.apellidos}'.strip()
            listado.append({
                'id_cirugia':       c.id_cirugia,
                'paciente_id':      c.id_paciente_id,
                'paciente_nombres': f'{c.id_paciente.nombres} {c.id_paciente.apellidos}',
                'cirujano':         cirujano_nombre,
                'procedimiento':    c.procedimiento or '',
                'fecha_programada': c.fecha_programada.isoformat() if c.fecha_programada else '',
                'estado_cirugia':   c.estado_cirugia,
                'complicaciones':   c.complicaciones or '',
            })

        return {'total': total, 'por_estado': por_estado, 'listado': listado}, total

    def _reporte_postoperatorio(self, f_desde, f_hasta, filtros):
        from apps.atencionClinica.postoperatorio.models import Postoperatorio

        qs = Postoperatorio.objects.select_related('id_paciente')

        if f_desde:
            qs = qs.filter(fecha_control__date__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha_control__date__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(id_paciente=filtros['id_paciente'])
        if filtros.get('estado'):
            qs = qs.filter(estado_postoperatorio=filtros['estado'])

        total = qs.count()
        complicados = qs.filter(estado_postoperatorio='COMPLICADO').count()

        por_estado = list(
            qs.values('estado_postoperatorio')
              .annotate(total=Count('id_postoperatorio'))
              .order_by('estado_postoperatorio')
        )

        listado = []
        for p in qs.order_by('-fecha_control')[:500]:
            listado.append({
                'id_postoperatorio':    p.id_postoperatorio,
                'paciente_id':          p.id_paciente_id,
                'paciente_nombres':     f'{p.id_paciente.nombres} {p.id_paciente.apellidos}',
                'estado_postoperatorio': p.estado_postoperatorio,
                'fecha_control':         p.fecha_control.isoformat() if p.fecha_control else '',
                'proximo_control':       p.proximo_control.isoformat() if p.proximo_control else '',
                'alertas':              p.alertas or '',
                'observaciones':        p.observaciones or '',
            })

        return {
            'total':       total,
            'complicados': complicados,
            'por_estado':  por_estado,
            'listado':     listado,
        }, total

    def _reporte_crm(self, f_desde, f_hasta, filtros):
        from apps.crm.models import HistorialContacto

        qs = HistorialContacto.objects.select_related('id_paciente')

        if f_desde:
            qs = qs.filter(fecha_contacto__date__gte=f_desde)
        if f_hasta:
            qs = qs.filter(fecha_contacto__date__lte=f_hasta)

        if filtros.get('id_paciente'):
            qs = qs.filter(id_paciente=filtros['id_paciente'])
        if filtros.get('id_campana'):
            qs = qs.filter(id_campana=filtros['id_campana'])
        if filtros.get('canal'):
            qs = qs.filter(canal=filtros['canal'])
        if filtros.get('tipo_mensaje'):
            qs = qs.filter(tipo_mensaje=filtros['tipo_mensaje'])
        if filtros.get('estado'):
            qs = qs.filter(estado_comunicacion=filtros['estado'])

        total = qs.count()
        respondidos = qs.filter(estado_comunicacion='RESPONDIDO').count()
        tasa_respuesta = round((respondidos / total * 100), 1) if total else 0.0

        por_canal = list(
            qs.values('canal').annotate(total=Count('id_historial_contacto')).order_by('-total')
        )
        por_tipo = list(
            qs.values('tipo_mensaje').annotate(total=Count('id_historial_contacto')).order_by('-total')
        )
        por_estado = list(
            qs.values('estado_comunicacion').annotate(total=Count('id_historial_contacto')).order_by('-total')
        )

        listado = []
        for c in qs.order_by('-fecha_contacto')[:500]:
            listado.append({
                'id_historial_contacto': c.id_historial_contacto,
                'paciente_id':           c.id_paciente_id,
                'paciente_nombres':      f'{c.id_paciente.nombres} {c.id_paciente.apellidos}',
                'canal':                 c.canal,
                'tipo_mensaje':          c.tipo_mensaje,
                'estado_comunicacion':   c.estado_comunicacion,
                'asunto':                c.asunto or '',
                'fecha_contacto':        c.fecha_contacto.isoformat(),
                'tiene_respuesta':       bool(c.respuesta_paciente),
            })

        return {
            'total':          total,
            'respondidos':    respondidos,
            'tasa_respuesta': tasa_respuesta,
            'por_canal':      por_canal,
            'por_tipo':       por_tipo,
            'por_estado':     por_estado,
            'listado':        listado,
        }, total

    # ── Exportación CSV ───────────────────────────────────────────────────────

    def _csv_response(self, tipo: str, datos: dict) -> HttpResponse:
        """
        Convierte el listado del reporte a un archivo CSV descargable.
        Cada tipo de reporte tiene su listado; si hay 'listado' en datos, lo usa.
        Para métricas adicionales (resúmenes), agrega secciones extra al inicio.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        nombre_archivo = f'reporte_{tipo.lower()}_{datetime.date.today().isoformat()}.csv'

        listado = datos.get('listado', [])
        if not listado:
            writer.writerow(['Sin datos para el reporte solicitado.'])
            response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
            return response

        # Cabeceras = claves del primer registro
        headers = list(listado[0].keys())
        writer.writerow(headers)
        for row in listado:
            writer.writerow([row.get(h, '') for h in headers])

        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
        return response
