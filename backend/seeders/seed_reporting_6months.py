"""
seeders/seed_reporting_6months.py

Genera datos históricos mínimos de 6 meses para reportes:
- pacientes con fecha_registro distribuida por mes
- citas con distintos estados (ATENDIDA, NO_ASISTIO, CANCELADA, CONFIRMADA)

Este seeder está orientado a mejorar pruebas de reportes QBE + IA.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone as dj_tz

from apps.atencionClinica.citas.models import Cita, EstadoCita, TipoCita, TipoCitaNombre
from apps.atencionClinica.especialistas.models import Especialista
from apps.pacientes.pacientes.models import EstadoPaciente, Paciente

NOMBRES = [
    ('María', 'Fernández'),
    ('José', 'Vargas'),
    ('Lucía', 'Mamani'),
    ('Carlos', 'Suárez'),
    ('Daniela', 'Paredes'),
    ('Miguel', 'Rojas'),
    ('Andrea', 'Quispe'),
    ('Raúl', 'Arce'),
    ('Paola', 'Medina'),
    ('Héctor', 'Flores'),
    ('Natalia', 'Soria'),
    ('Ricardo', 'Herrera'),
]

MOTIVOS = [
    'Control de agudeza visual',
    'Seguimiento de glaucoma',
    'Evaluación preoperatoria de catarata',
    'Control postoperatorio de facoemulsificación',
    'Molestia ocular y ojo seco',
    'Chequeo por visión borrosa',
]

OBSERVACIONES = [
    'Control sin incidencias. Recomendado seguimiento trimestral.',
    'Se sugiere mantener tratamiento y control de presión intraocular.',
    'Paciente refiere mejoría parcial, continuar con lágrimas artificiales.',
    'Se solicita nueva campimetría en próxima visita.',
    'Sin hallazgos de alarma en segmento anterior.',
]

SEGUROS = ['Particular', 'Caja Petrolera', 'Seguro Universitario', 'Convenio Empresarial']
TIPOS_DOCUMENTO = ['DNI', 'CI', 'PASAPORTE']
SEXOS = ['F', 'M']


def _month_anchor(months_back: int):
    now = dj_tz.localtime(dj_tz.now())
    # Aproximación robusta sin dependencias extra (30 días por mes).
    anchor = now - timedelta(days=months_back * 30)
    return anchor.replace(day=15, hour=10, minute=0, second=0, microsecond=0)


def _ensure_tipo_consulta():
    return TipoCita.objects.get(nombre=TipoCitaNombre.CONSULTA)


def _ensure_specialists():
    specialists = list(Especialista.objects.filter(activo=True)[:2])
    if specialists:
        return specialists

    User = get_user_model()
    medic, _created = User.objects.get_or_create(
        username='medico.reportes',
        defaults={
            'email': 'medico.reportes@oftalmologia.local',
            'nombres': 'Médico',
            'apellidos': 'Reportes',
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
            'codigo_profesional': 'MP-RPT-001',
            'activo': True,
        },
    )
    return [esp]


def _pick(seq, idx):
    return seq[idx % len(seq)]


def _birth_date_for_index(idx: int):
    # Rango 18-78 años, determinístico para mantener idempotencia.
    age = 18 + (idx % 61)
    base = date.today() - timedelta(days=(age * 365) + (idx % 30))
    return base


def _estado_for_patient(global_idx: int):
    # Distribución realista: más activos/en seguimiento, menos inactivos.
    bucket = global_idx % 10
    if bucket <= 4:
        return EstadoPaciente.ACTIVO
    if bucket <= 7:
        return EstadoPaciente.EN_SEGUIMIENTO
    if bucket == 8:
        return EstadoPaciente.POSTOPERATORIO
    return EstadoPaciente.INACTIVO


def _estado_for_cita(global_idx: int, cita_idx: int):
    # 55% atendidas, 20% confirmadas, 15% no asistió, 10% canceladas.
    bucket = (global_idx + cita_idx) % 20
    if bucket <= 10:
        return EstadoCita.ATENDIDA
    if bucket <= 14:
        return EstadoCita.CONFIRMADA
    if bucket <= 17:
        return EstadoCita.NO_ASISTIO
    return EstadoCita.CANCELADA


def _history_number_for_doc(doc: str):
    # Evita choques de secuenciales globales cuando hay restores o borrados.
    token = doc.replace('RPT6M-', '')
    return f'HC-RPT6M-{token}'


def run():
    tipo_consulta = _ensure_tipo_consulta()
    specialists = _ensure_specialists()

    creados = 0
    existentes = 0
    paciente_index = 0

    for months_back in range(5, -1, -1):
        base = _month_anchor(months_back)
        for i in range(8):  # 8 pacientes por mes (48 total)
            paciente_index += 1
            nombre, apellido = _pick(NOMBRES, paciente_index - 1)
            doc = f'RPT6M-{base.year}{base.month:02d}-{i + 1:02d}'
            email = (
                f"{nombre.lower()}.{apellido.lower()}.{base.year}{base.month:02d}{i + 1:02d}"
                '@demo.local'
            )
            estado_p = _estado_for_patient(paciente_index)
            telefono = f'+5917{(2000000 + paciente_index):07d}'
            seguro = _pick(SEGUROS, paciente_index)
            tipo_documento = _pick(TIPOS_DOCUMENTO, paciente_index)
            sexo = _pick(SEXOS, paciente_index)
            fecha_nacimiento = _birth_date_for_index(paciente_index)

            paciente, p_created = Paciente.objects.get_or_create(
                numero_documento=doc,
                defaults={
                    'numero_historia': _history_number_for_doc(doc),
                    'tipo_documento': tipo_documento,
                    'nombres': nombre,
                    'apellidos': apellido,
                    'email': email,
                    'telefono': telefono,
                    'sexo': sexo,
                    'fecha_nacimiento': fecha_nacimiento,
                    'direccion': f'Zona {_pick(["Norte", "Centro", "Sur", "Este"], paciente_index)}, Santa Cruz',
                    'contacto_emergencia_nombre': f'{_pick(NOMBRES, paciente_index + 3)[0]} {_pick(NOMBRES, paciente_index + 5)[1]}',
                    'contacto_emergencia_telefono': f'+5917{(3000000 + paciente_index):07d}',
                    'estado_paciente': estado_p,
                    'fecha_registro': base - timedelta(days=i * 3),
                    'observaciones_generales': f'Seguro: {seguro}. Historia creada para analítica.',
                },
            )
            if p_created:
                creados += 1
            else:
                paciente.tipo_documento = tipo_documento
                paciente.estado_paciente = estado_p
                paciente.email = email
                paciente.telefono = telefono
                paciente.sexo = sexo
                paciente.fecha_nacimiento = fecha_nacimiento
                paciente.fecha_registro = base - timedelta(days=i * 3)
                paciente.observaciones_generales = f'Seguro: {seguro}. Historia actualizada para analítica.'
                paciente.save(
                    update_fields=[
                        'tipo_documento',
                        'estado_paciente',
                        'email',
                        'telefono',
                        'sexo',
                        'fecha_nacimiento',
                        'fecha_registro',
                        'observaciones_generales',
                    ]
                )
                existentes += 1

            for j in range(3):  # 3 citas por paciente en 6 meses
                start = (base + timedelta(days=(i * 2) + (j * 8))).replace(hour=8 + ((paciente_index + j) % 8))
                end = start + timedelta(minutes=25 + ((paciente_index + j) % 3) * 10)
                estado_c = _estado_for_cita(paciente_index, j)
                especialista = specialists[(paciente_index + j) % len(specialists)]
                motivo = _pick(MOTIVOS, paciente_index + j)
                observacion = _pick(OBSERVACIONES, paciente_index + j)

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
                        f'{observacion} '
                        f'[Semilla analítica {base.year}-{base.month:02d}]'
                    ),
                    confirmada_en=start if estado_c in (EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA) else None,
                    creado_por=especialista.usuario,
                    fecha_creacion=start - timedelta(days=1),
                )
                creados += 1

    return creados, existentes
