"""Accounts Views — Registration, Login, Logout, Current User, Password Reset."""

from django.contrib.auth import login
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView, LogoutView, LogoutAllView

from .models import UserProfile, UserPreferences
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    FullUserSerializer,
    UserProfileSerializer,
    UserPreferencesSerializer,
)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register a new user. Returns auth token + full user data.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _, token = AuthToken.objects.create(user)

        return Response({
            'token': token,
            'user': FullUserSerializer(user).data,
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
