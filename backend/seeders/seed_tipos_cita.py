"""
seeders/seed_tipos_cita.py
Pobla la tabla tipos_cita con los 4 tipos definidos en TipoCitaNombre.
Idempotente: usa get_or_create, puede ejecutarse múltiples veces sin duplicar.
"""
from apps.citas.models import TipoCita, TipoCitaNombre


TIPOS_CITA = [
    {
        'nombre': TipoCitaNombre.CONSULTA,
        'descripcion': 'Consulta médica general u oftalmológica de primera vez o seguimiento.',
    },
    {
        'nombre': TipoCitaNombre.ESTUDIO,
        'descripcion': 'Realización de estudios diagnósticos (campo visual, OCT, topografía, etc.).',
    },
    {
        'nombre': TipoCitaNombre.CIRUGIA,
        'descripcion': 'Procedimiento quirúrgico oftalmológico (cataratas, LASIK, glaucoma, etc.).',
    },
    {
        'nombre': TipoCitaNombre.SEGUIMIENTO_POSTOPERATORIO,
        'descripcion': 'Control y seguimiento posterior a una cirugía oftalmológica.',
    },
]


def run():
    """
    Crea los tipos de cita si no existen.
    Retorna (creados, existentes).
    """
    creados = 0
    existentes = 0

    for data in TIPOS_CITA:
        _, created = TipoCita.objects.get_or_create(
            nombre=data['nombre'],
            defaults={'descripcion': data['descripcion']},
        )
        if created:
            creados += 1
        else:
            existentes += 1

    return creados, existentes
