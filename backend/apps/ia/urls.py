"""
Rutas API de la app ``ia`` (tenant).

Prefijo: ``/t/<slug>/api/ia/``
"""
from django.urls import path

from apps.ia.views import (
    ChatbotMessageView,
    HandoffAcceptView,
    HandoffCancelView,
    HandoffDetailView,
    HandoffFailView,
    HandoffFromClassificationView,
    HandoffListView,
    HandoffResolveView,
    HandoffStartCareView,
    NlpToReportView,
    UrgencyClassificationListView,
    UrgencyClassificationView,
)

urlpatterns = [
    path('nlp-to-report/', NlpToReportView.as_view(), name='ia-nlp-to-report'),
    path('chatbot/', ChatbotMessageView.as_view(), name='ia-chatbot'),
    path(
        'urgency-classification/',
        UrgencyClassificationView.as_view(),
        name='ia-urgency-classification',
    ),
    path(
        'urgency-classifications/',
        UrgencyClassificationListView.as_view(),
        name='ia-urgency-classifications-list',
    ),
    path(
        'human-handoffs/',
        HandoffListView.as_view(),
        name='ia-handoff-list',
    ),
    path(
        'human-handoffs/from-classification/<int:classification_id>/',
        HandoffFromClassificationView.as_view(),
        name='ia-handoff-from-classification',
    ),
    path(
        'human-handoffs/<int:pk>/',
        HandoffDetailView.as_view(),
        name='ia-handoff-detail',
    ),
    path(
        'human-handoffs/<int:pk>/accept/',
        HandoffAcceptView.as_view(),
        name='ia-handoff-accept',
    ),
    path(
        'human-handoffs/<int:pk>/resolve/',
        HandoffResolveView.as_view(),
        name='ia-handoff-resolve',
    ),
    path(
        'human-handoffs/<int:pk>/start-care/',
        HandoffStartCareView.as_view(),
        name='ia-handoff-start-care',
    ),
    path(
        'human-handoffs/<int:pk>/cancel/',
        HandoffCancelView.as_view(),
        name='ia-handoff-cancel',
    ),
    path(
        'human-handoffs/<int:pk>/fail/',
        HandoffFailView.as_view(),
        name='ia-handoff-fail',
    ),
]
