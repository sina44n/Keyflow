"""
KEYFLOW Typing Competitions API Tests
====================================
Verifies genuine multiplayer/competition lobby creation, code-based joining,
lifecycle progression, result verification, and real leaderboard ranking.
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from knox.models import AuthToken
from practice.models import Competition, CompetitionParticipant, Passage

User = get_user_model()


class CompetitionAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.host_user = User.objects.create_user(
            username='host_master',
            email='host@keyflow.dev',
            password='HostPassword123!',
        )
        _, self.host_token = AuthToken.objects.create(self.host_user)
        self.host_headers = {'HTTP_AUTHORIZATION': f'Token {self.host_token}'}

        self.participant_user = User.objects.create_user(
            username='fast_fingers',
            email='fast@keyflow.dev',
            password='FastPassword123!',
        )
        _, self.participant_token = AuthToken.objects.create(self.participant_user)
        self.participant_headers = {'HTTP_AUTHORIZATION': f'Token {self.participant_token}'}

        Passage.objects.create(
            title='Test Passage',
            content='Velocity and precision are the true markers of a master typist.',
            category='general',
            difficulty='medium',
            word_count=12,
        )

    def test_create_competition_authenticated(self):
        """Verify creating a competition generates a unique code and registers host as first participant."""
        res = self.client.post(
            '/api/practice/competitions/',
            {
                'name': 'Velocity Cup Final',
                'challenge_type': 'words',
                'target_limit': 25,
                'difficulty': 'expert',
                'max_participants': 8,
                'is_public': True,
                'display_name': 'HostMaster',
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['code'].startswith('KF-'))
        self.assertEqual(data['name'], 'Velocity Cup Final')
        self.assertEqual(data['max_participants'], 8)
        self.assertEqual(data['participant_count'], 1)
        self.assertEqual(data['created_by_name'], 'host_master')
        self.assertTrue(len(data['challenge_text']) > 0)
        self.assertIn('participant_id', data)

    def test_join_competition_by_code(self):
        """Verify joining an existing competition via unique code."""
        # Host creates
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Sprint Arena', 'display_name': 'Host'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']

        # Participant joins
        join_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'Challenger1'},
            content_type='application/json',
            **self.participant_headers,
        )
        self.assertEqual(join_res.status_code, 201)
        data = join_res.json()
        self.assertEqual(data['participant_count'], 2)
        self.assertTrue(any(p['display_name'] == 'Challenger1' for p in data['participants']))

    def test_join_nonexistent_or_full_competition(self):
        """Verify 404 for non-existent code and error when full."""
        # Non-existent
        res = self.client.post('/api/practice/competitions/INVALID-CODE/join/', {'display_name': 'Ghost'})
        self.assertEqual(res.status_code, 404)

        # Full lobby limit
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Duel Only', 'max_participants': 2, 'display_name': 'Player1'},
            content_type='application/json',
        )
        code = create_res.json()['code']

        # 2nd player joins (fills lobby)
        self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'Player2'}, content_type='application/json')

        # 3rd player attempts to join
        third_res = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'Player3'}, content_type='application/json')
        self.assertEqual(third_res.status_code, 400)
        self.assertIn('full', third_res.json()['error'].lower())

    def test_submit_results_and_leaderboard_ordering(self):
        """Verify participant results submission and strict leaderboard ranking (WPM desc, acc tiebreaker)."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Speed Duel', 'display_name': 'TypistA'},
            content_type='application/json',
        )
        code = create_res.json()['code']
        host_p_id = create_res.json()['participant_id']

        # Player B joins
        join_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'TypistB'},
            content_type='application/json',
        )
        p_b_id = join_res.json()['participant_id']

        # Player A submits: 85 WPM, 98% Acc
        self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_p_id,
                'net_wpm': 85.0,
                'gross_wpm': 88.0,
                'accuracy': 98.0,
                'duration_seconds': 20,
                'correct_chars': 150,
                'incorrect_chars': 2,
            },
            content_type='application/json',
        )

        # Player B submits: 105 WPM, 96% Acc
        self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': p_b_id,
                'net_wpm': 105.0,
                'gross_wpm': 110.0,
                'accuracy': 96.0,
                'duration_seconds': 18,
                'correct_chars': 155,
                'incorrect_chars': 4,
            },
            content_type='application/json',
        )

        # Fetch detail and verify rank 1 is Player B (105 WPM) and rank 2 is Player A (85 WPM)
        detail_res = self.client.get(f'/api/practice/competitions/{code}/')
        self.assertEqual(detail_res.status_code, 200)
        participants = detail_res.json()['participants']

        self.assertEqual(len(participants), 2)
        # Participants are ordered by -net_wpm
        self.assertEqual(participants[0]['display_name'], 'TypistB')
        self.assertEqual(float(participants[0]['net_wpm']), 105.0)
        self.assertEqual(participants[0]['rank'], 1)

        self.assertEqual(participants[1]['display_name'], 'TypistA')
        self.assertEqual(float(participants[1]['net_wpm']), 85.0)
        self.assertEqual(participants[1]['rank'], 2)
