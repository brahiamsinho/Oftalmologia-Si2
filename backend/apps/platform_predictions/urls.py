"""
URLs del módulo platform_predictions.

Montadas en: /api/public/platform/predictions/
  (via apps/tenant/urls.py → path('platform/predictions/', include(...)))
"""
from django.urls import path
from .views import (
    FeatureImportanceView,
    PredictView,
    ResultsListView,
    RunsListView,
    TrainModelView,
)

urlpatterns = [
    path('train/',              TrainModelView.as_view(),        name='pp-train'),
    path('runs/',               RunsListView.as_view(),          name='pp-runs'),
    path('results/',            ResultsListView.as_view(),       name='pp-results'),
    path('predict/',            PredictView.as_view(),           name='pp-predict'),
    path('feature-importance/', FeatureImportanceView.as_view(), name='pp-feature-importance'),
]
