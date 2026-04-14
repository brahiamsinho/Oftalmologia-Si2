# Data migration: agudeza en Consulta y Estudios tipo agudeza_visual → MedicionVisual

from django.db import migrations


def forwards(apps, schema_editor):
    Consulta = apps.get_model('consultas', 'Consulta')
    Estudio = apps.get_model('consultas', 'Estudio')
    MedicionVisual = apps.get_model('medicion_visual', 'MedicionVisual')

    for c in Consulta.objects.all():
        od = (c.agudeza_visual_od or '').strip() if c.agudeza_visual_od else ''
        oi = (c.agudeza_visual_oi or '').strip() if c.agudeza_visual_oi else ''
        if not od and not oi:
            continue
        MedicionVisual.objects.create(
            paciente_id=c.paciente_id,
            consulta_id=c.id,
            ojo_derecho=od or None,
            ojo_izquierdo=oi or None,
            observaciones=None,
            archivo_resultado=None,
            fecha=c.fecha,
        )

    for e in Estudio.objects.filter(tipo_estudio='agudeza_visual'):
        MedicionVisual.objects.create(
            paciente_id=e.paciente_id,
            consulta_id=e.consulta_id,
            ojo_derecho=e.ojo_derecho,
            ojo_izquierdo=e.ojo_izquierdo,
            observaciones=e.observaciones,
            archivo_resultado=e.archivo_resultado,
            fecha=e.fecha,
        )
        e.delete()


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('medicion_visual', '0001_initial'),
        ('consultas', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
