from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PublicTenantLookupView,
    SubscriptionPlanViewSet,
    TenantChangePlanView,
    TenantCurrentView,
    TenantManagementViewSet,
)

router = DefaultRouter()
router.register('tenants', TenantManagementViewSet, basename='tenants')
router.register('plans', SubscriptionPlanViewSet, basename='subscription-plans')

urlpatterns = [
    path('organization/me/', TenantCurrentView.as_view(), name='tenant-current'),
    path('organization/change-plan/', TenantChangePlanView.as_view(), name='tenant-change-plan'),

    path('tenants/<slug:slug>/', PublicTenantLookupView.as_view(), name='public-tenant-lookup'),

    path('', include(router.urls)),
]