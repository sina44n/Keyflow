"""Practice URL Configuration."""
from django.urls import path
from .views import PracticeHealthView

urlpatterns = [
    path('', PracticeHealthView.as_view(), name='practice_root'),
]
