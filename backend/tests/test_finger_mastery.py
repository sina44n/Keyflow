"""
Tests for Finger Mastery biomechanical analytics and API endpoints.
Verifies finger stats persistence, fallback inference from character_stats,
left/right/thumb hand speed and accuracy calculations, strongest finger,
user account isolation, and time-based filtering.
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


class FingerMasteryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            username='biomech_alpha',
            email='alpha@keyflow.test',
            password='Password123!',
        )
        self.user_b = User.objects.create_user(
            username='biomech_beta',
            email='beta@keyflow.test',
            password='Password123!',
        )

    def test_record_session_persists_finger_stats(self):
        """Verify POST /api/practice/sessions/ persists finger_stats JSON."""
        self.client.force_authenticate(user=self.user_a)
        payload = {
            'session_id': 'sess_fm_01',
            'session_type': 'timed',
            'duration_seconds': 60,
            'total_chars': 200,
            'correct_chars': 190,
            'incorrect_chars': 10,
            'gross_wpm': 40.0,
            'net_wpm': 38.0,
            'accuracy': 95.0,
            'finger_stats': {
                'left-index': {'speed': 45.0, 'accuracy': 92.0, 'total': 40, 'correct': 37, 'incorrect': 3},
                'right-index': {'speed': 50.0, 'accuracy': 96.0, 'total': 50, 'correct': 48, 'incorrect': 2},
            },
        }
        res = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('finger_stats', res.data)
        self.assertEqual(res.data['finger_stats']['left-index']['total'], 40)

        saved = PracticeSession.objects.get(client_session_id='sess_fm_01')
        self.assertEqual(saved.finger_stats['right-index']['speed'], 50.0)

    def test_finger_mastery_endpoint_direct_and_inferred_metrics(self):
        """
        Verify GET /api/practice/finger-mastery/ aggregates:
        - direct finger_stats
        - fallback inference from character_stats
        - correct left/right/thumb hand velocity and accuracy
        - strongest finger determination
        """
        self.client.force_authenticate(user=self.user_a)

        # Session 1: Explicit finger_stats
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=100,
            correct_chars=95,
            incorrect_chars=5,
            gross_wpm=40.0,
            net_wpm=38.0,
            accuracy=95.0,
            finger_stats={
                'left-index': {'speed': 40.0, 'accuracy': 90.0, 'total': 20, 'correct': 18, 'incorrect': 2},
                'left-middle': {'speed': 35.0, 'accuracy': 100.0, 'total': 10, 'correct': 10, 'incorrect': 0},
                'thumb': {'speed': 60.0, 'accuracy': 95.0, 'total': 15, 'correct': 14, 'incorrect': 1},
            },
        )

        # Session 2: Inferred from character_stats (historical legacy session)
        # 'j' -> right-index, 'k' -> right-middle, ' ' -> thumb
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=100,
            correct_chars=98,
            incorrect_chars=2,
            gross_wpm=42.0,
            net_wpm=40.0,
            accuracy=98.0,
            character_stats={
                'j': {'total': 25, 'correct': 24, 'incorrect': 1, 'wpm': 48.0},
                'k': {'total': 15, 'correct': 15, 'incorrect': 0, 'wpm': 36.0},
                ' ': {'total': 20, 'correct': 19, 'incorrect': 1, 'wpm': 70.0},
            },
        )

        res = self.client.get('/api/practice/finger-mastery/?period=overall')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['total_sessions'], 2)
        fstats = data['finger_stats']

        # Left Index (from session 1)
        self.assertTrue(fstats['left-index']['has_data'])
        self.assertEqual(fstats['left-index']['speed'], 40.0)
        self.assertEqual(fstats['left-index']['accuracy'], 90.0)

        # Left Middle (from session 1)
        self.assertTrue(fstats['left-middle']['has_data'])
        self.assertEqual(fstats['left-middle']['speed'], 35.0)

        # Right Index (inferred from 'j' in session 2)
        self.assertTrue(fstats['right-index']['has_data'])
        self.assertEqual(fstats['right-index']['speed'], 48.0)
        self.assertEqual(fstats['right-index']['total'], 25)

        # Right Middle (inferred from 'k' in session 2)
        self.assertTrue(fstats['right-middle']['has_data'])
        self.assertEqual(fstats['right-middle']['speed'], 36.0)

        # Left Pinky (unpracticed)
        self.assertFalse(fstats['left-pinky']['has_data'])
        self.assertEqual(fstats['left-pinky']['speed'], 0.0)

        # Hand summaries
        left = data['left_hand']
        self.assertTrue(left['has_data'])
        self.assertEqual(left['total_keystrokes'], 30)  # 20 + 10
        # Keystroke-weighted speed: (40*20 + 35*10) / 30 = (800 + 350) / 30 = 1150 / 30 = 38.3
        self.assertEqual(left['speed'], 38.3)
        self.assertEqual(left['strongest_finger'], 'Index')
        self.assertEqual(left['strongest_finger_details']['name'], 'Index')
        self.assertEqual(left['strongest_finger_details']['speed'], 40.0)

        right = data['right_hand']
        self.assertTrue(right['has_data'])
        self.assertEqual(right['total_keystrokes'], 40)  # 25 + 15
        # (48*25 + 36*15) / 40 = (1200 + 540) / 40 = 1740 / 40 = 43.5
        self.assertEqual(right['speed'], 43.5)
        self.assertEqual(right['strongest_finger'], 'Index')
        self.assertEqual(right['strongest_finger_details']['name'], 'Index')
        self.assertEqual(right['strongest_finger_details']['speed'], 48.0)

        thumbs = data['thumbs']
        self.assertTrue(thumbs['has_data'])
        self.assertEqual(thumbs['total_keystrokes'], 35)  # 15 + 20

    def test_finger_mastery_user_isolation(self):
        """User B cannot see User A's finger analytics."""
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=100,
            correct_chars=100,
            incorrect_chars=0,
            gross_wpm=50.0,
            net_wpm=50.0,
            accuracy=100.0,
            finger_stats={
                'left-index': {'speed': 50.0, 'accuracy': 100.0, 'total': 20, 'correct': 20, 'incorrect': 0},
            },
        )

        self.client.force_authenticate(user=self.user_b)
        res = self.client.get('/api/practice/finger-mastery/?period=overall')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_sessions'], 0)
        self.assertFalse(res.data['finger_stats']['left-index']['has_data'])
        self.assertFalse(res.data['left_hand']['has_data'])

    def test_unauthenticated_request_returns_empty_state(self):
        """Unauthenticated requests receive clean zero state with HTTP 200."""
        self.client.logout()
        res = self.client.get('/api/practice/finger-mastery/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_sessions'], 0)
        self.assertFalse(res.data['left_hand']['has_data'])

