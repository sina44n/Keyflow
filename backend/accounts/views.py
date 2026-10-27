import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import login
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView, LogoutView, LogoutAllView

from .models import UserProfile, UserPreferences, EmailVerificationToken
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    FullUserSerializer,
    UserProfileSerializer,
    UserPreferencesSerializer,
    PasswordChangeSerializer,
    EmailVerificationSerializer,
)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register a new user. Returns auth token + full user data.
    Generates single-use email verification token.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _, token = AuthToken.objects.create(user)

        # Generate email verification token (24h expiry)
        verif_token = uuid.uuid4().hex
        EmailVerificationToken.objects.create(
            user=user,
            token=verif_token,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        try:
            send_mail(
                subject='Welcome to KEYFLOW — Verify Your Email',
                message=f'Hello {user.username},\n\nWelcome to KEYFLOW! Use this token to verify your email:\n{verif_token}\n\nHappy typing!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            'token': token,
            'user': FullUserSerializer(user).data,
            'verification_token': verif_token,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate with email + password. Returns Knox token + full user.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        login(request, user)
        _, token = AuthToken.objects.create(user)

        return Response({
            'token': token,
            'user': FullUserSerializer(user).data,
        })


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Returns current authenticated user's full profile and preferences.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(FullUserSerializer(request.user).data)


class LogoutCurrentView(LogoutView):
    """
    POST /api/auth/logout/
    Invalidates the current Knox token (this device only).
    """
    pass


class LogoutAllDevicesView(LogoutAllView):
    """
    POST /api/auth/logout-all/
    Invalidates ALL Knox tokens for this user (all devices).
    """
    pass


# ---- Profile Views ----

class ProfileView(APIView):
    """
    GET  /api/profile/       — Retrieve current user's profile
    PATCH /api/profile/      — Update display_name, bio, avatar_url, timezone
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class PreferencesView(APIView):
    """
    GET  /api/profile/preferences/  — Retrieve user preferences (includes theme)
    PATCH /api/profile/preferences/ — Update theme, goals, sound, etc.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        return Response(UserPreferencesSerializer(prefs).data)

    def patch(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


# ---- Password Change & Email Verification ----

class PasswordChangeView(APIView):
    """
    POST /api/auth/change-password/
    Change current authenticated user's password.
    Requires old_password, new_password, new_password2.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    """
    POST /api/auth/verify-email/
    Verify email with single-use token.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data['token']
        try:
            token_obj = EmailVerificationToken.objects.get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)

        if not token_obj.is_valid():
            return Response({'error': 'Token has expired or has already been used.'}, status=status.HTTP_400_BAD_REQUEST)

        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])
        user = token_obj.user
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        return Response({'detail': 'Email verified successfully.'}, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    """
    POST /api/auth/resend-verification/
    Resend verification email to current authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response({'detail': 'Email is already verified.'}, status=status.HTTP_200_OK)

        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        verif_token = uuid.uuid4().hex
        EmailVerificationToken.objects.create(
            user=user,
            token=verif_token,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        try:
            send_mail(
                subject='Verify your KEYFLOW email',
                message=f'Hello {user.username},\n\nPlease verify your email with token: {verif_token}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({'detail': 'Verification email sent.', 'verification_token': verif_token}, status=status.HTTP_200_OK)
