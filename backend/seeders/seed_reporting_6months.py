"""
seeders/seed_reporting_6months.py

Genera datos históricos de ~6 meses para reportes (QBE + IA):
- **12 fichas clínicas únicas** por tenant (nombres distintos, sin repetir 4x el mismo)
- varias citas repartidas en el tiempo sobre esos mismos pacientes

Importante: esto crea registros en ``Paciente``, no usuarios con rol PACIENTE.
La cuenta app de paciente la crea ``seed_demo_paciente`` (Brandon).
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone as dj_tz

from apps.atencionClinica.citas.models import Cita, EstadoCita, TipoCita, TipoCitaNombre
from apps.atencionClinica.especialistas.models import Especialista
from apps.pacientes.pacientes.models import EstadoPaciente, Paciente

from seeders.demo_data_variety import (
    REPORTING_SEED_TAG,
    get_tenant_profile,
    patient_address,
    patient_email,
    patient_history_number,
    patient_identity,
    remove_legacy_rpt6m_patients,
    remove_reporting_analytics_patients,
    reporting_patient_document,
)

# Fichas clínicas de demo para reportes (no confundir con usuarios PACIENTE del módulo Usuarios).
UNIQUE_REPORTING_PATIENTS = 12
CITAS_POR_MES = 4

MOTIVOS = [
    'Control de agudeza visual',
    'Seguimiento de glaucoma',
    'Evaluación preoperatoria de catarata',
    'Control postoperatorio de facoemulsificación',
    'Molestia ocular y ojo seco',
    'Chequeo por visión borrosa',
    'Campimetría de seguimiento',
    'Adaptación de lentes de contacto',
]

OBSERVACIONES = [
    'Control sin incidencias. Recomendado seguimiento trimestral.',
    'Se sugiere mantener tratamiento y control de presión intraocular.',
    'Paciente refiere mejoría parcial, continuar con lágrimas artificiales.',
    'Se solicita nueva campimetría en próxima visita.',
    'Sin hallazgos de alarma en segmento anterior.',
    'Revisión de fondo de ojo programada en 3 meses.',
]

SEGUROS = ['Particular', 'Caja Petrolera', 'Seguro Universitario', 'Convenio Empresarial']
TIPOS_DOCUMENTO = ['DNI', 'CI', 'PASAPORTE']
SEXOS = ['F', 'M']


def _month_anchor(months_back: int):
    now = dj_tz.localtime(dj_tz.now())
    anchor = now - timedelta(days=months_back * 30)
    return anchor.replace(day=15, hour=10, minute=0, second=0, microsecond=0)


def _ensure_tipo_consulta():
    return TipoCita.objects.get(nombre=TipoCitaNombre.CONSULTA)


def _ensure_specialists(profile):
    specialists = list(Especialista.objects.filter(activo=True)[:3])
    if specialists:
        return specialists

    User = get_user_model()
    username = f'medico.reportes.{profile.code.lower()}'
    email = f'reportes.{profile.code.lower()}@oftalmologia.local'

    medic, _created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'nombres': 'Médico',
            'apellidos': f'Reportes {profile.code}',
            'tipo_usuario': 'MEDICO',
            'estado': 'ACTIVO',
            'is_active': True,
        },
    )
    medic.set_password('Medico123!')
    medic.save()

    esp, _esp_created = Especialista.objects.get_or_create(
        usuario=medic,
        defaults={
            'especialidad': 'Oftalmología general',
            'codigo_profesional': f'MP-{profile.code}-RPT',
            'activo': True,
        },
    )
    return [esp]


def _pick(seq, idx):
    return seq[idx % len(seq)]


def _birth_date_for_index(idx: int, profile_offset: int):
    age = 18 + ((idx + profile_offset) % 61)
    return date.today() - timedelta(days=(age * 365) + ((idx + profile_offset) % 30))


def _estado_for_patient(global_idx: int, profile_offset: int):
    bucket = (global_idx + profile_offset) % 10
    if bucket <= 4:
        return EstadoPaciente.ACTIVO
    if bucket <= 7:
        return EstadoPaciente.EN_SEGUIMIENTO
    if bucket == 8:
        return EstadoPaciente.POSTOPERATORIO
    return EstadoPaciente.INACTIVO


def _estado_for_cita(global_idx: int, cita_idx: int, profile_offset: int):
    bucket = (global_idx + cita_idx + profile_offset) % 20
    if bucket <= 10:
        return EstadoCita.ATENDIDA
    if bucket <= 14:
        return EstadoCita.CONFIRMADA
    if bucket <= 17:
        return EstadoCita.NO_ASISTIO
    return EstadoCita.CANCELADA


def _ensure_reporting_patients(profile):
    """Crea o actualiza las 12 fichas clínicas únicas del tenant."""
    pacientes = []
    for slot in range(1, UNIQUE_REPORTING_PATIENTS + 1):
        nombre, apellido = patient_identity(slot, profile)
        doc = reporting_patient_document(profile, slot)
        email = patient_email(nombre, apellido, 2026, 1, slot, profile)
        seguro = _pick(SEGUROS, slot + profile.offset)

        paciente, _created = Paciente.objects.update_or_create(
            numero_documento=doc,
            defaults={
                'numero_historia': patient_history_number(doc),
                'tipo_documento': _pick(TIPOS_DOCUMENTO, slot),
                'nombres': nombre,
                'apellidos': apellido,
                'email': email,
                'telefono': f'+5917{(2000000 + profile.offset + slot):07d}',
                'sexo': _pick(SEXOS, slot),
                'fecha_nacimiento': _birth_date_for_index(slot, profile.offset),
                'direccion': patient_address(slot, profile),
                'contacto_emergencia_nombre': f'{nombre} {apellido}',
                'contacto_emergencia_telefono': f'+5917{(3000000 + slot):07d}',
                'estado_paciente': _estado_for_patient(slot, profile.offset),
                'fecha_registro': dj_tz.now() - timedelta(days=slot * 12),
                'observaciones_generales': (
                    f'Seguro: {seguro}. Ficha clínica demo {profile.code} — {REPORTING_SEED_TAG}. '
                    'Sin cuenta de app móvil.'
                ),
            },
        )
        pacientes.append(paciente)
    return pacientes


def run():
    profile = get_tenant_profile()
    tipo_consulta = _ensure_tipo_consulta()
    specialists = _ensure_specialists(profile)

    creados = 0
    existentes = 0

    remove_legacy_rpt6m_patients()
    remove_reporting_analytics_patients()

    pacientes = _ensure_reporting_patients(profile)
    cita_seq = 0

    for months_back in range(5, -1, -1):
        base = _month_anchor(months_back)
        for cita_idx in range(CITAS_POR_MES):
            paciente = pacientes[(months_back * CITAS_POR_MES + cita_idx) % len(pacientes)]
            slot = pacientes.index(paciente) + 1
            cita_seq += 1

            start = (base + timedelta(days=cita_idx * 4)).replace(
                hour=8 + (cita_seq % 8),
            )
            end = start + timedelta(minutes=25 + (cita_seq % 3) * 10)
            estado_c = _estado_for_cita(slot, cita_idx, profile.offset)
            especialista = specialists[cita_seq % len(specialists)]
            motivo = _pick(MOTIVOS, cita_seq + profile.offset)
            observacion = _pick(OBSERVACIONES, cita_seq)

            cita_exists = Cita.objects.filter(
                id_paciente=paciente,
                fecha_hora_inicio=start,
                motivo=motivo,
            ).exists()

            if cita_exists:
                existentes += 1
                continue

            Cita.objects.create(
                id_paciente=paciente,
                id_especialista=especialista,
                id_tipo_cita=tipo_consulta,
                fecha_hora_inicio=start,
                fecha_hora_fin=end,
                estado=estado_c,
                motivo=motivo,
                observaciones=(
                    f'{observacion} [{profile.code} · {base.year}-{base.month:02d}]'
                ),
                confirmada_en=start if estado_c in (EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA) else None,
                creado_por=especialista.usuario,
                fecha_creacion=start - timedelta(days=1),
            )
            creados += 1

    return creados, existentes
