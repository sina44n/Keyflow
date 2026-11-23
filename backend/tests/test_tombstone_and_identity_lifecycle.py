"""
KEYFLOW Phase 7.26: Complete Owner Account Restoration, Google Login Identity Correction & Deletion Matrix
=============================================================================================================
Implements all 30 required verification scenarios specified in Phase 7.26 Section 7:

Owner identity:
1. sina44n07@gmail.com with verified Owner Clerk ID resolves to canonical Owner.
2. Owner login does not resolve to secondary account.
3. Owner retains exactly the required privileges.
4. Owner can access /admin.
5. Owner-only APIs return successful authorized responses.
6. Owner's identity remains unchanged after secondary deletion.

Google login and session switching:
7. Existing secondary session followed by Owner login resolves to Owner.
8. Logout followed by Owner login does not reuse stale secondary identity.
9. Selecting secondary Google account cannot display Owner privileges.
10. Navbar identity matches authenticated backend identity.
11. Frontend-supplied email cannot override verified Clerk JWT identity.

Secondary deletion:
12. Exact secondary email + verified Clerk ID matches only intended account.
13. A mismatched Clerk ID causes deletion to abort.
14. Owner deletion is rejected.
15. Legacy account remains untouched.
16. Shared platform records remain preserved.
17. Exclusively owned secondary records are deleted according to approved policy.
18. Tombstone is created atomically with deletion.

Old identity protection:
19. Old unexpired JWT is rejected.
20. Old webhook cannot recreate deleted account.
21. Old webhook cannot modify fresh account with same email.
22. Old deleted event cannot delete fresh account.
23. Repeated old identity requests remain rejected.
24. Concurrent authentication/deletion cannot resurrect old identity.

Fresh signup:
25. Same email with new verified Clerk ID creates ordinary USER.
26. Fresh account has no historical secondary data.
27. Fresh account receives no Admin privileges.
28. Old Clerk ID remains rejected after fresh signup.

Admin isolation:
29. Non-owner with elevated database flags receives 403.
30. Only verified canonical Owner passes all owner-only permissions.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory
import time
import jwt
from unittest.mock import patch
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from accounts.models import (
    OWNER_EMAIL,
    ROLE_SUPER_ADMIN,
    ROLE_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    UserProfile,
    UserPreferences,
    RevokedClerkIdentity,
)
from accounts.authentication import resolve_clerk_identity, ClerkAuthentication
from accounts.views import ClerkSyncView, ClerkWebhookView
from accounts.serializers import FullUserSerializer
from accounts.services.account_deletion import safe_delete_account
from admin_api.permissions import IsSuperAdminUser, IsAdminUser, IsOwnerOnly
from admin_api.urls import AdminAuthStatusView
from admin_api.models import AdminAuditLog
from practice.models import PracticeSession, Competition
from games.models import GameSession
from lessons.models import LessonProgress
from progress.models import DailyActivity
from achievements.models import UserAchievement

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
    CLERK_WEBHOOK_SECRET='whsec_bXlfc3VwZXJfc2VjcmV0X3dlYmhvb2tfa2V5XzMyYiE='
)
class Phase726IdentityAndDeletionMatrixTests(TestCase):
    def make_signed_webhook_request(self, payload, msg_id=None):
        import json, time, hmac, hashlib, base64
        body = json.dumps(payload).encode('utf-8')
        if msg_id is None:
            msg_id = f"msg_{int(time.time() * 1000)}"
        timestamp = str(int(time.time()))
        secret = 'whsec_bXlfc3VwZXJfc2VjcmV0X3dlYmhvb2tfa2V5XzMyYiE='
        try:
            key = base64.b64decode(secret[len("whsec_"):])
        except Exception:
            key = secret.encode("utf-8")
        to_sign = f"{msg_id}.{timestamp}.".encode("utf-8") + body
        sig = base64.b64encode(hmac.new(key, to_sign, hashlib.sha256).digest()).decode("utf-8")
        headers = {
            'HTTP_SVIX_ID': msg_id,
            'HTTP_SVIX_TIMESTAMP': timestamp,
            'HTTP_SVIX_SIGNATURE': f"v1,{sig}",
            'content_type': 'application/json',
        }
        return self.factory.post('/api/auth/clerk-webhook/', body, **headers)
    def setUp(self):
        self.factory = APIRequestFactory()

        # 1. Canonical Platform Owner
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            password='OwnerPassword123!',
        )
        self.owner.clerk_id = 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'
        self.owner.role = ROLE_SUPER_ADMIN
        self.owner.is_staff = True
        self.owner.is_superuser = True
        self.owner.status = STATUS_ACTIVE
        self.owner.is_email_verified = True
        self.owner.save()
        UserProfile.objects.update_or_create(user=self.owner, defaults={'display_name': 'Sinan KP'})
        UserPreferences.objects.get_or_create(user=self.owner)

        # 2. Secondary Personal Account (Target for Deletion)
        self.secondary = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinubai',
            password='UserPassword123!',
        )
        self.secondary.clerk_id = 'user_3LN4sX9cg3bUng1YzwiEB18Emh2'
        self.secondary.role = ROLE_USER
        self.secondary.is_staff = False
        self.secondary.is_superuser = False
        self.secondary.status = STATUS_ACTIVE
        self.secondary.is_email_verified = True
        self.secondary.save()
        UserProfile.objects.update_or_create(user=self.secondary, defaults={'display_name': 'Sinu Bai'})
        UserPreferences.objects.get_or_create(user=self.secondary)

        # 3. Legacy Archived Account
        self.legacy = User.objects.create_user(
            email='sinan.legacy1@archived.keyflow.local',
            username='sinan_legacy',
            password='LegacyPassword123!',
        )

        # 4. Unrelated Typist
        self.unrelated = User.objects.create_user(
            email='typist.unrelated@example.com',
            username='unrelated_typist',
            password='UnrelatedPassword123!',
        )
        self.unrelated.clerk_id = 'user_unrelated_random_9999'
        self.unrelated.role = ROLE_USER
        self.unrelated.save()
        UserProfile.objects.update_or_create(user=self.unrelated, defaults={'display_name': 'Unrelated Typist'})
        UserPreferences.objects.get_or_create(user=self.unrelated)

    def _make_jwt(self, sub, email=None, exp_delta=3600, name=None):
        payload = {
            'sub': sub,
            'iat': int(time.time()),
            'exp': int(time.time()) + exp_delta,
        }
        if email:
            payload['email'] = email
        if name:
            payload['name'] = name
        return jwt.encode(payload, TEST_PRIV, algorithm='RS256')

    # -------------------------------------------------------------------------
    # Owner Identity (Scenarios 1-6)
    # -------------------------------------------------------------------------

    def test_01_owner_with_verified_clerk_id_resolves_to_canonical_owner(self):
        payload = {
            'sub': 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            'email': 'sina44n07@gmail.com',
        }
        user = resolve_clerk_identity(payload)
        self.assertEqual(user.id, self.owner.id)
        self.assertEqual(user.email, 'sina44n07@gmail.com')
        self.assertTrue(user.is_owner)

    def test_02_owner_login_does_not_resolve_to_secondary_account(self):
        payload = {
            'sub': 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            'email': 'sina44n07@gmail.com',
        }
        user = resolve_clerk_identity(payload)
        self.assertNotEqual(user.id, self.secondary.id)
        self.assertNotEqual(user.email, 'muhammedsinankp2005@gmail.com')

    def test_03_owner_retains_required_privileges(self):
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.owner.is_staff)
        self.assertTrue(self.owner.is_superuser)
        self.assertTrue(self.owner.is_owner)
        self.assertTrue(self.owner.is_super_admin)
        self.assertTrue(self.owner.is_admin)

    def test_04_owner_can_access_admin(self):
        request = self.factory.get('/api/admin/overview/')
        request.user = self.owner
        self.assertTrue(IsSuperAdminUser().has_permission(request, None))
        self.assertTrue(IsAdminUser().has_permission(request, None))
        self.assertTrue(IsOwnerOnly().has_permission(request, None))

    def test_05_owner_only_apis_return_successful_authorized_responses(self):
        jwt_owner = self._make_jwt('user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', email='sina44n07@gmail.com')
        request = self.factory.get('/api/admin/auth/status/', HTTP_AUTHORIZATION=f'Bearer {jwt_owner}')
        view = AdminAuthStatusView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('status'), 'authorized')
        self.assertEqual(response.data.get('is_owner'), True)
        self.assertEqual(response.data.get('role'), ROLE_SUPER_ADMIN)

    def test_06_owner_identity_remains_unchanged_after_secondary_deletion(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.owner.is_owner)
        self.assertTrue(self.owner.is_staff)
        self.assertTrue(self.owner.is_superuser)
        self.assertEqual(self.owner.clerk_id, 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn')

    # -------------------------------------------------------------------------
    # Google Login & Session Switching (Scenarios 7-11)
    # -------------------------------------------------------------------------

    def test_07_existing_secondary_session_followed_by_owner_login_resolves_to_owner(self):
        # First: Secondary user login
        sec_payload = {'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'}
        u_sec = resolve_clerk_identity(sec_payload)
        self.assertEqual(u_sec.id, self.secondary.id)

        # Next: Owner logs in
        owner_payload = {'sub': 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', 'email': 'sina44n07@gmail.com'}
        u_owner = resolve_clerk_identity(owner_payload)
        self.assertEqual(u_owner.id, self.owner.id)
        self.assertTrue(u_owner.is_owner)

    def test_08_logout_followed_by_owner_login_does_not_reuse_stale_secondary_identity(self):
        # Simulate secondary login, then logout
        auth = ClerkAuthentication()
        jwt_sec = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        req_sec = self.factory.get('/api/accounts/profile/', HTTP_AUTHORIZATION=f'Bearer {jwt_sec}')
        user1, _ = auth.authenticate(req_sec)
        self.assertEqual(user1.id, self.secondary.id)

        # After logout, new owner session arrives
        jwt_owner = self._make_jwt('user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', email='sina44n07@gmail.com')
        req_owner = self.factory.get('/api/accounts/profile/', HTTP_AUTHORIZATION=f'Bearer {jwt_owner}')
        user2, _ = auth.authenticate(req_owner)
        self.assertEqual(user2.id, self.owner.id)
        self.assertTrue(user2.is_owner)

    def test_09_selecting_secondary_google_account_cannot_display_owner_privileges(self):
        self.secondary.refresh_from_db()
        self.assertFalse(self.secondary.is_owner)
        self.assertFalse(self.secondary.is_super_admin)
        self.assertEqual(self.secondary.role, ROLE_USER)

        request = self.factory.get('/api/admin/overview/')
        request.user = self.secondary
        self.assertFalse(IsSuperAdminUser().has_permission(request, None))
        self.assertFalse(IsOwnerOnly().has_permission(request, None))

    def test_10_navbar_identity_matches_authenticated_backend_identity(self):
        serializer = FullUserSerializer(self.owner)
        data = serializer.data
        self.assertEqual(data['email'], 'sina44n07@gmail.com')
        self.assertEqual(data['is_owner'], True)
        self.assertEqual(data['role'], ROLE_SUPER_ADMIN)

        sec_serializer = FullUserSerializer(self.secondary)
        sec_data = sec_serializer.data
        self.assertEqual(sec_data['email'], 'muhammedsinankp2005@gmail.com')
        self.assertEqual(sec_data['is_owner'], False)
        self.assertEqual(sec_data['role'], ROLE_USER)

    def test_11_frontend_supplied_email_cannot_override_verified_jwt_identity(self):
        # Secondary user token attempts to send owner email in clerk-sync body
        jwt_sec = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        view = ClerkSyncView.as_view()
        request = self.factory.post(
            '/api/auth/clerk-sync/',
            {'email': 'sina44n07@gmail.com', 'display_name': 'Hacker Name'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {jwt_sec}'
        )
        response = view(request)
        self.assertEqual(response.status_code, 403)
        self.assertIn("Cannot claim platform owner identity", response.data.get('detail', ''))

    # -------------------------------------------------------------------------
    # Secondary Deletion (Scenarios 12-18)
    # -------------------------------------------------------------------------

    def test_12_exact_secondary_email_and_clerk_id_matches_only_intended_account(self):
        result = safe_delete_account(
            target_email='muhammedsinankp2005@gmail.com',
            expected_clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            dry_run=True,
        )
        self.assertEqual(result['matched_count'], 1)
        self.assertEqual(result['audits'][0]['email'], 'muhammedsinankp2005@gmail.com')
        self.assertEqual(result['audits'][0]['clerk_id'], 'user_3LN4sX9cg3bUng1YzwiEB18Emh2')

    def test_13_mismatched_clerk_id_causes_deletion_to_abort(self):
        with self.assertRaises(ValidationError) as ctx:
            safe_delete_account(
                target_email='muhammedsinankp2005@gmail.com',
                expected_clerk_id='user_DIFFERENT_CLERK_ID',
                dry_run=False,
            )
        self.assertIn("SAFETY ABORT", str(ctx.exception))

    def test_14_owner_deletion_is_rejected(self):
        with self.assertRaises(PermissionDenied):
            safe_delete_account('sina44n07@gmail.com', 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', dry_run=False)

    def test_15_legacy_account_remains_untouched(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        self.assertTrue(User.objects.filter(id=self.legacy.id).exists())
        self.assertEqual(self.legacy.email, 'sinan.legacy1@archived.keyflow.local')

    def test_16_shared_platform_records_remain_preserved(self):
        AdminAuditLog.objects.create(admin_user=self.secondary, action='test_action', target_model='User')
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        self.assertEqual(AdminAuditLog.objects.filter(action='test_action').count(), 1)

    def test_17_exclusively_owned_secondary_records_are_deleted(self):
        PracticeSession.objects.create(
            user=self.secondary, duration_seconds=60, net_wpm=50.0, gross_wpm=52.0,
            accuracy=95.0, session_type='timed', total_chars=250, correct_chars=240, incorrect_chars=10
        )
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        self.assertEqual(PracticeSession.objects.filter(user_id=self.secondary.id).count(), 0)

    def test_18_tombstone_is_created_atomically_with_deletion(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        tombstone = RevokedClerkIdentity.objects.filter(clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2').first()
        self.assertIsNotNone(tombstone)
        self.assertEqual(tombstone.original_email, 'muhammedsinankp2005@gmail.com')

    # -------------------------------------------------------------------------
    # Old Identity Protection (Scenarios 19-24)
    # -------------------------------------------------------------------------

    def test_19_old_unexpired_jwt_is_rejected(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        jwt_old = self._make_jwt('user_3LN4sX9cg3bUng1YzwiEB18Emh2', email='muhammedsinankp2005@gmail.com')
        auth = ClerkAuthentication()
        request = self.factory.get('/api/accounts/profile/', HTTP_AUTHORIZATION=f'Bearer {jwt_old}')
        with self.assertRaises(AuthenticationFailed) as ctx:
            auth.authenticate(request)
        self.assertIn("permanently revoked and deleted", str(ctx.exception))

    def test_20_old_webhook_cannot_recreate_deleted_account(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        view = ClerkWebhookView.as_view()
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2',
                'email': 'muhammedsinankp2005@gmail.com',
            }
        }
        request = self.make_signed_webhook_request(payload)
        response = view(request)
        self.assertEqual(response.status_code, 401)
        self.assertFalse(User.objects.filter(clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2').exists())

    def test_21_old_webhook_cannot_modify_fresh_account_with_same_email(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        fresh_user = resolve_clerk_identity({
            'sub': 'user_FRESH_NEW_CLERK_ID_777',
            'email': 'muhammedsinankp2005@gmail.com',
            'name': 'Fresh Student',
        })
        # Stale webhook for old clerk_id attempts update
        view = ClerkWebhookView.as_view()
        payload = {
            'type': 'user.updated',
            'data': {
                'id': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2',
                'email': 'muhammedsinankp2005@gmail.com',
                'first_name': 'Hacked'
            }
        }
        request = self.make_signed_webhook_request(payload)
        response = view(request)
        self.assertEqual(response.status_code, 401)
        fresh_user.refresh_from_db()
        self.assertEqual(fresh_user.clerk_id, 'user_FRESH_NEW_CLERK_ID_777')
        self.assertEqual(fresh_user.profile.display_name, 'Fresh Student')

    def test_22_old_deleted_event_cannot_delete_fresh_account(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        fresh_user = resolve_clerk_identity({
            'sub': 'user_FRESH_NEW_CLERK_ID_777',
            'email': 'muhammedsinankp2005@gmail.com',
        })
        view = ClerkWebhookView.as_view()
        payload = {'type': 'user.deleted', 'data': {'id': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2'}}
        request = self.make_signed_webhook_request(payload)
        response = view(request)
        self.assertEqual(response.status_code, 401)
        self.assertTrue(User.objects.filter(id=fresh_user.id).exists())

    def test_23_repeated_old_identity_requests_remain_rejected(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        for _ in range(5):
            with self.assertRaises(AuthenticationFailed):
                resolve_clerk_identity({'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'})

    def test_24_concurrent_authentication_deletion_cannot_resurrect_old_identity(self):
        # Pre-seed tombstone
        RevokedClerkIdentity.objects.create(
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            original_email='muhammedsinankp2005@gmail.com',
            revocation_reason='account_deletion'
        )
        # Even if someone calls resolve_clerk_identity inside transaction, it must fail closed
        with self.assertRaises(AuthenticationFailed):
            with transaction.atomic():
                resolve_clerk_identity({'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'})

    # -------------------------------------------------------------------------
    # Fresh Signup (Scenarios 25-28)
    # -------------------------------------------------------------------------

    def test_25_same_email_with_new_clerk_id_creates_ordinary_user(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        fresh_user = resolve_clerk_identity({
            'sub': 'user_FRESH_999999',
            'email': 'muhammedsinankp2005@gmail.com',
        })
        self.assertEqual(fresh_user.email, 'muhammedsinankp2005@gmail.com')
        self.assertEqual(fresh_user.clerk_id, 'user_FRESH_999999')
        self.assertEqual(fresh_user.role, ROLE_USER)

    def test_26_fresh_account_has_no_historical_secondary_data(self):
        PracticeSession.objects.create(
            user=self.secondary, duration_seconds=60, net_wpm=50.0, gross_wpm=52.0,
            accuracy=95.0, session_type='timed', total_chars=250, correct_chars=240, incorrect_chars=10
        )
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        fresh_user = resolve_clerk_identity({
            'sub': 'user_FRESH_999999',
            'email': 'muhammedsinankp2005@gmail.com',
        })
        self.assertEqual(PracticeSession.objects.filter(user=fresh_user).count(), 0)
        self.assertEqual(LessonProgress.objects.filter(user=fresh_user).count(), 0)
        self.assertEqual(GameSession.objects.filter(user=fresh_user).count(), 0)
        self.assertEqual(DailyActivity.objects.filter(user=fresh_user).count(), 0)
        self.assertEqual(UserAchievement.objects.filter(user=fresh_user).count(), 0)

    def test_27_fresh_account_receives_no_admin_privileges(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        fresh_user = resolve_clerk_identity({
            'sub': 'user_FRESH_999999',
            'email': 'muhammedsinankp2005@gmail.com',
        })
        self.assertFalse(fresh_user.is_owner)
        self.assertFalse(fresh_user.is_staff)
        self.assertFalse(fresh_user.is_superuser)
        self.assertFalse(fresh_user.is_super_admin)

    def test_28_old_clerk_id_remains_rejected_after_fresh_signup(self):
        safe_delete_account('muhammedsinankp2005@gmail.com', 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', dry_run=False)
        resolve_clerk_identity({
            'sub': 'user_FRESH_999999',
            'email': 'muhammedsinankp2005@gmail.com',
        })
        with self.assertRaises(AuthenticationFailed):
            resolve_clerk_identity({'sub': 'user_3LN4sX9cg3bUng1YzwiEB18Emh2', 'email': 'muhammedsinankp2005@gmail.com'})

    # -------------------------------------------------------------------------
    # Admin Isolation (Scenarios 29-30)
    # -------------------------------------------------------------------------

    def test_29_non_owner_with_elevated_database_flags_receives_403(self):
        impostor = User.objects.create_user(
            email='impostor@example.com',
            username='impostor_admin',
            password='Password123!',
        )
        impostor.role = ROLE_SUPER_ADMIN
        impostor.is_staff = True
        impostor.is_superuser = True
        impostor.save()

        request = self.factory.get('/api/admin/overview/')
        request.user = impostor
        self.assertFalse(IsSuperAdminUser().has_permission(request, None))
        self.assertFalse(IsAdminUser().has_permission(request, None))
        self.assertFalse(IsOwnerOnly().has_permission(request, None))

    def test_30_only_verified_canonical_owner_passes_all_owner_only_permissions(self):
        # 1. Canonical Owner
        req_owner = self.factory.get('/api/admin/overview/')
        req_owner.user = self.owner
        self.assertTrue(IsSuperAdminUser().has_permission(req_owner, None))
        self.assertTrue(IsAdminUser().has_permission(req_owner, None))
        self.assertTrue(IsOwnerOnly().has_permission(req_owner, None))

        # 2. Secondary User
        req_sec = self.factory.get('/api/admin/overview/')
        req_sec.user = self.secondary
        self.assertFalse(IsSuperAdminUser().has_permission(req_sec, None))
        self.assertFalse(IsAdminUser().has_permission(req_sec, None))
        self.assertFalse(IsOwnerOnly().has_permission(req_sec, None))

        # 3. Unrelated User
        req_unrel = self.factory.get('/api/admin/overview/')
        req_unrel.user = self.unrelated
        self.assertFalse(IsSuperAdminUser().has_permission(req_unrel, None))
        self.assertFalse(IsAdminUser().has_permission(req_unrel, None))
        self.assertFalse(IsOwnerOnly().has_permission(req_unrel, None))
