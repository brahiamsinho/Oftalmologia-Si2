from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Domain,
    EstadoSuscripcion,
    PlanCodigo,
    SubscriptionPlan,
    Tenant,
    TenantSettings,
    TenantSubscription,
    TenantUsage,
)


def normalizar_schema_desde_slug(slug: str) -> str:
    return slug.strip().lower().replace('-', '_')


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class TenantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantSettings
        fields = [
            'timezone',
            'idioma',
            'branding_nombre',
            'branding_color_primario',
            'branding_color_secundario',
            'branding_logo_url',
            'flags',
        ]


class TenantSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    esta_activa = serializers.BooleanField(read_only=True)

    class Meta:
        model = TenantSubscription
        fields = [
            'id_suscripcion',
            'plan',
            'estado',
            'fecha_inicio',
            'fecha_fin',
            'trial_fin',
            'renovar_automaticamente',
            'esta_activa',
        ]


class TenantUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantUsage
        fields = [
            'usuarios_actuales',
            'pacientes_actuales',
            'citas_mes_actual',
            'almacenamiento_usado_mb',
            'periodo_anio',
            'periodo_mes',
            'updated_at',
        ]


class TenantPublicSerializer(serializers.ModelSerializer):
    settings = TenantSettingsSerializer(read_only=True)
    subscription = TenantSubscriptionSerializer(read_only=True)
    url_prefix = serializers.CharField(read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id_tenant',
            'schema_name',
            'slug',
            'nombre',
            'razon_social',
            'nit',
            'email_contacto',
            'telefono_contacto',
            'activo',
            'dominio_base',
            'url_prefix',
            'settings',
            'subscription',
        ]


class TenantCreateSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=80)
    nombre = serializers.CharField(max_length=150)
    razon_social = serializers.CharField(max_length=180, required=False, allow_blank=True)
    nit = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email_contacto = serializers.EmailField(required=False, allow_blank=True)
    telefono_contacto = serializers.CharField(max_length=40, required=False, allow_blank=True)
    plan = serializers.ChoiceField(
        choices=[choice[0] for choice in PlanCodigo.choices],
        default=PlanCodigo.FREE,
    )
    trial_days = serializers.IntegerField(required=False, min_value=0, max_value=365, default=14)

    def validate_slug(self, value):
        slug = value.strip().lower()
        schema_name = normalizar_schema_desde_slug(slug)

        if slug == 'public':
            raise serializers.ValidationError('No puedes crear un tenant con slug public.')

        if Tenant.objects.filter(slug=slug).exists():
            raise serializers.ValidationError('Ya existe una organización con ese slug.')

        if Tenant.objects.filter(schema_name=schema_name).exists():
            raise serializers.ValidationError('Ya existe una organización con ese schema_name.')

        if Domain.objects.filter(domain=slug).exists():
            raise serializers.ValidationError('Ya existe un subfolder con ese slug.')

        return slug

    @transaction.atomic
    def create(self, validated_data):
        plan_codigo = validated_data.pop('plan', PlanCodigo.FREE)
        trial_days = validated_data.pop('trial_days', 14)

        slug = validated_data['slug']
        schema_name = normalizar_schema_desde_slug(slug)
        plan = SubscriptionPlan.objects.get(codigo=plan_codigo, activo=True)

        tenant = Tenant.objects.create(
            schema_name=schema_name,
            dominio_base=slug,
            activo=True,
            **validated_data,
        )

        Domain.objects.create(domain=slug, tenant=tenant, is_primary=True)

        TenantSettings.objects.create(
            tenant=tenant,
            branding_nombre=tenant.nombre,
        )

        TenantSubscription.objects.create(
            tenant=tenant,
            plan=plan,
            estado=EstadoSuscripcion.TRIAL if trial_days else EstadoSuscripcion.ACTIVA,
            trial_fin=timezone.now() + timedelta(days=trial_days) if trial_days else None,
        )

        TenantUsage.objects.create(tenant=tenant)
        return tenant


class TenantManagementSerializer(serializers.ModelSerializer):
    settings = TenantSettingsSerializer(read_only=True)
    subscription = TenantSubscriptionSerializer(read_only=True)
    usage = TenantUsageSerializer(read_only=True)
    url_prefix = serializers.CharField(read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id_tenant',
            'schema_name',
            'slug',
            'nombre',
            'razon_social',
            'nit',
            'email_contacto',
            'telefono_contacto',
            'activo',
            'dominio_base',
            'url_prefix',
            'settings',
            'subscription',
            'usage',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_tenant', 'schema_name', 'created_at', 'updated_at']


class TenantChangePlanSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(
        choices=[choice[0] for choice in PlanCodigo.choices],
        help_text='Código del nuevo plan: FREE, PLUS o PRO.',
    )
    confirmar_downgrade = serializers.BooleanField(
        required=False,
        default=False,
        help_text='Debe enviarse true cuando se baja a un plan menor.',
    )
    renovar_automaticamente = serializers.BooleanField(required=False)
    proveedor_pago = serializers.CharField(required=False, allow_blank=True, max_length=40)
    referencia_pago = serializers.CharField(required=False, allow_blank=True, max_length=120)
    notas = serializers.CharField(required=False, allow_blank=True)

    def _get_tenant(self):
        request = self.context.get('request')
        tenant = self.context.get('tenant') or getattr(request, 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError({
                'tenant': 'No se pudo resolver la organización actual.'
            })
        if getattr(tenant, 'schema_name', None) == 'public':
            raise serializers.ValidationError({
                'tenant': 'No puedes cambiar el plan del schema public desde este endpoint.'
            })
        return tenant

    def validate(self, attrs):
        tenant = self._get_tenant()
        plan_codigo = attrs['plan']

        try:
            nuevo_plan = SubscriptionPlan.objects.get(codigo=plan_codigo, activo=True)
        except SubscriptionPlan.DoesNotExist as exc:
            raise serializers.ValidationError({
                'plan': 'El plan no existe o está inactivo.'
            }) from exc

        suscripcion = (
            TenantSubscription.objects
            .select_related('plan')
            .filter(tenant=tenant)
            .first()
        )

        plan_actual = suscripcion.plan if suscripcion else None
        es_downgrade = (
            plan_actual is not None
            and nuevo_plan.precio_mensual < plan_actual.precio_mensual
        )

        if es_downgrade and not attrs.get('confirmar_downgrade'):
            raise serializers.ValidationError({
                'confirmar_downgrade': (
                    f'Estás bajando de {plan_actual.codigo} a {nuevo_plan.codigo}. '
                    'Envía confirmar_downgrade=true para confirmar el cambio.'
                )
            })

        uso = TenantUsage.objects.filter(tenant=tenant).first()
        excesos = {}

        if uso is not None:
            if uso.usuarios_actuales > nuevo_plan.max_usuarios:
                excesos['usuarios_actuales'] = (
                    f'Uso actual {uso.usuarios_actuales} supera el límite '
                    f'del plan {nuevo_plan.codigo}: {nuevo_plan.max_usuarios}.'
                )

            if uso.pacientes_actuales > nuevo_plan.max_pacientes:
                excesos['pacientes_actuales'] = (
                    f'Uso actual {uso.pacientes_actuales} supera el límite '
                    f'del plan {nuevo_plan.codigo}: {nuevo_plan.max_pacientes}.'
                )

            if uso.citas_mes_actual > nuevo_plan.max_citas_mes:
                excesos['citas_mes_actual'] = (
                    f'Uso actual {uso.citas_mes_actual} supera el límite '
                    f'del plan {nuevo_plan.codigo}: {nuevo_plan.max_citas_mes}.'
                )

            if uso.almacenamiento_usado_mb > nuevo_plan.max_almacenamiento_mb:
                excesos['almacenamiento_usado_mb'] = (
                    f'Uso actual {uso.almacenamiento_usado_mb} MB supera el límite '
                    f'del plan {nuevo_plan.codigo}: {nuevo_plan.max_almacenamiento_mb} MB.'
                )

        if excesos:
            raise serializers.ValidationError({
                'limites': excesos,
                'detail': 'No se puede cambiar a este plan porque el uso actual supera sus límites.',
            })

        attrs['tenant_obj'] = tenant
        attrs['plan_obj'] = nuevo_plan
        attrs['suscripcion_obj'] = suscripcion
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        tenant = self.validated_data['tenant_obj']
        nuevo_plan = self.validated_data['plan_obj']
        suscripcion = self.validated_data['suscripcion_obj']

        if suscripcion is None:
            suscripcion = TenantSubscription(
                tenant=tenant,
                fecha_inicio=timezone.now(),
            )

        suscripcion.plan = nuevo_plan
        suscripcion.estado = EstadoSuscripcion.ACTIVA
        suscripcion.trial_fin = None
        suscripcion.fecha_inicio = timezone.now()

        if 'renovar_automaticamente' in self.initial_data:
            suscripcion.renovar_automaticamente = self.validated_data.get('renovar_automaticamente', False)

        if 'proveedor_pago' in self.initial_data:
            suscripcion.proveedor_pago = self.validated_data.get('proveedor_pago', '')

        if 'referencia_pago' in self.initial_data:
            suscripcion.referencia_pago = self.validated_data.get('referencia_pago', '')

        if 'notas' in self.initial_data:
            suscripcion.notas = self.validated_data.get('notas', '')

        suscripcion.save()

        TenantUsage.objects.get_or_create(tenant=tenant)

        return suscripcion