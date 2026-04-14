"""
seeders/seed_permisos.py
Pobla la tabla permisos con los permisos granulares del sistema.
Idempotente: usa get_or_create, puede ejecutarse múltiples veces sin duplicar.

Convención de código: '<modulo>.<accion>'
Módulos: users, pacientes, especialistas, historias_clinicas,
         citas, bitacora, roles, permisos
"""
from apps.usuarios.permisos.models import Permiso


PERMISOS = [
    # ── Usuarios ──────────────────────────────────────────────────────────────
    {'codigo': 'users.listar',    'nombre': 'Listar usuarios',       'modulo': 'users'},
    {'codigo': 'users.ver',       'nombre': 'Ver usuario',            'modulo': 'users'},
    {'codigo': 'users.crear',     'nombre': 'Crear usuario',          'modulo': 'users'},
    {'codigo': 'users.editar',    'nombre': 'Editar usuario',         'modulo': 'users'},
    {'codigo': 'users.eliminar',  'nombre': 'Eliminar usuario',       'modulo': 'users'},

    # ── Pacientes ─────────────────────────────────────────────────────────────
    {'codigo': 'pacientes.listar',   'nombre': 'Listar pacientes',    'modulo': 'pacientes'},
    {'codigo': 'pacientes.ver',      'nombre': 'Ver paciente',        'modulo': 'pacientes'},
    {'codigo': 'pacientes.crear',    'nombre': 'Crear paciente',      'modulo': 'pacientes'},
    {'codigo': 'pacientes.editar',   'nombre': 'Editar paciente',     'modulo': 'pacientes'},
    {'codigo': 'pacientes.eliminar', 'nombre': 'Eliminar paciente',   'modulo': 'pacientes'},

    # ── Especialistas ─────────────────────────────────────────────────────────
    {'codigo': 'especialistas.listar',   'nombre': 'Listar especialistas',  'modulo': 'especialistas'},
    {'codigo': 'especialistas.ver',      'nombre': 'Ver especialista',       'modulo': 'especialistas'},
    {'codigo': 'especialistas.crear',    'nombre': 'Crear especialista',     'modulo': 'especialistas'},
    {'codigo': 'especialistas.editar',   'nombre': 'Editar especialista',    'modulo': 'especialistas'},
    {'codigo': 'especialistas.eliminar', 'nombre': 'Eliminar especialista',  'modulo': 'especialistas'},

    # ── Historias Clínicas ────────────────────────────────────────────────────
    {'codigo': 'historias.listar',   'nombre': 'Listar historias clínicas', 'modulo': 'historias_clinicas'},
    {'codigo': 'historias.ver',      'nombre': 'Ver historia clínica',       'modulo': 'historias_clinicas'},
    {'codigo': 'historias.crear',    'nombre': 'Crear historia clínica',     'modulo': 'historias_clinicas'},
    {'codigo': 'historias.editar',   'nombre': 'Editar historia clínica',    'modulo': 'historias_clinicas'},
    {'codigo': 'historias.eliminar', 'nombre': 'Eliminar historia clínica',  'modulo': 'historias_clinicas'},

    # ── Citas ─────────────────────────────────────────────────────────────────
    {'codigo': 'citas.listar',      'nombre': 'Listar citas',          'modulo': 'citas'},
    {'codigo': 'citas.ver',         'nombre': 'Ver cita',              'modulo': 'citas'},
    {'codigo': 'citas.crear',       'nombre': 'Crear cita',            'modulo': 'citas'},
    {'codigo': 'citas.editar',      'nombre': 'Editar cita',           'modulo': 'citas'},
    {'codigo': 'citas.cancelar',    'nombre': 'Cancelar cita',         'modulo': 'citas'},
    {'codigo': 'citas.confirmar',   'nombre': 'Confirmar cita',        'modulo': 'citas'},
    {'codigo': 'citas.reprogramar', 'nombre': 'Reprogramar cita',      'modulo': 'citas'},

    # ── Bitácora ──────────────────────────────────────────────────────────────
    {'codigo': 'bitacora.ver', 'nombre': 'Ver bitácora de auditoría', 'modulo': 'bitacora'},

    # ── Roles y Permisos ──────────────────────────────────────────────────────
    {'codigo': 'roles.listar',    'nombre': 'Listar roles',    'modulo': 'roles'},
    {'codigo': 'roles.crear',     'nombre': 'Crear rol',       'modulo': 'roles'},
    {'codigo': 'roles.editar',    'nombre': 'Editar rol',      'modulo': 'roles'},
    {'codigo': 'roles.eliminar',  'nombre': 'Eliminar rol',    'modulo': 'roles'},
    {'codigo': 'permisos.listar', 'nombre': 'Listar permisos', 'modulo': 'permisos'},
    {'codigo': 'permisos.crear',  'nombre': 'Crear permiso',   'modulo': 'permisos'},
    {'codigo': 'permisos.editar', 'nombre': 'Editar permiso',  'modulo': 'permisos'},
]


def run():
    """
    Crea los permisos granulares si no existen.
    Retorna (creados, existentes).
    """
    creados = 0
    existentes = 0

    for data in PERMISOS:
        _, created = Permiso.objects.get_or_create(
            codigo=data['codigo'],
            defaults={
                'nombre': data['nombre'],
                'modulo': data['modulo'],
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1

    return creados, existentes
