"""Accounts URL Configuration — Authentication endpoints."""

from django.urls import path, include
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    LogoutCurrentView,
    LogoutAllDevicesView,
    PasswordChangeView,
    VerifyEmailView,
    ResendVerificationEmailView,
)

urlpatterns = [
    # Registration & Authentication
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutCurrentView.as_view(), name='auth_logout'),
    path('logout-all/', LogoutAllDevicesView.as_view(), name='auth_logout_all'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),

    # Password Management
    path('change-password/', PasswordChangeView.as_view(), name='auth_change_password'),
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),

    # Email Verification
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='auth_resend_verification'),
]

