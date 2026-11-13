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
    owner_email = getattr(settings, 'OWNER_EMAIL', OWNER_EMAIL).strip().lower()
    owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
    if getattr(user, 'email', '').lower() == owner_email:
        return True
    if getattr(user, 'clerk_id', '') in owner_clerk_ids:
        return True
    return False


class IsSuperAdminUser(BasePermission):
    """
    Allows access only to authenticated Super Administrators or verified owner sina44n07@gmail.com.
    Blocks any user who is suspended, banned, or deleted.
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        # Status check
        if getattr(user, 'status', STATUS_ACTIVE) != STATUS_ACTIVE or not user.is_active:
            return False

        # Owner check (always authorized)
        if _is_verified_owner(user):
            return True

        # Role or superuser flag check
        return getattr(user, 'role', '') == ROLE_SUPER_ADMIN or getattr(user, 'is_superuser', False)


class IsAdminUser(BasePermission):
    """
    Allows access to authenticated Admins and Super Admins.
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'status', STATUS_ACTIVE) != STATUS_ACTIVE or not user.is_active:
            return False

        if _is_verified_owner(user):
            return True

        return (
            getattr(user, 'role', '') in (ROLE_SUPER_ADMIN, ROLE_ADMIN)
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )


class IsOwnerOnly(BasePermission):
    """
    Allows access strictly to the immutable platform owner (sina44n07@gmail.com).
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return _is_verified_owner(user)

