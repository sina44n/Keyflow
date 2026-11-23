from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from practice.models import PracticeSession
from practice.serializers import PracticeSessionSerializer

User = get_user_model()


class PracticeTelemetryDataIntegrityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            username='user_alice',
            email='alice@example.com',
            password='Password123!',
        )
        self.user_b = User.objects.create_user(
            username='user_bob',
            email='bob@example.com',
            password='Password123!',
        )

    def test_record_workstation_page_a_session(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {
            'session_id': 'sess_wa_test_01',
            'session_type': 'timed',
            'source': 'workstation_a',
            'duration_seconds': 15,
            'total_chars': 150,
            'correct_chars': 148,
            'incorrect_chars': 2,
            'gross_wpm': 60.0,
            'net_wpm': 58.0,
            'accuracy': 98.67,
            'character_stats': {
                'a': {'char': 'a', 'total': 10, 'correct': 10, 'wpm': 60},
            },
        }
        res = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['source'], 'workstation_a')
        self.assertEqual(res.data['session_type'], 'timed')
        self.assertEqual(res.data['duration_seconds'], 15)

    def test_record_workstation_page_b_session(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {
            'session_id': 'sess_wb_test_02',
            'session_type': 'timed',
            'source': 'workstation_b',
            'duration_seconds': 30,
            'total_chars': 300,
            'correct_chars': 295,
            'incorrect_chars': 5,
            'gross_wpm': 70.0,
            'net_wpm': 68.0,
            'accuracy': 98.33,
        }
        res = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['source'], 'workstation_b')
        self.assertEqual(res.data['duration_seconds'], 30)

    def test_record_academy_lesson_session(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {
            'session_id': 'sess_acad_test_03',
            'session_type': 'lesson',
            'source': 'academy',
            'stage_id': 2,
            'level_number': 4,
            'duration_seconds': 45,
            'total_chars': 250,
            'correct_chars': 250,
            'incorrect_chars': 0,
            'gross_wpm': 50.0,
            'net_wpm': 50.0,
            'accuracy': 100.0,
        }
        res = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['source'], 'academy')
        self.assertEqual(res.data['session_type'], 'lesson')

    def test_strict_user_isolation(self):
        # Alice creates a session
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=15,
            total_chars=100,
            correct_chars=100,
            incorrect_chars=0,
            gross_wpm=50,
            net_wpm=50,
            accuracy=100,
            client_session_id='alice_private_sess',
            character_stats={'_meta': {'source': 'workstation_a'}},
        )

        # Bob creates a session
        PracticeSession.objects.create(
            user=self.user_b,
            session_type='timed',
            duration_seconds=20,
            total_chars=120,
            correct_chars=120,
            incorrect_chars=0,
            gross_wpm=60,
            net_wpm=60,
            accuracy=100,
            client_session_id='bob_private_sess',
            character_stats={'_meta': {'source': 'workstation_b'}},
        )

        # Alice fetches history: must ONLY see Alice's session
        self.client.force_authenticate(user=self.user_a)
        res_a = self.client.get('/api/practice/history/')
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        data_a = res_a.data.get('results', res_a.data) if isinstance(res_a.data, dict) else res_a.data
        alice_ids = [s['client_session_id'] for s in data_a]
        self.assertIn('alice_private_sess', alice_ids)
        self.assertNotIn('bob_private_sess', alice_ids)

        # Bob fetches history: must ONLY see Bob's session
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.get('/api/practice/history/')
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        data_b = res_b.data.get('results', res_b.data) if isinstance(res_b.data, dict) else res_b.data
        bob_ids = [s['client_session_id'] for s in data_b]
        self.assertIn('bob_private_sess', bob_ids)
        self.assertNotIn('alice_private_sess', bob_ids)
