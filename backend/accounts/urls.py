"""Accounts URL Configuration — Authentication endpoints."""

from django.urls import path, include
from .views import RegisterView, LoginView, CurrentUserView, LogoutCurrentView, LogoutAllDevicesView

urlpatterns = [
    # Registration & Authentication
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutCurrentView.as_view(), name='auth_logout'),
    path('logout-all/', LogoutAllDevicesView.as_view(), name='auth_logout_all'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),

    # Password Reset (via django-rest-passwordreset)
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]
