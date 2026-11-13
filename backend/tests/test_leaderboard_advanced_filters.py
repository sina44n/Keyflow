"""
Advanced Leaderboard Filter Tests
=================================
Verifies:
- Scope: Global, Weekly, Competitions
- Duration: 15s, 30s, 60s, 120s
- Continent: All, Asia, Europe, etc.
- 15-second result NEVER appears in 60-second leaderboard
- Accurate ranking and platform stats
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
from practice.models import PracticeSession, Competition, CompetitionParticipant
from accounts.models import UserProfile

User = get_user_model()


class AdvancedLeaderboardFilterTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create test users with continents
        self.user1 = User.objects.create_user(
            username='asian_sprinter',
            email='asian@test.com',
            password='Password123!',
        )
        self.p1, _ = UserProfile.objects.get_or_create(user=self.user1)
        self.p1.continent = 'asia'
        self.p1.save()

        self.user2 = User.objects.create_user(
            username='european_master',
            email='european@test.com',
            password='Password123!',
        )
        self.p2, _ = UserProfile.objects.get_or_create(user=self.user2)
        self.p2.continent = 'europe'
        self.p2.save()

        # User 1 has a 15s session with 100 WPM
        PracticeSession.objects.create(
            user=self.user1,
            duration_seconds=15,
            total_chars=120,
            correct_chars=118,
            incorrect_chars=2,
            gross_wpm=102.0,
            net_wpm=100.0,
            accuracy=98.0,
        )

        # User 2 has a 60s session with 75 WPM
        PracticeSession.objects.create(
            user=self.user2,
            duration_seconds=60,
            total_chars=400,
            correct_chars=395,
            incorrect_chars=5,
            gross_wpm=78.0,
            net_wpm=75.0,
            accuracy=98.7,
        )

        # Competition setup
        self.competition = Competition.objects.create(
            code='KF-TEST01',
            name='Championship Sprint',
            challenge_text='The quick brown fox jumps over the lazy dog.',
            status='completed',
            is_public=True,
        )
        CompetitionParticipant.objects.create(
            competition=self.competition,
            user=self.user1,
            display_name='Asian Sprinter',
            status='completed',
            net_wpm=110.0,
            gross_wpm=112.0,
            accuracy=98.5,
            duration_seconds=15,
            correct_chars=110,
            incorrect_chars=2,
            completed_at=timezone.now(),
        )

    def test_duration_filtering_strict_isolation(self):
        """A 15-second result must NEVER appear in the 60-second leaderboard."""
        # 15s leaderboard
        res15 = self.client.get('/api/leaderboard/?duration=15')
        self.assertEqual(res15.status_code, 200)
        data15 = res15.json()
        self.assertEqual(len(data15['entries']), 1)
        self.assertEqual(data15['entries'][0]['username'], 'asian_sprinter')
        self.assertEqual(data15['entries'][0]['duration_seconds'], 15)

        # 60s leaderboard
        res60 = self.client.get('/api/leaderboard/?duration=60')
        self.assertEqual(res60.status_code, 200)
        data60 = res60.json()
        self.assertEqual(len(data60['entries']), 1)
        self.assertEqual(data60['entries'][0]['username'], 'european_master')
        self.assertEqual(data60['entries'][0]['duration_seconds'], 60)

        # Confirm 15s sprinter is NOT in 60s leaderboard
        usernames_in_60 = [e['username'] for e in data60['entries']]
        self.assertNotIn('asian_sprinter', usernames_in_60)

    def test_continent_filtering(self):
        """Filtering by continent strictly isolates typists from that continent."""
        # Asia
        res_asia = self.client.get('/api/leaderboard/?continent=asia')
        self.assertEqual(res_asia.status_code, 200)
        entries_asia = res_asia.json()['entries']
        self.assertEqual(len(entries_asia), 1)
        self.assertEqual(entries_asia[0]['username'], 'asian_sprinter')

        # Europe
        res_eu = self.client.get('/api/leaderboard/?continent=europe')
        self.assertEqual(res_eu.status_code, 200)
        entries_eu = res_eu.json()['entries']
        self.assertEqual(len(entries_eu), 1)
        self.assertEqual(entries_eu[0]['username'], 'european_master')

        # Africa (empty)
        res_af = self.client.get('/api/leaderboard/?continent=africa')
        self.assertEqual(res_af.status_code, 200)
        self.assertEqual(len(res_af.json()['entries']), 0)
        self.assertEqual(res_af.json()['stats']['active_competitors'], 0)

    def test_competitions_scope(self):
        """Competitions scope pulls verified competition participants and available competitions."""
        res = self.client.get('/api/leaderboard/?scope=competitions')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['scope'], 'competitions')
        self.assertEqual(len(data['entries']), 1)
        self.assertEqual(data['entries'][0]['username'], 'asian_sprinter')
        self.assertEqual(data['entries'][0]['net_wpm'], 110.0)
        self.assertIsNotNone(data.get('competitions'))
        self.assertGreaterEqual(len(data['competitions']), 1)
        self.assertEqual(data['competitions'][0]['code'], 'KF-TEST01')

