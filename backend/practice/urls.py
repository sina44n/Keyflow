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
    CompetitionListView,
    CompetitionDetailView,
    CompetitionJoinView,
    CompetitionSubmitView,
    UserCompetitionsView,
)

urlpatterns = [
    path('', PracticeHealthView.as_view(), name='practice_root'),
    path('passages/', PassageListView.as_view(), name='practice_passages'),
    path('passages/<int:pk>/', PassageDetailView.as_view(), name='practice_passage_detail'),
    path('sessions/', RecordPracticeSessionView.as_view(), name='practice_record_session'),
    path('history/', UserPracticeHistoryView.as_view(), name='practice_history'),

    # Typing Competitions
    path('competitions/', CompetitionListView.as_view(), name='practice_competitions'),
    path('competitions/my/', UserCompetitionsView.as_view(), name='practice_user_competitions'),
    path('competitions/<str:code>/', CompetitionDetailView.as_view(), name='practice_competition_detail'),
    path('competitions/<str:code>/join/', CompetitionJoinView.as_view(), name='practice_competition_join'),
    path('competitions/<str:code>/submit/', CompetitionSubmitView.as_view(), name='practice_competition_submit'),
]
