"""

Seeder CU19 — promociones y descuentos demo en el schema del tenant actual.

"""

from datetime import timedelta

from decimal import Decimal



from django.utils import timezone



from apps.administracionFinanciera.descuentos.models import (

    AlcancePromocion,

    CompatibilidadSeguro,

    EstadoPromocion,

    PromocionDescuento,

    TipoBeneficio,

)



PROMOCIONES = (

    {

        'codigo': 'BIENVENIDA15',

        'nombre': 'Bienvenida consulta oftalmológica',

        'descripcion': '15% de descuento en primera consulta para pacientes sin seguro.',

        'tipo_beneficio': TipoBeneficio.PORCENTAJE,

        'valor': Decimal('15.00'),

        'alcance': AlcancePromocion.GENERAL,

        'compatibilidad_seguro': CompatibilidadSeguro.SOLO_SIN_SEGURO,

        'acumulable': False,

        'condiciones_aplicacion': 'Válido solo en consulta general. No acumulable con otras promos.',

    },

    {

        'codigo': 'CONTROL50',

        'nombre': 'Control postoperatorio',

        'descripcion': 'Monto fijo de descuento en control de seguimiento.',

        'tipo_beneficio': TipoBeneficio.MONTO_FIJO,

        'valor': Decimal('50.00'),

        'alcance': AlcancePromocion.ASIGNADA,

        'compatibilidad_seguro': CompatibilidadSeguro.CUALQUIERA,

        'acumulable': True,

        'condiciones_aplicacion': 'Requiere asignación explícita al paciente.',

    },

)





def run():

    hoy = timezone.localdate()

    creados = 0

    existentes = 0



    for row in PROMOCIONES:

        _, created = PromocionDescuento.objects.update_or_create(

            codigo=row['codigo'],

            defaults={

                'nombre': row['nombre'],

                'descripcion': row['descripcion'],

                'tipo_beneficio': row['tipo_beneficio'],

                'valor': row['valor'],

                'alcance': row['alcance'],

                'compatibilidad_seguro': row['compatibilidad_seguro'],

                'acumulable': row['acumulable'],

                'condiciones_aplicacion': row['condiciones_aplicacion'],

                'fecha_inicio': hoy - timedelta(days=30),

                'fecha_fin': hoy + timedelta(days=180),

                'estado': EstadoPromocion.ACTIVA,

            },

        )

        if created:

            creados += 1

        else:

            existentes += 1



    return creados, existentes

