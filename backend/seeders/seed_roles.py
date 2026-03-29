"""
seeders/seed_roles.py
Pobla la tabla roles con los roles base del sistema oftalmológico.
Idempotente: usa get_or_create, puede ejecutarse múltiples veces sin duplicar.
"""
from apps.roles.models import Rol


ROLES_BASE = [
    {
        'nombre': 'Administrador del Sistema',
        'descripcion': 'Acceso total al sistema. Gestión de usuarios, configuración y auditoría.',
    },
    {
        'nombre': 'Médico Oftalmólogo',
        'descripcion': 'Acceso a historias clínicas, diagnósticos, recetas y citas propias.',
    },
    {
        'nombre': 'Recepcionista',
        'descripcion': 'Gestión de citas, registro de pacientes y agendamiento.',
    },
    {
        'nombre': 'Paciente',
        'descripcion': 'Visualización de su propia historia clínica y citas.',
    },
    {
        'nombre': 'Técnico Especialista',
        'descripcion': 'Realización de estudios diagnósticos y carga de resultados.',
    },
]


def run():
    """
    Crea los roles base si no existen.
    Retorna (creados, existentes).
    """
    creados = 0
    existentes = 0

    for data in ROLES_BASE:
        _, created = Rol.objects.get_or_create(
            nombre=data['nombre'],
            defaults={'descripcion': data['descripcion'], 'activo': True},
        )
        if created:
            creados += 1
        else:
            existentes += 1

    return creados, existentes
