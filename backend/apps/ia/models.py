"""Modelos de dominio IA.

La app ``apps.ia`` vive en ``TENANT_APPS``. Por eso estos modelos son
schema-locales y NO llevan ``tenant_id``: django-tenants ya ejecuta las queries
en el schema de la clínica resuelta por ``/t/<slug>/``.
"""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class NivelUrgenciaChatbot(models.TextChoices):
    BAJO = 'BAJO', 'Bajo'
    MEDIO = 'MEDIO', 'Medio'
    ALTO = 'ALTO', 'Alto'
    CRITICO = 'CRITICO', 'Crítico'
    INSUFICIENTE = 'INSUFICIENTE', 'Información insuficiente'
    INDETERMINADO = 'INDETERMINADO', 'No determinable'


class EstadoDerivacionChatbot(models.TextChoices):
    NO_REQUERIDA = 'NO_REQUERIDA', 'No requerida'
    PENDIENTE = 'PENDIENTE', 'Pendiente'


class EstadoDerivacionHumana(models.TextChoices):
    """Estados del circuito de derivación a atención humana (CU25)."""

    PENDIENTE = 'PENDIENTE', 'Pendiente'
    NOTIFICADA = 'NOTIFICADA', 'Notificada'
    ASIGNADA = 'ASIGNADA', 'Asignada'
    ACEPTADA = 'ACEPTADA', 'Aceptada'
    EN_ATENCION = 'EN_ATENCION', 'En atención'
    RESUELTA = 'RESUELTA', 'Resuelta'
    FALLIDA = 'FALLIDA', 'Fallida'
    CANCELADA = 'CANCELADA', 'Cancelada'


class ChatbotUrgencyClassification(models.Model):
    """Clasificación determinística de urgencia enviada por paciente.

    CU24 registra la clasificación y deja una marca pasiva para CU25 cuando el
    nivel es crítico. No dispara notificaciones ni deriva automáticamente.
    """

    id_clasificacion = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clasificaciones_urgencia_chatbot',
    )
    paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='clasificaciones_urgencia_chatbot',
    )
    mensaje_usuario = models.TextField()
    nivel = models.CharField(
        max_length=20,
        choices=NivelUrgenciaChatbot.choices,
        db_index=True,
    )
    confianza = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text='Confianza determinística normalizada entre 0.0 y 1.0.',
    )
    criterios_detectados = models.JSONField(default=list, blank=True)
    orientacion = models.TextField()
    requiere_atencion_humana = models.BooleanField(default=False, db_index=True)
    estado_derivacion = models.CharField(
        max_length=20,
        choices=EstadoDerivacionChatbot.choices,
        default=EstadoDerivacionChatbot.NO_REQUERIDA,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ia_chatbot_urgency_classifications'
        verbose_name = 'Clasificación de urgencia del chatbot'
        verbose_name_plural = 'Clasificaciones de urgencia del chatbot'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['paciente', '-created_at'], name='ia_urg_paciente_created_idx'),
            models.Index(fields=['nivel', '-created_at'], name='ia_urg_nivel_created_idx'),
            models.Index(fields=['estado_derivacion', '-created_at'], name='ia_urg_deriv_created_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.paciente_id} — {self.nivel} — {self.created_at:%Y-%m-%d %H:%M}'


class CriticalHumanHandoff(models.Model):
    """Derivación a atención humana cuando una clasificación alcanza nivel crítico.

    CU25 toma una clasificación CU24 con ``requiere_atencion_humana`` y la
    convierte en un caso atendible por personal clínico. Cada handoff nace de una
    única clasificación; no se permiten duplicados.
    """

    id_handoff = models.BigAutoField(primary_key=True)
    classification = models.ForeignKey(
        ChatbotUrgencyClassification,
        on_delete=models.CASCADE,
        db_column='id_clasificacion',
        related_name='handoffs',
        help_text='Clasificación CU24 que originó esta derivación.',
    )
    paciente = models.ForeignKey(
        'pacientes.Paciente',
        on_delete=models.CASCADE,
        db_column='id_paciente',
        related_name='handoffs_criticos',
    )
    mensaje_original = models.TextField(
        help_text='Texto del mensaje enviado por el paciente que disparó la clasificación crítica.',
    )
    nivel_urgencia = models.CharField(
        max_length=20,
        choices=NivelUrgenciaChatbot.choices,
        default=NivelUrgenciaChatbot.CRITICO,
    )
    criterios_detectados = models.JSONField(
        default=list,
        blank=True,
        help_text='Criterios de urgencia que matchearon en la clasificación.',
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoDerivacionHumana.choices,
        default=EstadoDerivacionHumana.PENDIENTE,
        db_index=True,
        help_text='Estado actual dentro del circuito de atención humana.',
    )
    asignado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handoffs_asignados',
        help_text='Personal al que se le asignó este caso.',
    )
    aceptado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handoffs_aceptados',
        help_text='Personal que aceptó formalmente atender el caso.',
    )
    notificado_en = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Momento en que se notificó al personal.',
    )
    aceptado_en = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Momento en que el caso fue aceptado.',
    )
    resuelto_en = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Momento en que el caso fue resuelto.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ia_critical_human_handoffs'
        verbose_name = 'Derivación a atención humana'
        verbose_name_plural = 'Derivaciones a atención humana'
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['paciente', '-created_at'],
                name='ia_ho_paciente_created_idx',
            ),
            models.Index(
                fields=['estado', '-created_at'],
                name='ia_ho_estado_created_idx',
            ),
        ]

    def __str__(self) -> str:
        return (
            f'Handoff {self.id_handoff} — {self.paciente_id} — '
            f'{self.estado} — {self.created_at:%Y-%m-%d %H:%M}'
        )
