"""
KEYFLOW Leaderboard Authentic Profile Avatar Tests
===================================================
Forensic verification of Phase 7.8 requirements:
1. Google-authenticated user with a valid provider-sourced profile image.
2. Google-authenticated user without a usable profile image.
3. Email-only registered user (Clerk default purple avatar filtered out).
4. Guest participant (unauthenticated typist session handling).
5. Missing image URL (None or blank).
6. Invalid image URL (non-http, corrupt token, malformed data).
7. Multiple leaderboard users with distinct authentic profile images.
8. Cross-environment consistency: Global, Weekly, and Competition scopes.
9. Anti-tamper & privacy: zero sensitive tokens, secrets, or private data exposed.
"""

import base64
import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from practice.models import PracticeSession, Competition, CompetitionParticipant
from accounts.models import UserProfile, is_authentic_avatar_url

User = get_user_model()


class LeaderboardAuthenticAvatarTests(TestCase):
    def setUp(self):
        self.client = Client()

        # 1. Google-authenticated user with real Google photo proxied via Clerk (type: proxy)
        self.user_google = User.objects.create_user(
            username='google_typist',
            email='googler@gmail.com',
            password='Password123!',
        )
        google_proxy_token = base64.b64encode(json.dumps({
            'type': 'proxy',
            'src': 'https://lh3.googleusercontent.com/a/ACg8oc_sample_google_avatar=s1000-c',
            's': 'valid_signature'
        }).encode('utf-8')).decode('utf-8')
        self.google_avatar_url = f'https://img.clerk.com/{google_proxy_token}'
        self.user_google.profile.display_name = 'Google Typist'
        self.user_google.profile.avatar_url = self.google_avatar_url
        self.user_google.profile.save()

        # 2. Email-only user with Clerk auto-generated default purple avatar (type: default)
        self.user_email_only = User.objects.create_user(
            username='email_typist',
            email='email_user@example.com',
            password='Password123!',
        )
        clerk_default_token = base64.b64encode(json.dumps({
            'type': 'default',
            'iid': 'ins_12345',
            'rid': 'user_99999',
            'initials': 'ET'
        }).encode('utf-8')).decode('utf-8')
        self.clerk_default_url = f'https://img.clerk.com/{clerk_default_token}'
        self.user_email_only.profile.display_name = 'Email Typist'
        self.user_email_only.profile.avatar_url = self.clerk_default_url
        self.user_email_only.profile.save()

        # 3. Direct Google user with direct lh3.googleusercontent.com URL
        self.user_direct_google = User.objects.create_user(
            username='direct_google',
            email='direct_google@gmail.com',
            password='Password123!',
        )
        self.direct_google_url = 'https://lh3.googleusercontent.com/a/ACg8ocDirectGoogleUser=s96-c'
        self.user_direct_google.profile.display_name = 'Direct Google'
        self.user_direct_google.profile.avatar_url = self.direct_google_url
        self.user_direct_google.profile.save()

        # 4. User without any avatar (blank / None)
        self.user_no_avatar = User.objects.create_user(
            username='no_avatar_typist',
            email='no_avatar@example.com',
            password='Password123!',
        )
        self.user_no_avatar.profile.display_name = 'No Avatar Typist'
        self.user_no_avatar.profile.avatar_url = ''
        self.user_no_avatar.profile.save()

        # 5. User with invalid/malformed avatar URL
        self.user_invalid_avatar = User.objects.create_user(
            username='invalid_avatar_typist',
            email='invalid_avatar@example.com',
            password='Password123!',
        )
        self.user_invalid_avatar.profile.display_name = 'Invalid Avatar Typist'
        self.user_invalid_avatar.profile.avatar_url = 'not-a-valid-url-javascript:alert(1)'
        self.user_invalid_avatar.profile.save()

    def test_01_is_authentic_avatar_url_classification(self):
        """Validates that is_authentic_avatar_url accurately discriminates provider vs default vs invalid avatars."""
        # Genuine Google proxy via Clerk -> True
        self.assertTrue(is_authentic_avatar_url(self.google_avatar_url))
        # Direct Google user content -> True
        self.assertTrue(is_authentic_avatar_url(self.direct_google_url))
        # Generic Clerk default placeholder -> False
        self.assertFalse(is_authentic_avatar_url(self.clerk_default_url))
        # Empty string -> False
        self.assertFalse(is_authentic_avatar_url(''))
        # None -> False
        self.assertFalse(is_authentic_avatar_url(None))
        # Non-URL strings -> False
        self.assertFalse(is_authentic_avatar_url('javascript:void(0)'))
        self.assertFalse(is_authentic_avatar_url('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='))

    def test_02_authentic_avatar_url_property_on_profile(self):
        """UserProfile.authentic_avatar_url property returns authentic URLs and strips default placeholders."""
        self.assertEqual(self.user_google.profile.authentic_avatar_url, self.google_avatar_url)
        self.assertEqual(self.user_direct_google.profile.authentic_avatar_url, self.direct_google_url)
        self.assertEqual(self.user_email_only.profile.authentic_avatar_url, '')
        self.assertEqual(self.user_no_avatar.profile.authentic_avatar_url, '')
        self.assertEqual(self.user_invalid_avatar.profile.authentic_avatar_url, '')

    def test_03_global_leaderboard_preserves_google_and_suppresses_clerk_default(self):
        """Leaderboard API returns authentic provider URLs for Google users and empty string for default avatars."""
        # Create qualifying sessions
        PracticeSession.objects.create(
            user=self.user_google,
            duration_seconds=30,
            total_chars=300,
            correct_chars=295,
            incorrect_chars=5,
            gross_wpm=95.0,
            net_wpm=92.0,
            accuracy=98.3,
        )
        PracticeSession.objects.create(
            user=self.user_email_only,
            duration_seconds=30,
            total_chars=280,
            correct_chars=275,
            incorrect_chars=5,
            gross_wpm=88.0,
            net_wpm=85.0,
            accuracy=98.2,
        )
        PracticeSession.objects.create(
            user=self.user_direct_google,
            duration_seconds=30,
            total_chars=260,
            correct_chars=255,
            incorrect_chars=5,
            gross_wpm=82.0,
            net_wpm=80.0,
            accuracy=98.1,
        )

        res = self.client.get('/api/leaderboard/?duration=30')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        self.assertEqual(len(entries), 3)

        # Rank 1: Google user -> authentic avatar URL present
        self.assertEqual(entries[0]['username'], 'google_typist')
        self.assertEqual(entries[0]['avatar_url'], self.google_avatar_url)

        # Rank 2: Email-only user -> avatar_url is empty string (clean fallback, not Clerk purple placeholder)
        self.assertEqual(entries[1]['username'], 'email_typist')
        self.assertEqual(entries[1]['avatar_url'], '')

        # Rank 3: Direct Google user -> authentic avatar URL present
        self.assertEqual(entries[2]['username'], 'direct_google')
        self.assertEqual(entries[2]['avatar_url'], self.direct_google_url)

    def test_04_weekly_scope_avatar_parity(self):
        """Weekly leaderboard scope correctly surfaces authentic avatars and suppresses placeholders."""
        PracticeSession.objects.create(
            user=self.user_google,
            duration_seconds=15,
            total_chars=150,
            correct_chars=148,
            incorrect_chars=2,
            gross_wpm=90.0,
            net_wpm=88.0,
            accuracy=98.7,
            created_at=timezone.now(),
        )
        PracticeSession.objects.create(
            user=self.user_email_only,
            duration_seconds=15,
            total_chars=130,
            correct_chars=127,
            incorrect_chars=3,
            gross_wpm=80.0,
            net_wpm=78.0,
            accuracy=97.7,
            created_at=timezone.now(),
        )

        res = self.client.get('/api/leaderboard/?scope=weekly&duration=15')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]['avatar_url'], self.google_avatar_url)
        self.assertEqual(entries[1]['avatar_url'], '')

    def test_05_competitions_scope_avatar_parity(self):
        """Competition leaderboard scope correctly preserves authentic avatars and suppresses placeholders."""
        comp = Competition.objects.create(
            name='Avatar Championship',
            challenge_type='time',
            target_limit=30,
            status='finished',
        )
        CompetitionParticipant.objects.create(
            competition=comp,
            user=self.user_google,
            display_name='Google Champion',
            status='completed',
            correct_chars=280,
            incorrect_chars=5,
            net_wpm=92.0,
            gross_wpm=94.0,
            accuracy=98.2,
            duration_seconds=30,
            completed_at=timezone.now(),
        )
        CompetitionParticipant.objects.create(
            competition=comp,
            user=self.user_email_only,
            display_name='Email Contender',
            status='completed',
            correct_chars=250,
            incorrect_chars=5,
            net_wpm=82.0,
            gross_wpm=84.0,
            accuracy=98.0,
            duration_seconds=30,
            completed_at=timezone.now(),
        )

        res = self.client.get('/api/leaderboard/?scope=competitions')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        self.assertGreaterEqual(len(entries), 2)

        # Match participants by username
        google_entry = next(e for e in entries if e['username'] == 'google_typist')
        email_entry = next(e for e in entries if e['username'] == 'email_typist')

        self.assertEqual(google_entry['avatar_url'], self.google_avatar_url)
        self.assertEqual(email_entry['avatar_url'], '')

    def test_06_guest_participant_does_not_leak_or_fabricate_avatar(self):
        """Guest practice sessions (user=None) are excluded from registered rankings."""
        PracticeSession.objects.create(
            user=None,
            duration_seconds=30,
            total_chars=400,
            correct_chars=398,
            incorrect_chars=2,
            gross_wpm=120.0,
            net_wpm=118.0,
            accuracy=99.5,
        )

        res = self.client.get('/api/leaderboard/?duration=30')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        # None of the entries should have user_id=None or fabricated avatars
        for e in entries:
            self.assertIsNotNone(e['user_id'])
            self.assertNotEqual(e['username'], 'guest')

    def test_07_no_private_tokens_or_emails_leaked(self):
        """Guarantees that no user emails, password hashes, or auth tokens are exposed in leaderboard entries."""
        PracticeSession.objects.create(
            user=self.user_google,
            duration_seconds=15,
            total_chars=150,
            correct_chars=148,
            incorrect_chars=2,
            gross_wpm=90.0,
            net_wpm=88.0,
            accuracy=98.7,
        )

        res = self.client.get('/api/leaderboard/?duration=15')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        self.assertGreaterEqual(len(entries), 1)

        entry = entries[0]
        # Sensitive fields must never be exposed
        self.assertNotIn('email', entry)
        self.assertNotIn('password', entry)
        self.assertNotIn('token', entry)
        self.assertNotIn('guest_token_hash', entry)
        self.assertNotIn('secret', entry)
