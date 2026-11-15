"""
KEYFLOW Leaderboard Authentic Profile Avatar Tests
===================================================
Forensic verification of Phase 7.8 & 7.9 requirements:
1. Google-authenticated user with a valid provider-sourced profile image.
2. Genuine Clerk proxy wrapping a Google profile image (type: proxy, src: *.googleusercontent.com).
3. Clerk default purple avatar rejected (type: default).
4. Arbitrary external HTTPS image URLs from non-Google domains rejected.
5. Misleading Google-like URLs (spoofed subdomains, fake query/path) rejected.
6. Insecure HTTP image URLs rejected.
7. Unsafe schemes (javascript:, data:, blob:) rejected.
8. Clerk proxies wrapping non-Google external domains rejected.
9. Malformed, whitespace, and empty URLs rejected.
10. Cross-environment consistency: Global, Weekly, and Competition scopes.
11. Privacy & Anti-Tamper: zero sensitive tokens, secrets, or private data exposed.
"""

import base64
import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from practice.models import PracticeSession, Competition, CompetitionParticipant
from accounts.models import UserProfile, is_authentic_avatar_url, is_google_avatar_host

User = get_user_model()


class LeaderboardAuthenticAvatarTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Helper to build Clerk tokens
        def make_clerk(data):
            return 'https://img.clerk.com/' + base64.b64encode(json.dumps(data).encode()).decode()

        self.make_clerk = make_clerk

        # 1. Google-authenticated user with real Google photo proxied via Clerk (type: proxy)
        self.user_google = User.objects.create_user(
            username='google_typist',
            email='googler@gmail.com',
            password='Password123!',
        )
        self.google_avatar_url = make_clerk({
            'type': 'proxy',
            'src': 'https://lh3.googleusercontent.com/a/ACg8oc_sample_google_avatar=s1000-c',
            's': 'valid_signature'
        })
        self.user_google.profile.display_name = 'Google Typist'
        self.user_google.profile.avatar_url = self.google_avatar_url
        self.user_google.profile.save()

        # 2. Email-only user with Clerk auto-generated default purple avatar (type: default)
        self.user_email_only = User.objects.create_user(
            username='email_typist',
            email='email_user@example.com',
            password='Password123!',
        )
        self.clerk_default_url = make_clerk({
            'type': 'default',
            'iid': 'ins_12345',
            'rid': 'user_99999',
            'initials': 'ET'
        })
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

        # 4. User with arbitrary external HTTPS avatar (e.g. attacker or external host)
        self.user_external_avatar = User.objects.create_user(
            username='external_typist',
            email='external@example.com',
            password='Password123!',
        )
        self.user_external_avatar.profile.display_name = 'External Typist'
        self.user_external_avatar.profile.avatar_url = 'https://evil-site.com/avatar.png'
        self.user_external_avatar.profile.save()

        # 5. User without any avatar (blank / None)
        self.user_no_avatar = User.objects.create_user(
            username='no_avatar_typist',
            email='no_avatar@example.com',
            password='Password123!',
        )
        self.user_no_avatar.profile.display_name = 'No Avatar Typist'
        self.user_no_avatar.profile.avatar_url = ''
        self.user_no_avatar.profile.save()

        # 6. User with invalid/malformed avatar URL
        self.user_invalid_avatar = User.objects.create_user(
            username='invalid_avatar_typist',
            email='invalid_avatar@example.com',
            password='Password123!',
        )
        self.user_invalid_avatar.profile.display_name = 'Invalid Avatar Typist'
        self.user_invalid_avatar.profile.avatar_url = 'not-a-valid-url-javascript:alert(1)'
        self.user_invalid_avatar.profile.save()

    def test_01_is_google_avatar_host_domain_validation(self):
        """is_google_avatar_host strictly validates Google profile-image CDN domains over HTTPS."""
        # Genuine Google CDN domains
        self.assertTrue(is_google_avatar_host('https://lh3.googleusercontent.com/a/test=s96-c'))
        self.assertTrue(is_google_avatar_host('https://lh6.googleusercontent.com/photo.jpg'))
        self.assertTrue(is_google_avatar_host('https://googleusercontent.com/user/1'))
        self.assertTrue(is_google_avatar_host('https://lh3.ggpht.com/pic.jpg'))

        # Insecure HTTP scheme rejected
        self.assertFalse(is_google_avatar_host('http://lh3.googleusercontent.com/a/test=s96-c'))

        # Non-Google domains rejected
        self.assertFalse(is_google_avatar_host('https://evil-site.com/photo.jpg'))
        self.assertFalse(is_google_avatar_host('https://github.com/avatar.png'))

        # Subdomain spoofing attempts rejected
        self.assertFalse(is_google_avatar_host('https://googleusercontent.com.attacker.com/pic.png'))
        self.assertFalse(is_google_avatar_host('https://lh3.googleusercontent.com.evil.org/pic.png'))

        # Misleading paths or queries on third-party hosts rejected
        self.assertFalse(is_google_avatar_host('https://attacker.com/lh3.googleusercontent.com/pic.jpg'))
        self.assertFalse(is_google_avatar_host('https://attacker.com/avatar.jpg?domain=googleusercontent.com'))

    def test_02_is_authentic_avatar_url_comprehensive_matrix(self):
        """is_authentic_avatar_url enforces Google source authenticity across all URL categories."""
        # 1. Genuine Google direct URL -> ACCEPT
        self.assertTrue(is_authentic_avatar_url(self.direct_google_url))

        # 2. Genuine Clerk proxy wrapping Google image -> ACCEPT
        self.assertTrue(is_authentic_avatar_url(self.google_avatar_url))

        # 3. Clerk default avatar -> REJECT
        self.assertFalse(is_authentic_avatar_url(self.clerk_default_url))

        # 4. Arbitrary external HTTPS image from unrelated domain -> REJECT
        self.assertFalse(is_authentic_avatar_url('https://evil-site.com/avatar.png'))
        self.assertFalse(is_authentic_avatar_url('https://cdn.example.org/photo.jpg'))

        # 5. Misleading Google-like URLs -> REJECT
        self.assertFalse(is_authentic_avatar_url('https://attacker.com/fake/lh3.googleusercontent.com/avatar.jpg'))
        self.assertFalse(is_authentic_avatar_url('https://googleusercontent.com.evil.com/pic.jpg'))

        # 6. HTTP image URL -> REJECT
        self.assertFalse(is_authentic_avatar_url('http://lh3.googleusercontent.com/a/test.png'))

        # 7. javascript: URL -> REJECT
        self.assertFalse(is_authentic_avatar_url('javascript:alert(1)'))

        # 8. data: and blob: URLs -> REJECT
        self.assertFalse(is_authentic_avatar_url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='))
        self.assertFalse(is_authentic_avatar_url('blob:https://keyflow.app/1234-5678'))

        # 9. Clerk proxy wrapping attacker/non-Google URL -> REJECT
        malicious_clerk_proxy = self.make_clerk({
            'type': 'proxy',
            'src': 'https://evil-site.com/malicious.png',
        })
        self.assertFalse(is_authentic_avatar_url(malicious_clerk_proxy))

        # 10. Malformed and empty URLs -> REJECT
        self.assertFalse(is_authentic_avatar_url(''))
        self.assertFalse(is_authentic_avatar_url('   '))
        self.assertFalse(is_authentic_avatar_url(None))
        self.assertFalse(is_authentic_avatar_url('https:///invalid-domain'))

    def test_03_profile_property_enforces_google_source_only(self):
        """UserProfile.authentic_avatar_url returns URLs only for genuine Google sources."""
        self.assertEqual(self.user_google.profile.authentic_avatar_url, self.google_avatar_url)
        self.assertEqual(self.user_direct_google.profile.authentic_avatar_url, self.direct_google_url)

        # Arbitrary external avatar must resolve to empty string fallback
        self.assertEqual(self.user_external_avatar.profile.authentic_avatar_url, '')

        # Clerk default avatar must resolve to empty string fallback
        self.assertEqual(self.user_email_only.profile.authentic_avatar_url, '')

        # Blank and invalid must resolve to empty string fallback
        self.assertEqual(self.user_no_avatar.profile.authentic_avatar_url, '')
        self.assertEqual(self.user_invalid_avatar.profile.authentic_avatar_url, '')

    def test_04_global_leaderboard_rejects_external_avatars_and_serves_google(self):
        """Global Leaderboard API returns genuine Google avatars and empty string for non-Google/default users."""
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
            user=self.user_external_avatar,
            duration_seconds=30,
            total_chars=290,
            correct_chars=285,
            incorrect_chars=5,
            gross_wpm=90.0,
            net_wpm=88.0,
            accuracy=98.2,
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
        self.assertEqual(len(entries), 4)

        # Rank 1: Google user -> authentic avatar URL present
        self.assertEqual(entries[0]['username'], 'google_typist')
        self.assertEqual(entries[0]['avatar_url'], self.google_avatar_url)

        # Rank 2: External avatar user -> arbitrary external URL suppressed, returns ''
        self.assertEqual(entries[1]['username'], 'external_typist')
        self.assertEqual(entries[1]['avatar_url'], '')

        # Rank 3: Email-only user -> Clerk purple placeholder suppressed, returns ''
        self.assertEqual(entries[2]['username'], 'email_typist')
        self.assertEqual(entries[2]['avatar_url'], '')

        # Rank 4: Direct Google user -> authentic avatar URL present
        self.assertEqual(entries[3]['username'], 'direct_google')
        self.assertEqual(entries[3]['avatar_url'], self.direct_google_url)

    def test_05_weekly_scope_avatar_parity(self):
        """Weekly leaderboard scope correctly surfaces authentic Google avatars and suppresses external URLs."""
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
            user=self.user_external_avatar,
            duration_seconds=15,
            total_chars=140,
            correct_chars=137,
            incorrect_chars=3,
            gross_wpm=85.0,
            net_wpm=83.0,
            accuracy=97.8,
            created_at=timezone.now(),
        )

        res = self.client.get('/api/leaderboard/?scope=weekly&duration=15')
        self.assertEqual(res.status_code, 200)
        entries = res.json().get('entries', [])
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]['avatar_url'], self.google_avatar_url)
        self.assertEqual(entries[1]['avatar_url'], '')

    def test_06_competitions_scope_avatar_parity(self):
        """Competition leaderboard scope correctly preserves authentic Google avatars and suppresses external URLs."""
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
            user=self.user_external_avatar,
            display_name='External Contender',
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

        google_entry = next(e for e in entries if e['username'] == 'google_typist')
        external_entry = next(e for e in entries if e['username'] == 'external_typist')

        self.assertEqual(google_entry['avatar_url'], self.google_avatar_url)
        self.assertEqual(external_entry['avatar_url'], '')

    def test_07_guest_participant_does_not_leak_or_fabricate_avatar(self):
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
        for e in entries:
            self.assertIsNotNone(e['user_id'])
            self.assertNotEqual(e['username'], 'guest')

    def test_08_no_private_tokens_or_emails_leaked(self):
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
        self.assertNotIn('email', entry)
        self.assertNotIn('password', entry)
        self.assertNotIn('token', entry)
        self.assertNotIn('guest_token_hash', entry)
        self.assertNotIn('secret', entry)
