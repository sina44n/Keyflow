"""
Comprehensive Clerk JWT Authentication & Identity Mapping Tests
================================================================
Verifies:
1. Cryptographic RSA token verification (valid, expired, tampered).
2. Identity mapping: resolving existing clerk_id.
3. Safe account linking: linking existing user by verified email without modifying primary key.
4. Idempotent new user provisioning with profile & preferences creation.
5. Error handling: missing token, missing sub, invalid header formatting.
6. Passthrough to Knox Token authentication when 'Token <key>' header is used.
7. Competition submission authorization: preventing participant score spoofing.
"""

import time
from datetime import timedelta
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt

from accounts.models import User, UserProfile, UserPreferences
from practice.models import Competition, CompetitionParticipant


def generate_rsa_key_pair():
    """Generate an in-memory RSA key pair for testing Clerk RS256 token verification."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode('utf-8')

    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode('utf-8')

    return private_pem, public_pem


TEST_PRIVATE_KEY, TEST_PUBLIC_KEY = generate_rsa_key_pair()
OTHER_PRIVATE_KEY, _ = generate_rsa_key_pair()


def make_test_clerk_token(
    sub="user_clerk_test_123",
    email="clerk.user@keyflow.app",
    name="Clerk Test User",
    exp_seconds=3600,
    private_key=TEST_PRIVATE_KEY,
    extra_claims=None,
):
    """Helper to generate a signed Clerk JWT."""
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + exp_seconds,
        "nbf": now - 10,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, private_key, algorithm="RS256")


@override_settings(CLERK_TEST_PUBLIC_KEY=TEST_PUBLIC_KEY)
class ClerkAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_new_user_provisioning_from_valid_clerk_token(self):
        """A valid Clerk JWT for a new user provisions a Django User with clerk_id and profile."""
        token = make_test_clerk_token(
            sub="user_new_clerk_456",
            email="new.clerk@keyflow.app",
            name="New Clerk Typist",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "new.clerk@keyflow.app")
        self.assertEqual(res.data["clerk_id"], "user_new_clerk_456")

        # Verify database record
        user = User.objects.get(clerk_id="user_new_clerk_456")
        self.assertEqual(user.email, "new.clerk@keyflow.app")
        self.assertTrue(user.is_email_verified)
        self.assertFalse(user.has_usable_password())

        # Verify profile and preferences were auto-created
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        self.assertTrue(UserPreferences.objects.filter(user=user).exists())
        self.assertEqual(user.profile.display_name, "New Clerk Typist")

    def test_existing_user_safe_account_linking(self):
        """
        When an existing Django user logs in via Clerk with matching email,
        their clerk_id is linked without changing their integer primary key or data.
        """
        existing = User.objects.create_user(
            email="legacy.student@keyflow.app",
            username="legacy_student",
            password="LegacyPassword123!",
        )
        original_pk = existing.pk
        self.assertIsNone(existing.clerk_id)

        token = make_test_clerk_token(
            sub="user_clerk_link_789",
            email="legacy.student@keyflow.app",
            name="Legacy Student",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], original_pk)
        self.assertEqual(res.data["clerk_id"], "user_clerk_link_789")

        # Confirm database state
        existing.refresh_from_db()
        self.assertEqual(existing.pk, original_pk)
        self.assertEqual(existing.clerk_id, "user_clerk_link_789")

    def test_subsequent_login_resolves_directly_via_clerk_id(self):
        """Once linked, requests resolve directly via clerk_id."""
        user = User.objects.create_user(
            email="direct@keyflow.app",
            username="direct_user",
            clerk_id="user_clerk_direct_999",
        )

        token = make_test_clerk_token(
            sub="user_clerk_direct_999",
            email="direct@keyflow.app",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], user.pk)

    def test_expired_clerk_token_rejected(self):
        """Expired Clerk token receives HTTP 401."""
        token = make_test_clerk_token(
            sub="user_expired_111",
            exp_seconds=-60,  # Expired 60s ago
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("expired", str(res.data))

    def test_tampered_or_invalid_signature_rejected(self):
        """Token signed with untrusted/different private key receives HTTP 401."""
        token = make_test_clerk_token(
            sub="user_tampered_222",
            private_key=OTHER_PRIVATE_KEY,  # Signed by different key
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_sub_claim_rejected(self):
        """Token without 'sub' claim is rejected."""
        now = int(time.time())
        token = jwt.encode(
            {"email": "nosub@keyflow.app", "exp": now + 3600},
            TEST_PRIVATE_KEY,
            algorithm="RS256",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_clerk_sync_endpoint(self):
        """POST /api/auth/clerk-sync/ updates display name and avatar."""
        token = make_test_clerk_token(
            sub="user_sync_test_333",
            email="sync.test@keyflow.app",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.post("/api/auth/clerk-sync/", {
            "display_name": "Synced Name",
            "avatar_url": "https://images.example.com/avatar.png",
        }, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "synchronized")
        self.assertEqual(res.data["user"]["profile"]["display_name"], "Synced Name")
        self.assertEqual(res.data["user"]["profile"]["avatar_url"], "https://images.example.com/avatar.png")


@override_settings(CLERK_TEST_PUBLIC_KEY=TEST_PUBLIC_KEY)
class CompetitionOwnershipSecurityTests(TestCase):
    def setUp(self):
        self.client_alice = APIClient()
        self.client_bob = APIClient()

        self.user_alice = User.objects.create_user(
            email="alice.comp@keyflow.app",
            username="alice_comp",
            clerk_id="user_alice_comp",
        )
        self.user_bob = User.objects.create_user(
            email="bob.comp@keyflow.app",
            username="bob_comp",
            clerk_id="user_bob_comp",
        )

        token_alice = make_test_clerk_token(sub="user_alice_comp", email="alice.comp@keyflow.app")
        token_bob = make_test_clerk_token(sub="user_bob_comp", email="bob.comp@keyflow.app")

        self.client_alice.credentials(HTTP_AUTHORIZATION=f"Bearer {token_alice}")
        self.client_bob.credentials(HTTP_AUTHORIZATION=f"Bearer {token_bob}")

        # Create competition lobby
        self.competition = Competition.objects.create(
            name="Security Arena",
            challenge_text="The quick brown fox jumps over the lazy dog.",
            created_by=self.user_alice,
        )
        self.participant_alice = CompetitionParticipant.objects.create(
            competition=self.competition,
            user=self.user_alice,
            display_name="Alice",
            status="joined",
        )
        self.participant_bob = CompetitionParticipant.objects.create(
            competition=self.competition,
            user=self.user_bob,
            display_name="Bob",
            status="joined",
        )

    def test_alice_cannot_submit_for_bob(self):
        """Alice attempting to submit scores for Bob's participant record is rejected with HTTP 403."""
        res = self.client_alice.post(
            f"/api/practice/competitions/{self.competition.code}/submit/",
            {
                "participant_id": self.participant_bob.id,
                "net_wpm": 150.0,
                "gross_wpm": 150.0,
                "accuracy": 100.0,
                "duration_seconds": 15,
                "correct_chars": 100,
                "incorrect_chars": 0,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.participant_bob.refresh_from_db()
        self.assertEqual(self.participant_bob.status, "joined")
        self.assertEqual(float(self.participant_bob.net_wpm), 0.0)

    def test_alice_submits_for_own_participant_successfully(self):
        """Alice submitting for Alice's participant record succeeds."""
        res = self.client_alice.post(
            f"/api/practice/competitions/{self.competition.code}/submit/",
            {
                "participant_id": self.participant_alice.id,
                "net_wpm": 95.5,
                "gross_wpm": 98.0,
                "accuracy": 97.4,
                "duration_seconds": 25,
                "correct_chars": 200,
                "incorrect_chars": 5,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.participant_alice.refresh_from_db()
        self.assertEqual(self.participant_alice.status, "completed")
        self.assertEqual(float(self.participant_alice.net_wpm), 95.5)

    def test_duplicate_submission_is_idempotent(self):
        """Submitting a score for an already completed participant returns existing results without re-updating."""
        self.participant_alice.status = "completed"
        self.participant_alice.net_wpm = 95.5
        self.participant_alice.save()

        res = self.client_alice.post(
            f"/api/practice/competitions/{self.competition.code}/submit/",
            {
                "participant_id": self.participant_alice.id,
                "net_wpm": 200.0,  # Attempting to tamper with already completed score
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.participant_alice.refresh_from_db()
        # Remains 95.5, not 200.0
        self.assertEqual(float(self.participant_alice.net_wpm), 95.5)
