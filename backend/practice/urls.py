"""
Practice URL Configuration.
"""
from django.urls import path
from .views import (
    PracticeHealthView,
    PassageListView,
    PassageDetailView,
    RecordPracticeSessionView,
    UserPracticeHistoryView,
)

urlpatterns = [
    path('', PracticeHealthView.as_view(), name='practice_root'),
    path('passages/', PassageListView.as_view(), name='practice_passages'),
    path('passages/<int:pk>/', PassageDetailView.as_view(), name='practice_passage_detail'),
    path('sessions/', RecordPracticeSessionView.as_view(), name='practice_record_session'),
    path('history/', UserPracticeHistoryView.as_view(), name='practice_history'),
]
