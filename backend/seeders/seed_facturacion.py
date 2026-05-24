"""
Seeder CU20 — catálogo de tarifas clínicas demo.
"""
from decimal import Decimal

from apps.atencionClinica.citas.models import TipoCita, TipoCitaNombre
from apps.facturacion.models import CatalogoServicioClinico, TipoServicioClinico

SERVICIOS = (
    {
        'codigo': 'CONS-GEN',
        'nombre': 'Consulta oftalmológica general',
        'tipo_servicio': TipoServicioClinico.CONSULTA,
        'tipo_cita': TipoCitaNombre.CONSULTA,
        'precio_base': Decimal('120.00'),
    },
    {
        'codigo': 'EST-RET',
        'nombre': 'Estudio retinográfico',
        'tipo_servicio': TipoServicioClinico.ESTUDIO,
        'tipo_cita': TipoCitaNombre.ESTUDIO,
        'precio_base': Decimal('95.00'),
    },
    {
        'codigo': 'CIR-CAT',
        'nombre': 'Cirugía de catarata (honorarios base)',
        'tipo_servicio': TipoServicioClinico.CIRUGIA,
        'tipo_cita': TipoCitaNombre.CIRUGIA,
        'precio_base': Decimal('2500.00'),
    },
    {
        'codigo': 'CTRL-POST',
        'nombre': 'Control postoperatorio',
        'tipo_servicio': TipoServicioClinico.CONTROL,
        'tipo_cita': TipoCitaNombre.SEGUIMIENTO_POSTOPERATORIO,
        'precio_base': Decimal('80.00'),
    },
)


def run():
    creados = 0
    existentes = 0

    for row in SERVICIOS:
        tipo_cita = TipoCita.objects.filter(nombre=row['tipo_cita']).first()
        _, created = CatalogoServicioClinico.objects.update_or_create(
            codigo=row['codigo'],
            defaults={
                'nombre': row['nombre'],
                'tipo_servicio': row['tipo_servicio'],
                'id_tipo_cita': tipo_cita,
                'precio_base': row['precio_base'],
                'activo': True,
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1

    return creados, existentes
