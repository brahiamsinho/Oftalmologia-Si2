from django.db import models
from django.utils import timezone


class TipoReglaRecordatorio(models.TextChoices):
    CONTROL_POSTOPERATORIO = 'CONTROL_POSTOPERATORIO', 'Control postoperatorio'


class EstadoTarea(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    PROCESADA = 'PROCESADA', 'Procesada'
    ERROR = 'ERROR', 'Error'
    CANCELADA = 'CANCELADA', 'Cancelada'


class NivelLog(models.TextChoices):
    INFO = 'INFO', 'Info'
    ERROR = 'ERROR', 'Error'


class ReglaRecordatorio(models.Model):
    id_regla = models.BigAutoField(primary_key=True)

    nombre = models.CharField(max_length=120)
    tipo_regla = models.CharField(
        max_length=40,
        choices=TipoReglaRecordatorio.choices,
        default=TipoReglaRecordatorio.CONTROL_POSTOPERATORIO,
    )
    horas_antes = models.PositiveIntegerField(default=24)
    titulo_template = models.CharField(max_length=200)
    cuerpo_template = models.TextField()
    activa = models.BooleanField(default=True, db_index=True)

    creado_por = models.ForeignKey(
        'users.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por',
        related_name='reglas_recordatorio_creadas',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notificaciones_reglas_recordatorio'
        verbose_name = 'Regla de recordatorio'
        verbose_name_plural = 'Reglas de recordatorio'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['nombre'],
                name='recordatorio_nombre_uniq',
            ),
        ]

    def __str__(self):
        return f'{self.nombre} ({self.horas_antes}h antes)'


class TareaRecordatorioProgramada(models.Model):
    id_tarea = models.BigAutoField(primary_key=True)

    id_regla = models.ForeignKey(
        ReglaRecordatorio,
        on_delete=models.PROTECT,
        db_column='id_regla',
        related_name='tareas_programadas',
    )
    id_paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='recordatorios_programados',
    )
    id_postoperatorio = models.ForeignKey(
        'postoperatorio.Postoperatorio',
        on_delete=models.CASCADE,
        db_column='id_postoperatorio',
        related_name='recordatorios_programados',
        null=True,
        blank=True,
    )

    programada_para = models.DateTimeField(db_index=True)
    estado = models.CharField(
        max_length=20,
        choices=EstadoTarea.choices,
        default=EstadoTarea.PENDIENTE,
        db_index=True,
    )
    intentos = models.PositiveSmallIntegerField(default=0)
    procesada_en = models.DateTimeField(null=True, blank=True)
    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notificaciones_tareas_recordatorio'
        verbose_name = 'Tarea de recordatorio'
        verbose_name_plural = 'Tareas de recordatorio'
        ordering = ['programada_para']

    def marcar_procesada(self):
        self.estado = EstadoTarea.PROCESADA
        self.procesada_en = timezone.now()
        self.save(update_fields=['estado', 'procesada_en', 'updated_at'])

    def marcar_error(self):
        self.estado = EstadoTarea.ERROR
        self.intentos += 1
        self.procesada_en = timezone.now()
        self.save(update_fields=['estado', 'intentos', 'procesada_en', 'updated_at'])


class LogEjecucionRecordatorio(models.Model):
    id_log = models.BigAutoField(primary_key=True)

    id_tarea = models.ForeignKey(
        TareaRecordatorioProgramada,
        on_delete=models.SET_NULL,
        db_column='id_tarea',
        related_name='logs',
        null=True,
        blank=True,
    )

    nivel = models.CharField(max_length=10, choices=NivelLog.choices, default=NivelLog.INFO)
    mensaje = models.CharField(max_length=255)
    detalle = models.TextField(blank=True, null=True)
    ejecutado_en = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notificaciones_logs_recordatorio'
        verbose_name = 'Log de ejecución de recordatorio'
        verbose_name_plural = 'Logs de ejecución de recordatorio'
        ordering = ['-ejecutado_en']

    def __str__(self):
        return f'[{self.nivel}] {self.mensaje}'