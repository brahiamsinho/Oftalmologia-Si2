"""
Seeder demo para historias y documentos clinicos.

Objetivo:
- asegurar que todos los pacientes demo tengan historia clinica
- emitir al menos una receta e indicacion visibles en frontend
"""
from django.contrib.auth import get_user_model

from apps.atencionClinica.documentos_clinicos.models import (
    DocumentoClinicoAutorizado,
    TipoDocumentoClinico,
)
from apps.atencionClinica.documentos_clinicos.services import emitir_documento_clinico
from apps.pacientes.historial_clinico.models import EstadoHistoriaClinica, HistoriaClinica
from apps.pacientes.pacientes.models import Paciente


DOC_ORIGIN_MODULE = 'seed_documentos_clinicos_demo'

SPECIAL_PATIENTS = {
    'DEMO-BRANDON-001': {
        'creator_username': 'carlos.ramirez',
        'motivo': 'Seguimiento demo para consulta oftalmologica y recetas visibles en UI.',
        'documents': (
            {
                'origin_id': 10001,
                'tipo': TipoDocumentoClinico.RECETA,
                'titulo': 'Receta demo de lubricacion ocular',
                'contenido': '\n'.join([
                    'Lagrimas artificiales 1 gota en ambos ojos cada 8 horas por 14 dias.',
                    'Evitar frotarse los ojos y reducir pantalla por periodos prolongados.',
                    'Si aparece dolor intenso o baja visual, consultar de inmediato.',
                ]),
            },
            {
                'origin_id': 10002,
                'tipo': TipoDocumentoClinico.INDICACION,
                'titulo': 'Indicaciones de control demo',
                'contenido': '\n'.join([
                    'Control oftalmologico en 7 dias.',
                    'Mantener higiene palpebral dos veces por dia.',
                    'Usar proteccion solar al salir a la calle.',
                ]),
            },
        ),
    },
    'DEMO-SOFIA-001': {
        'creator_username': 'ana.chen',
        'motivo': 'Seguimiento demo adicional con recetas para validar el flujo paciente.',
        'documents': (
            {
                'origin_id': 20001,
                'tipo': TipoDocumentoClinico.RECETA,
                'titulo': 'Receta demo para ojo seco',
                'contenido': '\n'.join([
                    'Lagrimas artificiales 1 gota cada 6 horas por 10 dias.',
                    'Compresas tibias 5 minutos, 2 veces al dia.',
                    'Si hay secrecion, dolor o enrojecimiento progresivo, consultar.',
                ]),
            },
            {
                'origin_id': 20002,
                'tipo': TipoDocumentoClinico.INDICACION,
                'titulo': 'Indicaciones de seguimiento demo',
                'contenido': '\n'.join([
                    'Revisar evolucion en la siguiente cita de control.',
                    'No usar lentes de contacto hasta nueva indicacion.',
                    'Registrar cualquier cambio de vision en el chat del asistente.',
                ]),
            },
        ),
    },
}

GENERIC_RECETA_VARIANTS = (
    [
        'Lagrimas artificiales 1 gota en ambos ojos cada 8 horas por 10 dias.',
        'Evitar frotarse los ojos y usar pausas visuales cada 20 minutos.',
        'Si aparece dolor intenso, consulta urgente.',
    ],
    [
        'Compresas tibias 5 minutos, 2 veces al dia.',
        'No usar lentes de contacto hasta la siguiente revision.',
        'Mantener buena higiene palpebral.',
    ],
    [
        'Colirio lubricante 1 gota cada 6 horas por 7 dias.',
        'Suspender automedicacion y seguir indicacion profesional.',
        'Controlar evolucion en consulta programada.',
    ],
)

GENERIC_INDICACION_VARIANTS = (
    [
        'Control oftalmologico en 7 dias.',
        'Registrar cambios de vision o dolor ocular.',
        'Usar proteccion solar al salir a la calle.',
    ],
    [
        'Revisar sintomas antes de la siguiente cita.',
        'Mantener hidratacion y descanso visual.',
        'Acudir antes si empeora el enrojecimiento.',
    ],
    [
        'No frotar los ojos ni manipular la zona ocular.',
        'Conservar higiene de parpados dos veces al dia.',
        'Volver al control segun cronograma indicado.',
    ],
)


def _get_creator(username: str):
    User = get_user_model()
    creator = User.objects.filter(username=username).first()
    if creator:
        return creator
    return User.objects.filter(tipo_usuario='MEDICO').first()


def _ensure_history(paciente: Paciente):
    historia, created = HistoriaClinica.objects.get_or_create(
        id_paciente=paciente,
        defaults={
            'motivo_apertura': 'Historia demo creada para mostrar recetas e indicaciones en el flujo del paciente.',
            'estado': EstadoHistoriaClinica.ACTIVA,
        },
    )

    changed = False
    if not historia.motivo_apertura:
        historia.motivo_apertura = 'Historia demo creada para mostrar recetas e indicaciones en el flujo del paciente.'
        changed = True
    if historia.estado != EstadoHistoriaClinica.ACTIVA:
        historia.estado = EstadoHistoriaClinica.ACTIVA
        changed = True
    if changed:
        historia.save(update_fields=['motivo_apertura', 'estado'])

    return historia, created


def _generic_documents_for_patient(paciente: Paciente, index: int):
    variant_idx = index % len(GENERIC_RECETA_VARIANTS)
    base_name = paciente.get_full_name()
    history_label = paciente.numero_historia or f'HC-{paciente.id_paciente}'

    return (
        {
            'origin_id': paciente.id_paciente * 100 + 1,
            'tipo': TipoDocumentoClinico.RECETA,
            'titulo': f'Receta demo para {base_name}',
            'contenido': '\n'.join([
                f'Paciente: {base_name} ({history_label}).',
                *GENERIC_RECETA_VARIANTS[variant_idx],
            ]),
        },
        {
            'origin_id': paciente.id_paciente * 100 + 2,
            'tipo': TipoDocumentoClinico.INDICACION,
            'titulo': f'Indicaciones demo para {base_name}',
            'contenido': '\n'.join([
                f'Paciente: {base_name} ({history_label}).',
                *GENERIC_INDICACION_VARIANTS[variant_idx],
            ]),
        },
    )


def _patient_documents(paciente: Paciente, index: int):
    special = SPECIAL_PATIENTS.get(paciente.numero_documento)
    if special:
        return special['creator_username'], special['motivo'], special['documents']

    return (
        'carlos.ramirez',
        'Historia demo generica para el flujo CU26 de documentos clinicos.',
        _generic_documents_for_patient(paciente, index),
    )


def run():
    creados = 0
    existentes = 0

    pacientes = list(Paciente.objects.select_related('usuario').order_by('id_paciente'))
    if not pacientes:
        raise RuntimeError(
            'No se encontraron pacientes. Ejecuta primero seed_demo_paciente o seed_reporting_6months.'
        )

    staff_pool = list(
        get_user_model().objects.filter(tipo_usuario__in=['ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA']).order_by('id')
    )

    for index, paciente in enumerate(pacientes):
        historia, historia_created = _ensure_history(paciente)
        if historia_created:
            creados += 1
        else:
            existentes += 1

        creator_username, motivo, documents = _patient_documents(paciente, index)
        creador = _get_creator(creator_username)
        if creador is None and staff_pool:
            creador = staff_pool[index % len(staff_pool)]

        for doc_idx, doc_cfg in enumerate(documents, start=1):
            existed = DocumentoClinicoAutorizado.objects.filter(
                origen_modulo=DOC_ORIGIN_MODULE,
                origen_registro_id=doc_cfg['origin_id'],
            ).exists()

            emitir_documento_clinico(
                historia_clinica=historia,
                tipo_documento=doc_cfg['tipo'],
                titulo=doc_cfg['titulo'],
                contenido=doc_cfg['contenido'],
                creado_por=creador,
                origen_modulo=DOC_ORIGIN_MODULE,
                origen_registro_id=doc_cfg['origin_id'],
                observaciones=f'Seed demo de documentos clinicos #{doc_idx}: {motivo}',
            )

            if existed:
                existentes += 1
            else:
                creados += 1

    return creados, existentes
