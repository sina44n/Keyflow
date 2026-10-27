"""Quotes URL Configuration"""

from django.urls import path
from .views import CurrentQuoteView, ForceRotateQuoteView

urlpatterns = [
    path('current/', CurrentQuoteView.as_view(), name='quote_current'),
    path('rotate/', ForceRotateQuoteView.as_view(), name='quote_rotate'),
]
