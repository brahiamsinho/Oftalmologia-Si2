"""
seeders/seed_demo_paciente.py

Datos de demostración:
- paciente demo realista (perfil clínico básico)
- 3 médicos (subespecialidades distintas)
- 3 citas futuras con escenarios clínicos plausibles

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
DEMO_USERNAME = 'brandon'
DEMO_EMAIL = 'brandon@gmail.com'
DEMO_PASSWORD = 'Felipe321'
DEMO_NUMERO_DOCUMENTO = 'DEMO-BRANDON-001'
# Fijo para no chocar con HC-YYYY-NNNNNN generados por otros seeders o borrados/restores.
DEMO_NUMERO_HISTORIA = 'HC-DEMO-BRANDON'


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
    doc3 = _ensure_user(
        'javier.montano',
        'javier.montano@oftalmologia.local',
        'Medico123!',
        'Javier',
        'Montaño',
        'MEDICO',
    )

    esp1 = _ensure_especialista(
        doc1,
        'Oftalmología general',
        'MP-DEMO-001',
    )

    esp2 = _ensure_especialista(
        doc2,
        'Retina y vítreo',
        'MP-DEMO-002',
    )
    esp3 = _ensure_especialista(
        doc3,
        'Glaucoma',
        'MP-DEMO-003',
    )

    pac_user = _ensure_user(
        DEMO_USERNAME,
        DEMO_EMAIL,
        DEMO_PASSWORD,
        'María',
        'García López',
        'PACIENTE',
    )

    # Buscar por documento demo (estable tras restore/DELETE), no solo por usuario:
    # si borraste el paciente pero quedó el usuario, get_or_create(usuario=...) fallaba
    # al generar un numero_historia ya usado por otro registro.
    paciente, paciente_created = Paciente.objects.get_or_create(
        numero_documento=DEMO_NUMERO_DOCUMENTO,
        defaults={
            'usuario': pac_user,
            'numero_historia': DEMO_NUMERO_HISTORIA,
            'tipo_documento': 'CI',
            'nombres': 'María',
            'apellidos': 'García López',
            'email': DEMO_EMAIL,
            'telefono': '+59173456789',
            'sexo': 'F',
            'direccion': 'Av. Alemana, Zona Norte, Santa Cruz',
            'contacto_emergencia_nombre': 'Pedro García',
            'contacto_emergencia_telefono': '+59172345678',
            'observaciones_generales': 'Paciente demo para pruebas funcionales de agenda y reportes.',
        },
    )

    if paciente_created:
        creados += 1
    else:
        paciente.usuario = pac_user
        paciente.nombres = 'María'
        paciente.apellidos = 'García López'
        paciente.email = DEMO_EMAIL
        paciente.telefono = '+59173456789'
        paciente.tipo_documento = 'CI'
        paciente.sexo = 'F'
        paciente.direccion = 'Av. Alemana, Zona Norte, Santa Cruz'
        paciente.contacto_emergencia_nombre = 'Pedro García'
        paciente.contacto_emergencia_telefono = '+59172345678'
        paciente.observaciones_generales = 'Paciente demo para pruebas funcionales de agenda y reportes.'
        if not paciente.numero_historia:
            paciente.numero_historia = DEMO_NUMERO_HISTORIA
        paciente.save(
            update_fields=[
                'usuario',
                'tipo_documento',
                'nombres',
                'apellidos',
                'email',
                'telefono',
                'sexo',
                'direccion',
                'contacto_emergencia_nombre',
                'contacto_emergencia_telefono',
                'observaciones_generales',
                'numero_historia',
            ],
        )
        existentes += 1

    citas_data = [
        {
            'inicio': _fecha_futura(days=3, hour=10, minute=30),
            'motivo': 'Control anual de refracción',
            'esp': esp1,
            'obs': 'Consultorio 3 — Piso 2. Traer lentes actuales.',
        },
        {
            'inicio': _fecha_futura(days=15, hour=15, minute=0),
            'motivo': 'Seguimiento por sospecha de glaucoma',
            'esp': esp2,
            'obs': 'Consultorio 2 — Piso 1. Revisar campimetría previa.',
        },
        {
            'inicio': _fecha_futura(days=28, hour=9, minute=15),
            'motivo': 'Control de superficie ocular y ojo seco',
            'esp': esp3,
            'obs': 'Consultorio 1 — Piso 1. Evaluar respuesta a lágrimas artificiales.',
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