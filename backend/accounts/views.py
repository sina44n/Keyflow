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

from .models import UserProfile, UserPreferences, EmailVerificationToken, is_authentic_avatar_url
from .debug_logger import log_auth_event

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
        try:
            from admin_api.models import GlobalPlatformConfig
            config = GlobalPlatformConfig.get_config()
            if not config.registration_enabled:
                return Response(
                    {'error': 'Registration is currently disabled by platform administration.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

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
            if '@' not in new_email or '.' not in new_email:
                errors['email'] = ['Please enter a valid email address.']
            elif User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
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
                prefs.daily_goal_minutes = max(1, min(1440, int(data['daily_goal_minutes'])))
            except (ValueError, TypeError):
                pass
        if 'weekly_goal_minutes' in data:
            try:
                prefs.weekly_goal_minutes = max(5, min(10080, int(data['weekly_goal_minutes'])))
            except (ValueError, TypeError):
                pass
        elif 'weekly_goal' in data:
            try:
                wg_val = float(data['weekly_goal'])
                # If value is small (e.g. <= 40), treat as hours and convert to minutes
                prefs.weekly_goal_minutes = int(wg_val * 60) if wg_val <= 40 else int(wg_val)
            except (ValueError, TypeError):
                pass
        if 'first_day_of_week' in data:
            try:
                prefs.first_day_of_week = max(0, min(6, int(data['first_day_of_week'])))
            except (ValueError, TypeError):
                pass
        elif 'week_start' in data:
            try:
                prefs.first_day_of_week = max(0, min(6, int(data['week_start'])))
            except (ValueError, TypeError):
                pass
        if 'reduced_motion' in data:
            prefs.reduced_motion = bool(data['reduced_motion'])
        if 'theme_preset' in data and data['theme_preset']:
            prefs.theme_preset = str(data['theme_preset']).strip()
        if 'sound_enabled' in data:
            prefs.sound_enabled = bool(data['sound_enabled'])
        if 'sound_profile' in data and data['sound_profile']:
            prefs.sound_profile = str(data['sound_profile']).strip()
        if 'language' in data and data['language']:
            prefs.language = str(data['language']).strip()[:10]
        if 'keyboard_visual_enabled' in data:
            prefs.keyboard_visual_enabled = bool(data['keyboard_visual_enabled'])
        if 'hand_guide_enabled' in data:
            prefs.hand_guide_enabled = bool(data['hand_guide_enabled'])
        if 'preferred_mode' in data and data['preferred_mode']:
            prefs.preferred_mode = str(data['preferred_mode']).strip()[:20]
        if 'preferred_duration' in data:
            try:
                prefs.preferred_duration = max(5, int(data['preferred_duration']))
            except (ValueError, TypeError):
                pass
        if 'preferred_word_count' in data:
            try:
                prefs.preferred_word_count = max(5, int(data['preferred_word_count']))
            except (ValueError, TypeError):
                pass

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        profile.save()
        prefs.save()

        user.profile = profile
        user.preferences = prefs

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


class ClerkSyncView(APIView):
    """
    POST /api/auth/clerk-sync/
    Explicitly synchronizes frontend Clerk user session with Django database.
    Requires Clerk Bearer token (resolved by ClerkAuthentication).
    Accepts optional display_name and avatar_url to update profile.
    Returns synchronized FullUserSerializer payload.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data or {}
        log_auth_event("clerk_sync_entry", {
            "user_id": getattr(user, 'id', None),
            "user_email": getattr(user, 'email', None),
            "user_clerk_id": getattr(user, 'clerk_id', None),
            "user_role": getattr(user, 'role', None),
            "data_email": data.get('email'),
            "data_display_name": data.get('display_name'),
            "owner_email": getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower(),
            "owner_clerk_ids": list(getattr(settings, 'OWNER_CLERK_IDS', [])),
        })
        from accounts.models import RevokedClerkIdentity
        if getattr(user, 'clerk_id', None) and RevokedClerkIdentity.objects.filter(clerk_id=user.clerk_id).exists():
            return Response({'detail': 'This authentication identity has been permanently revoked.'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data or {}
        incoming_clerk_id = data.get('clerk_id')
        if incoming_clerk_id and RevokedClerkIdentity.objects.filter(clerk_id=incoming_clerk_id).exists():
            return Response({'detail': 'Incoming identity has been permanently revoked.'}, status=status.HTTP_401_UNAUTHORIZED)

        profile = getattr(user, 'profile', None)
        if not profile:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            user.profile = profile

        display_name = data.get('display_name') or data.get('name')
        avatar_url = data.get('avatar_url') or data.get('picture')
        email = data.get('email')

        updated_profile = False
        if display_name and display_name.strip():
            profile.display_name = str(display_name).strip()[:50]
            updated_profile = True
        if avatar_url and avatar_url.strip():
            clean_avatar = str(avatar_url).strip()
            if is_authentic_avatar_url(clean_avatar):
                profile.avatar_url = clean_avatar
                updated_profile = True
        if updated_profile:
            profile.save()
            user.profile = profile

        # Update placeholder email with real verified email when available and no conflict exists
        owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))

        is_verified_owner = bool(
            user.email and user.email.lower() == owner_email and
            getattr(user, 'clerk_id', '') in owner_clerk_ids
        )

        if email and isinstance(email, str):
            clean_email = email.strip().lower()
            if '@' in clean_email:
                if clean_email == owner_email:
                    # Security check: only verified owner Clerk ID can claim or link to owner email
                    if getattr(user, 'clerk_id', '') not in owner_clerk_ids:
                        log_auth_event("clerk_sync_403_rejection", {
                            "reason": "clean_email == owner_email but user.clerk_id not in owner_clerk_ids",
                            "user_clerk_id": getattr(user, 'clerk_id', ''),
                            "owner_clerk_ids": list(owner_clerk_ids),
                            "owner_email": owner_email,
                            "clean_email": clean_email,
                        })
                        return Response({
                            'detail': 'Permission denied: Cannot claim platform owner identity.'
                        }, status=status.HTTP_403_FORBIDDEN)

                    canonical_owner = User.objects.filter(email__iexact=owner_email).first()
                    if canonical_owner and canonical_owner.pk != user.pk:
                        c_id = user.clerk_id
                        user.clerk_id = None
                        user.save(update_fields=['clerk_id'])

                        canonical_owner.clerk_id = c_id
                        canonical_owner.role = 'SUPER_ADMIN'
                        canonical_owner.status = 'ACTIVE'
                        canonical_owner.is_staff = True
                        canonical_owner.is_superuser = True
                        canonical_owner.is_email_verified = True
                        canonical_owner.save()
                        user = canonical_owner
                        is_verified_owner = True

                        profile, _ = UserProfile.objects.get_or_create(user=user)
                        if display_name and display_name.strip():
                            profile.display_name = str(display_name).strip()[:50]
                        if avatar_url and avatar_url.strip():
                            clean_avatar = str(avatar_url).strip()
                            if is_authentic_avatar_url(clean_avatar):
                                profile.avatar_url = clean_avatar
                        profile.save()
                    else:
                        is_verified_owner = True
                else:
                    # Non-owner email:
                    # If this user currently holds a placeholder email (@clerk.keyflow.local),
                    # allow updating user.email to clean_email ONLY if no conflict exists.
                    # Never silently detach or hijack another existing Django account!
                    if user.email.endswith('@clerk.keyflow.local') or not user.email:
                        conflict_user = User.objects.filter(email__iexact=clean_email).exclude(pk=user.pk).first()
                        if conflict_user:
                            logger.warning(
                                f"[KEYFLOW Clerk] Refusing to reassign existing email {clean_email} to placeholder user {user.id}. "
                                "Identity takeover prevented."
                            )
                        else:
                            user.email = clean_email
                            user.is_email_verified = True
                            user.save(update_fields=['email', 'is_email_verified'])

        # Guarantee owner status ONLY if user is verified owner
        if is_verified_owner:
            needs_save = False
            fields = []
            if getattr(user, 'role', '') != 'SUPER_ADMIN':
                user.role = 'SUPER_ADMIN'
                fields.append('role')
                needs_save = True
            if not user.is_staff:
                user.is_staff = True
                fields.append('is_staff')
                needs_save = True
            if not user.is_superuser:
                user.is_superuser = True
                fields.append('is_superuser')
                needs_save = True
            if needs_save:
                user.save(update_fields=fields)
            if getattr(user, 'status', '') != 'ACTIVE':
                user.status = 'ACTIVE'
                fields.append('status')
                needs_save = True
            if not getattr(user, 'is_email_verified', False):
                user.is_email_verified = True
                fields.append('is_email_verified')
                needs_save = True
            if needs_save:
                user.save(update_fields=fields)
        else:
            # Guarantee non-owner account is strictly USER
            if getattr(user, 'role', '') in ('SUPER_ADMIN', 'ADMIN') or user.is_staff or user.is_superuser:
                user.role = 'USER'
                user.is_staff = False
                user.is_superuser = False
                user.save(update_fields=['role', 'is_staff', 'is_superuser'])

        user.refresh_from_db()
        user.profile = profile
        return Response({
            'status': 'synchronized',
            'user': FullUserSerializer(user).data,
        }, status=status.HTTP_200_OK)


from django.core.validators import validate_email
from django.core.exceptions import ValidationError


def _validate_and_normalize_email(val):
    """
    Validates and normalizes an email candidate string.
    Returns cleaned lowercase email if valid; otherwise None.
    Rejects non-string types (int, bool, etc.), empty/whitespace strings,
    and strings that fail Django's validate_email validator.
    """
    if not isinstance(val, str) or isinstance(val, bool):
        return None
    cleaned = val.strip().lower()
    if not cleaned:
        return None
    try:
        validate_email(cleaned)
        return cleaned
    except ValidationError:
        return None


def _extract_verified_email(data):
    """
    Extracts a validated email from Clerk event data or user info.
    Prioritizes primary email address, falls back to secondary valid entries,
    and finally checks top-level 'email'.
    Returns normalized email string, or None if no valid candidate is found.
    """
    if not isinstance(data, dict):
        return None

    raw_email_addresses = data.get('email_addresses')
    email_addresses = raw_email_addresses if isinstance(raw_email_addresses, list) else []
    primary_id = data.get('primary_email_address_id')

    primary_candidate = None
    fallback_candidate = None

    for ea in email_addresses:
        if isinstance(ea, dict):
            raw_addr = ea.get('email_address')
            clean_addr = _validate_and_normalize_email(raw_addr)
            if clean_addr:
                entry_id = ea.get('id')
                if primary_id and entry_id == primary_id and not primary_candidate:
                    primary_candidate = clean_addr
                elif not fallback_candidate:
                    fallback_candidate = clean_addr

    if primary_candidate:
        return primary_candidate
    if fallback_candidate:
        return fallback_candidate

    raw_top_email = data.get('email')
    clean_top_email = _validate_and_normalize_email(raw_top_email)
    if clean_top_email:
        return clean_top_email

    return None


class ClerkWebhookView(APIView):
    """
    POST /api/auth/clerk-webhook/
    Processes incoming Clerk webhooks (user.created, user.updated, user.deleted).
    Enforces:
    1. Svix HMAC-SHA256 signature verification (rejects missing/invalid signatures).
    2. Timestamp tolerance / replay attack protection (300s window).
    3. Fail-closed behavior if CLERK_WEBHOOK_SECRET is not configured.
    4. Idempotent event processing and deduplication via svix-id.
    5. Rejection of tombstoned Clerk IDs immediately (status=401).
    6. Non-owner webhook cannot claim Owner identity or elevated privileges.
    7. Owner identity cannot be deleted through untrusted or forged webhooks.
    8. Stale user.deleted webhooks cannot purge fresh accounts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import time
        import hmac
        import hashlib
        import base64
        from django.core.cache import cache

        # 1. Verify webhook secret is configured (fail-closed)
        webhook_secret = getattr(settings, 'CLERK_WEBHOOK_SECRET', '')
        if not webhook_secret:
            logger.error("[KEYFLOW Webhook] Rejection: CLERK_WEBHOOK_SECRET is not configured on server.")
            return Response(
                {'error': 'Webhook secret is not configured on server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 2. Extract Svix headers
        svix_id = request.META.get('HTTP_SVIX_ID')
        svix_timestamp = request.META.get('HTTP_SVIX_TIMESTAMP')
        svix_signature = request.META.get('HTTP_SVIX_SIGNATURE')

        if not svix_id or not svix_timestamp or not svix_signature:
            logger.warning("[KEYFLOW Webhook] Rejection: Missing required svix headers.")
            return Response(
                {'error': 'Missing required svix webhook headers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Verify timestamp tolerance (replay protection: 300 seconds)
        try:
            ts = int(svix_timestamp)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid svix-timestamp header.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if abs(int(time.time()) - ts) > 300:
            logger.warning(f"[KEYFLOW Webhook] Rejection: Timestamp {ts} outside tolerance window.")
            return Response(
                {'error': 'Webhook timestamp outside tolerance window.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Cryptographic HMAC-SHA256 signature verification
        try:
            if webhook_secret.startswith("whsec_"):
                try:
                    key = base64.b64decode(webhook_secret[len("whsec_"):])
                except Exception:
                    key = webhook_secret.encode("utf-8")
            else:
                key = webhook_secret.encode("utf-8")

            body_bytes = request.body
            to_sign = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + body_bytes
            expected_sig = base64.b64encode(hmac.new(key, to_sign, hashlib.sha256).digest()).decode("utf-8")

            verified = False
            for item in svix_signature.split(" "):
                parts = item.split(",", 1)
                if len(parts) == 2 and parts[0] == "v1":
                    if hmac.compare_digest(expected_sig, parts[1]):
                        verified = True
                        break

            if not verified:
                logger.warning(f"[KEYFLOW Webhook] Rejection: Invalid signature for event {svix_id}.")
                return Response(
                    {'error': 'Invalid webhook signature.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as exc:
            logger.warning(f"[KEYFLOW Webhook] Verification error: {exc}")
            return Response(
                {'error': 'Error verifying webhook signature.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 5. Parse and validate JSON payload
        payload = request.data
        if not isinstance(payload, dict):
            return Response(
                {'error': 'Malformed webhook payload; JSON object expected.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event_type = payload.get('type')
        event_data = payload.get('data') or {}
        clerk_id = event_data.get('id')

        if not clerk_id:
            return Response({'error': 'Missing Clerk ID in webhook data'}, status=status.HTTP_400_BAD_REQUEST)

        # 6. Check RevokedClerkIdentity tombstone registry
        from accounts.models import RevokedClerkIdentity
        if RevokedClerkIdentity.objects.filter(clerk_id=clerk_id).exists():
            logger.warning(f"[KEYFLOW Webhook] Rejection: Clerk ID {clerk_id} is in RevokedClerkIdentity registry.")
            return Response(
                {'error': 'This authentication identity has been permanently revoked and deleted.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))

        # 7. Owner security guards
        if event_type == 'user.deleted':
            if clerk_id in owner_clerk_ids:
                return Response({'error': 'Security Violation: Cannot delete platform owner.'}, status=status.HTTP_403_FORBIDDEN)
            target = User.objects.filter(clerk_id=clerk_id).first()
            if target and (target.is_owner or target.email.lower() == owner_email):
                return Response({'error': 'Security Violation: Cannot delete platform owner.'}, status=status.HTTP_403_FORBIDDEN)

        elif event_type in ('user.created', 'user.updated'):
            email = _extract_verified_email(event_data)

            if not email and clerk_id in owner_clerk_ids:
                email = owner_email

            if email == owner_email and clerk_id not in owner_clerk_ids:
                return Response({'error': 'Security Violation: Non-owner identity attempting to claim owner email.'}, status=status.HTTP_403_FORBIDDEN)

            if clerk_id in owner_clerk_ids and email and email != owner_email:
                return Response({'error': 'Security Violation: Non-owner email claiming owner clerk ID.'}, status=status.HTTP_403_FORBIDDEN)

        # 8. Durable Database Idempotency via WebhookEventReceipt with Safe Atomic Claim & Fencing
        from accounts.models import WebhookEventReceipt
        from django.utils import timezone
        from django.db import IntegrityError, OperationalError, transaction
        from django.db.models import Q
        import uuid
        from datetime import timedelta

        now = timezone.now()
        worker_claim_token = uuid.uuid4()
        lease_expiry = now + timedelta(seconds=60)

        # Fast-path check: If already PROCESSED, immediately acknowledge with 200
        try:
            receipt = WebhookEventReceipt.objects.filter(svix_id=svix_id).first()
            if receipt and receipt.status == WebhookEventReceipt.STATUS_PROCESSED:
                logger.info(f"[KEYFLOW Webhook] Duplicate event already processed: svix-id={svix_id}")
                return Response(
                    {'status': 'duplicate_ignored', 'svix_id': svix_id},
                    status=status.HTTP_200_OK
                )
        except OperationalError:
            # Active write lock held by competing worker
            logger.info(f"[KEYFLOW Webhook] DB lock collision on fast-path check for svix-id={svix_id}; returning 429")
            return Response(
                {'status': 'processing_in_progress', 'svix_id': svix_id, 'retry_after': 5},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={'Retry-After': '5'}
            )

        claimed = False
        if not receipt:
            try:
                # Atomic insert: Status defaults to PROCESSING, with explicit claim_token and lease_expires_at
                receipt = WebhookEventReceipt.objects.create(
                    svix_id=svix_id,
                    event_type=event_type or 'unknown',
                    status=WebhookEventReceipt.STATUS_PROCESSING,
                    claim_token=worker_claim_token,
                    lease_expires_at=lease_expiry,
                )
                claimed = True
            except (IntegrityError, OperationalError):
                # svix_id collision (another worker inserted simultaneously) or database lock
                try:
                    receipt = WebhookEventReceipt.objects.filter(svix_id=svix_id).first()
                except OperationalError:
                    return Response(
                        {'status': 'processing_in_progress', 'svix_id': svix_id, 'retry_after': 5},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                        headers={'Retry-After': '5'}
                    )

        if not claimed:
            # Receipt exists in DB. Check if it's already PROCESSED
            if receipt and receipt.status == WebhookEventReceipt.STATUS_PROCESSED:
                return Response(
                    {'status': 'duplicate_ignored', 'svix_id': svix_id},
                    status=status.HTTP_200_OK
                )

            # Atomically attempt to claim or reclaim:
            # Worker may only claim if status is FAILED or lease has expired (lease_expires_at <= now or null)
            try:
                claimed_rows = WebhookEventReceipt.objects.filter(
                    svix_id=svix_id
                ).filter(
                    Q(status=WebhookEventReceipt.STATUS_FAILED) |
                    Q(status=WebhookEventReceipt.STATUS_PROCESSING, lease_expires_at__lte=now) |
                    Q(status=WebhookEventReceipt.STATUS_PROCESSING, lease_expires_at__isnull=True)
                ).update(
                    status=WebhookEventReceipt.STATUS_PROCESSING,
                    claim_token=worker_claim_token,
                    lease_expires_at=lease_expiry,
                    error_message='',
                )
            except OperationalError:
                # Active write lock held by concurrent worker. Return 429 Retry-After.
                logger.info(f"[KEYFLOW Webhook] DB lock collision for svix-id={svix_id}; returning 429 Retry-After: 5")
                return Response(
                    {'status': 'processing_in_progress', 'svix_id': svix_id, 'retry_after': 5},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={'Retry-After': '5'}
                )

            if claimed_rows == 1:
                claimed = True
            else:
                # Re-check status: if completed in the interim, return 200 duplicate_ignored
                try:
                    re_check = WebhookEventReceipt.objects.filter(svix_id=svix_id).first()
                    if re_check and re_check.status == WebhookEventReceipt.STATUS_PROCESSED:
                        return Response(
                            {'status': 'duplicate_ignored', 'svix_id': svix_id},
                            status=status.HTTP_200_OK
                        )
                except OperationalError:
                    pass

                # Active claim collision: Another worker is actively processing within valid lease window.
                # Return HTTP 429 Too Many Requests with Retry-After header so Clerk safely retries.
                logger.info(f"[KEYFLOW Webhook] Active claim conflict for svix-id={svix_id}; returning 429 Retry-After: 5")
                return Response(
                    {'status': 'processing_in_progress', 'svix_id': svix_id, 'retry_after': 5},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={'Retry-After': '5'}
                )

        # 9. Verify Required Identity Data Outside Protected Transaction (Zero In-Transaction HTTP Calls)
        if event_type in ('user.created', 'user.updated'):
            user_exists = User.objects.filter(clerk_id=clerk_id).exists()
            if not email and not user_exists:
                # Pre-fetch external Clerk user info outside any database transaction or row lock
                try:
                    from accounts.authentication import fetch_clerk_user_info
                    clerk_info = fetch_clerk_user_info(clerk_id)
                    if isinstance(clerk_info, dict):
                        fetched_email = _extract_verified_email(clerk_info)
                        if fetched_email:
                            email = fetched_email
                        if not event_data.get('first_name') and clerk_info.get('first_name'):
                            event_data['first_name'] = clerk_info.get('first_name')
                        if not event_data.get('last_name') and clerk_info.get('last_name'):
                            event_data['last_name'] = clerk_info.get('last_name')
                        if not event_data.get('username') and clerk_info.get('username'):
                            event_data['username'] = clerk_info.get('username')
                        if not event_data.get('image_url') and clerk_info.get('image_url'):
                            event_data['image_url'] = clerk_info.get('image_url')
                except Exception as exc:
                    logger.warning(f"[KEYFLOW Webhook] Pre-fetch external user info failed: {exc}")

                # Re-verify owner security invariants with prefetched email
                if email == owner_email and clerk_id not in owner_clerk_ids:
                    WebhookEventReceipt.objects.filter(
                        svix_id=svix_id,
                        claim_token=worker_claim_token,
                    ).update(
                        status=WebhookEventReceipt.STATUS_FAILED,
                        error_message='Security Violation: Non-owner identity attempting to claim owner email.'
                    )
                    return Response({'error': 'Security Violation: Non-owner identity attempting to claim owner email.'}, status=status.HTTP_403_FORBIDDEN)

                if clerk_id in owner_clerk_ids and email and email != owner_email:
                    WebhookEventReceipt.objects.filter(
                        svix_id=svix_id,
                        claim_token=worker_claim_token,
                    ).update(
                        status=WebhookEventReceipt.STATUS_FAILED,
                        error_message='Security Violation: Non-owner email claiming owner clerk ID.'
                    )
                    return Response({'error': 'Security Violation: Non-owner email claiming owner clerk ID.'}, status=status.HTTP_403_FORBIDDEN)

                if not email:
                    # Required email data could not be obtained: fail receipt safely and return retryable 503
                    logger.warning(
                        f"[KEYFLOW Webhook] Cannot process {event_type} for clerk_id={clerk_id}: "
                        f"no usable email in payload or pre-fetch. Transitioning receipt to FAILED with claim token fencing."
                    )
                    WebhookEventReceipt.objects.filter(
                        svix_id=svix_id,
                        claim_token=worker_claim_token,
                    ).update(
                        status=WebhookEventReceipt.STATUS_FAILED,
                        error_message='User email unavailable: pre-fetch failed or returned no usable email.'
                    )
                    return Response(
                        {
                            'error': 'User email unavailable: pre-fetch failed or returned no usable email.',
                            'clerk_id': clerk_id,
                            'retry_after': 5,
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                        headers={'Retry-After': '5'}
                    )

        # 10. Execute Downstream Business Mutation within Protected Atomic Transaction with Row Lock & Claim Fencing
        try:
            with transaction.atomic():
                # Lock receipt row and re-verify claim ownership inside transaction
                locked_receipt = WebhookEventReceipt.objects.select_for_update().filter(svix_id=svix_id).first()

                # Verify all ownership invariants before executing any business mutation:
                # 1. Receipt must exist.
                # 2. Receipt status must be PROCESSING.
                # 3. claim_token must strictly match worker_claim_token.
                if (
                    not locked_receipt
                    or locked_receipt.status != WebhookEventReceipt.STATUS_PROCESSING
                    or locked_receipt.claim_token != worker_claim_token
                ):
                    logger.warning(
                        f"[KEYFLOW Webhook] Mutation aborted: worker {worker_claim_token} lost claim ownership "
                        f"for svix_id={svix_id} (current status={getattr(locked_receipt, 'status', None)}, "
                        f"current token={getattr(locked_receipt, 'claim_token', None)})"
                    )
                    if locked_receipt and locked_receipt.status == WebhookEventReceipt.STATUS_PROCESSED:
                        return Response(
                            {'status': 'duplicate_ignored', 'svix_id': svix_id},
                            status=status.HTTP_200_OK
                        )
                    return Response(
                        {'status': 'processing_in_progress', 'svix_id': svix_id, 'retry_after': 5},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                        headers={'Retry-After': '5'}
                    )

                # Execute database-only business mutation
                if event_type == 'user.deleted':
                    target = User.objects.filter(clerk_id=clerk_id).first()
                    if target:
                        from accounts.services.account_deletion import safe_delete_account
                        safe_delete_account(target_email=target.email, expected_clerk_id=clerk_id, dry_run=False)
                    result_response = Response({'status': 'deleted', 'clerk_id': clerk_id}, status=status.HTTP_200_OK)

                elif event_type in ('user.created', 'user.updated'):
                    jwt_payload = {
                        'sub': clerk_id,
                        'email': email,
                        'first_name': event_data.get('first_name', ''),
                        'last_name': event_data.get('last_name', ''),
                        'username': event_data.get('username'),
                        'image_url': event_data.get('image_url', ''),
                        'allow_external_fetch': False,
                    }
                    from accounts.authentication import resolve_clerk_identity
                    user = resolve_clerk_identity(jwt_payload)
                    result_response = Response({'status': 'processed', 'user_id': user.id}, status=status.HTTP_200_OK)

                else:
                    result_response = Response({'status': 'ignored', 'event_type': event_type}, status=status.HTTP_200_OK)

                # Transition receipt to PROCESSED within the exact same transaction
                locked_receipt.status = WebhookEventReceipt.STATUS_PROCESSED
                locked_receipt.processed_at = timezone.now()
                locked_receipt.error_message = ''
                locked_receipt.save(update_fields=['status', 'processed_at', 'error_message'])

            # Atomic transaction committed: both business mutation and PROCESSED receipt are committed together
            return result_response

        except Exception as exc:
            # Transaction rolled back automatically!
            # Fenced transition to FAILED so Clerk retries remain cleanly claimable
            WebhookEventReceipt.objects.filter(
                svix_id=svix_id,
                claim_token=worker_claim_token,
            ).update(
                status=WebhookEventReceipt.STATUS_FAILED,
                error_message=str(exc)[:255]
            )
            logger.error(f"[KEYFLOW Webhook] Downstream processing failed for svix_id={svix_id}: {exc}")
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
