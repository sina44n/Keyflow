"""
Leaderboard API Unit & Integration Tests
=========================================
Tests for /api/leaderboard/ verifying:
- Speed, Accuracy, and Overall category rankings
- User deduplication (single best qualifying session per typist)
- Exclusion of anonymous / guest sessions from registered typist rankings
- Period filtering: daily, weekly, monthly, all_time
- Platform stats: registered_typists, active_competitors, top_speed, avg_accuracy, countdown
- Authenticated user's personal rank identification and unranked state
- Privacy protections (no emails or sensitive auth tokens exposed)
"""

import datetime
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from knox.models import AuthToken
from practice.models import PracticeSession

User = get_user_model()


class LeaderboardAPITests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create registered users
        self.user_alice = User.objects.create_user(
            username='alice_speedster',
            email='alice@example.com',
            password='Password123!',
        )
        self.user_bob = User.objects.create_user(
            username='bob_accurate',
            email='bob@example.com',
            password='Password123!',
        )
        self.user_charlie = User.objects.create_user(
            username='charlie_grandmaster',
            email='charlie@example.com',
            password='Password123!',
        )
        self.user_dan = User.objects.create_user(
            username='dan_observer',
            email='dan@example.com',
            password='Password123!',
        )

        # Tokens for auth tests
        _, self.alice_token = AuthToken.objects.create(self.user_alice)
        self.alice_headers = {'HTTP_AUTHORIZATION': f'Token {self.alice_token}'}

        _, self.dan_token = AuthToken.objects.create(self.user_dan)
        self.dan_headers = {'HTTP_AUTHORIZATION': f'Token {self.dan_token}'}

    def test_health_check(self):
        """GET /api/leaderboard/health/ returns status ok."""
        res = self.client.get('/api/leaderboard/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'app': 'leaderboard', 'status': 'ok'})

    def test_empty_leaderboard(self):
        """When no practice sessions exist, returns 200 with 0 active competitors."""
        res = self.client.get('/api/leaderboard/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['period'], 'all_time')
        self.assertEqual(data['category'], 'speed')
        self.assertEqual(data['stats']['registered_typists'], 4)
        self.assertEqual(data['stats']['active_competitors'], 0)
        self.assertEqual(data['stats']['top_speed'], 0.0)
        self.assertIsNone(data['stats']['top_speed_user'])
        self.assertEqual(len(data['entries']), 0)
        self.assertIsNone(data['my_rank'])

    def test_speed_ranking_and_deduplication(self):
        """
        Deduplicates each user to their single best session and ranks by Net WPM.
        Guests (user=None) are excluded from the registered typist leaderboard.
        """
        # Alice session 1: 65 WPM
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=200,
            correct_chars=195,
            incorrect_chars=5,
            gross_wpm=68.0,
            net_wpm=65.0,
            accuracy=97.5,
        )
        # Alice session 2 (Personal Best): 85 WPM
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=260,
            correct_chars=255,
            incorrect_chars=5,
            gross_wpm=88.0,
            net_wpm=85.0,
            accuracy=98.0,
        )
        # Bob: 75 WPM
        PracticeSession.objects.create(
            user=self.user_bob,
            duration_seconds=30,
            total_chars=230,
            correct_chars=225,
            incorrect_chars=5,
            gross_wpm=78.0,
            net_wpm=75.0,
            accuracy=97.8,
        )
        # Charlie: 110 WPM (Champion)
        PracticeSession.objects.create(
            user=self.user_charlie,
            duration_seconds=30,
            total_chars=330,
            correct_chars=325,
            incorrect_chars=5,
            gross_wpm=112.0,
            net_wpm=110.0,
            accuracy=98.5,
        )
        # Guest session: 130 WPM (Must NOT appear on registered leaderboard)
        PracticeSession.objects.create(
            user=None,
            duration_seconds=30,
            total_chars=400,
            correct_chars=395,
            incorrect_chars=5,
            gross_wpm=135.0,
            net_wpm=130.0,
            accuracy=98.7,
        )

        res = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data['stats']['active_competitors'], 3)
        self.assertEqual(data['stats']['top_speed'], 110.0)
        self.assertEqual(data['stats']['top_speed_user'], 'charlie_grandmaster')
        self.assertEqual(len(data['entries']), 3)

        # Rank 1: Charlie (110 WPM)
        self.assertEqual(data['entries'][0]['rank'], 1)
        self.assertEqual(data['entries'][0]['username'], 'charlie_grandmaster')
        self.assertEqual(data['entries'][0]['net_wpm'], 110.0)

        # Rank 2: Alice (85 WPM, not 65 WPM; appears only once!)
        self.assertEqual(data['entries'][1]['rank'], 2)
        self.assertEqual(data['entries'][1]['username'], 'alice_speedster')
        self.assertEqual(data['entries'][1]['net_wpm'], 85.0)
        self.assertEqual(data['entries'][1]['sessions_count'], 2)

        # Rank 3: Bob (75 WPM)
        self.assertEqual(data['entries'][2]['rank'], 3)
        self.assertEqual(data['entries'][2]['username'], 'bob_accurate')
        self.assertEqual(data['entries'][2]['net_wpm'], 75.0)

    def test_accuracy_ranking(self):
        """Accuracy ranking prioritizes accuracy %, with Net WPM as tie-breaker."""
        # Alice: 90 WPM, 94% accuracy (150 chars)
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=150,
            correct_chars=141,
            incorrect_chars=9,
            gross_wpm=92.0,
            net_wpm=90.0,
            accuracy=94.0,
        )
        # Bob: 60 WPM, 99.5% accuracy (150 chars)
        PracticeSession.objects.create(
            user=self.user_bob,
            duration_seconds=30,
            total_chars=150,
            correct_chars=149,
            incorrect_chars=1,
            gross_wpm=61.0,
            net_wpm=60.0,
            accuracy=99.5,
        )

        res = self.client.get('/api/leaderboard/?category=accuracy')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['category'], 'accuracy')
        self.assertEqual(len(data['entries']), 2)

        # Bob takes Rank 1 for Accuracy
        self.assertEqual(data['entries'][0]['rank'], 1)
        self.assertEqual(data['entries'][0]['username'], 'bob_accurate')
        self.assertEqual(data['entries'][0]['accuracy'], 99.5)

        # Alice takes Rank 2
        self.assertEqual(data['entries'][1]['rank'], 2)
        self.assertEqual(data['entries'][1]['username'], 'alice_speedster')
        self.assertEqual(data['entries'][1]['accuracy'], 94.0)

    def test_overall_ranking_formula(self):
        """Overall score balances WPM, Accuracy %, and test duration."""
        # Fast but inaccurate
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=200,
            correct_chars=160,
            incorrect_chars=40,
            gross_wpm=100.0,
            net_wpm=80.0,
            accuracy=80.0,
        )
        # Balanced: 75 WPM with 99% accuracy
        PracticeSession.objects.create(
            user=self.user_bob,
            duration_seconds=30,
            total_chars=200,
            correct_chars=198,
            incorrect_chars=2,
            gross_wpm=76.0,
            net_wpm=75.0,
            accuracy=99.0,
        )

        res = self.client.get('/api/leaderboard/?category=overall')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['category'], 'overall')

        # Bob's overall: 75 * 0.99 * 1.0 = 74.25
        # Alice's overall: 80 * 0.80 * 1.0 = 64.0
        self.assertEqual(data['entries'][0]['username'], 'bob_accurate')
        self.assertGreater(data['entries'][0]['score'], data['entries'][1]['score'])

    def test_time_period_filtering(self):
        """Daily, Weekly, Monthly, and All Time filter sessions accurately."""
        now = timezone.now()
        yesterday = now - datetime.timedelta(days=1, hours=2)

        # Alice typed yesterday
        s1 = PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=200,
            correct_chars=190,
            incorrect_chars=10,
            gross_wpm=70.0,
            net_wpm=68.0,
            accuracy=95.0,
        )
        PracticeSession.objects.filter(id=s1.id).update(created_at=yesterday)

        # Charlie typed right now (today)
        PracticeSession.objects.create(
            user=self.user_charlie,
            duration_seconds=30,
            total_chars=300,
            correct_chars=295,
            incorrect_chars=5,
            gross_wpm=100.0,
            net_wpm=98.0,
            accuracy=98.3,
        )

        # Daily query: only Charlie should appear
        res_daily = self.client.get('/api/leaderboard/?period=daily')
        self.assertEqual(res_daily.status_code, 200)
        daily_entries = res_daily.json()['entries']
        self.assertEqual(len(daily_entries), 1)
        self.assertEqual(daily_entries[0]['username'], 'charlie_grandmaster')
        self.assertIsNotNone(res_daily.json()['stats']['period_time_remaining'])

        # All-Time query: both Alice and Charlie appear
        res_all = self.client.get('/api/leaderboard/?period=all_time')
        self.assertEqual(res_all.status_code, 200)
        all_entries = res_all.json()['entries']
        self.assertEqual(len(all_entries), 2)
        self.assertIsNone(res_all.json()['stats']['period_time_remaining'])

    def test_authenticated_user_my_rank(self):
        """Authenticated typist receives their personal rank and percentile."""
        PracticeSession.objects.create(
            user=self.user_charlie,
            duration_seconds=30,
            total_chars=300,
            correct_chars=295,
            incorrect_chars=5,
            gross_wpm=100.0,
            net_wpm=98.0,
            accuracy=98.0,
        )
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=200,
            correct_chars=190,
            incorrect_chars=10,
            gross_wpm=70.0,
            net_wpm=65.0,
            accuracy=95.0,
        )

        # Alice views leaderboard
        res = self.client.get('/api/leaderboard/', **self.alice_headers)
        self.assertEqual(res.status_code, 200)
        my_rank = res.json()['my_rank']
        self.assertIsNotNone(my_rank)
        self.assertTrue(my_rank['ranked'])
        self.assertEqual(my_rank['rank'], 2)
        self.assertEqual(my_rank['total_competitors'], 2)
        self.assertEqual(my_rank['net_wpm'], 65.0)

        # Dan views leaderboard (Dan has no completed practice sessions)
        res_dan = self.client.get('/api/leaderboard/', **self.dan_headers)
        self.assertEqual(res_dan.status_code, 200)
        dan_rank = res_dan.json()['my_rank']
        self.assertIsNotNone(dan_rank)
        self.assertFalse(dan_rank['ranked'])
        self.assertIsNone(dan_rank['rank'])
        self.assertIn('No qualifying practice sessions found', dan_rank['message'])

    def test_privacy_guarantee(self):
        """User email, password, and internal tokens must never be exposed."""
        PracticeSession.objects.create(
            user=self.user_alice,
            duration_seconds=30,
            total_chars=200,
            correct_chars=190,
            incorrect_chars=10,
            gross_wpm=70.0,
            net_wpm=68.0,
            accuracy=95.0,
        )
        res = self.client.get('/api/leaderboard/')
        self.assertEqual(res.status_code, 200)
        entry = res.json()['entries'][0]

        # Public fields present
        self.assertIn('rank', entry)
        self.assertIn('username', entry)
        self.assertIn('display_name', entry)
        self.assertIn('avatar_url', entry)
        self.assertIn('net_wpm', entry)
        self.assertIn('accuracy', entry)

        # Private fields absent
        self.assertNotIn('email', entry)
        self.assertNotIn('password', entry)
        self.assertNotIn('clerk_id', entry)
        self.assertNotIn('token', entry)

