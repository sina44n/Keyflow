"""Lessons URL Configuration."""
from django.urls import path
from .views import LessonsHealthView

urlpatterns = [
    path('', LessonsHealthView.as_view(), name='lessons_root'),
]
