"""Progress URL Configuration."""
from django.urls import path
from .views import ProgressHealthView

urlpatterns = [
    path('', ProgressHealthView.as_view(), name='progress_root'),
]
