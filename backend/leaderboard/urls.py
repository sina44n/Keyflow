"""
Leaderboard URL Configuration
=============================
Public and authenticated routing for the Global Leaderboard API.
"""

from django.urls import path
from .views import GlobalLeaderboardView, LeaderboardHealthView

urlpatterns = [
    path('', GlobalLeaderboardView.as_view(), name='global_leaderboard'),
    path('health/', LeaderboardHealthView.as_view(), name='leaderboard_health'),
]
