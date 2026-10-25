"""Achievements URL Configuration."""
from django.urls import path
from .views import AchievementsHealthView

urlpatterns = [
    path('', AchievementsHealthView.as_view(), name='achievements_root'),
]
