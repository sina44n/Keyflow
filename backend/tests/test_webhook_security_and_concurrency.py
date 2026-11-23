"""
KEYFLOW Phase 7.27: Webhook Security, Deletion Safeguards & Concurrency Test Suite
===================================================================================
Covers:
1. Svix HMAC-SHA256 signature verification (valid, invalid, missing headers, missing secret fail-closed).
2. Timestamp replay tolerance window (300 seconds).
3. Webhook idempotency and deduplication via svix-id.
4. Tombstone rejection and Owner immunity in webhook handler.
5. Management command CLI argument parsing (--dry-run, --confirm, safety matching).
6. Archived legacy account protection.
7. Concurrency scenarios A through F (race conditions between auth, deletion, and webhooks).
"""

import json
import time
import hmac
import hashlib
import base64
import threading
from django.test import TestCase, TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.cache import cache
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import (
    OWNER_EMAIL,
    ROLE_SUPER_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    UserProfile,
    UserPreferences,
    RevokedClerkIdentity,
)
from accounts.views import ClerkWebhookView
from accounts.authentication import resolve_clerk_identity
from accounts.services.account_deletion import safe_delete_account

User = get_user_model()

TEST_WEBHOOK_SECRET = 'whsec_bXlfc3VwZXJfc2VjcmV0X3dlYmhvb2tfa2V5XzMyYiE='
RAW_TEST_KEY = base64.b64decode('bXlfc3VwZXJfc2VjcmV0X3dlYmhvb2tfa2V5XzMyYiE=')


def build_svix_request(factory, payload, secret=TEST_WEBHOOK_SECRET, msg_id=None, timestamp=None, signature_override=None):
    body = json.dumps(payload).encode('utf-8')
    if msg_id is None:
        msg_id = f"msg_{int(time.time() * 1000)}_{id(payload)}"
    if timestamp is None:
        timestamp = str(int(time.time()))

    if signature_override is not None:
        signature = signature_override
    else:
        try:
            key = base64.b64decode(secret[len("whsec_"):]) if secret.startswith("whsec_") else secret.encode('utf-8')
        except Exception:
            key = secret.encode('utf-8')
        to_sign = f"{msg_id}.{timestamp}.".encode("utf-8") + body
        sig = base64.b64encode(hmac.new(key, to_sign, hashlib.sha256).digest()).decode("utf-8")
        signature = f"v1,{sig}"

    headers = {
        'HTTP_SVIX_ID': msg_id,
        'HTTP_SVIX_TIMESTAMP': str(timestamp),
        'HTTP_SVIX_SIGNATURE': signature,
        'content_type': 'application/json',
    }
    return factory.post('/api/auth/clerk-webhook/', body, **headers)


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
    CLERK_WEBHOOK_SECRET=TEST_WEBHOOK_SECRET,
)
class ClerkWebhookSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.view = ClerkWebhookView.as_view()

        # Seed Owner
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        UserProfile.objects.update_or_create(user=self.owner, defaults={'display_name': 'Owner'})

        # Seed Secondary
        self.secondary = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinubai',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_USER,
            is_staff=False,
            is_superuser=False,
        )
        UserProfile.objects.update_or_create(user=self.secondary, defaults={'display_name': 'Secondary'})

    # 1. Valid Svix signature -> 200 OK
    def test_webhook_valid_signature_success(self):
        payload = {
            'type': 'user.updated',
            'data': {
                'id': 'user_webhook_student_1',
                'email': 'student1@example.com',
                'first_name': 'Student One',
            }
        }
        request = build_svix_request(self.factory, payload)
        response = self.view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('status'), 'processed')

    # 2. Invalid Svix signature -> 401 Unauthorized
    def test_webhook_invalid_signature_rejected(self):
        payload = {'type': 'user.created', 'data': {'id': 'user_hacker_123', 'email': 'hacker@example.com'}}
        request = build_svix_request(self.factory, payload, signature_override='v1,fake_invalid_signature_xyz=')
        response = self.view(request)
        self.assertEqual(response.status_code, 401)
        self.assertIn('Invalid webhook signature', response.data.get('error', ''))

    # 3. Missing Svix headers -> 400 Bad Request
    def test_webhook_missing_headers_rejected(self):
        payload = {'type': 'user.created', 'data': {'id': 'user_test_missing_hdr'}}
        body = json.dumps(payload).encode('utf-8')
        request = self.factory.post('/api/auth/clerk-webhook/', body, content_type='application/json')
        response = self.view(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing required svix webhook headers', response.data.get('error', ''))

    # 4. Missing secret -> 500 fail-closed
    @override_settings(CLERK_WEBHOOK_SECRET='')
    def test_webhook_missing_secret_fails_closed(self):
        payload = {'type': 'user.created', 'data': {'id': 'user_test_no_secret'}}
        request = build_svix_request(self.factory, payload)
        response = self.view(request)
        self.assertEqual(response.status_code, 500)
        self.assertIn('Webhook secret is not configured', response.data.get('error', ''))

    # 5. Timestamp tolerance window (replay attack protection) -> 400
    def test_webhook_timestamp_tolerance_replay_rejected(self):
        payload = {'type': 'user.created', 'data': {'id': 'user_replay_test'}}
        stale_timestamp = str(int(time.time()) - 600)  # 10 minutes in past
        request = build_svix_request(self.factory, payload, timestamp=stale_timestamp)
        response = self.view(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('outside tolerance window', response.data.get('error', ''))

    # 6. Webhook idempotency and deduplication via svix-id -> 200 duplicate_ignored
    def test_webhook_duplicate_event_idempotent(self):
        msg_id = 'msg_unique_idempotency_12345'
        payload = {'type': 'user.updated', 'data': {'id': self.secondary.clerk_id, 'first_name': 'Test'}}
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp1 = self.view(req1)
        self.assertEqual(resp1.status_code, 200)

        # Repeated delivery with exact same svix-id
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp2 = self.view(req2)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data.get('status'), 'duplicate_ignored')

    # 7. Malformed payload -> 400 Bad Request
    def test_webhook_malformed_payload_rejected(self):
        msg_id = 'msg_malformed_999'
        timestamp = str(int(time.time()))
        body = b'not_a_json_payload'
        key = RAW_TEST_KEY
        to_sign = f"{msg_id}.{timestamp}.".encode("utf-8") + body
        sig = base64.b64encode(hmac.new(key, to_sign, hashlib.sha256).digest()).decode("utf-8")
        headers = {
            'HTTP_SVIX_ID': msg_id,
            'HTTP_SVIX_TIMESTAMP': timestamp,
            'HTTP_SVIX_SIGNATURE': f"v1,{sig}",
            'content_type': 'application/json',
        }
        request = self.factory.post('/api/auth/clerk-webhook/', body, **headers)
        response = self.view(request)
        self.assertEqual(response.status_code, 400)

    # 8. Tombstone rejection -> 401 Unauthorized
    def test_webhook_tombstoned_identity_rejected(self):
        RevokedClerkIdentity.objects.create(
            clerk_id='user_tombstoned_webhook_test',
            original_email='tombstoned@example.com',
            revocation_reason='account_deletion'
        )
        payload = {'type': 'user.created', 'data': {'id': 'user_tombstoned_webhook_test', 'email': 'tombstoned@example.com'}}
        request = build_svix_request(self.factory, payload)
        response = self.view(request)
        self.assertEqual(response.status_code, 401)
        self.assertIn('permanently revoked and deleted', response.data.get('error', ''))

    # 9. Owner deletion immunity via webhook -> 403 Forbidden
    def test_webhook_owner_deletion_immunity(self):
        payload = {'type': 'user.deleted', 'data': {'id': self.owner.clerk_id}}
        request = build_svix_request(self.factory, payload)
        response = self.view(request)
        self.assertEqual(response.status_code, 403)
        self.assertIn('Cannot delete platform owner', response.data.get('error', ''))
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.is_owner)

    # 10. Non-owner claiming owner email via webhook -> 403 Forbidden
    def test_webhook_owner_impersonation_rejected(self):
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_impostor_9999',
                'email': 'sina44n07@gmail.com',
            }
        }
        request = build_svix_request(self.factory, payload)
        response = self.view(request)
        self.assertEqual(response.status_code, 403)


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
    CLERK_WEBHOOK_SECRET=TEST_WEBHOOK_SECRET,
)
class DeletionCommandAndSafeguardTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.secondary = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinubai',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_USER,
        )
        self.legacy = User.objects.create_user(
            email='sinan.legacy1@archived.keyflow.local',
            username='sinan_legacy',
        )

    # 11. Command dry run does not modify any database rows
    def test_command_dry_run_flag_preserves_data(self):
        call_command('delete_secondary_account', dry_run=True)
        self.assertTrue(User.objects.filter(id=self.secondary.id).exists())
        self.assertFalse(RevokedClerkIdentity.objects.filter(clerk_id=self.secondary.clerk_id).exists())

    # 12. Command requires email and clerk_id match
    def test_command_mismatch_aborts(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'delete_secondary_account',
                email='muhammedsinankp2005@gmail.com',
                clerk_id='user_WRONG_CLERK_ID',
                confirm=True
            )
        self.assertIn('safety check', str(ctx.exception).lower())
        self.assertTrue(User.objects.filter(id=self.secondary.id).exists())

    # 13. Service refuses deletion of owner account
    def test_service_refuses_owner_deletion(self):
        with self.assertRaises(PermissionDenied):
            safe_delete_account('sina44n07@gmail.com', 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn', dry_run=False)

    # 14. Service refuses deletion of archived legacy accounts
    def test_service_refuses_legacy_account_deletion(self):
        with self.assertRaises(PermissionDenied):
            safe_delete_account('sinan.legacy1@archived.keyflow.local', 'user_any_clerk_id', dry_run=False)


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
    CLERK_WEBHOOK_SECRET=TEST_WEBHOOK_SECRET,
)
class ConcurrencyLifecycleTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

    # A. Authentication starts before deletion
    def test_concurrency_auth_starts_before_deletion(self):
        # 1. User authenticates and exists
        user = resolve_clerk_identity({
            'sub': 'user_concurrent_test_a',
            'email': 'test_a@example.com',
            'name': 'Concurrent A',
        })
        self.assertEqual(user.clerk_id, 'user_concurrent_test_a')

        # 2. Deletion occurs
        result = safe_delete_account('test_a@example.com', 'user_concurrent_test_a', dry_run=False)
        self.assertEqual(result['status'], 'deleted')

        # 3. Post-deletion authentication must fail closed
        with self.assertRaises(AuthenticationFailed):
            resolve_clerk_identity({'sub': 'user_concurrent_test_a', 'email': 'test_a@example.com'})

    # B. Deletion starts before authentication
    def test_concurrency_deletion_starts_before_auth(self):
        # Seed user
        user = User.objects.create_user(
            email='test_b@example.com',
            username='user_b',
            clerk_id='user_concurrent_test_b',
            role=ROLE_USER,
        )
        # Deletion runs first
        safe_delete_account('test_b@example.com', 'user_concurrent_test_b', dry_run=False)

        # Subsequent auth fails immediately
        with self.assertRaises(AuthenticationFailed) as ctx:
            resolve_clerk_identity({'sub': 'user_concurrent_test_b', 'email': 'test_b@example.com'})
        self.assertIn('permanently revoked and deleted', str(ctx.exception))

    # C. Overlapping operations (threads)
    def test_concurrency_overlapping_operations(self):
        target_clerk = 'user_concurrent_test_c'
        target_email = 'test_c@example.com'
        user = User.objects.create_user(
            email=target_email,
            username='user_c',
            clerk_id=target_clerk,
            role=ROLE_USER,
        )

        auth_results = []
        del_results = []

        def run_auth():
            try:
                u = resolve_clerk_identity({'sub': target_clerk, 'email': target_email})
                auth_results.append(('success', u.id))
            except AuthenticationFailed as exc:
                auth_results.append(('rejected', str(exc)))
            except Exception as exc:
                auth_results.append(('error', str(exc)))

        def run_del():
            try:
                res = safe_delete_account(target_email, target_clerk, dry_run=False)
                del_results.append(('deleted', res['status']))
            except Exception as exc:
                del_results.append(('error', str(exc)))

        t1 = threading.Thread(target=run_auth)
        t2 = threading.Thread(target=run_del)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Tombstone must be permanently recorded
        self.assertTrue(RevokedClerkIdentity.objects.filter(clerk_id=target_clerk).exists())
        # Final state: subsequent auth MUST fail closed
        with self.assertRaises(AuthenticationFailed):
            resolve_clerk_identity({'sub': target_clerk, 'email': target_email})

    # D. Stale webhook arrives after deletion
    def test_concurrency_stale_webhook_after_deletion(self):
        target_clerk = 'user_concurrent_test_d'
        target_email = 'test_d@example.com'
        User.objects.create_user(
            email=target_email,
            username='user_d',
            clerk_id=target_clerk,
            role=ROLE_USER,
        )
        safe_delete_account(target_email, target_clerk, dry_run=False)

        # Stale webhook arrives
        view = ClerkWebhookView.as_view()
        payload = {'type': 'user.created', 'data': {'id': target_clerk, 'email': target_email}}
        req = build_svix_request(self.factory, payload)
        resp = view(req)
        self.assertEqual(resp.status_code, 401)
        self.assertFalse(User.objects.filter(clerk_id=target_clerk).exists())

    # E. Repeated authentication attempts after tombstone creation
    def test_concurrency_repeated_auth_after_tombstone(self):
        target_clerk = 'user_concurrent_test_e'
        target_email = 'test_e@example.com'
        RevokedClerkIdentity.objects.create(
            clerk_id=target_clerk,
            original_email=target_email,
            revocation_reason='account_deletion'
        )

        for _ in range(10):
            with self.assertRaises(AuthenticationFailed):
                resolve_clerk_identity({'sub': target_clerk, 'email': target_email})

    # F. Two simultaneous provisioning requests attempt to create the same Clerk identity
    def test_concurrency_simultaneous_provisioning_race(self):
        from django.db import connections
        connections.close_all()

        clerk_id = 'user_simultaneous_race_101'
        email = 'race101@example.com'

        results = []
        def provision():
            try:
                u = resolve_clerk_identity({'sub': clerk_id, 'email': email, 'name': 'Racer'})
                results.append(('ok', u.id))
            except Exception as exc:
                results.append(('error', str(exc)))
            finally:
                connections.close_all()

        t1 = threading.Thread(target=provision)
        t2 = threading.Thread(target=provision)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Both threads should succeed without IntegrityError crash, returning the same user ID
        self.assertEqual(len(results), 2)
        successes = [r for r in results if r[0] == 'ok']
        self.assertEqual(len(successes), 2)
        self.assertEqual(successes[0][1], successes[1][1])
        # Exactly one user in DB
        self.assertEqual(User.objects.filter(clerk_id=clerk_id).count(), 1)
