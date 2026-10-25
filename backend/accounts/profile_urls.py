"""Profile URL Configuration — Profile and Preferences endpoints."""

from django.urls import path
from .views import ProfileView, PreferencesView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
]
