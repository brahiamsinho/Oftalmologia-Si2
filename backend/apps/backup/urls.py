"""
apps/backup/urls.py
URLs para el sistema de backup/restore.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.backup.views import BackupConfigViewSet, TenantBackupViewSet

router = DefaultRouter()
router.register(r'backup', TenantBackupViewSet, basename='backup')
router.register(r'backup-config', BackupConfigViewSet, basename='backup-config')

urlpatterns = [
    path('', include(router.urls)),
]
