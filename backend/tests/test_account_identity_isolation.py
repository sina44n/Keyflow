"""
Test Suite: KEYFLOW Phase 7.12 — Account Identity Isolation & Admin Privilege Security
====================================================================================
Verifies:
1. Secondary Account Isolation:
   - muhammedsinankp2005@gmail.com resolves to its intended Django user.
   - Secondary Clerk ID never resolves to Owner Django user.
   - Secondary account receives role = USER.
   - is_staff and is_superuser remain False.
   - Secondary account is strictly denied HTTP 403 on Super Admin APIs.
   - Secondary account is strictly denied HTTP 403 on Owner-only APIs.
   - Repeated Clerk sync is idempotent and preserves identity.
   - Email fallback cannot silently link a conflicting Clerk identity.
   - Forged frontend role fields are completely ignored.
2. Platform Owner Integrity:
   - sina44n07@gmail.com resolves to verified Owner identity.
   - Existing Owner permissions remain functional.
   - Existing Clerk ID remains unchanged.
   - Retains access to legitimate Owner-only endpoints.
3. Identity Collision & Takeover Defense:
   - Two distinct Clerk IDs cannot silently map to the same Django identity.
   - Clerk ID cannot be transferred without explicit validated resolution.
   - Placeholder email collisions do not cause account takeover.
   - Duplicate sync requests remain safe and idempotent.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
import time
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from accounts.models import (
    OWNER_EMAIL,
    ROLE_SUPER_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    UserProfile,
    UserPreferences,
)
from accounts.authentication import resolve_clerk_identity
from accounts.views import ClerkSyncView

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
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
)
class AccountIdentityIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Canonical Owner Account (User ID 3 equivalent)
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            password='TestPassword123!',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
        )
        self.owner.role = ROLE_SUPER_ADMIN
        self.owner.is_staff = True
        self.owner.is_superuser = True
        self.owner.save()
        UserProfile.objects.get_or_create(user=self.owner, defaults={'display_name': 'Owner Sinan'})

        # 2. Canonical Secondary User (User ID 1 / User ID 14 equivalent)
        self.secondary = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinan_sec',
            password='TestPassword123!',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_USER,
        )
        self.secondary.is_staff = False
        self.secondary.is_superuser = False
        self.secondary.save()
        UserProfile.objects.get_or_create(user=self.secondary, defaults={'display_name': 'Muhammed Sinan'})

    def _make_jwt(self, sub, email=None):
        payload = {
            'sub': sub,
            'exp': int(time.time()) + 3600,
            'iat': int(time.time()),
        }
        if email:
            payload['email'] = email
        return jwt.encode(payload, TEST_PRIV, algorithm='RS256')

    # -------------------------------------------------------------------------
    # 1. Secondary Account Isolation Tests
    # -------------------------------------------------------------------------

    def test_01_secondary_account_resolves_to_intended_user(self):
        """Secondary Clerk ID must resolve to the secondary Django user, never the Owner."""
        payload = {'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'}
        resolved_user = resolve_clerk_identity(payload)
        self.assertEqual(resolved_user.id, self.secondary.id)
        self.assertNotEqual(resolved_user.id, self.owner.id)
        self.assertEqual(resolved_user.email, 'muhammedsinankp2005@gmail.com')

    def test_02_secondary_account_strictly_role_user(self):
        """Secondary account must strictly retain role USER with false staff/superuser flags."""
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_me = self.client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['role'], ROLE_USER)
        self.assertFalse(res_me.data['is_staff'])
        self.assertFalse(res_me.data['is_superuser'])
        self.assertFalse(res_me.data['is_super_admin'])
        self.assertFalse(res_me.data['is_admin'])
        self.assertFalse(res_me.data['is_owner'])

    def test_03_secondary_account_denied_super_admin_endpoints(self):
        """Secondary account receives HTTP 403 when requesting Super Admin endpoints."""
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_overview = self.client.get('/api/admin/overview/')
        self.assertEqual(res_overview.status_code, status.HTTP_403_FORBIDDEN)

        res_auth_status = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res_auth_status.status_code, status.HTTP_403_FORBIDDEN)

        res_users = self.client.get('/api/admin/users/')
        self.assertEqual(res_users.status_code, status.HTTP_403_FORBIDDEN)

    def test_04_secondary_account_denied_owner_only_endpoints(self):
        """Secondary account cannot access owner-only administrative endpoints."""
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Attempt to patch platform settings (Owner permission required)
        res_settings = self.client.patch('/api/admin/settings/', {'maintenance_mode': True}, format='json')
        self.assertEqual(res_settings.status_code, status.HTTP_403_FORBIDDEN)

    def test_05_repeated_clerk_sync_is_idempotent_and_preserves_role(self):
        """Repeated sync requests by secondary user preserve role = USER and do not mutate ID."""
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        for _ in range(3):
            res_sync = self.client.post('/api/auth/clerk-sync/', {
                'email': 'muhammedsinankp2005@gmail.com',
                'display_name': 'Muhammed Sinan',
            }, format='json')
            self.assertEqual(res_sync.status_code, status.HTTP_200_OK)
            self.assertEqual(res_sync.data['user']['id'], self.secondary.id)
            self.assertEqual(res_sync.data['user']['role'], ROLE_USER)
            self.assertFalse(res_sync.data['user']['is_super_admin'])
            self.assertFalse(res_sync.data['user']['is_staff'])

    def test_06_forged_frontend_role_fields_strictly_ignored(self):
        """Client-supplied role or superuser values in sync and profile patch are rejected/ignored."""
        token = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 1. In clerk-sync
        res_sync = self.client.post('/api/auth/clerk-sync/', {
            'role': 'SUPER_ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'is_super_admin': True,
            'is_owner': True,
        }, format='json')
        self.assertEqual(res_sync.status_code, status.HTTP_200_OK)
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_USER)
        self.assertFalse(self.secondary.is_staff)
        self.assertFalse(self.secondary.is_superuser)

        # 2. In /api/auth/me/ PATCH
        res_patch = self.client.patch('/api/auth/me/', {
            'role': 'SUPER_ADMIN',
            'is_staff': True,
            'is_superuser': True,
        }, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_USER)
        self.assertFalse(self.secondary.is_staff)
        self.assertFalse(self.secondary.is_superuser)

    # -------------------------------------------------------------------------
    # 2. Owner Account Tests
    # -------------------------------------------------------------------------

    def test_07_owner_resolves_to_verified_owner_identity(self):
        """Owner token maps to Owner Django user with SUPER_ADMIN privileges."""
        token = self._make_jwt('user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', email='sina44n07@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_me = self.client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['id'], self.owner.id)
        self.assertEqual(res_me.data['email'], 'sina44n07@gmail.com')
        self.assertEqual(res_me.data['role'], ROLE_SUPER_ADMIN)
        self.assertTrue(res_me.data['is_staff'])
        self.assertTrue(res_me.data['is_superuser'])
        self.assertTrue(res_me.data['is_super_admin'])
        self.assertTrue(res_me.data['is_owner'])

    def test_08_owner_authorized_on_super_admin_endpoints(self):
        """Owner is granted authorized status and access on all administrative endpoints."""
        token = self._make_jwt('user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', email='sina44n07@gmail.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_auth = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(res_auth.data['status'], 'authorized')
        self.assertTrue(res_auth.data['is_owner'])
        self.assertTrue(res_auth.data['is_super_admin'])

        res_overview = self.client.get('/api/admin/overview/')
        self.assertEqual(res_overview.status_code, status.HTTP_200_OK)

    def test_09_unverified_user_cannot_claim_owner_email_in_sync(self):
        """Non-owner user attempting to claim owner email in sync request is rejected with HTTP 403."""
        token = self._make_jwt('user_unauthorized_attacker', email='attacker@example.com')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_fake_claim = self.client.post('/api/auth/clerk-sync/', {
            'email': 'sina44n07@gmail.com',
        }, format='json')
        self.assertEqual(res_fake_claim.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission denied', res_fake_claim.data.get('detail', ''))

    # -------------------------------------------------------------------------
    # 3. Identity Collision & Takeover Defense Tests
    # -------------------------------------------------------------------------

    def test_10_distinct_clerk_id_cannot_hijack_existing_bound_user(self):
        """When an incoming JWT claims an email already bound to a different Clerk ID, reject with AuthenticationFailed."""
        # secondary is bound to user_3LN4sX9cg3bUng1YzwiEB18Emh2.
        # A new token arrives with sub user_intruder claiming secondary's email.
        payload = {
            'sub': 'user_intruder_999',
            'email': 'muhammedsinankp2005@gmail.com',
        }
        with self.assertRaises(AuthenticationFailed) as ctx:
            resolve_clerk_identity(payload)
        self.assertIn("already bound to a different authentication identity", str(ctx.exception))

        # Verify secondary's clerk_id was NOT modified
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.clerk_id, 'user_3LN4sX9cg3bUng1YzwiEB18Emh2')

    def test_11_placeholder_email_collision_in_sync_does_not_hijack_account(self):
        """A user with a placeholder email cannot hijack an existing user via sync email payload."""
        # Create a placeholder user
        placeholder_user = User.objects.create_user(
            email='user_newbie_123@clerk.keyflow.local',
            username='user_newbie',
            password='TestPassword123!',
            clerk_id='user_newbie_123',
            role=ROLE_USER,
        )

        token = self._make_jwt('user_newbie_123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Attempt to claim secondary's email
        res_sync = self.client.post('/api/auth/clerk-sync/', {
            'email': 'muhammedsinankp2005@gmail.com',
        }, format='json')
        self.assertEqual(res_sync.status_code, status.HTTP_200_OK)

        # Verify secondary account was not hijacked or modified
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.clerk_id, 'user_3LN4sX9cg3bUng1YzwiEB18Emh2')

        # Verify placeholder user did NOT steal secondary's email
        placeholder_user.refresh_from_db()
        self.assertEqual(placeholder_user.clerk_id, 'user_newbie_123')
        self.assertEqual(placeholder_user.email, 'user_newbie_123@clerk.keyflow.local')

    def test_12_non_owner_new_user_creation_defaults_to_role_user(self):
        """New users created via resolve_clerk_identity default to role USER with false staff/superuser flags."""
        payload = {
            'sub': 'user_fresh_new_student',
            'email': 'fresh_student@example.com',
            'name': 'Fresh Student',
        }
        user = resolve_clerk_identity(payload)
        self.assertEqual(user.role, ROLE_USER)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_super_admin)
        self.assertFalse(user.is_owner)

    def test_13_non_owner_accidental_superadmin_demoted_on_login(self):
        """A non-owner account holding accidental administrative flags is automatically demoted on login."""
        self.secondary.role = ROLE_SUPER_ADMIN
        self.secondary.is_staff = True
        self.secondary.is_superuser = True
        self.secondary.save()

        payload = {'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'}
        user = resolve_clerk_identity(payload)
        self.assertEqual(user.role, ROLE_USER)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_super_admin)
        self.assertFalse(user.is_owner)

    def test_14_unauthorized_clerk_id_claiming_owner_email_fails_closed(self):
        """A non-owner Clerk ID attempting to claim the Owner email fails closed."""
        payload = {'sub': 'user_impostor_999', 'email': 'sina44n07@gmail.com'}
        with self.assertRaises(AuthenticationFailed):
            resolve_clerk_identity(payload)

    def test_15_owner_is_owner_property_strictly_enforced(self):
        """is_owner requires BOTH verified owner email and verified owner Clerk ID."""
        # Genuine owner
        self.assertTrue(self.owner.is_owner)
        self.assertTrue(self.owner.is_super_admin)

        # Mismatched Clerk ID
        fake_owner = User(
            email='sina44n07@gmail.com',
            username='fake_owner',
            clerk_id='user_fake_clerk_id',
        )
        self.assertFalse(fake_owner.is_owner)
        self.assertFalse(fake_owner.is_super_admin)

        # Mismatched Email
        fake_owner_2 = User(
            email='intruder@gmail.com',
            username='fake_owner_2',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
        )
        self.assertFalse(fake_owner_2.is_owner)
        self.assertFalse(fake_owner_2.is_super_admin)
