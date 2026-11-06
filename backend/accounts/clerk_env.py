"""
KEYFLOW Clerk Backend Environment Configuration & Security Validator
====================================================================
Provides authoritative environment inspection, validation, and security guards
for Clerk JWT authentication on the Django REST Framework backend.

Key Capabilities:
1. Validates key formats:
   - Development: pk_test_..., sk_test_...
   - Production:  pk_live_..., sk_live_...
2. Detects environment mismatches (e.g. pk_live_ paired with sk_test_).
3. Production security audit: Warns if DEBUG=False is deployed with development keys.
4. Derives and validates issuer and JWKS endpoints from publishable key or environment.
5. Protects against secret exposure in logs.
"""

import base64
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_clerk_domain_from_publishable_key(pk):
    """
    Clerk publishable keys (pk_test_..., pk_live_...) encode the frontend API
    domain in base64. Extracts the domain (e.g. 'verb-noun-00.clerk.accounts.dev'
    or a custom production domain like 'clerk.keyflow.app').
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


def get_clerk_key_type(key):
    """
    Determines whether a Clerk key is development ('test'), production ('live'),
    or invalid/empty.
    """
    if not key or not isinstance(key, str):
        return 'empty'
    clean = key.strip()
    if clean.startswith(('pk_test_', 'sk_test_')):
        return 'test'
    if clean.startswith(('pk_live_', 'sk_live_')):
        return 'live'
    return 'invalid'


def validate_clerk_backend_configuration(override_settings=None):
    """
    Validates backend Clerk environment configuration against security policies.

    Checks:
    - Key presence and format
    - Cross-key consistency (matching test or live)
    - Production safety (DEBUG=False with test keys)
    - Resolution of JWKS URL and Issuer
    """
    cfg = override_settings or {}
    pk = cfg.get('CLERK_PUBLISHABLE_KEY', getattr(settings, 'CLERK_PUBLISHABLE_KEY', '')).strip()
    sk = cfg.get('CLERK_SECRET_KEY', getattr(settings, 'CLERK_SECRET_KEY', '')).strip()
    issuer = cfg.get('CLERK_ISSUER', getattr(settings, 'CLERK_ISSUER', '')).strip()
    jwks_url = cfg.get('CLERK_JWKS_URL', getattr(settings, 'CLERK_JWKS_URL', '')).strip()
    pem_key = cfg.get('CLERK_PEM_PUBLIC_KEY', getattr(settings, 'CLERK_PEM_PUBLIC_KEY', '')).strip()
    is_debug = cfg.get('DEBUG', getattr(settings, 'DEBUG', True))

    pk_type = get_clerk_key_type(pk)
    sk_type = get_clerk_key_type(sk)

    warnings = []
    errors = []

    # Check 1: Key pairing consistency
    if pk_type in ('test', 'live') and sk_type in ('test', 'live'):
        if pk_type != sk_type:
            err = (
                f"[KEYFLOW Security Mismatch] CLERK_PUBLISHABLE_KEY ({pk_type}) "
                f"does not match CLERK_SECRET_KEY ({sk_type}). Both must be either 'test' or 'live'."
            )
            errors.append(err)
            logger.error(err)

    # Check 2: Production safety audit
    if not is_debug:
        if pk_type == 'test' or sk_type == 'test':
            warn = (
                "[KEYFLOW Security Warning] Production environment (DEBUG=False) is running "
                "with Clerk Development credentials (test keys). Ensure pk_live_ and sk_live_ "
                "are configured before serving live production traffic."
            )
            warnings.append(warn)
            logger.warning(warn)

    # Check 3: Domain and Issuer resolution
    derived_domain = get_clerk_domain_from_publishable_key(pk)
    effective_issuer = issuer or (f"https://{derived_domain}" if derived_domain else '')
    effective_jwks = jwks_url or (f"{effective_issuer.rstrip('/')}/.well-known/jwks.json" if effective_issuer else '')

    is_configured = bool(pem_key or effective_jwks or effective_issuer)

    instance_type = 'unconfigured'
    if pk_type == 'test' or sk_type == 'test':
        instance_type = 'development'
    elif pk_type == 'live' or sk_type == 'live':
        instance_type = 'production'
    elif pk_type == 'invalid' or sk_type == 'invalid':
        instance_type = 'invalid'

    return {
        'is_configured': is_configured,
        'instance_type': instance_type,
        'pk_type': pk_type,
        'sk_type': sk_type,
        'derived_domain': derived_domain,
        'effective_issuer': effective_issuer,
        'effective_jwks_url': effective_jwks,
        'has_pem_key': bool(pem_key),
        'warnings': warnings,
        'errors': errors,
    }

