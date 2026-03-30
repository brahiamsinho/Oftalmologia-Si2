"""
seeders/seed_demo_paciente.py
Datos de demostración: paciente + 2 médicos + 2 citas futuras (alineado a diseño Figma).

Solo desarrollo. Vuelve a fijar la contraseña del usuario demo en cada ejecución.

Login API (solo correo electrónico):
  • Email:    brandon@gmail.com
  • Password: Felipe321
  (El username "brandon" ya no se usa para iniciar sesión.)

Requiere haber ejecutado antes: seed tipos_cita (CONSULTA).
"""
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone as dj_tz

from apps.citas.models import Cita, EstadoCita, TipoCita, TipoCitaNombre
from apps.especialistas.models import Especialista
from apps.pacientes.models import Paciente
from apps.pacientes.utils import generar_numero_historia

User = get_user_model()

DEMO_USERNAME = 'brandon'
DEMO_EMAIL = 'brandon@gmail.com'
DEMO_PASSWORD = 'Felipe321'


def _ensure_tipo_consulta():
    return TipoCita.objects.get(nombre=TipoCitaNombre.CONSULTA)


def _ensure_user(username, email, password, nombres, apellidos, tipo_usuario):
    u, _created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'nombres': nombres,
            'apellidos': apellidos,
            'tipo_usuario': tipo_usuario,
            'estado': 'ACTIVO',
            'is_active': True,
        },
    )
    u.email = email
    u.nombres = nombres
    u.apellidos = apellidos
    u.tipo_usuario = tipo_usuario
    u.estado = 'ACTIVO'
    u.is_active = True
    u.set_password(password)
    u.save()
    return u


def _ensure_especialista(usuario, especialidad, codigo):
    esp, _created = Especialista.objects.get_or_create(
        usuario=usuario,
        defaults={
            'especialidad': especialidad,
            'codigo_profesional': codigo,
            'activo': True,
        },
    )
    if not _created:
        esp.especialidad = especialidad
        esp.codigo_profesional = codigo
        esp.activo = True
        esp.save()
    return esp


def run():
    tipo = _ensure_tipo_consulta()

    doc1 = _ensure_user(
        'carlos.ramirez',
        'carlos.ramirez@oftalmologia.local',
        'Medico123!',
        'Carlos',
        'Ramírez',
        'MEDICO',
    )
    doc2 = _ensure_user(
        'ana.chen',
        'ana.chen@oftalmologia.local',
        'Medico123!',
        'Ana',
        'Chen',
        'MEDICO',
    )
    esp1 = _ensure_especialista(doc1, 'Oftalmología general', 'MP-DEMO-001')
    esp2 = _ensure_especialista(doc2, 'Oftalmología general', 'MP-DEMO-002')

    pac_user = _ensure_user(
        DEMO_USERNAME,
        DEMO_EMAIL,
        DEMO_PASSWORD,
        'María',
        'García López',
        'PACIENTE',
    )

    paciente, pc_created = Paciente.objects.get_or_create(
        usuario=pac_user,
        defaults={
            'numero_historia': generar_numero_historia(),
            'tipo_documento': 'DNI',
            'numero_documento': 'DEMO-BRANDON-001',
            'nombres': 'María',
            'apellidos': 'García López',
            'email': DEMO_EMAIL,
            'telefono': '+5491100000000',
        },
    )
    if not pc_created:
        paciente.nombres = 'María'
        paciente.apellidos = 'García López'
        paciente.email = DEMO_EMAIL
        paciente.save()

    citas_data = [
        {
            'inicio': dj_tz.make_aware(datetime(2026, 4, 9, 10, 30)),
            'motivo': 'Control anual',
            'esp': esp1,
            'obs': 'Consultorio 3 — Piso 2',
        },
        {
            'inicio': dj_tz.make_aware(datetime(2026, 4, 24, 15, 0)),
            'motivo': 'Seguimiento post-tratamiento',
            'esp': esp2,
            'obs': 'Consultorio 2 — Piso 1',
        },
    ]

    creados = 0
    existentes = 0
    for row in citas_data:
        fin = row['inicio'] + timedelta(minutes=30)
        exists = Cita.objects.filter(
            id_paciente=paciente,
            id_especialista=row['esp'],
            motivo=row['motivo'],
            fecha_hora_inicio__date=row['inicio'].date(),
        ).exists()
        if exists:
            existentes += 1
            continue
        Cita.objects.create(
            id_paciente=paciente,
            id_especialista=row['esp'],
            id_tipo_cita=tipo,
            fecha_hora_inicio=row['inicio'],
            fecha_hora_fin=fin,
            estado=EstadoCita.CONFIRMADA,
            motivo=row['motivo'],
            observaciones=row['obs'],
            confirmada_en=dj_tz.now(),
        )
        creados += 1

    print(
        '\n  📱 Paciente demo (desarrollo)\n'
        f'     email:    {DEMO_EMAIL}\n'
        f'     password: {DEMO_PASSWORD}\n'
    )

    return creados, existentes
