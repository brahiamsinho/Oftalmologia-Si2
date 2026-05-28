"""
Señales CU17: programación automática al crear/actualizar cita o postoperatorio.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.atencionClinica.citas.models import Cita
from apps.atencionClinica.postoperatorio.models import Postoperatorio

from .services.scheduling import sync_recordatorios_cita, sync_recordatorios_postoperatorio


@receiver(post_save, sender=Cita)
def autoprogramar_recordatorio_cita(sender, instance: Cita, **kwargs):
    sync_recordatorios_cita(instance)


@receiver(post_save, sender=Postoperatorio)
def autoprogramar_recordatorio_postoperatorio(sender, instance: Postoperatorio, **kwargs):
    sync_recordatorios_postoperatorio(instance)
