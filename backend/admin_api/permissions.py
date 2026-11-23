"""
Security & Authorization Permissions for KEYFLOW Super Admin Control Center.
Guarantees server-side verification and absolute protection of owner sina44n07@gmail.com.
"""

from rest_framework.permissions import BasePermission
from django.conf import settings
from accounts.models import OWNER_EMAIL, ROLE_SUPER_ADMIN, ROLE_ADMIN, STATUS_ACTIVE


def _is_verified_owner(user):
    if not user or not user.is_authenticated:
        return False
    return bool(getattr(user, 'is_owner', False))


class IsSuperAdminUser(BasePermission):
    """
    Allows access strictly to the authenticated and verified Platform Owner (sina44n07@gmail.com).
    Blocks any user who is suspended, banned, or deleted.
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        # Status check
        if getattr(user, 'status', STATUS_ACTIVE) != STATUS_ACTIVE or not user.is_active:
            return False

        # Strict verified owner check
        return _is_verified_owner(user)


class IsAdminUser(BasePermission):
    """
    Allows access strictly to the verified Platform Owner (sina44n07@gmail.com).
    Generic roles or Django staff/superuser flags on non-owners are strictly rejected.
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'status', STATUS_ACTIVE) != STATUS_ACTIVE or not user.is_active:
            return False

        return _is_verified_owner(user)


class IsOwnerOnly(BasePermission):
    """
    Allows access strictly to the immutable platform owner (sina44n07@gmail.com).
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return _is_verified_owner(user)

