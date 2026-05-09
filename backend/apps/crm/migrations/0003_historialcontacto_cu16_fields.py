"""
Migration 0003 — CU16: Gestionar CRM para la comunicación con pacientes.

Agrega 4 campos nuevos a HistorialContacto:
  - tipo_mensaje:        propósito semántico (RECORDATORIO, NOTIFICACION, etc.)
  - asunto:              título/asunto del mensaje (max 200 chars)
  - mensaje:             contenido completo del mensaje enviado
  - respuesta_paciente:  texto de la respuesta o interacción del paciente
  - estado_comunicacion: ciclo de vida del mensaje (PENDIENTE→ENVIADO→RESPONDIDO…)

El campo resultado (CharField 150) se mantiene por compatibilidad hacia atrás.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0002_initial'),
    ]

    operations = [
        # Tipo semántico del mensaje
        migrations.AddField(
            model_name='historialcontacto',
            name='tipo_mensaje',
            field=models.CharField(
                choices=[
                    ('RECORDATORIO', 'Recordatorio'),
                    ('NOTIFICACION', 'Notificación'),
                    ('SEGUIMIENTO', 'Seguimiento'),
                    ('RESULTADO', 'Resultado de examen'),
                    ('INFORMATIVO', 'Informativo'),
                    ('OTRO', 'Otro'),
                ],
                default='SEGUIMIENTO',
                max_length=20,
            ),
        ),

        # Asunto / título del mensaje
        migrations.AddField(
            model_name='historialcontacto',
            name='asunto',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),

        # Contenido completo del mensaje enviado
        migrations.AddField(
            model_name='historialcontacto',
            name='mensaje',
            field=models.TextField(blank=True, null=True),
        ),

        # Respuesta o interacción registrada del paciente
        migrations.AddField(
            model_name='historialcontacto',
            name='respuesta_paciente',
            field=models.TextField(blank=True, null=True),
        ),

        # Estado del ciclo de vida de la comunicación
        migrations.AddField(
            model_name='historialcontacto',
            name='estado_comunicacion',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente de envío'),
                    ('ENVIADO', 'Enviado'),
                    ('ENTREGADO', 'Entregado'),
                    ('LEIDO', 'Leído'),
                    ('RESPONDIDO', 'Respondido'),
                    ('FALLIDO', 'Fallido'),
                ],
                default='PENDIENTE',
                max_length=20,
            ),
        ),
    ]
