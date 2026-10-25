"""
Unit tests for Practice app endpoints.
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.management import call_command
from knox.models import AuthToken
from practice.models import Passage, PracticeSession

User = get_user_model()


class PracticeAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('seed_passages')
        self.user = User.objects.create_user(
            username='typist_pro',
            email='pro@keyflow.dev',
            password='TestPassword123!',
        )
        _, self.token = AuthToken.objects.create(self.user)
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Token {self.token}'}

    def test_get_passages_list(self):
        """Verify GET /api/practice/passages/ returns all active seeded passages."""
        response = self.client.get('/api/practice/passages/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 7)
        self.assertTrue(any('Flow of Thought' in p['title'] for p in data))

    def test_record_practice_session_guest(self):
        """Verify unauthenticated guests can record practice sessions."""
        response = self.client.post(
            '/api/practice/sessions/',
            {
                'session_type': 'timed',
                'duration_seconds': 60,
                'total_chars': 350,
                'correct_chars': 340,
                'incorrect_chars': 10,
                'gross_wpm': 70.0,
                'net_wpm': 68.0,
                'accuracy': 97.1,
                'error_count': 2,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(float(data['net_wpm']), 68.0)
        self.assertEqual(data['username'], 'Guest')

    def test_record_practice_session_authenticated(self):
        """Verify authenticated users record session associated with their user profile."""
        passage = Passage.objects.first()
        response = self.client.post(
            '/api/practice/sessions/',
            {
                'session_type': 'passage',
                'duration_seconds': 45,
                'total_chars': 280,
                'correct_chars': 275,
                'incorrect_chars': 5,
                'gross_wpm': 74.5,
                'net_wpm': 73.3,
                'accuracy': 98.2,
                'error_count': 1,
                'passage_id': passage.id,
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['username'], 'typist_pro')

        # Check history endpoint
        hist_response = self.client.get('/api/practice/history/', **self.auth_headers)
        self.assertEqual(hist_response.status_code, 200)
        hist_data = hist_response.json()
        self.assertGreaterEqual(len(hist_data.get('results', hist_data)), 1)
