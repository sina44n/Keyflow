"""Games URL Configuration."""
from django.urls import path
from .views import GamesHealthView

urlpatterns = [
    path('', GamesHealthView.as_view(), name='games_root'),
]
