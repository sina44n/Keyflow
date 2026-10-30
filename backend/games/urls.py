"""Games URL Configuration — Health, recording, records summary, Likes, Plays, and Multiplayer Racing."""
from django.urls import path
from .views import (
    GamesHealthView,
    RecordGameSessionView,
    ArcadeSummaryView,
    GameStatsView,
    GameLikeToggleView,
    GamePlayRecordView,
    MultiplayerRoomListCreateView,
    MultiplayerRoomDetailView,
    MultiplayerRoomJoinView,
    MultiplayerRoomReadyView,
    MultiplayerRoomSyncView,
    MultiplayerRoomLeaveView,
)

urlpatterns = [
    path('', GamesHealthView.as_view(), name='games_root'),
    path('stats/', GameStatsView.as_view(), name='games_stats'),
    path('<str:game_id>/like/', GameLikeToggleView.as_view(), name='games_like_toggle'),
    path('<str:game_id>/play/', GamePlayRecordView.as_view(), name='games_play_record'),
    path('record/', RecordGameSessionView.as_view(), name='games_record'),
    path('records/', ArcadeSummaryView.as_view(), name='games_records'),
    # Multiplayer Racing Endpoints
    path('racing/rooms/', MultiplayerRoomListCreateView.as_view(), name='racing_rooms_list_create'),
    path('racing/rooms/<str:code>/', MultiplayerRoomDetailView.as_view(), name='racing_room_detail'),
    path('racing/rooms/<str:code>/join/', MultiplayerRoomJoinView.as_view(), name='racing_room_join'),
    path('racing/rooms/<str:code>/ready/', MultiplayerRoomReadyView.as_view(), name='racing_room_ready'),
    path('racing/rooms/<str:code>/sync/', MultiplayerRoomSyncView.as_view(), name='racing_room_sync'),
    path('racing/rooms/<str:code>/leave/', MultiplayerRoomLeaveView.as_view(), name='racing_room_leave'),
]
