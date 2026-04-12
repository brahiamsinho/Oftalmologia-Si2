from django.db import models
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import Usuario
from apps.atencionClinica.citas.models import Cita

class Consulta(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='consultas')
    cita = models.ForeignKey(Cita, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultas')
    especialista = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='consultas_realizadas')
    
    fecha = models.DateTimeField(auto_now_add=True)
    motivo = models.TextField()
    sintomas = models.TextField(blank=True)
    notas_clinicas = models.TextField(blank=True)
    
    # Examen de ojos básico
    agudeza_visual_od = models.CharField(max_length=50, blank=True, null=True, verbose_name="Agudeza Visual Ojo Derecho")
    agudeza_visual_oi = models.CharField(max_length=50, blank=True, null=True, verbose_name="Agudeza Visual Ojo Izquierdo")
    presion_intraocular_od = models.CharField(max_length=50, blank=True, null=True, verbose_name="Presión Intraocular Ojo Derecho")
    presion_intraocular_oi = models.CharField(max_length=50, blank=True, null=True, verbose_name="Presión Intraocular Ojo Izquierdo")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Consulta'
        verbose_name_plural = 'Consultas'

    def __str__(self):
        return f"Consulta de {self.paciente} el {self.fecha.strftime('%Y-%m-%d')}"

class Estudio(models.Model):
    TIPO_ESTUDIO_CHOICES = [
        ('agudeza_visual', 'Agudeza Visual'),
        ('refraccion', 'Refracción'),
        ('tonometria', 'Tonometría (Presión Intraocular)'),
        ('fondo_ojo', 'Fondo de Ojo'),
        ('topografia', 'Topografía Corneal'),
        ('paquimetria', 'Paquimetría'),
        ('tomografia', 'Tomografía de Coherencia Óptica (OCT)'),
        ('campo_visual', 'Campo Visual'),
        ('otros', 'Otros'),
    ]

    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='estudios')
    consulta = models.ForeignKey(Consulta, on_delete=models.SET_NULL, null=True, blank=True, related_name='estudios')
    tipo_estudio = models.CharField(max_length=50, choices=TIPO_ESTUDIO_CHOICES, default='otros')
    
    # Valores de medición
    ojo_derecho = models.CharField(max_length=255, blank=True, null=True, verbose_name="Resultado Ojo Derecho")
    ojo_izquierdo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Resultado Ojo Izquierdo")
    
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones Clínicas")
    archivo_resultado = models.FileField(upload_to='estudios/resultados/', blank=True, null=True, verbose_name="Archivo/Resultados")
    
    fecha = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Estudio Oftalmológico'
        verbose_name_plural = 'Estudios Oftalmológicos'

    def __str__(self):
        return f"{self.get_tipo_estudio_display()} - {self.paciente} ({self.fecha.strftime('%Y-%m-%d')})"
