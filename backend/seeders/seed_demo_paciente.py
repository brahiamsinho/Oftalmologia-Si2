"""
seeders/seed_demo_paciente.py

Datos de demostración: paciente + 2 médicos + 2 citas futuras.

Login API:
  Email:    brandon@gmail.com
  Password: Felipe321

Requiere haber ejecutado antes:
    python manage.py seed --tenant clinica-demo --only tipos_cita
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone as dj_tz

from apps.atencionClinica.citas.models import (
    Cita,
    EstadoCita,
    TipoCita,
    TipoCitaNombre,
)
from apps.atencionClinica.especialistas.models import Especialista
from apps.pacientes.pacientes.models import Paciente
from apps.pacientes.pacientes.utils import generar_numero_historia


DEMO_USERNAME = 'brandon'
DEMO_EMAIL = 'brandon@gmail.com'
DEMO_PASSWORD = 'Felipe321'


def _ensure_tipo_consulta():
    return TipoCita.objects.get(nombre=TipoCitaNombre.CONSULTA)


def _ensure_user(username, email, password, nombres, apellidos, tipo_usuario):
    User = get_user_model()

    user, _created = User.objects.get_or_create(
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

    user.email = email
    user.nombres = nombres
    user.apellidos = apellidos
    user.tipo_usuario = tipo_usuario
    user.estado = 'ACTIVO'
    user.is_active = True
    user.set_password(password)
    user.save()

    return user


def _ensure_especialista(usuario, especialidad, codigo):
    especialista, created = Especialista.objects.get_or_create(
        usuario=usuario,
        defaults={
            'especialidad': especialidad,
            'codigo_profesional': codigo,
            'activo': True,
        },
    )

    if not created:
        especialista.especialidad = especialidad
        especialista.codigo_profesional = codigo
        especialista.activo = True
        especialista.save(update_fields=['especialidad', 'codigo_profesional', 'activo'])

    return especialista


def _fecha_futura(days, hour, minute):
    base = dj_tz.localtime(dj_tz.now()) + timedelta(days=days)
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0)


def run():
    tipo = _ensure_tipo_consulta()

    creados = 0
    existentes = 0

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

    esp1 = _ensure_especialista(
        doc1,
        'Oftalmología general',
        'MP-DEMO-001',
    )

    esp2 = _ensure_especialista(
        doc2,
        'Oftalmología general',
        'MP-DEMO-002',
    )

    pac_user = _ensure_user(
        DEMO_USERNAME,
        DEMO_EMAIL,
        DEMO_PASSWORD,
        'María',
        'García López',
        'PACIENTE',
    )

    paciente, paciente_created = Paciente.objects.get_or_create(
        usuario=pac_user,
        defaults={
            'numero_historia': generar_numero_historia(),
            'tipo_documento': 'DNI',
            'numero_documento': 'DEMO-BRANDON-001',
            'nombres': 'María',
            'apellidos': 'García López',
            'email': DEMO_EMAIL,
            'telefono': '+59170000000',
        },
    )

    if paciente_created:
        creados += 1
    else:
        paciente.nombres = 'María'
        paciente.apellidos = 'García López'
        paciente.email = DEMO_EMAIL
        paciente.telefono = '+59170000000'
        paciente.save(update_fields=['nombres', 'apellidos', 'email', 'telefono'])
        existentes += 1

    citas_data = [
        {
            'inicio': _fecha_futura(days=3, hour=10, minute=30),
            'motivo': 'Control anual',
            'esp': esp1,
            'obs': 'Consultorio 3 — Piso 2',
        },
        {
            'inicio': _fecha_futura(days=15, hour=15, minute=0),
            'motivo': 'Seguimiento post-tratamiento',
            'esp': esp2,
            'obs': 'Consultorio 2 — Piso 1',
        },
    ]

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
        '\n  📱 Paciente demo\n'
        f'     email:    {DEMO_EMAIL}\n'
        f'     password: {DEMO_PASSWORD}\n'
    )

    return creados, existentes