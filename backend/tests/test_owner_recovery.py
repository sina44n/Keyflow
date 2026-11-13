"""
Test Suite: KEYFLOW Owner Access Recovery & Persistent Super Admin Protection
Verifies:
1. Designated owner (sina44n07@gmail.com) receives SUPER_ADMIN upon Clerk token resolution.
2. Owner role persists across multiple logins and Clerk user synchronization.
3. Forged owner email attempts by unverified users are strictly rejected with HTTP 403.
4. Unauthenticated requests to /api/admin/* receive HTTP 401.
5. Regular authenticated users receive HTTP 403.
6. Super Admin owner is granted authorized HTTP 200 on administrative endpoints.
7. Owner account is permanently protected against suspension, ban, and demotion.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status
import time
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from accounts.models import (
    OWNER_EMAIL,
    ROLE_SUPER_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    STATUS_SUSPENDED,
    STATUS_BANNED,
)
from accounts.authentication import resolve_clerk_identity
from accounts.views import ClerkSyncView
from admin_api.permissions import IsSuperAdminUser

User = get_user_model()


def _gen_keys():
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode('utf-8')
    pub_pem = priv.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode('utf-8')
    return priv_pem, pub_pem

TEST_PRIV, TEST_PUB = _gen_keys()


@override_settings(
    CLERK_TEST_PUBLIC_KEY=TEST_PUB,
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']
)
class OwnerAccessRecoveryTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()

        # Canonical owner account
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp_test',
            password='TestPassword123!',
        )

        # Normal typist account
        self.student = User.objects.create_user(
            email='student_typist@keyflow.app',
            username='student_typist',
            password='TestPassword123!',
        )

    def _make_jwt(self, sub, email=None):
        payload = {
            'sub': sub,
            'exp': int(time.time()) + 3600,
            'iat': int(time.time()),
        }
        if email:
            payload['email'] = email
        return jwt.encode(payload, TEST_PRIV, algorithm='RS256')

    def test_owner_receives_super_admin_from_verified_jwt(self):
        """Owner receives SUPER_ADMIN, is_staff, is_superuser when verified JWT arrives."""
        token = self._make_jwt('user_owner_jwt_123', email='sina44n07@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('status'), 'authorized')
        self.assertEqual(res.data.get('role'), ROLE_SUPER_ADMIN)
        self.assertTrue(res.data.get('is_super_admin'))
        self.assertTrue(res.data.get('is_owner'))

    def test_owner_recognized_via_configured_owner_clerk_id(self):
        """Owner with configured clerk_id is recognized even if token omits email claim."""
        token = self._make_jwt('user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', email=None)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('status'), 'authorized')
        self.assertEqual(res.data.get('role'), ROLE_SUPER_ADMIN)

    def test_clerk_sync_cannot_downgrade_owner(self):
        """Owner sync request safely preserves SUPER_ADMIN and active status."""
        self.client.force_authenticate(user=self.owner)
        res = self.client.post('/api/auth/clerk-sync/', {
            'email': 'sina44n07@gmail.com',
            'display_name': 'Owner Sinan',
            'avatar_url': 'https://keyflow.app/avatar.png',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['profile']['display_name'], 'Owner Sinan')
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.owner.is_staff)
        self.assertTrue(self.owner.is_superuser)
        from accounts.models import UserProfile
        profile = UserProfile.objects.get(user=self.owner)
        self.assertEqual(profile.display_name, 'Owner Sinan')

    def test_forged_owner_email_in_clerk_sync_rejected(self):
        """A non-owner user attempting to claim owner email in sync request is rejected with 403."""
        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/auth/clerk-sync/', {
            'email': 'sina44n07@gmail.com',
            'display_name': 'Imposter',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, ROLE_USER)
        self.assertFalse(self.student.is_staff)
        self.assertFalse(self.student.is_superuser)
        self.assertNotEqual(self.student.email, 'sina44n07@gmail.com')

    def test_unauthenticated_request_to_admin_rejected_with_401(self):
        """Anonymous access to /api/admin/* endpoints returns HTTP 401."""
        self.client.credentials()  # No credentials
        res = self.client.get('/api/admin/overview/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_normal_user_denied_admin_access_with_403(self):
        """Regular typist account receives HTTP 403 Forbidden on /api/admin/*."""
        self.client.force_authenticate(user=self.student)
        res = self.client.get('/api/admin/overview/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_protected_against_destructive_actions(self):
        """Owner account cannot be suspended, banned, or demoted even via admin actions."""
        self.client.force_authenticate(user=self.owner)

        # Attempt to suspend
        res_suspend = self.client.post(f'/api/admin/users/{self.owner.id}/action/', {
            'action': 'SUSPEND',
            'reason': 'Hostile takeover attempt',
        }, format='json')
        self.assertEqual(res_suspend.status_code, status.HTTP_400_BAD_REQUEST)

        # Attempt to demote
        res_demote = self.client.post(f'/api/admin/users/{self.owner.id}/action/', {
            'action': 'UPDATE_ROLE',
            'role': ROLE_USER,
        }, format='json')
        self.assertEqual(res_demote.status_code, status.HTTP_400_BAD_REQUEST)

        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, ROLE_SUPER_ADMIN)
        self.assertEqual(self.owner.status, STATUS_ACTIVE)

    def test_secondary_account_isolation_and_admin_denial(self):
        """Secondary user muhammedsinankp2005@gmail.com is strictly role USER and denied admin access."""
        secondary_user = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinan_sec',
            password='TestPassword123!',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_USER,
        )
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Check me
        res_me = self.client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['email'], 'muhammedsinankp2005@gmail.com')
        self.assertEqual(res_me.data['role'], ROLE_USER)
        self.assertFalse(res_me.data['is_super_admin'])
        self.assertFalse(res_me.data['is_owner'])

        # Check admin rejection
        res_admin = self.client.get('/api/admin/overview/')
        self.assertEqual(res_admin.status_code, status.HTTP_403_FORBIDDEN)
        res_status = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res_status.status_code, status.HTTP_403_FORBIDDEN)
