"""
apps/patients/utils.py
Utilidades del dominio de pacientes.
"""
from django.utils import timezone


def generar_numero_historia():
    """
    Genera un número de historia clínica único con formato HC-YYYY-NNNNNN.
    El secuencial se toma del conteo actual de pacientes en el sistema.
    """
    from .models import Paciente
    año = timezone.now().year
    total = Paciente.objects.filter(
        numero_historia__startswith=f'HC-{año}-'
    ).count()
    return f'HC-{año}-{total + 1:06d}'
