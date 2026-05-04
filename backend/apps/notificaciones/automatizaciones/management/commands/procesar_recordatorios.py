from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notificaciones.automatizaciones.models import EstadoTarea, TareaRecordatorioProgramada
from apps.notificaciones.automatizaciones.serializers import procesar_tarea_recordatorio


class Command(BaseCommand):
    help = 'Procesa tareas pendientes de recordatorios automáticos (cron-friendly).'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=100)

    def handle(self, *args, **options):
        limit = max(1, int(options['limit']))
        pendientes = TareaRecordatorioProgramada.objects.filter(
            estado=EstadoTarea.PENDIENTE,
            programada_para__lte=timezone.now(),
        ).order_by('programada_para')[:limit]

        total = 0
        for tarea in pendientes:
            procesar_tarea_recordatorio(tarea)
            total += 1

        self.stdout.write(self.style.SUCCESS(f'Tareas procesadas: {total}'))
