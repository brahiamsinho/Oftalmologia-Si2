"""
Seeder CU18 — aseguradoras y convenios demo en el schema del tenant actual.
"""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.seguros.models import Aseguradora, Convenio

ASEGURADORAS = (
    {
        'codigo': 'NSS',
        'nombre': 'Nacional Seguros Salud',
        'razon_social': 'Nacional Seguros Salud S.A.',
    },
    {
        'codigo': 'MEDICORP',
        'nombre': 'MediCorp Previsión',
        'razon_social': 'MediCorp Previsión Ltda.',
    },
)

CONVENIOS_POR_ASEGURADORA = {
    'NSS': (
        {
            'codigo': 'NSS-OFT-EMP',
            'nombre': 'Plan oftalmológico empresarial',
            'porcentaje_cobertura': Decimal('85.00'),
            'copago_monto': Decimal('40.00'),
        },
    ),
    'MEDICORP': (
        {
            'codigo': 'MC-BASICO',
            'nombre': 'Cobertura básica consultas',
            'porcentaje_cobertura': Decimal('70.00'),
            'copago_monto': Decimal('60.00'),
        },
    ),
}


def run():
    hoy = timezone.localdate()
    creados = 0
    existentes = 0

    for row in ASEGURADORAS:
        _, created = Aseguradora.objects.update_or_create(
            codigo=row['codigo'],
            defaults={
                'nombre': row['nombre'],
                'razon_social': row['razon_social'],
                'activo': True,
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1

        aseguradora = Aseguradora.objects.get(codigo=row['codigo'])
        for conv in CONVENIOS_POR_ASEGURADORA.get(row['codigo'], ()):
            _, conv_created = Convenio.objects.update_or_create(
                id_aseguradora=aseguradora,
                codigo=conv['codigo'],
                defaults={
                    'nombre': conv['nombre'],
                    'porcentaje_cobertura': conv['porcentaje_cobertura'],
                    'copago_monto': conv['copago_monto'],
                    'fecha_inicio': hoy - timedelta(days=60),
                    'fecha_fin': None,
                    'activo': True,
                },
            )
            if conv_created:
                creados += 1
            else:
                existentes += 1

    return creados, existentes
