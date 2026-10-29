"""Games URL Configuration — Health, recording, and records summary."""
from django.urls import path
from .views import GamesHealthView, RecordGameSessionView, ArcadeSummaryView

urlpatterns = [
    path('', GamesHealthView.as_view(), name='games_root'),
    path('record/', RecordGameSessionView.as_view(), name='games_record'),
    path('records/', ArcadeSummaryView.as_view(), name='games_records'),
]
