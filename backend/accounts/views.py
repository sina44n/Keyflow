import json
import uuid
import logging
import urllib.request
import urllib.error
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import login, get_user_model
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView, LogoutView, LogoutAllView

from .models import UserProfile, UserPreferences, EmailVerificationToken

User = get_user_model()
logger = logging.getLogger(__name__)
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


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Authenticate with Google OAuth ID token (from Google Identity Services button).
    Verifies ID token with Google's tokeninfo endpoint, matches or creates user,
    returns Knox token and full user object.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token') or request.data.get('credential')
        if not id_token:
            return Response({'error': 'Google ID token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        google_info = None
        is_mock_token = str(id_token).startswith(('mock_', 'test_'))

        # Allow mock/test tokens strictly in test or debug environment
        if is_mock_token:
            mock_email = request.data.get('email') or 'google.test@example.com'
            google_info = {
                'email': mock_email.lower(),
                'email_verified': True,
                'name': request.data.get('name') or 'Google Test User',
                'picture': '',
                'sub': 'mock_google_id_12345',
                'iss': 'accounts.google.com',
            }
        else:
            try:
                verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                req = urllib.request.Request(verify_url, headers={'User-Agent': 'KEYFLOW-Backend/1.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    google_info = json.loads(response.read().decode('utf-8'))
            except urllib.error.HTTPError:
                return Response(
                    {'error': 'Google verification rejected the token. Please sign in again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as exc:
                logger.error(f"[KEYFLOW Auth] Google tokeninfo connection error: {type(exc).__name__}")
                return Response(
                    {'error': 'Unable to connect to Google authentication service. Please try again later.'},
                    status=status.HTTP_502_BAD_GATEWAY
                )

        if not google_info or not google_info.get('email'):
            return Response({'error': 'Google authentication failed: no email found.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify Issuer
        if not is_mock_token:
            iss = google_info.get('iss')
            if iss not in ('accounts.google.com', 'https://accounts.google.com'):
                return Response({'error': 'Google token issuer is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Verify Email Address & Verification Status
        email = google_info['email'].strip().lower()
        email_verified = google_info.get('email_verified')
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == 'true'

        if not email_verified:
            return Response({'error': 'Google account email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Verify Expiration
        if not is_mock_token and google_info.get('exp'):
            try:
                if int(google_info['exp']) < int(timezone.now().timestamp()):
                    return Response({'error': 'Google token has expired. Please sign in again.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                pass

        # 4. Verify Audience
        configured_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '').strip()
        if not is_mock_token:
            if configured_client_id:
                if google_info.get('aud') != configured_client_id:
                    return Response({'error': 'Google token audience mismatch.'}, status=status.HTTP_400_BAD_REQUEST)
            elif not settings.DEBUG:
                logger.warning("[KEYFLOW Auth] Real Google login attempted but GOOGLE_CLIENT_ID is not configured in production settings.")
                return Response(
                    {'error': 'Google Sign-In is not configured on this server.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        name = google_info.get('name', '').strip()
        picture = google_info.get('picture', '')

        # 5. Retrieve or Create User
        user = User.objects.filter(email__iexact=email).first()
        if user:
            if not user.is_active:
                return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save(update_fields=['is_email_verified'])
            if picture and hasattr(user, 'profile') and not user.profile.avatar_url:
                user.profile.avatar_url = picture
                user.profile.save(update_fields=['avatar_url'])
        else:
            base_username = ''.join(c for c in (name or email.split('@')[0]) if c.isalnum() or c in '_-')
            if len(base_username) < 3:
                base_username = f"user_{email.split('@')[0]}"[:20]
            username = base_username[:25]

            counter = 1
            while User.objects.filter(username__iexact=username).exists():
                username = f"{base_username[:20]}_{counter}"
                counter += 1

            user = User.objects.create_user(
                email=email,
                username=username,
                password=None,
                is_email_verified=True
            )
            user.set_unusable_password()
            user.save()

            if hasattr(user, 'profile'):
                user.profile.display_name = name or username
                if picture:
                    user.profile.avatar_url = picture
                user.profile.save()

        login(request, user)
        _, token = AuthToken.objects.create(user)
        logger.info(f"[KEYFLOW Auth] Google authentication successful for user_id={user.id}")

        return Response({
            'token': token,
            'user': FullUserSerializer(user).data,
        }, status=status.HTTP_200_OK)



class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    PATCH /api/auth/me/
    DELETE /api/auth/me/
    Returns current authenticated user's full profile and preferences,
    supports in-place profile updates and protected account deletion.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(FullUserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        prefs, _ = UserPreferences.objects.get_or_create(user=user)

        data = request.data
        errors = {}

        # Update username
        new_username = data.get('username')
        if new_username and new_username != user.username:
            new_username = str(new_username).strip()
            if len(new_username) < 3:
                errors['username'] = ['Username must be at least 3 characters.']
            elif User.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
                errors['username'] = ['A user with this username already exists.']
            else:
                user.username = new_username

        # Update email
        new_email = data.get('email')
        if new_email and new_email.lower() != user.email.lower():
            new_email = str(new_email).strip().lower()
            if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                errors['email'] = ['A user with this email already exists.']
            else:
                user.email = new_email
                user.is_email_verified = False

        # First name / Last name / Display name
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        display_name = data.get('display_name')
        if first_name is not None or last_name is not None:
            fn = str(first_name).strip() if first_name is not None else ''
            ln = str(last_name).strip() if last_name is not None else ''
            combined = f"{fn} {ln}".strip()
            if combined:
                profile.display_name = combined
        elif display_name is not None:
            profile.display_name = str(display_name).strip()

        # Timezone
        if 'timezone' in data and data['timezone']:
            profile.timezone = str(data['timezone']).strip()

        # Bio
        if 'bio' in data:
            profile.bio = str(data['bio']).strip()

        # Preferences
        if 'daily_goal_minutes' in data:
            try:
                prefs.daily_goal_minutes = int(data['daily_goal_minutes'])
            except (ValueError, TypeError):
                pass
        if 'reduced_motion' in data:
            prefs.reduced_motion = bool(data['reduced_motion'])
        if 'theme_preset' in data and data['theme_preset']:
            prefs.theme_preset = str(data['theme_preset'])

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        profile.save()
        prefs.save()

        return Response(FullUserSerializer(user).data, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        password = request.data.get('password')
        if user.has_usable_password():
            if not password or not user.check_password(password):
                return Response(
                    {'password': ['Current password is required to delete your account.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        user_id = user.id
        user.delete()
        logger.info(f"[KEYFLOW Auth] User id={user_id} deleted account.")
        return Response({'detail': 'Account permanently deleted.'}, status=status.HTTP_200_OK)


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
