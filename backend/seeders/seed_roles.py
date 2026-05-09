"""
seeders/seed_roles.py

Pobla la tabla roles con los roles base del sistema oftalmológico.
"""
from apps.usuarios.roles.models import Rol


ROLES_BASE = [
    {
        'codigo': 'admin-sistema',
        'nombre': 'Administrador del Sistema',
        'descripcion': 'Acceso total al sistema. Gestión de usuarios, configuración y auditoría.',
    },
    {
        'codigo': 'medico-oftalmologo',
        'nombre': 'Médico Oftalmólogo',
        'descripcion': 'Acceso a historias clínicas y citas propias.',
    },
    {
        'codigo': 'recepcionista',
        'nombre': 'Recepcionista',
        'descripcion': 'Gestión de citas, registro de pacientes y agendamiento.',
    },
    {
        'codigo': 'paciente',
        'nombre': 'Paciente',
        'descripcion': 'Visualización de su propia historia clínica y citas.',
    },
    {
        'codigo': 'tecnico-especialista',
        'nombre': 'Técnico Especialista',
        'descripcion': 'Realización de estudios diagnósticos y carga de resultados.',
    },
]


def run():
    """
    Crea o actualiza los roles base en el schema actual.
    Retorna (creados, existentes).
    """
    creados = 0
    existentes = 0

    for data in ROLES_BASE:
        rol, created = Rol.objects.get_or_create(
            nombre=data['nombre'],
            defaults={
                'codigo': data['codigo'],
                'descripcion': data['descripcion'],
                'activo': True,
                'es_sistema': True,
            },
        )

        if not created:
            rol.codigo = data['codigo']
            rol.descripcion = data['descripcion']
            rol.activo = True
            rol.es_sistema = True
            rol.save(update_fields=['codigo', 'descripcion', 'activo', 'es_sistema'])
            existentes += 1
        else:
            creados += 1

    return creados, existentes