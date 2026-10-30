"""Games URL Configuration — Health, recording, records summary, Likes, and Plays."""
from django.urls import path
from .views import (
    GamesHealthView,
    RecordGameSessionView,
    ArcadeSummaryView,
    GameStatsView,
    GameLikeToggleView,
    GamePlayRecordView,
)

urlpatterns = [
    path('', GamesHealthView.as_view(), name='games_root'),
    path('stats/', GameStatsView.as_view(), name='games_stats'),
    path('<str:game_id>/like/', GameLikeToggleView.as_view(), name='games_like_toggle'),
    path('<str:game_id>/play/', GamePlayRecordView.as_view(), name='games_play_record'),
    path('record/', RecordGameSessionView.as_view(), name='games_record'),
    path('records/', ArcadeSummaryView.as_view(), name='games_records'),
]
