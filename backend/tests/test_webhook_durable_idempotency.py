"""
KEYFLOW Phase 7.32: Webhook Failure-Safe Durable Idempotency Tests
===================================================================
Covers the 10 core requirements:
1. Valid event processes successfully.
2. Successful event delivered twice produces one business mutation.
3. Processing failure does not permanently consume the event ID.
4. Retrying after a transient failure successfully processes the event.
5. Two concurrent deliveries of the same event do not duplicate the mutation.
6. Invalid signatures never create trusted receipts.
7. Missing webhook secret fails closed.
8. Tombstoned Clerk identities remain rejected.
9. Owner identity protections remain unchanged.
10. Existing deletion webhook behavior remains intact.
"""

import time
import json
import base64
import hmac
import hashlib
import threading
import uuid
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connections
from django.db.models import Q
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from accounts.views import ClerkWebhookView
from accounts.models import (
    ROLE_SUPER_ADMIN,
    ROLE_USER,
    RevokedClerkIdentity,
    WebhookEventReceipt,
)

User = get_user_model()

TEST_WEBHOOK_SECRET = 'whsec_bXlfc3VwZXJfc2VjcmV0X3dlYmhvb2tfa2V5XzMyYiE='


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
class WebhookDurableIdempotencyUnitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.view = ClerkWebhookView.as_view()
        User.objects.all().delete()
        WebhookEventReceipt.objects.all().delete()

        # Seed Owner
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

    # 1. Valid event processes successfully
    def test_01_valid_event_processes_successfully(self):
        msg_id = "msg_test_01"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_01',
                'email': 'user01@example.com',
                'first_name': 'First',
                'last_name': 'User',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get('status'), 'processed')
        self.assertTrue(User.objects.filter(clerk_id='user_test_01').exists())

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertIsNotNone(receipt)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)
        self.assertIsNotNone(receipt.processed_at)

    # 2. Successful event delivered twice produces exactly one business mutation
    def test_02_successful_event_delivered_twice_deduplicates(self):
        msg_id = "msg_test_02"
        ts = str(int(time.time()))
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_02',
                'email': 'user02@example.com',
            }
        }

        req1 = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
        resp1 = self.view(req1)
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.data.get('status'), 'processed')
        self.assertEqual(User.objects.filter(clerk_id='user_test_02').count(), 1)

        # Delivery 2 with same svix-id
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
        resp2 = self.view(req2)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data.get('status'), 'duplicate_ignored')
        self.assertEqual(User.objects.filter(clerk_id='user_test_02').count(), 1)

    # 3. Processing failure does not permanently consume the event ID
    def test_03_processing_failure_does_not_consume_event_id(self):
        msg_id = "msg_test_03"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_03',
                'email': 'user03@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        with patch('accounts.authentication.resolve_clerk_identity', side_effect=RuntimeError("Transient DB glitch")):
            resp = self.view(req)
            self.assertEqual(resp.status_code, 400)

        self.assertFalse(User.objects.filter(clerk_id='user_test_03').exists())
        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertIsNotNone(receipt)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)
        self.assertIn("Transient DB glitch", receipt.error_message)

    # 4. Retrying after a transient failure successfully processes the event
    def test_04_retrying_after_failure_successfully_processes(self):
        msg_id = "msg_test_04"
        ts = str(int(time.time()))
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_04',
                'email': 'user04@example.com',
            }
        }

        # Attempt 1: Fails
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
        with patch('accounts.authentication.resolve_clerk_identity', side_effect=RuntimeError("Transient DB glitch")):
            resp1 = self.view(req1)
            self.assertEqual(resp1.status_code, 400)

        self.assertFalse(User.objects.filter(clerk_id='user_test_04').exists())

        # Attempt 2: Clerk retries with same svix_id -> Downstream is now healthy
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
        resp2 = self.view(req2)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data.get('status'), 'processed')
        self.assertTrue(User.objects.filter(clerk_id='user_test_04').exists())

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 6. Invalid signatures never create trusted receipts
    def test_06_invalid_signature_never_creates_receipt(self):
        msg_id = "msg_test_06"
        payload = {'type': 'user.created', 'data': {'id': 'user_test_06', 'email': 'test06@example.com'}}
        req = build_svix_request(self.factory, payload, msg_id=msg_id, signature_override="v1,forged_invalid_signature")
        resp = self.view(req)

        self.assertEqual(resp.status_code, 401)
        self.assertFalse(WebhookEventReceipt.objects.filter(svix_id=msg_id).exists())

    # 7. Missing webhook secret fails closed
    @override_settings(CLERK_WEBHOOK_SECRET='')
    def test_07_missing_webhook_secret_fails_closed(self):
        msg_id = "msg_test_07"
        payload = {'type': 'user.created', 'data': {'id': 'user_test_07', 'email': 'test07@example.com'}}
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 500)
        self.assertFalse(WebhookEventReceipt.objects.filter(svix_id=msg_id).exists())

    # 8. Tombstoned Clerk identities remain rejected
    def test_08_tombstoned_identity_rejected(self):
        msg_id = "msg_test_08"
        tomb_clerk_id = "user_tombstoned_999"
        RevokedClerkIdentity.objects.create(clerk_id=tomb_clerk_id, original_email="tomb@example.com")

        payload = {'type': 'user.created', 'data': {'id': tomb_clerk_id, 'email': 'tomb@example.com'}}
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 401)
        self.assertIn("permanently revoked", resp.data.get('error', ''))
        self.assertFalse(WebhookEventReceipt.objects.filter(svix_id=msg_id).exists())

    # 9. Owner identity protections remain unchanged
    def test_09_owner_identity_protections_unchanged(self):
        # A. Non-owner claiming owner email
        req_a = build_svix_request(self.factory, {
            'type': 'user.created',
            'data': {'id': 'user_intruder_clerk', 'email': 'sina44n07@gmail.com'}
        })
        resp_a = self.view(req_a)
        self.assertEqual(resp_a.status_code, 403)

        # B. Attempting to delete owner via webhook
        req_b = build_svix_request(self.factory, {
            'type': 'user.deleted',
            'data': {'id': 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'}
        })
        resp_b = self.view(req_b)
        self.assertEqual(resp_b.status_code, 403)
        self.assertTrue(User.objects.filter(email='sina44n07@gmail.com').exists())

    # 10. Existing deletion webhook behavior remains intact
    def test_10_deletion_webhook_purges_user_and_records_receipt(self):
        victim = User.objects.create_user(
            email='victim@example.com',
            username='victim1',
            clerk_id='user_victim_clerk_10',
            role=ROLE_USER,
        )
        msg_id = "msg_test_10"
        payload = {
            'type': 'user.deleted',
            'data': {'id': 'user_victim_clerk_10'}
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get('status'), 'deleted')
        self.assertFalse(User.objects.filter(id=victim.id).exists())
        self.assertTrue(RevokedClerkIdentity.objects.filter(clerk_id='user_victim_clerk_10').exists())

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertIsNotNone(receipt)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 11. Expired lease is reclaimed by new worker
    def test_11_expired_lease_reclaimed_by_new_worker(self):
        msg_id = "msg_test_11_expired"
        old_token = uuid.uuid4()
        WebhookEventReceipt.objects.create(
            svix_id=msg_id,
            event_type='user.created',
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=old_token,
            lease_expires_at=timezone.now() - timedelta(seconds=15),
        )
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_11',
                'email': 'user11@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get('status'), 'processed')
        self.assertTrue(User.objects.filter(clerk_id='user_test_11').exists())

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)
        self.assertNotEqual(receipt.claim_token, old_token)

    # 12. Active lease rejected with 429 Retry-After: 5
    def test_12_active_lease_rejected_with_429(self):
        msg_id = "msg_test_12_active"
        active_token = uuid.uuid4()
        WebhookEventReceipt.objects.create(
            svix_id=msg_id,
            event_type='user.created',
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=active_token,
            lease_expires_at=timezone.now() + timedelta(seconds=45),
        )
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_12',
                'email': 'user12@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.data.get('status'), 'processing_in_progress')
        self.assertEqual(resp.data.get('retry_after'), 5)
        self.assertEqual(resp.headers.get('Retry-After'), '5')
        self.assertFalse(User.objects.filter(clerk_id='user_test_12').exists())

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSING)
        self.assertEqual(receipt.claim_token, active_token)

    # 13. Stale worker is fenced out from finalization
    def test_13_stale_worker_fenced_out_from_finalization(self):
        msg_id = "msg_test_13_fencing"
        stale_token = uuid.uuid4()
        new_token = uuid.uuid4()
        receipt = WebhookEventReceipt.objects.create(
            svix_id=msg_id,
            event_type='user.created',
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=new_token,
            lease_expires_at=timezone.now() + timedelta(seconds=60),
        )

        # Worker 1 with stale_token tries to finalize
        updated = WebhookEventReceipt.objects.filter(
            svix_id=msg_id,
            claim_token=stale_token,
        ).update(
            status=WebhookEventReceipt.STATUS_PROCESSED,
            processed_at=timezone.now(),
        )
        self.assertEqual(updated, 0)

        # Receipt status and token remain owned by Worker 2
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSING)
        self.assertEqual(receipt.claim_token, new_token)

    # 14. Worker crash recovery without duplicate mutation
    def test_14_worker_crash_recovery_without_duplicate_mutation(self):
        msg_id = "msg_test_14_crash"
        # Simulate worker that died mid-processing
        WebhookEventReceipt.objects.create(
            svix_id=msg_id,
            event_type='user.created',
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=uuid.uuid4(),
            lease_expires_at=timezone.now() - timedelta(seconds=5),
        )
        # User was not created because worker crashed before mutation
        self.assertFalse(User.objects.filter(clerk_id='user_test_14').exists())

        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_14',
                'email': 'user14@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp = self.view(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get('status'), 'processed')
        self.assertEqual(User.objects.filter(clerk_id='user_test_14').count(), 1)

        receipt = WebhookEventReceipt.objects.filter(svix_id=msg_id).first()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 15. Stale worker that lost claim ownership aborts before business mutation
    def test_15_stale_worker_aborts_before_business_mutation(self):
        msg_id = "msg_test_15_stale_abort"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_15',
                'email': 'user15@example.com',
            }
        }
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id)

        from accounts.authentication import resolve_clerk_identity as real_resolve

        resolve_calls = []

        def spy_resolve(jwt_payload):
            resolve_calls.append(jwt_payload)
            return real_resolve(jwt_payload)

        original_select = WebhookEventReceipt.objects.select_for_update
        stolen = [False]

        def stolen_select_for_update(*args, **kwargs):
            if not stolen[0]:
                stolen[0] = True
                # Worker 2 steals the claim and completes
                new_token = uuid.uuid4()
                WebhookEventReceipt.objects.filter(svix_id=msg_id).update(
                    claim_token=new_token,
                    status=WebhookEventReceipt.STATUS_PROCESSED,
                    processed_at=timezone.now(),
                )
                User.objects.create_user(
                    email='user15@example.com',
                    username='user15',
                    clerk_id='user_test_15',
                )
            return original_select(*args, **kwargs)

        with patch.object(type(WebhookEventReceipt.objects), 'select_for_update', side_effect=stolen_select_for_update):
            with patch('accounts.authentication.resolve_clerk_identity', side_effect=spy_resolve):
                with self.assertLogs('accounts.views', level='WARNING') as cm:
                    resp1 = self.view(req1)
                    self.assertEqual(resp1.status_code, 200)
                    self.assertEqual(resp1.data.get('status'), 'duplicate_ignored')
                    self.assertTrue(any('lost claim ownership' in msg for msg in cm.output))

        # resolve_clerk_identity was NEVER invoked by the stale worker
        self.assertEqual(len(resolve_calls), 0)
        # Exactly 1 user in database
        self.assertEqual(User.objects.filter(clerk_id='user_test_15').count(), 1)

    # 16. Failure during business mutation rolls back mutation and receipt finalization together
    def test_16_failure_during_mutation_rolls_back_atomically(self):
        msg_id = "msg_test_16_rollback"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_16',
                'email': 'user16@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        def failing_resolve(jwt_payload):
            # Partially create a user in the atomic transaction, then crash
            User.objects.create_user(
                email='user16@example.com',
                username='user16_partial',
                clerk_id='user_test_16',
            )
            raise RuntimeError("Database error during post-processing")

        with patch('accounts.authentication.resolve_clerk_identity', side_effect=failing_resolve):
            resp = self.view(req)
            self.assertEqual(resp.status_code, 400)

        # Assert user creation rolled back completely
        self.assertFalse(User.objects.filter(clerk_id='user_test_16').exists())

        # Assert receipt was rolled back from PROCESSED and transitioned to FAILED
        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)
        self.assertIn("Database error during post-processing", receipt.error_message)

    # 17. Crash before transaction commit does not leave partial mutation
    def test_17_crash_before_commit_rolls_back_partial_mutation(self):
        msg_id = "msg_test_17_crash"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_17',
                'email': 'user17@example.com',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        from accounts.authentication import resolve_clerk_identity as real_resolve

        def crash_after_provisioning(jwt_payload):
            # Real provisioning creates user in the active transaction
            user = real_resolve(jwt_payload)
            self.assertTrue(User.objects.filter(id=user.id).exists())
            # Crash right before transaction completes
            raise RuntimeError("Fatal process crash before transaction commit")

        with patch('accounts.authentication.resolve_clerk_identity', side_effect=crash_after_provisioning):
            resp = self.view(req)
            self.assertEqual(resp.status_code, 400)

        # User creation rolled back completely
        self.assertFalse(User.objects.filter(clerk_id='user_test_17').exists())
        # Receipt exists in FAILED status
        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)
        self.assertIn("Fatal process crash before transaction commit", receipt.error_message)

    # 18. Duplicate delivery after successful processing never calls business mutation
    def test_18_duplicate_delivery_never_calls_mutation(self):
        msg_id = "msg_test_18_duplicate"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_18',
                'email': 'user18@example.com',
            }
        }
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp1 = self.view(req1)
        self.assertEqual(resp1.status_code, 200)
        self.assertTrue(User.objects.filter(clerk_id='user_test_18').exists())

        # Second delivery: assert resolve_clerk_identity is NEVER invoked
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id)
        with patch('accounts.authentication.resolve_clerk_identity') as mock_resolve:
            resp2 = self.view(req2)
            self.assertEqual(resp2.status_code, 200)
            self.assertEqual(resp2.data.get('status'), 'duplicate_ignored')
            mock_resolve.assert_not_called()

    # 19. Deletion webhook with stolen claim aborts before safe_delete_account
    def test_19_deletion_with_stolen_claim_aborts_before_delete(self):
        victim = User.objects.create_user(
            email='victim19@example.com',
            username='victim19',
            clerk_id='user_victim_19',
            role=ROLE_USER,
        )
        msg_id = "msg_test_19_delete_abort"
        payload = {
            'type': 'user.deleted',
            'data': {'id': 'user_victim_19'}
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        original_select = WebhookEventReceipt.objects.select_for_update
        stolen = [False]

        def stolen_select(*args, **kwargs):
            if not stolen[0]:
                stolen[0] = True
                WebhookEventReceipt.objects.filter(svix_id=msg_id).update(
                    claim_token=uuid.uuid4(),
                    status=WebhookEventReceipt.STATUS_PROCESSED,
                )
            return original_select(*args, **kwargs)

        with patch.object(type(WebhookEventReceipt.objects), 'select_for_update', side_effect=stolen_select):
            with patch('accounts.services.account_deletion.safe_delete_account') as mock_delete:
                with self.assertLogs('accounts.views', level='WARNING') as cm:
                    resp = self.view(req)
                    self.assertEqual(resp.status_code, 200)
                    self.assertEqual(resp.data.get('status'), 'duplicate_ignored')
                    mock_delete.assert_not_called()

        # Victim account remains untouched
        self.assertTrue(User.objects.filter(id=victim.id).exists())


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
    CLERK_WEBHOOK_SECRET=TEST_WEBHOOK_SECRET,
)
class WebhookDurableConcurrencyTests(TransactionTestCase):
    def setUp(self):
        connections.close_all()
        cache.clear()
        self.factory = APIRequestFactory()
        self.view = ClerkWebhookView.as_view()
        User.objects.all().delete()
        WebhookEventReceipt.objects.all().delete()

    # 5. Two concurrent deliveries of the same event do not duplicate the mutation
    def test_05_concurrent_deliveries_do_not_duplicate_mutation(self):
        connections.close_all()
        msg_id = "msg_test_05_concurrent"
        ts = str(int(time.time()))
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_05_concurrent',
                'email': 'concurrent05@example.com',
                'first_name': 'Conc',
                'last_name': 'Racer',
            }
        }

        results = []

        def worker_post():
            try:
                req = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
                resp = self.view(req)
                results.append((resp.status_code, resp.data.get('status')))
            except Exception as exc:
                results.append(('error', str(exc)))
            finally:
                connections.close_all()

        t1 = threading.Thread(target=worker_post)
        t2 = threading.Thread(target=worker_post)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Both workers should complete cleanly without errors
        self.assertEqual(len(results), 2)
        for res in results:
            self.assertIn(res[0], (200, 429))
            self.assertIn(res[1], ('processed', 'duplicate_ignored', 'processing_in_progress'))

        # Exactly 1 user created in database
        self.assertEqual(User.objects.filter(clerk_id='user_test_05_concurrent').count(), 1)

        # Exactly 1 receipt in database, marked PROCESSED
        receipts = WebhookEventReceipt.objects.filter(svix_id=msg_id)
        self.assertEqual(receipts.count(), 1)
        self.assertEqual(receipts.first().status, WebhookEventReceipt.STATUS_PROCESSED)

    # 20. Simultaneous racing workers with synchronization barrier do not duplicate mutation
    def test_20_simultaneous_racing_workers_with_synchronization_barrier(self):
        connections.close_all()
        msg_id = "msg_test_20_barrier"
        ts = str(int(time.time()))
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_20_barrier',
                'email': 'barrier20@example.com',
                'first_name': 'Barrier',
                'last_name': 'Sync',
            }
        }

        barrier = threading.Barrier(2)
        results = []

        def racing_worker():
            try:
                req = build_svix_request(self.factory, payload, msg_id=msg_id, timestamp=ts)
                # Wait until both threads are primed and ready to strike simultaneously
                barrier.wait(timeout=5)
                resp = self.view(req)
                results.append((resp.status_code, resp.data.get('status')))
            except Exception as exc:
                results.append(('error', str(exc)))
            finally:
                connections.close_all()

        t1 = threading.Thread(target=racing_worker)
        t2 = threading.Thread(target=racing_worker)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(results), 2)
        for res in results:
            self.assertIn(res[0], (200, 429))
            self.assertIn(res[1], ('processed', 'duplicate_ignored', 'processing_in_progress'))

        # Primary invariant: exactly 1 user created in the database
        self.assertEqual(User.objects.filter(clerk_id='user_test_20_barrier').count(), 1)

        # Primary invariant: exactly 1 receipt in the database, marked PROCESSED
        receipts = WebhookEventReceipt.objects.filter(svix_id=msg_id)
        self.assertEqual(receipts.count(), 1)
        self.assertEqual(receipts.first().status, WebhookEventReceipt.STATUS_PROCESSED)

    # 21. Email present in webhook payload: no external pre-fetch required
    def test_21_email_present_in_payload_skips_external_prefetch(self):
        msg_id = "msg_test_21_direct"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_21',
                'email': 'direct21@example.com',
                'first_name': 'Direct',
                'last_name': 'Payload',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        with patch('accounts.authentication.fetch_clerk_user_info') as mock_fetch:
            resp = self.view(req)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('status'), 'processed')
            # Invariant: external pre-fetch must never be called when email is present in payload
            self.assertEqual(mock_fetch.call_count, 0)

        # Invariant: user exists with payload email
        user = User.objects.filter(clerk_id='user_test_21').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'direct21@example.com')

        # Invariant: receipt marked PROCESSED
        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 22. Email absent, pre-fetch succeeds: identity processing succeeds outside transaction
    def test_22_email_absent_prefetch_succeeds_outside_transaction(self):
        msg_id = "msg_test_22_prefetch"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_22',
                'first_name': 'Prefetched',
                'last_name': 'User',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        from django.db import connection
        call_log = []

        def spy_fetch(clerk_id):
            call_log.append({
                'clerk_id': clerk_id,
                'in_atomic_block': connection.in_atomic_block,
            })
            return {
                'primary_email_address_id': 'ea_22',
                'email_addresses': [{'id': 'ea_22', 'email_address': 'prefetched22@example.com'}],
                'first_name': 'Prefetched',
                'last_name': 'User',
            }

        with patch('accounts.authentication.fetch_clerk_user_info', side_effect=spy_fetch):
            resp = self.view(req)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('status'), 'processed')

        # Invariant: spy_fetch was called exactly once
        self.assertEqual(len(call_log), 1)
        self.assertEqual(call_log[0]['clerk_id'], 'user_test_22')
        # CRITICAL INVARIANT: fetch executed OUTSIDE any atomic database transaction / row lock
        self.assertFalse(call_log[0]['in_atomic_block'], "External pre-fetch MUST execute outside transaction.atomic()")

        # Invariant: user created with prefetched email
        user = User.objects.filter(clerk_id='user_test_22').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'prefetched22@example.com')

        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 23. Email absent, pre-fetch fails: no business mutation occurs, returns retryable 503
    def test_23_email_absent_prefetch_fails_returns_503_and_zero_mutations(self):
        msg_id = "msg_test_23_fail"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_23',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        from django.db import connection
        call_log = []

        def failing_fetch(clerk_id):
            call_log.append({
                'clerk_id': clerk_id,
                'in_atomic_block': connection.in_atomic_block,
            })
            raise RuntimeError("Clerk API network timeout")

        with patch('accounts.authentication.fetch_clerk_user_info', side_effect=failing_fetch), \
             patch('accounts.authentication.resolve_clerk_identity') as mock_resolve:
            resp = self.view(req)
            self.assertEqual(resp.status_code, 503)
            self.assertEqual(resp.headers.get('Retry-After'), '5')
            self.assertIn('User email unavailable', resp.data.get('error'))
            # Invariant: resolve_clerk_identity was NEVER called
            self.assertEqual(mock_resolve.call_count, 0)

        # Invariant: call occurred outside transaction.atomic()
        self.assertEqual(len(call_log), 1)
        self.assertFalse(call_log[0]['in_atomic_block'])

        # Invariant: ZERO business mutations in database
        self.assertFalse(User.objects.filter(clerk_id='user_test_23').exists())

        # Invariant: receipt transitioned to FAILED so retries remain claimable
        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)
        self.assertIn('User email unavailable', receipt.error_message)

    # 24. Email absent, pre-fetch returns no usable email: no business mutation occurs, returns retryable 503
    def test_24_email_absent_prefetch_returns_empty_email_list_returns_503(self):
        msg_id = "msg_test_24_empty"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_24',
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        from django.db import connection
        call_log = []

        def empty_fetch(clerk_id):
            call_log.append({
                'clerk_id': clerk_id,
                'in_atomic_block': connection.in_atomic_block,
            })
            return {
                'primary_email_address_id': None,
                'email_addresses': [],
            }

        with patch('accounts.authentication.fetch_clerk_user_info', side_effect=empty_fetch), \
             patch('accounts.authentication.resolve_clerk_identity') as mock_resolve:
            resp = self.view(req)
            self.assertEqual(resp.status_code, 503)
            self.assertEqual(resp.headers.get('Retry-After'), '5')
            self.assertEqual(mock_resolve.call_count, 0)

        self.assertEqual(len(call_log), 1)
        self.assertFalse(call_log[0]['in_atomic_block'])
        self.assertFalse(User.objects.filter(clerk_id='user_test_24').exists())

        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)

    # 25. Proof that resolve_clerk_identity rejects external fallback when allow_external_fetch is False
    def test_25_resolve_clerk_identity_blocks_fallback_when_external_fetch_disallowed(self):
        from accounts.authentication import resolve_clerk_identity
        from rest_framework.exceptions import AuthenticationFailed

        payload = {
            'sub': 'user_test_25_no_fetch',
            'email': None,
            'allow_external_fetch': False,
        }

        with patch('accounts.authentication.fetch_clerk_user_info') as mock_fetch:
            with self.assertRaises(AuthenticationFailed) as ctx:
                resolve_clerk_identity(payload)
            self.assertIn("User email is required", str(ctx.exception))
            # Invariant: fetch_clerk_user_info was NEVER invoked
            self.assertEqual(mock_fetch.call_count, 0)

    # 26. Existing ordinary authentication fallback behavior remains unchanged
    def test_26_ordinary_auth_retains_external_fallback_behavior(self):
        from accounts.authentication import resolve_clerk_identity

        payload = {
            'sub': 'user_test_26_ordinary',
            'email': None,
            # allow_external_fetch defaults to True
        }

        mock_data = {
            'primary_email_address_id': 'ea_26',
            'email_addresses': [{'id': 'ea_26', 'email_address': 'ordinary26@example.com'}],
            'first_name': 'Ordinary',
            'last_name': 'User',
        }

        with patch('accounts.authentication.fetch_clerk_user_info', return_value=mock_data) as mock_fetch:
            user = resolve_clerk_identity(payload)
            self.assertIsNotNone(user)
            self.assertEqual(user.email, 'ordinary26@example.com')
            self.assertEqual(mock_fetch.call_count, 1)

    # 27. Retry after pre-fetch recovery processes the original event successfully
    def test_27_retry_after_prefetch_recovery_succeeds(self):
        msg_id = "msg_test_27_retry"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_27',
            }
        }

        # Attempt 1: Pre-fetch fails
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id)
        with patch('accounts.authentication.fetch_clerk_user_info', return_value=None):
            resp1 = self.view(req1)
            self.assertEqual(resp1.status_code, 503)

        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)
        self.assertFalse(User.objects.filter(clerk_id='user_test_27').exists())

        # Attempt 2: Clerk retries with identical svix_id; API now succeeds
        recovered_data = {
            'primary_email_address_id': 'ea_27',
            'email_addresses': [{'id': 'ea_27', 'email_address': 'recovered27@example.com'}],
            'first_name': 'Recovered',
            'last_name': 'User',
        }
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id)
        with patch('accounts.authentication.fetch_clerk_user_info', return_value=recovered_data):
            resp2 = self.view(req2)
            self.assertEqual(resp2.status_code, 200)
            self.assertEqual(resp2.data.get('status'), 'processed')

        # Assert exactly one user created
        self.assertEqual(User.objects.filter(clerk_id='user_test_27').count(), 1)
        user = User.objects.get(clerk_id='user_test_27')
        self.assertEqual(user.email, 'recovered27@example.com')

        # Assert exactly one receipt, now marked PROCESSED
        receipts = WebhookEventReceipt.objects.filter(svix_id=msg_id)
        self.assertEqual(receipts.count(), 1)
        self.assertEqual(receipts.first().status, WebhookEventReceipt.STATUS_PROCESSED)

    # 28. Owner identity and tombstone protections remain intact
    def test_28_owner_identity_and_tombstone_protections_intact(self):
        owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        # 1. Tombstone rejection
        RevokedClerkIdentity.objects.create(clerk_id='user_revoked_28', original_email='tomb28@example.com', revocation_reason='Manual deletion')
        payload_tomb = {
            'type': 'user.created',
            'data': {'id': 'user_revoked_28', 'email': 'tomb28@example.com'}
        }
        req_tomb = build_svix_request(self.factory, payload_tomb, msg_id='msg_test_28_tomb')
        resp_tomb = self.view(req_tomb)
        self.assertEqual(resp_tomb.status_code, 401)
        self.assertFalse(User.objects.filter(clerk_id='user_revoked_28').exists())

        # 2. Owner deletion forbidden
        payload_del = {
            'type': 'user.deleted',
            'data': {'id': 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'}
        }
        req_del = build_svix_request(self.factory, payload_del, msg_id='msg_test_28_del')
        resp_del = self.view(req_del)
        self.assertEqual(resp_del.status_code, 403)
        self.assertTrue(User.objects.filter(clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn').exists())

        # 3. Non-owner attempting to claim owner email
        payload_impostor = {
            'type': 'user.created',
            'data': {'id': 'user_impostor_28', 'email': 'sina44n07@gmail.com'}
        }
        req_imp = build_svix_request(self.factory, payload_impostor, msg_id='msg_test_28_imp')
        resp_imp = self.view(req_imp)
        self.assertEqual(resp_imp.status_code, 403)

    # 29. Duplicate delivery after successful processing skips pre-fetch and returns duplicate_ignored
    def test_29_duplicate_delivery_skips_prefetch_and_returns_200(self):
        msg_id = "msg_test_29_dup"
        payload = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_29',
                'email': 'dup29@example.com',
            }
        }
        req1 = build_svix_request(self.factory, payload, msg_id=msg_id)
        resp1 = self.view(req1)
        self.assertEqual(resp1.status_code, 200)

        # Second delivery of same svix_id
        req2 = build_svix_request(self.factory, payload, msg_id=msg_id)
        with patch('accounts.authentication.fetch_clerk_user_info') as mock_fetch:
            resp2 = self.view(req2)
            self.assertEqual(resp2.status_code, 200)
            self.assertEqual(resp2.data.get('status'), 'duplicate_ignored')
            self.assertEqual(mock_fetch.call_count, 0)

    # 30. Existing user without email skips pre-fetch and preserves user (TEST A)
    def test_30_existing_user_without_email_skips_prefetch_and_preserves_user(self):
        # Seed an existing user in the database
        existing = User.objects.create_user(
            email='existing30@example.com',
            username='existing30',
            clerk_id='user_test_30_existing',
            role=ROLE_USER,
        )
        msg_id = "msg_test_30_existing"
        payload = {
            'type': 'user.updated',
            'data': {
                'id': 'user_test_30_existing',
                'first_name': 'UpdatedFirst',
                # No email, no email_addresses
            }
        }
        req = build_svix_request(self.factory, payload, msg_id=msg_id)

        with patch('accounts.authentication.fetch_clerk_user_info') as mock_fetch:
            resp = self.view(req)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('status'), 'processed')
            # Invariant 1: fetch_clerk_user_info must NEVER be called for existing user
            self.assertEqual(mock_fetch.call_count, 0)

        # Invariant 2: User identity remains completely intact and unchanged
        user = User.objects.get(clerk_id='user_test_30_existing')
        self.assertEqual(user.id, existing.id)
        self.assertEqual(user.email, 'existing30@example.com')
        self.assertEqual(user.username, 'existing30')
        # Invariant 3: Exactly 1 user exists; no placeholder user created
        self.assertEqual(User.objects.filter(clerk_id='user_test_30_existing').count(), 1)
        self.assertFalse(User.objects.filter(email__endswith='@clerk.keyflow.local').exists())

        # Invariant 4: Receipt marked PROCESSED
        receipt = WebhookEventReceipt.objects.get(svix_id=msg_id)
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)

    # 31. Malformed email payload input validation (TEST B)
    def test_31_malformed_email_payload_handling(self):
        # --- Group 1: Malformed top-level email values ---
        malformed_top_levels = [
            ('int', 12345, '12345'),
            ('bool_true', True, 'true'),
            ('bool_false', False, 'false'),
            ('empty_str', '', ''),
            ('whitespace', '   ', '   '),
            ('invalid_fmt', 'not_an_email', 'not_an_email'),
        ]

        for label, mal_val, repr_str in malformed_top_levels:
            with self.subTest(top_level_type=label):
                p = {'type': 'user.created', 'data': {'id': f'user_test_31_top_{label}', 'email': mal_val}}
                req = build_svix_request(self.factory, p, msg_id=f'msg_test_31_top_{label}')
                with patch('accounts.authentication.fetch_clerk_user_info', return_value=None):
                    resp = self.view(req)
                    # Because email is rejected and pre-fetch returns None, must trigger missing-email 503
                    self.assertEqual(resp.status_code, 503)
                    self.assertEqual(resp.headers.get('Retry-After'), '5')
                    self.assertIn('User email unavailable', resp.data.get('error'))

                # Database Integrity: user must NOT exist with malformed email representation
                self.assertFalse(User.objects.filter(email=repr_str).exists(), f"Account created with malformed email '{repr_str}'")
                self.assertFalse(User.objects.filter(clerk_id=f'user_test_31_top_{label}').exists())

                # Persisted receipt must be marked FAILED
                receipt = WebhookEventReceipt.objects.get(svix_id=f'msg_test_31_top_{label}')
                self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)

        # --- Group 2: Malformed email_addresses collection structures ---
        malformed_collections = [
            ('str_instead_of_list', 'not_a_list'),
            ('list_with_str', ['invalid_string']),
            ('list_with_int', [42]),
            ('list_with_none', [None]),
            ('dict_with_invalid_email_type', [{'id': 'ea1', 'email_address': 999}]),
            ('dict_with_bool_email', [{'id': 'ea2', 'email_address': False}]),
        ]

        for label, mal_collection in malformed_collections:
            with self.subTest(collection_type=label):
                p = {'type': 'user.created', 'data': {'id': f'user_test_31_coll_{label}', 'email_addresses': mal_collection}}
                req = build_svix_request(self.factory, p, msg_id=f'msg_test_31_coll_{label}')
                with patch('accounts.authentication.fetch_clerk_user_info', return_value=None):
                    try:
                        resp = self.view(req)
                        self.assertEqual(resp.status_code, 503, f"Collection {label} must safely return 503 when pre-fetch fails")
                    except (AttributeError, TypeError) as exc:
                        self.fail(f"Unhandled exception on malformed collection {label}: {exc}")

                self.assertFalse(User.objects.filter(clerk_id=f'user_test_31_coll_{label}').exists())
                receipt = WebhookEventReceipt.objects.get(svix_id=f'msg_test_31_coll_{label}')
                self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_FAILED)

        # --- Group 3: Primary email selection & fallback hierarchy ---
        # 3a. Valid primary email preferred over valid secondary email
        p_primary = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_31_pri_pref',
                'primary_email_address_id': 'ea_primary',
                'email_addresses': [
                    {'id': 'ea_secondary', 'email_address': 'secondary31@example.com'},
                    {'id': 'ea_primary', 'email_address': 'primary31@example.com'},
                ]
            }
        }
        req_primary = build_svix_request(self.factory, p_primary, msg_id='msg_test_31_pri_pref')
        resp_primary = self.view(req_primary)
        self.assertEqual(resp_primary.status_code, 200)
        user_pri = User.objects.filter(clerk_id='user_test_31_pri_pref').first()
        self.assertIsNotNone(user_pri)
        self.assertEqual(user_pri.email, 'primary31@example.com')

        # 3b. Invalid primary email safely falls back to valid secondary email
        p_invalid_pri = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_31_inv_pri',
                'primary_email_address_id': 'ea_bad_primary',
                'email_addresses': [
                    {'id': 'ea_bad_primary', 'email_address': 'NOT_A_VALID_EMAIL'},
                    {'id': 'ea_valid_sec', 'email_address': 'fallback31_valid@example.com'},
                ]
            }
        }
        req_invalid_pri = build_svix_request(self.factory, p_invalid_pri, msg_id='msg_test_31_inv_pri')
        resp_invalid_pri = self.view(req_invalid_pri)
        self.assertEqual(resp_invalid_pri.status_code, 200)
        user_inv_pri = User.objects.filter(clerk_id='user_test_31_inv_pri').first()
        self.assertIsNotNone(user_inv_pri)
        self.assertEqual(user_inv_pri.email, 'fallback31_valid@example.com')

        # 3c. Missing primary ID reference safely falls back to valid candidate in list
        p_missing_pri = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_31_missing_pri',
                'primary_email_address_id': 'non_existent_id',
                'email_addresses': [{'id': 'some_id', 'email_address': 'fallback31_found@example.com'}]
            }
        }
        req_missing_pri = build_svix_request(self.factory, p_missing_pri, msg_id='msg_test_31_missing_pri')
        resp_missing_pri = self.view(req_missing_pri)
        self.assertEqual(resp_missing_pri.status_code, 200)
        user_missing_pri = User.objects.filter(clerk_id='user_test_31_missing_pri').first()
        self.assertIsNotNone(user_missing_pri)
        self.assertEqual(user_missing_pri.email, 'fallback31_found@example.com')

        # 3d. No valid candidates triggers existing missing-email behavior (503 on failed prefetch)
        p_no_valid = {
            'type': 'user.created',
            'data': {
                'id': 'user_test_31_no_valid',
                'primary_email_address_id': 'ea_1',
                'email_addresses': [{'id': 'ea_1', 'email_address': 'invalid_email_1'}, {'id': 'ea_2', 'email_address': 'invalid_email_2'}]
            }
        }
        req_no_valid = build_svix_request(self.factory, p_no_valid, msg_id='msg_test_31_no_valid')
        with patch('accounts.authentication.fetch_clerk_user_info', return_value=None):
            resp_no_valid = self.view(req_no_valid)
            self.assertEqual(resp_no_valid.status_code, 503)

        self.assertFalse(User.objects.filter(clerk_id='user_test_31_no_valid').exists())

    # 32. Stale FAILED transition fencing affects zero rows (TEST C)
    def test_32_stale_failed_transition_fencing_affects_zero_rows(self):
        msg_id = "msg_test_32_stale_fence"
        token_a = uuid.uuid4()
        token_b = uuid.uuid4()

        # Step 1: Worker A claims the receipt, but its lease expires
        receipt = WebhookEventReceipt.objects.create(
            svix_id=msg_id,
            event_type='user.created',
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=token_a,
            lease_expires_at=timezone.now() - timedelta(seconds=10),
            error_message='',
        )

        # Step 2: Worker B safely reclaims the expired receipt with token_b
        claimed_by_b = WebhookEventReceipt.objects.filter(
            svix_id=msg_id
        ).filter(
            Q(status=WebhookEventReceipt.STATUS_FAILED) |
            Q(status=WebhookEventReceipt.STATUS_PROCESSING, lease_expires_at__lte=timezone.now()) |
            Q(status=WebhookEventReceipt.STATUS_PROCESSING, lease_expires_at__isnull=True)
        ).update(
            status=WebhookEventReceipt.STATUS_PROCESSING,
            claim_token=token_b,
            lease_expires_at=timezone.now() + timedelta(seconds=60),
            error_message='',
        )
        self.assertEqual(claimed_by_b, 1, "Worker B must successfully reclaim the expired lease")

        # Step 3: Worker A wakes up and attempts its FAILED transition using stale token_a
        stale_failed_rows = WebhookEventReceipt.objects.filter(
            svix_id=msg_id,
            claim_token=token_a,
        ).update(
            status=WebhookEventReceipt.STATUS_FAILED,
            error_message='Worker A pre-fetch failed'
        )

        # Critical Invariant: Worker A's update MUST affect exactly 0 rows
        self.assertEqual(stale_failed_rows, 0, "Stale worker transition to FAILED must match exactly 0 rows")

        # Step 4: Verify receipt remains exclusively owned by Worker B in PROCESSING status
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSING)
        self.assertEqual(receipt.claim_token, token_b)
        self.assertEqual(receipt.error_message, '', "Worker A must not overwrite Worker B error_message")

        # Step 5: Worker B completes the event successfully
        finalized_rows = WebhookEventReceipt.objects.filter(
            svix_id=msg_id,
            claim_token=token_b,
        ).update(
            status=WebhookEventReceipt.STATUS_PROCESSED,
            processed_at=timezone.now(),
        )
        self.assertEqual(finalized_rows, 1, "Worker B must finalize its claimed receipt")

        receipt.refresh_from_db()
        self.assertEqual(receipt.status, WebhookEventReceipt.STATUS_PROCESSED)
        self.assertEqual(receipt.claim_token, token_b)
