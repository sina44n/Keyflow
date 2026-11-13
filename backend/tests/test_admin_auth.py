"""
Test Suite: KEYFLOW Super Admin Authentication, Role Provisioning & Security
Validates:
1. Owner auto-provisioning for sina44n07@gmail.com.
2. Protection of owner against deletion, demotion, and suspension.
3. IsSuperAdminUser permission enforcement.
4. Serializer exposure of role, status, is_super_admin, is_owner.
5. Suspension and banned user rejection.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import (
    OWNER_EMAIL,
    ROLE_SUPER_ADMIN,
    ROLE_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    STATUS_SUSPENDED,
    STATUS_BANNED,
    STATUS_DELETED,
)
from accounts.authentication import resolve_clerk_identity
from accounts.serializers import FullUserSerializer
from admin_api.permissions import IsSuperAdminUser, IsAdminUser, IsOwnerOnly
from admin_api.urls import AdminAuthStatusView
from admin_api.models import AdminAuditLog, GlobalPlatformConfig

User = get_user_model()


class SuperAdminSecurityTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        # Regular user
        self.normal_user = User.objects.create_user(
            email='student@example.com',
            username='student1',
            password='Password123!',
        )

        # Super Admin Owner
        self.owner_user = User.objects.create_user(
            email=OWNER_EMAIL,
            username='owner_sina',
            password='Password123!',
        )

        # Standard Admin
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='staff_admin',
            role=ROLE_ADMIN,
            is_staff=True,
            password='Password123!',
        )

    def test_owner_automatic_super_admin_provisioning_on_creation(self):
        """Owner email should automatically be granted SUPER_ADMIN, is_staff, and is_superuser."""
        self.assertEqual(self.owner_user.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.owner_user.is_staff)
        self.assertTrue(self.owner_user.is_superuser)
        self.assertTrue(self.owner_user.is_super_admin)
        self.assertTrue(self.owner_user.is_admin)
        self.assertTrue(self.owner_user.is_owner)

    def test_regular_user_defaults_to_user_role(self):
        """Standard users must have role=USER, is_staff=False, is_superuser=False."""
        self.assertEqual(self.normal_user.role, ROLE_USER)
        self.assertFalse(self.normal_user.is_staff)
        self.assertFalse(self.normal_user.is_superuser)
        self.assertFalse(self.normal_user.is_super_admin)
        self.assertFalse(self.normal_user.is_owner)

    def test_owner_protection_against_management(self):
        """Owner account must never be manageable/deletable/demotable."""
        self.assertFalse(self.owner_user.can_be_managed_by(self.admin_user))
        self.assertFalse(self.owner_user.can_be_managed_by(self.owner_user))
        self.assertTrue(self.normal_user.can_be_managed_by(self.owner_user))

    def test_resolve_clerk_identity_promotes_owner(self):
        """When Clerk token with owner email arrives, user is automatically promoted to SUPER_ADMIN."""
        payload = {
            'sub': 'user_clerk_owner_999',
            'email': OWNER_EMAIL.upper(),  # Test case insensitivity
            'first_name': 'Sinan',
            'last_name': 'Owner',
        }
        user = resolve_clerk_identity(payload)
        self.assertEqual(user.email, OWNER_EMAIL)
        self.assertEqual(user.role, ROLE_SUPER_ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.clerk_id, 'user_clerk_owner_999')

    def test_is_super_admin_permission_denies_normal_user(self):
        """Normal users must receive 403 Forbidden from IsSuperAdminUser."""
        permission = IsSuperAdminUser()
        request = self.factory.get('/api/admin/auth/status/')
        request.user = self.normal_user
        self.assertFalse(permission.has_permission(request, None))

    def test_is_super_admin_permission_denies_admin_user(self):
        """Ordinary admins without SUPER_ADMIN must be denied by IsSuperAdminUser."""
        permission = IsSuperAdminUser()
        request = self.factory.get('/api/admin/auth/status/')
        request.user = self.admin_user
        self.assertFalse(permission.has_permission(request, None))

    def test_is_super_admin_permission_allows_owner(self):
        """Owner must be allowed by IsSuperAdminUser."""
        permission = IsSuperAdminUser()
        request = self.factory.get('/api/admin/auth/status/')
        request.user = self.owner_user
        self.assertTrue(permission.has_permission(request, None))

    def test_suspended_user_is_denied_permission(self):
        """Suspended or banned users must always be rejected."""
        suspended_user = User.objects.create_user(
            email='suspended_super@example.com',
            username='suspended_super',
            role=ROLE_SUPER_ADMIN,
            status=STATUS_SUSPENDED,
            password='Password123!',
        )
        permission = IsSuperAdminUser()
        request = self.factory.get('/api/admin/auth/status/')
        request.user = suspended_user
        self.assertFalse(permission.has_permission(request, None))

    def test_admin_auth_status_view_success(self):
        """Owner can query /api/admin/auth/status/ and receives full authorization details."""
        view = AdminAuthStatusView.as_view()
        request = self.factory.get('/api/admin/auth/status/')
        force_authenticate(request, user=self.owner_user)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'authorized')
        self.assertTrue(response.data['is_owner'])
        self.assertTrue(response.data['is_super_admin'])
        self.assertEqual(response.data['role'], ROLE_SUPER_ADMIN)

    def test_admin_auth_status_view_forbidden_for_normal_user(self):
        """Normal user receives 403 Forbidden on /api/admin/auth/status/."""
        view = AdminAuthStatusView.as_view()
        request = self.factory.get('/api/admin/auth/status/')
        force_authenticate(request, user=self.normal_user)
        response = view(request)
        self.assertEqual(response.status_code, 403)

    def test_full_user_serializer_contains_admin_flags(self):
        """FullUserSerializer includes role, status, is_super_admin, is_admin, is_owner."""
        serializer = FullUserSerializer(self.owner_user)
        data = serializer.data
        self.assertEqual(data['role'], ROLE_SUPER_ADMIN)
        self.assertEqual(data['status'], STATUS_ACTIVE)
        self.assertTrue(data['is_super_admin'])
        self.assertTrue(data['is_admin'])
        self.assertTrue(data['is_owner'])

    def test_admin_audit_log_and_platform_config(self):
        """Verifies audit logging creation and singleton platform configuration."""
        config = GlobalPlatformConfig.get_config()
        self.assertEqual(config.default_duration, 60)
        self.assertIn(60, config.allowed_durations)

        log = AdminAuditLog.log(
            action='TEST_ACTION',
            admin_user=self.owner_user,
            target_model='User',
            target_id=str(self.normal_user.id),
            target_repr=self.normal_user.username,
            details={'test_key': 'test_val'}
        )
        self.assertEqual(log.action, 'TEST_ACTION')
        self.assertEqual(log.admin_user, self.owner_user)
        self.assertEqual(log.details['test_key'], 'test_val')

    def test_admin_overview_view(self):
        """Verifies overview KPIs returned for owner."""
        from admin_api.views import AdminOverviewView
        view = AdminOverviewView.as_view()
        request = self.factory.get('/api/admin/overview/')
        force_authenticate(request, user=self.owner_user)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('kpis', response.data)
        self.assertIn('total_users', response.data['kpis'])
        self.assertGreaterEqual(response.data['kpis']['total_users'], 2)

    def test_admin_users_list_and_search(self):
        """Verifies user directory listing and filtering."""
        from admin_api.views import AdminUsersListView
        view = AdminUsersListView.as_view()
        request = self.factory.get('/api/admin/users/?search=student')
        force_authenticate(request, user=self.owner_user)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertTrue(any(u['username'] == 'student1' for u in response.data['results']))

    def test_admin_user_action_suspend_and_restore(self):
        """Admin can suspend and restore a regular user."""
        from admin_api.views import AdminUserActionView
        view = AdminUserActionView.as_view()

        # Suspend
        req_suspend = self.factory.post(
            f'/api/admin/users/{self.normal_user.id}/action/',
            {'action': 'SUSPEND', 'reason': 'Testing suspension'},
            format='json'
        )
        force_authenticate(req_suspend, user=self.owner_user)
        res_suspend = view(req_suspend, user_id=self.normal_user.id)
        self.assertEqual(res_suspend.status_code, 200)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.status, 'SUSPENDED')

        # Restore
        req_restore = self.factory.post(
            f'/api/admin/users/{self.normal_user.id}/action/',
            {'action': 'RESTORE'},
            format='json'
        )
        force_authenticate(req_restore, user=self.owner_user)
        res_restore = view(req_restore, user_id=self.normal_user.id)
        self.assertEqual(res_restore.status_code, 200)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.status, 'ACTIVE')

    def test_admin_user_action_blocks_owner_modification(self):
        """Attempting to modify owner account must return 400 Bad Request."""
        from admin_api.views import AdminUserActionView
        view = AdminUserActionView.as_view()

        req = self.factory.post(
            f'/api/admin/users/{self.owner_user.id}/action/',
            {'action': 'SUSPEND', 'reason': 'Accidental self suspend'},
            format='json'
        )
        force_authenticate(req, user=self.owner_user)
        res = view(req, user_id=self.owner_user.id)
        self.assertEqual(res.status_code, 400)
        self.assertIn('protected', res.data['error'].lower())

    def test_admin_typing_config_update(self):
        """Updating typing durations and custom text settings."""
        from admin_api.views import AdminTypingConfigView
        view = AdminTypingConfigView.as_view()

        put_req = self.factory.put(
            '/api/admin/typing/config/',
            {'allowed_durations': [15, 30, 60, 180], 'default_duration': 30, 'custom_text_enabled': False},
            format='json'
        )
        force_authenticate(put_req, user=self.owner_user)
        res = view(put_req)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['default_duration'], 30)
        self.assertEqual(res.data['allowed_durations'], [15, 30, 60, 180])
        self.assertFalse(res.data['custom_text_enabled'])

