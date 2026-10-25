"""Leaderboard URL Configuration."""
from django.urls import path
from .views import LeaderboardHealthView

urlpatterns = [
    path('', LeaderboardHealthView.as_view(), name='leaderboard_root'),
]
