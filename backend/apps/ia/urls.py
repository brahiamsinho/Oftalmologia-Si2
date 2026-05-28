"""
Rutas API de la app ``ia`` (tenant).

Prefijo: ``/t/<slug>/api/ia/``
"""
from django.urls import path

from apps.ia.views import ChatbotMessageView, NlpToReportView

urlpatterns = [
    path('nlp-to-report/', NlpToReportView.as_view(), name='ia-nlp-to-report'),
    path('chatbot/', ChatbotMessageView.as_view(), name='ia-chatbot'),
]
