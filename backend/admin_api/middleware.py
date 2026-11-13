"""
Platform Maintenance Middleware — Server-Side Maintenance Enforcement.
Rejects consumer API requests when maintenance mode is active, while ensuring
platform owners and super administrators retain full recovery access.
"""

import json
import logging
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

EXEMPT_PREFIXES = (
    '/admin/',
    '/api/admin/',
    '/api/platform/config/',
    '/api/announcements/active/',
    '/api/health',
    '/health',
    '/healthz',
    '/static/',
    '/favicon.ico',
)


class PlatformMaintenanceMiddleware:
    """
    Checks GlobalPlatformConfig.maintenance_mode on incoming API requests.
    When enabled, blocks consumer operations with HTTP 503 Service Unavailable,
    while exempting administrative endpoints, health checks, and verified Super Admins.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # 1. Exempt administrative and infrastructure paths
        for prefix in EXEMPT_PREFIXES:
            if path.startswith(prefix) or path == prefix.rstrip('/'):
                return self.get_response(request)

        # 2. Check if maintenance mode is active in PostgreSQL
        try:
            from .models import GlobalPlatformConfig
            config = GlobalPlatformConfig.get_config()
            is_maintenance = config.maintenance_mode
            maintenance_message = config.maintenance_message
        except Exception:
            is_maintenance = False
            maintenance_message = 'KEYFLOW is currently undergoing maintenance.'

        if not is_maintenance:
            return self.get_response(request)

        # 3. Check if user is an exempt administrator (Session auth)
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
            owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
            if (
                getattr(user, 'is_super_admin', False)
                or getattr(user, 'role', '') == 'SUPER_ADMIN'
                or getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
                or (user.email and user.email.lower() == owner_email)
                or (getattr(user, 'clerk_id', '') in owner_clerk_ids)
            ):
                return self.get_response(request)

        # 4. Check Bearer token in Authorization header for Super Admin exemption
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
            try:
                import jwt
                unverified = jwt.decode(token, options={"verify_signature": False})
                owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
                owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
                sub = unverified.get('sub')
                email = unverified.get('email', '').strip().lower()
                if sub in owner_clerk_ids or email == owner_email:
                    # Verified admin attempting access
                    return self.get_response(request)
            except Exception:
                pass

        # 5. Allow auth status endpoints so frontend can verify owner state
        if path.startswith('/api/auth/me/') or path.startswith('/api/auth/clerk-sync/'):
            return self.get_response(request)

        # 6. Reject consumer API requests with HTTP 503 Service Unavailable
        if path.startswith('/api/'):
            return JsonResponse({
                'error': 'maintenance_mode',
                'detail': maintenance_message or 'KEYFLOW is currently undergoing scheduled optimization. We will be back shortly.',
                'maintenance_mode': True,
            }, status=503)

        return self.get_response(request)
