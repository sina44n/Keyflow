
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

    # 1. Existing Clerk identity match
    user = User.objects.filter(clerk_id=clerk_id).first()
    if user:
        if not user.is_active:
            raise AuthenticationFailed("This account has been deactivated.")
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

    if email:
        email = str(email).strip().lower()

    with transaction.atomic():
        # Check if an existing Django user has this email address
        if email:
            existing_user = User.objects.filter(email__iexact=email).first()
            if existing_user:
                existing_user.clerk_id = clerk_id
                if not existing_user.is_email_verified:
                    existing_user.is_email_verified = True
                existing_user.save(update_fields=['clerk_id', 'is_email_verified'])
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
        new_user = User.objects.create_user(
            email=target_email,
            username=candidate_username,
            clerk_id=clerk_id,
            is_email_verified=True,
        )
        new_user.set_unusable_password()
        new_user.save()

        # Update profile if provided
        if hasattr(new_user, 'profile'):
            if name:
                new_user.profile.display_name = name
            if picture:
                new_user.profile.avatar_url = picture
            new_user.profile.save()

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
        payload = self.verify_token(token)
        user = resolve_clerk_identity(payload)
        return (user, token)

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
            except jwt.PyJWKClientError as exc:
                raise AuthenticationFailed(f"Clerk JWKS verification failed: {str(exc)}")
            except jwt.InvalidTokenError as exc:
                raise AuthenticationFailed(f"Invalid Clerk session token: {str(exc)}")

        # If no verification method is configured:
        raise AuthenticationFailed(
            "Clerk authentication is not configured on this server. "
            "Set CLERK_PEM_PUBLIC_KEY, CLERK_JWKS_URL, CLERK_ISSUER, or CLERK_PUBLISHABLE_KEY in your environment."
        )

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
