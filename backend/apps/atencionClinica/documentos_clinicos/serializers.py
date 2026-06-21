from __future__ import annotations

from django.core.files.base import ContentFile
from rest_framework.reverse import reverse
from rest_framework import serializers

from .models import DocumentoClinicoAutorizado
from .services import generar_documento_pdf_bytes


class DocumentoClinicoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    numero_historia = serializers.SerializerMethodField()
    tipo_documento_display = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    creador_nombre = serializers.SerializerMethodField()
    tiene_archivo = serializers.SerializerMethodField()
    nombre_archivo = serializers.SerializerMethodField()
    descarga_url = serializers.SerializerMethodField()

    archivo = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = DocumentoClinicoAutorizado
        fields = [
            'id_documento_clinico',
            'id_historia_clinica',
            'paciente_nombre',
            'numero_historia',
            'tipo_documento',
            'tipo_documento_display',
            'titulo',
            'contenido',
            'estado',
            'estado_display',
            'fecha_emision',
            'fecha_vencimiento',
            'creado_por',
            'creador_nombre',
            'origen_modulo',
            'origen_registro_id',
            'observaciones',
            'tiene_archivo',
            'nombre_archivo',
            'descarga_url',
            'archivo',
        ]
        read_only_fields = [
            'id_documento_clinico',
            'id_historia_clinica',
            'paciente_nombre',
            'numero_historia',
            'tipo_documento_display',
            'estado_display',
            'creador_nombre',
            'tiene_archivo',
            'nombre_archivo',
            'descarga_url',
            'creado_por',
            'fecha_emision',
        ]

    def validate(self, attrs):
        archivo = attrs.get('archivo')
        contenido = (attrs.get('contenido') or '').strip()
        if not archivo and not contenido:
            raise serializers.ValidationError({
                'contenido': 'Debes proporcionar contenido o un archivo para generar el documento.',
            })
        return attrs

    def create(self, validated_data):
        archivo = validated_data.pop('archivo', None)
        documento = DocumentoClinicoAutorizado.objects.create(**validated_data)

        if archivo is not None:
            documento.archivo = archivo
            documento.save(update_fields=['archivo'])
        elif documento.contenido:
            pdf_bytes = generar_documento_pdf_bytes(documento)
            nombre = f'documentos_clinicos/{documento.fecha_emision:%Y/%m/%d}/documento-{documento.id_documento_clinico}.pdf'
            documento.archivo.save(nombre, ContentFile(pdf_bytes), save=True)

        return documento

    def get_paciente_nombre(self, obj):
        return obj.id_historia_clinica.id_paciente.get_full_name()

    def get_numero_historia(self, obj):
        return obj.id_historia_clinica.id_paciente.numero_historia

    def get_tipo_documento_display(self, obj):
        return obj.get_tipo_documento_display()

    def get_estado_display(self, obj):
        return obj.get_estado_display()

    def get_creador_nombre(self, obj):
        if not obj.creado_por:
            return None
        return obj.creado_por.get_full_name() or obj.creado_por.username

    def get_tiene_archivo(self, obj):
        return bool(obj.archivo)

    def get_nombre_archivo(self, obj):
        if not obj.archivo:
            return None
        return obj.archivo.name.rsplit('/', 1)[-1]

    def get_descarga_url(self, obj):
        if not obj.archivo:
            return None
        request = self.context.get('request')
        if request is None:
            return None
        return reverse(
            'api:documentos-clinicos-download',
            kwargs={
                'id_historia_clinica': obj.id_historia_clinica_id,
                'pk': obj.id_documento_clinico,
            },
            request=request,
        )
