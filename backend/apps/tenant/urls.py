from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PlatformPlanManagementViewSet,
    PublicTenantLookupView,
    StripeWebhookPublicView,
    SubscriptionPlanViewSet,
    TenantChangePlanView,
    TenantCurrentView,
    TenantManagementViewSet,
    TenantStripeCheckoutView,
    TenantStripeConfirmView,
    TenantSettingsCurrentView,
)

router = DefaultRouter()
router.register('tenants', TenantManagementViewSet, basename='tenants')
router.register('plans', SubscriptionPlanViewSet, basename='subscription-plans')
router.register('platform/plans', PlatformPlanManagementViewSet, basename='platform-plan-management')

urlpatterns = [
    path('platform/', include('apps.platform_admin.urls')),

    path('organization/me/', TenantCurrentView.as_view(), name='tenant-current'),

    path(
        'organization/settings/',
        TenantSettingsCurrentView.as_view(),
        name='tenant-settings-current',
    ),

    path(
        'organization/change-plan/',
        TenantChangePlanView.as_view(),
        name='tenant-change-plan',
    ),
    path(
        'organization/change-plan/checkout/',
        TenantStripeCheckoutView.as_view(),
        name='tenant-change-plan-checkout',
    ),
    path(
        'organization/change-plan/confirm-stripe/',
        TenantStripeConfirmView.as_view(),
        name='tenant-change-plan-confirm-stripe',
    ),
    path(
        'stripe/webhook/',
        StripeWebhookPublicView.as_view(),
        name='stripe-webhook',
    ),

    path(
        'tenants/<slug:slug>/',
        PublicTenantLookupView.as_view(),
        name='public-tenant-lookup',
    ),

    path('', include(router.urls)),
]