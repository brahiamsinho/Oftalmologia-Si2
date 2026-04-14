from django.conf import settings
from django.db import models


class PlataformaFcm(models.TextChoices):
    ANDROID = 'android', 'Android'
    IOS = 'ios', 'iOS'
    WEB = 'web', 'Web'


class DispositivoFcm(models.Model):
    """Token FCM asociado a un usuario (un dispositivo = un token vigente)."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dispositivos_fcm',
    )
    token = models.CharField(max_length=512, unique=True, db_index=True)
    plataforma = models.CharField(
        max_length=16,
        choices=PlataformaFcm.choices,
        default=PlataformaFcm.ANDROID,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notificaciones_dispositivos_fcm'
        verbose_name = 'Dispositivo FCM'
        verbose_name_plural = 'Dispositivos FCM'

    def __str__(self):
        return f'{self.usuario_id} — {self.plataforma}'


class Notificacion(models.Model):
    """Registro persistente de cada notificación enviada a un usuario."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificaciones',
    )
    titulo = models.CharField(max_length=200)
    cuerpo = models.TextField()
    tipo = models.CharField(max_length=50, default='general', db_index=True)
    leida = models.BooleanField(default=False, db_index=True)
    creada_en = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notificaciones_notificacion'
        ordering = ['-creada_en']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'

    def __str__(self):
        return f'[{self.tipo}] {self.titulo} → usuario {self.usuario_id}'
