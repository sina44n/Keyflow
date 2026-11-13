
"""
KEYFLOW Clerk JWT Authentication Backend for Django REST Framework
==================================================================
Cryptographically verifies Clerk session JWTs, maps verified Clerk identities
(sub claim) to Django User instances, links existing accounts safely without
modifying integer primary keys, and preserves all user relationships.

Supports:
- Asymmetric RS256 signature verification via Clerk JWKS (cached) or PEM public key.
- Fallback to Clerk Secret Key API lookup when email claims are omitted.
- Deterministic test key support for unit testing without network dependencies.
"""

import json
import logging
import base64
import urllib.request
import urllib.error
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
import jwt
from accounts.clerk_env import (
    get_clerk_domain_from_publishable_key,
    validate_clerk_backend_configuration,
)

User = get_user_model()
logger = logging.getLogger(__name__)

# Global PyJWKClient instance cache
_jwk_clients = {}


def get_clerk_domain_from_publishable_key(pk):
    """
    Clerk publishable keys (pk_test_..., pk_live_...) encode the frontend API
    domain in base64. Extracts the domain (e.g. 'verb-noun-00.clerk.accounts.dev').
    """
    if not pk or not isinstance(pk, str):
        return None
    clean_pk = pk.strip()
    if not clean_pk.startswith(('pk_test_', 'pk_live_')):
        return None
    try:
        parts = clean_pk.split('_', 2)
        if len(parts) < 3:
            return None
        encoded = parts[2]
        padded = encoded + '=' * (-len(encoded) % 4)
        domain = base64.b64decode(padded).decode('utf-8').rstrip('$').strip()
        return domain if '.' in domain else None
    except Exception:
        return None


def _get_jwk_client(jwks_url):
    """Retrieve or initialize a cached PyJWKClient instance for the given JWKS URL."""
    if jwks_url not in _jwk_clients:
        _jwk_clients[jwks_url] = jwt.PyJWKClient(jwks_url, cache_keys=True, max_cached_keys=16, lifespan=3600)
    return _jwk_clients[jwks_url]


def fetch_clerk_user_info(clerk_id):
    """
    Fetch user info directly from Clerk Backend API if CLERK_SECRET_KEY is configured.
    Used when email claim is not present in the session token.
    """
    secret_key = getattr(settings, 'CLERK_SECRET_KEY', '').strip()
    if not secret_key:
        return None

    api_url = f"https://api.clerk.com/v1/users/{clerk_id}"
    req = urllib.request.Request(
        api_url,
        headers={
            'Authorization': f'Bearer {secret_key}',
            'User-Agent': 'KEYFLOW-Backend/1.0',
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as exc:
        logger.warning(f"[KEYFLOW Clerk] Failed to fetch user info from Clerk API: {exc}")
        return None


def resolve_clerk_identity(payload):
    """
    Given a verified Clerk JWT payload, maps the verified Clerk 'sub' to a Django User.
    1. If user with clerk_id == sub exists: returns that user.
    2. Else, checks verified email in claims (or via Clerk Backend API).
       - If an existing Django user has that email: safely links clerk_id to them.
       - If no existing Django user matches: creates a new Django user with clerk_id.
    3. Guarantees all Profile and Preferences records exist.
    """
    clerk_id = payload.get('sub')
    if not clerk_id:
        raise AuthenticationFailed("Clerk session token is missing the required 'sub' claim.")

    owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
    owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))

    # 1. Existing Clerk identity match
    user = User.objects.filter(clerk_id=clerk_id).first()
    if user:
        if not user.is_active or getattr(user, 'status', 'ACTIVE') == 'DELETED':
            raise AuthenticationFailed("This account has been deactivated.")
        if getattr(user, 'status', 'ACTIVE') == 'BANNED':
            raise AuthenticationFailed("This account has been banned by platform administration.")
        if getattr(user, 'status', 'ACTIVE') == 'SUSPENDED':
            reason = getattr(user, 'suspension_reason', '') or 'Contact support.'
            raise AuthenticationFailed(f"This account has been suspended: {reason}")

        # Protect and auto-promote platform owner
        if (user.email and user.email.lower() == owner_email) or clerk_id in owner_clerk_ids:
            needs_update = False
            fields_to_update = []
            if user.email.lower() != owner_email and (clerk_id in owner_clerk_ids):
                # Ensure owner email consistency if no collision with another active user
                conflict = User.objects.filter(email__iexact=owner_email).exclude(pk=user.pk).exists()
                if not conflict:
                    user.email = owner_email
                    fields_to_update.append('email')
                    needs_update = True
            if getattr(user, 'role', '') != 'SUPER_ADMIN':
                user.role = 'SUPER_ADMIN'
                fields_to_update.append('role')
                needs_update = True
            if not user.is_staff:
                user.is_staff = True
                fields_to_update.append('is_staff')
                needs_update = True
            if not user.is_superuser:
                user.is_superuser = True
                fields_to_update.append('is_superuser')
                needs_update = True
            if getattr(user, 'status', '') != 'ACTIVE':
                user.status = 'ACTIVE'
                fields_to_update.append('status')
                needs_update = True
            if not getattr(user, 'is_email_verified', False):
                user.is_email_verified = True
                fields_to_update.append('is_email_verified')
                needs_update = True
            if needs_update:
                user.save(update_fields=fields_to_update)

        return user

    # 2. Extract email from claims
    email = (
        payload.get('email')
        or payload.get('email_address')
        or payload.get('primary_email_address')
        or payload.get('claims', {}).get('email')
    )

    name = payload.get('name') or payload.get('first_name') or ''
    picture = payload.get('picture') or payload.get('image_url') or ''
    username_claim = payload.get('username')

    # If email was not included in session token claims, attempt Clerk API query
    if not email:
        try:
            clerk_user_data = fetch_clerk_user_info(clerk_id)
            if clerk_user_data:
                primary_id = clerk_user_data.get('primary_email_address_id')
                email_addresses = clerk_user_data.get('email_addresses', [])
                for ea in email_addresses:
                    if ea.get('id') == primary_id or not email:
                        email = ea.get('email_address')
                if not name:
                    fn = clerk_user_data.get('first_name', '')
                    ln = clerk_user_data.get('last_name', '')
                    name = f"{fn} {ln}".strip()
                if not picture:
                    picture = clerk_user_data.get('image_url', '')
                if not username_claim:
                    username_claim = clerk_user_data.get('username')
        except Exception as exc:
            logger.warning(f"[KEYFLOW Clerk] Error during fetch_clerk_user_info: {exc}")

    # Fallback to configured owner identity if known owner Clerk ID matches
    if not email and clerk_id in owner_clerk_ids:
        email = owner_email

    if email:
        email = str(email).strip().lower()

    with transaction.atomic():
        # Check if an existing Django user has this email address
        if email:
            existing_user = User.objects.filter(email__iexact=email).first()
            if existing_user:
                # Disconnect clerk_id from any other user that might hold it
                conflict_user = User.objects.filter(clerk_id=clerk_id).exclude(id=existing_user.id).first()
                if conflict_user:
                    try:
                        from practice.models import PracticeSession
                        from games.models import GameSession
                        from lessons.models import CurriculumLessonProgress, LessonProgress
                        PracticeSession.objects.filter(user=conflict_user).update(user=existing_user)
                        GameSession.objects.filter(user=conflict_user).update(user=existing_user)
                        CurriculumLessonProgress.objects.filter(user=conflict_user).update(user=existing_user)
                        LessonProgress.objects.filter(user=conflict_user).update(user=existing_user)
                    except Exception as merge_err:
                        logger.warning(f"[KEYFLOW Clerk] Non-critical error migrating data from conflict user: {merge_err}")

                    conflict_user.clerk_id = None
                    conflict_user.save(update_fields=['clerk_id'])

                existing_user.clerk_id = clerk_id
                if not existing_user.is_email_verified:
                    existing_user.is_email_verified = True
                update_fields = ['clerk_id', 'is_email_verified']
                if email.lower() == owner_email:
                    existing_user.role = 'SUPER_ADMIN'
                    existing_user.status = 'ACTIVE'
                    existing_user.is_staff = True
                    existing_user.is_superuser = True
                    update_fields.extend(['role', 'status', 'is_staff', 'is_superuser'])
                existing_user.save(update_fields=update_fields)

                from accounts.models import UserProfile, UserPreferences
                UserProfile.objects.get_or_create(user=existing_user)
                UserPreferences.objects.get_or_create(user=existing_user)

                logger.info(
                    f"[KEYFLOW Clerk] Successfully linked existing user id={existing_user.id} "
                    f"({existing_user.email}) to Clerk ID {clerk_id}"
                )
                return existing_user

        # Create new Django user
        base_username = username_claim or (email.split('@')[0] if email else f"user_{clerk_id[-6:]}")
        clean_username = ''.join(c for c in base_username if c.isalnum() or c in '_-')[:20]
        if len(clean_username) < 3:
            clean_username = f"user_{clerk_id[-6:]}"

        candidate_username = clean_username
        counter = 1
        while User.objects.filter(username__iexact=candidate_username).exists():
            candidate_username = f"{clean_username[:15]}_{counter}"
            counter += 1

        target_email = email or f"{clerk_id}@clerk.keyflow.local"
        existing_target = User.objects.filter(email__iexact=target_email).first()
        if existing_target:
            existing_target.clerk_id = clerk_id
            existing_target.save(update_fields=['clerk_id'])
            return existing_target

        new_user = User.objects.create_user(
            email=target_email,
            username=candidate_username,
            clerk_id=clerk_id,
            is_email_verified=True,
        )
        new_user.set_unusable_password()
        new_user.save()

        # Update profile if provided
        from accounts.models import UserProfile, UserPreferences
        profile, _ = UserProfile.objects.get_or_create(user=new_user)
        UserPreferences.objects.get_or_create(user=new_user)

        if name:
            profile.display_name = name
        if picture:
            profile.avatar_url = picture
        profile.save()

        logger.info(
            f"[KEYFLOW Clerk] Provisioned new Django user id={new_user.id} "
            f"({new_user.username}) for Clerk ID {clerk_id}"
        )
        return new_user


class ClerkAuthentication(BaseAuthentication):
    """
    DRF Authentication Class for Clerk Session Tokens.
    Accepts: Authorization: Bearer <clerk_jwt>
    Passes through:
      - Authorization: Token <knox_token> (handled by Knox)
      - No Authorization header (handled by AllowAny endpoints)
    """

    def _is_public_view(self, request):
        """
        Determines whether the target view permits unauthenticated/anonymous access.
        If a view allows AllowAny, token verification failures should degrade gracefully
        to AnonymousUser rather than aborting the public request with 401.
        """
        try:
            from django.urls import resolve
            from rest_framework.permissions import AllowAny
            resolver_match = resolve(request.path_info)
            view_class = getattr(resolver_match.func, 'view_class', None)
            if view_class:
                permission_classes = getattr(view_class, 'permission_classes', [])
                if AllowAny in permission_classes:
                    return True
        except Exception:
            pass
        return False

    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()
        if not auth_header:
            return None

        prefix = auth_header[0].decode('utf-8').lower()
        if prefix != 'bearer':
            # Not a Bearer token (e.g. Knox 'Token <key>') — pass to next authenticator
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed("Invalid Bearer header: Token is missing.")
        elif len(auth_header) > 2:
            raise AuthenticationFailed("Invalid Bearer header: Token string contains spaces.")

        token = auth_header[1].decode('utf-8')
        try:
            payload = self.verify_token(token)
            user = resolve_clerk_identity(payload)
            return (user, token)
        except AuthenticationFailed as exc:
            # If target view permits AllowAny, fallback to AnonymousUser instead of crashing with 401
            if self._is_public_view(request):
                logger.info(f"[KEYFLOW Clerk] Gracefully handling unverified token on public view {request.path_info}: {exc}")
                return None
            raise
        except Exception as exc:
            logger.warning(f"[KEYFLOW Clerk] Unhandled error during token verification on {request.path_info}: {exc}")
            if self._is_public_view(request):
                return None
            raise AuthenticationFailed(f"Authentication failed: {str(exc)}")

    def verify_token(self, token):
        """
        Verify the JWT cryptographically using configured Clerk keys:
        1. CLERK_TEST_PUBLIC_KEY (for unit tests / mock environment)
        2. CLERK_PEM_PUBLIC_KEY (for zero-latency local PEM verification)
        3. CLERK_JWKS_URL or CLERK_ISSUER (for standard Clerk JWKS verification)
        """
        # Test key support
        test_key = getattr(settings, 'CLERK_TEST_PUBLIC_KEY', None)
        if test_key:
            try:
                return jwt.decode(
                    token,
                    test_key,
                    algorithms=['RS256', 'HS256'],
                    options={'verify_aud': False},
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Clerk session token has expired.")
            except jwt.InvalidTokenError as exc:
                raise AuthenticationFailed(f"Invalid Clerk token: {str(exc)}")

        # PEM Public Key configured directly
        pem_key = getattr(settings, 'CLERK_PEM_PUBLIC_KEY', '').strip()
        if pem_key:
            # Ensure standard PEM headers if raw base64 was pasted
            if not pem_key.startswith('-----BEGIN'):
                formatted_pem = f"-----BEGIN PUBLIC KEY-----\n{pem_key}\n-----END PUBLIC KEY-----"
            else:
                formatted_pem = pem_key
            try:
                issuer = getattr(settings, 'CLERK_ISSUER', None)
                decode_options = {'verify_aud': False}
                if not issuer:
                    decode_options['verify_iss'] = False

                return jwt.decode(
                    token,
                    formatted_pem,
                    algorithms=['RS256'],
                    issuer=issuer if issuer else None,
                    options=decode_options,
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Clerk session token has expired.")
            except jwt.InvalidTokenError as exc:
                raise AuthenticationFailed(f"Invalid Clerk token signature: {str(exc)}")

        # JWKS URL or Issuer configured
        jwks_url = getattr(settings, 'CLERK_JWKS_URL', '').strip()
        issuer = getattr(settings, 'CLERK_ISSUER', '').strip()

        # If not set, check if CLERK_PUBLISHABLE_KEY can derive issuer and JWKS URL
        if not jwks_url and not issuer:
            pk = getattr(settings, 'CLERK_PUBLISHABLE_KEY', '').strip()
            derived_domain = get_clerk_domain_from_publishable_key(pk)
            if derived_domain:
                issuer = f"https://{derived_domain}"
                jwks_url = f"https://{derived_domain}/.well-known/jwks.json"

        if not jwks_url and issuer:
            jwks_url = f"{issuer.rstrip('/')}/.well-known/jwks.json"

        if jwks_url:
            try:
                jwk_client = _get_jwk_client(jwks_url)
                signing_key = jwk_client.get_signing_key_from_jwt(token)
                decode_options = {'verify_aud': False}
                if not issuer:
                    decode_options['verify_iss'] = False

                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=['RS256'],
                    issuer=issuer if issuer else None,
                    options=decode_options,
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Clerk session token has expired.")
            except (jwt.PyJWKClientError, jwt.InvalidTokenError, urllib.error.URLError, urllib.error.HTTPError, TimeoutError, Exception) as exc:
                if getattr(settings, 'DEBUG', False):
                    logger.warning(f"[KEYFLOW Clerk] JWKS verification failed ({exc}). Decoding claims for development.")
                    try:
                        return jwt.decode(token, options={'verify_signature': False})
                    except Exception:
                        pass
                if isinstance(exc, jwt.PyJWKClientError):
                    raise AuthenticationFailed(f"Clerk JWKS verification failed: {str(exc)}")
                raise AuthenticationFailed(f"Invalid Clerk session token: {str(exc)}")

        # If no verification method is configured:
        raise AuthenticationFailed(
            "Clerk authentication is not configured on this server. "
            "Set CLERK_PEM_PUBLIC_KEY, CLERK_JWKS_URL, CLERK_ISSUER, or CLERK_PUBLISHABLE_KEY in your environment."
        )

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
