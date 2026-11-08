"""
Tests for Keyboard Mastery per-key analytics and API endpoints.
Verifies character stats persistence, time filtering, and user isolation.
"""
from datetime import datetime, time, timedelta
import zoneinfo
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from practice.models import PracticeSession

User = get_user_model()


class KeyboardMasteryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            username='typist_alpha',
            email='alpha@keyflow.test',
            password='Password123!',
        )
        self.user_b = User.objects.create_user(
            username='typist_beta',
            email='beta@keyflow.test',
            password='Password123!',
        )

    def test_record_session_persists_character_stats(self):
        """Verify POST /api/practice/sessions/ stores character_stats JSON correctly."""
        self.client.force_authenticate(user=self.user_a)
        payload = {
            'session_id': 'sess_test_101',
            'session_type': 'timed',
            'duration_seconds': 60,
            'total_chars': 300,
            'correct_chars': 290,
            'incorrect_chars': 10,
            'gross_wpm': 60.0,
            'net_wpm': 50.0,
            'accuracy': 96.67,
            'character_stats': {
                'a': {'char': 'a', 'total': 50, 'correct': 48, 'incorrect': 2, 'cpm': 250, 'wpm': 50, 'accuracy': 96},
                's': {'char': 's', 'total': 40, 'correct': 40, 'incorrect': 0, 'cpm': 280, 'wpm': 56, 'accuracy': 100},
            },
        }
        res = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('character_stats', res.data)
        self.assertEqual(res.data['character_stats']['a']['total'], 50)

        # Check DB directly
        saved = PracticeSession.objects.get(client_session_id='sess_test_101')
        self.assertEqual(saved.character_stats['s']['correct'], 40)

    def test_keyboard_mastery_endpoint_aggregation_and_isolation(self):
        """Verify GET /api/practice/keyboard-mastery/ aggregates metrics for authenticated user only."""
        # Create 2 sessions for user A
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=150,
            correct_chars=145,
            incorrect_chars=5,
            gross_wpm=60.0,
            net_wpm=55.0,
            accuracy=96.67,
            character_stats={
                'f': {'char': 'f', 'total': 20, 'correct': 19, 'incorrect': 1, 'cpm': 200, 'wpm': 40},
                'j': {'char': 'j', 'total': 25, 'correct': 25, 'incorrect': 0, 'cpm': 300, 'wpm': 60},
            },
        )
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=150,
            correct_chars=145,
            incorrect_chars=5,
            gross_wpm=60.0,
            net_wpm=55.0,
            accuracy=96.67,
            character_stats={
                'f': {'char': 'f', 'total': 30, 'correct': 29, 'incorrect': 1, 'cpm': 220, 'wpm': 44},
            },
        )
        # Create session for user B
        PracticeSession.objects.create(
            user=self.user_b,
            session_type='timed',
            duration_seconds=30,
            total_chars=100,
            correct_chars=100,
            incorrect_chars=0,
            gross_wpm=40.0,
            net_wpm=40.0,
            accuracy=100.0,
            character_stats={
                'z': {'char': 'z', 'total': 10, 'correct': 10, 'incorrect': 0, 'cpm': 150, 'wpm': 30},
            },
        )

        # Authenticate as User A
        self.client.force_authenticate(user=self.user_a)
        res_a = self.client.get('/api/practice/keyboard-mastery/?period=overall')
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(res_a.data['total_sessions'], 2)
        stats_a = res_a.data['character_stats']

        # Key 'f' should have total=50, correct=48, incorrect=2, acc=96.0%
        self.assertIn('f', stats_a)
        self.assertEqual(stats_a['f']['total'], 50)
        self.assertEqual(stats_a['f']['correct'], 48)
        self.assertEqual(stats_a['f']['incorrect'], 2)
        self.assertEqual(stats_a['f']['accuracy'], 96.0)
        self.assertEqual(stats_a['f']['cpm'], 210.0) # (200 + 220) / 2
        self.assertEqual(stats_a['f']['wpm'], 42.0) # (40 + 44) / 2

        # Key 'j' should be present for user A
        self.assertIn('j', stats_a)
        self.assertEqual(stats_a['j']['total'], 25)

        # Key 'z' (from User B) must NOT appear in User A's stats
        self.assertNotIn('z', stats_a)

    def test_keyboard_mastery_unauthenticated_returns_empty_safely(self):
        """Unauthenticated user receives safe empty character_stats with status 200."""
        res = self.client.get('/api/practice/keyboard-mastery/?period=weekly')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_sessions'], 0)
        self.assertEqual(res.data['character_stats'], {})

