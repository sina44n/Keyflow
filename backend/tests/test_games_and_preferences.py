"""
Unit and integration tests for User Preferences and Arcade Games persistence.
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from knox.models import AuthToken
from games.models import GameSession
from accounts.models import UserPreferences

User = get_user_model()


class PreferencesAndGamesTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='flow_master',
            email='master@keyflow.dev',
            password='ComplexPassword123!',
        )
        _, self.token = AuthToken.objects.create(self.user)
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Token {self.token}'}

    def test_user_preferences_defaults_and_update(self):
        """Verify default preferences and updating theme, sound, and workstation options."""
        # 1. Retrieve initial preferences
        res = self.client.get('/api/profile/preferences/', **self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['theme_preset'], 'burgundy-cream')
        self.assertEqual(data['sound_profile'], 'mechanical-blue')
        self.assertTrue(data['hand_guide_enabled'])
        self.assertEqual(data['preferred_word_count'], 25)

        # 2. Update preferences via PATCH
        update_res = self.client.patch(
            '/api/profile/preferences/',
            {
                'theme_preset': 'midnight-blue',
                'sound_profile': 'alps-cream',
                'sound_enabled': True,
                'hand_guide_enabled': False,
                'preferred_duration': 120,
                'preferred_word_count': 50,
                'preferred_mode': 'words',
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(update_res.status_code, 200)
        updated = update_res.json()
        self.assertEqual(updated['theme_preset'], 'midnight-blue')
        self.assertEqual(updated['sound_profile'], 'alps-cream')
        self.assertFalse(updated['hand_guide_enabled'])
        self.assertEqual(updated['preferred_duration'], 120)
        self.assertEqual(updated['preferred_word_count'], 50)
        self.assertEqual(updated['preferred_mode'], 'words')

        # 3. Verify in database
        prefs = UserPreferences.objects.get(user=self.user)
        self.assertEqual(prefs.theme_preset, 'midnight-blue')
        self.assertEqual(prefs.sound_profile, 'alps-cream')

    def test_arcade_game_record_and_summary(self):
        """Verify recording sessions for multiple arcade games and retrieving user summary."""
        # Record Cascade game
        res1 = self.client.post(
            '/api/games/record/',
            {
                'game_type': 'cascade',
                'score': 1250,
                'accuracy': 98.5,
                'duration_seconds': 90,
                'words_correct': 45,
                'metadata': {'bestCombo': 18, 'highestTier': 3},
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(res1.status_code, 201)

        # Record Speed Sprint game
        res2 = self.client.post(
            '/api/games/record/',
            {
                'game_type': 'sprint',
                'score': 85,
                'accuracy': 99.0,
                'duration_seconds': 60,
                'words_correct': 50,
                'metadata': {'wpm': 85.0, 'highestTier': 2},
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(res2.status_code, 201)

        # Record Boss Battle game
        res3 = self.client.post(
            '/api/games/record/',
            {
                'game_type': 'boss',
                'score': 3500,
                'accuracy': 96.0,
                'duration_seconds': 140,
                'words_correct': 80,
                'metadata': {
                    'bossDefeated': True,
                    'highestWave': 5,
                    'soldiersDefeated': 40,
                    'durationSeconds': 140,
                },
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(res3.status_code, 201)

        # Retrieve summary records
        sum_res = self.client.get('/api/games/records/', **self.auth_headers)
        self.assertEqual(sum_res.status_code, 200)
        records = sum_res.json()

        # Check Cascade stats
        self.assertEqual(records['cascade']['bestScore'], 1250)
        self.assertEqual(records['cascade']['bestCombo'], 18)
        self.assertEqual(records['cascade']['highestTier'], 3)
        self.assertEqual(records['cascade']['gamesPlayed'], 1)

        # Check Sprint stats
        self.assertEqual(records['sprint']['bestWpm'], 85.0)
        self.assertEqual(records['sprint']['bestAccuracy'], 99.0)
        self.assertEqual(records['sprint']['gamesPlayed'], 1)

        # Check Boss stats
        self.assertTrue(records['boss']['bossDefeated'])
        self.assertEqual(records['boss']['highestWave'], 5)
        self.assertEqual(records['boss']['bestScore'], 3500)
        self.assertEqual(records['boss']['fastestDefeatSeconds'], 140)

    def test_unauthenticated_arcade_summary_forbidden(self):
        """Unauthenticated requests to /api/games/records/ must return 401."""
        res = self.client.get('/api/games/records/')
        self.assertEqual(res.status_code, 401)

    def test_game_stats_and_likes_toggle(self):
        """Verify real-time Likes toggle, unliking, and stats aggregation."""
        # 1. Fetch initial stats
        res = self.client.get('/api/games/stats/', **self.auth_headers)
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertIn('nitro', stats)
        self.assertIn('cascade', stats)
        initial_nitro_likes = stats['nitro']['likes']
        self.assertFalse(stats['nitro']['hasLiked'])

        # 2. Toggle like as authenticated user
        like_res = self.client.post('/api/games/nitro/like/', **self.auth_headers)
        self.assertEqual(like_res.status_code, 200)
        like_data = like_res.json()
        self.assertTrue(like_data['hasLiked'])
        self.assertEqual(like_data['likes'], initial_nitro_likes + 1)

        # 3. Verify stats reflect the new like
        stats_after = self.client.get('/api/games/stats/', **self.auth_headers).json()
        self.assertTrue(stats_after['nitro']['hasLiked'])
        self.assertEqual(stats_after['nitro']['likes'], initial_nitro_likes + 1)

        # 4. Unlike by clicking again
        unlike_res = self.client.post('/api/games/nitro/like/', **self.auth_headers)
        self.assertEqual(unlike_res.status_code, 200)
        unlike_data = unlike_res.json()
        self.assertFalse(unlike_data['hasLiked'])
        self.assertEqual(unlike_data['likes'], initial_nitro_likes)

    def test_guest_like_and_unique_play_sessions(self):
        """Verify guest likes and idempotent play session recording."""
        guest_id = 'guest_tester_999'

        # 1. Guest likes game
        res = self.client.post(
            '/api/games/ninja/like/',
            {'guest_id': guest_id},
            content_type='application/json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['hasLiked'])

        # 2. Record play session
        session_id = 'session_unique_abc123'
        play_res1 = self.client.post(
            '/api/games/nitro/play/',
            {'sessionId': session_id, 'guest_id': guest_id},
            content_type='application/json',
        )
        self.assertEqual(play_res1.status_code, 200)
        plays_count_1 = play_res1.json()['plays']
        self.assertTrue(play_res1.json()['recorded'])

        # 3. Idempotent check: repeating identical sessionId must NOT increment plays
        play_res2 = self.client.post(
            '/api/games/nitro/play/',
            {'sessionId': session_id, 'guest_id': guest_id},
            content_type='application/json',
        )
        self.assertEqual(play_res2.status_code, 200)
        self.assertEqual(play_res2.json()['plays'], plays_count_1)
        self.assertFalse(play_res2.json()['recorded'])

    def test_nitro_racing_session_recording_and_summary(self):
        """Verify recording a Nitro Type Pro racing session."""
        res = self.client.post(
            '/api/games/record/',
            {
                'game_type': 'nitro',
                'score': 112,
                'accuracy': 98.7,
                'duration_seconds': 42,
                'words_correct': 65,
                'metadata': {
                    'wpm': 112.5,
                    'placement': 1,
                    'vehicle': 'apex-gt',
                    'totalDistance': 1200,
                    'highestTier': 4,
                },
            },
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)

        # Retrieve summary records
        sum_res = self.client.get('/api/games/records/', **self.auth_headers)
        self.assertEqual(sum_res.status_code, 200)
        records = sum_res.json()
        self.assertEqual(records['nitro']['bestWpm'], 112.5)
        self.assertEqual(records['nitro']['racesWon'], 1)
        self.assertEqual(records['nitro']['topPlacement'], 1)
        self.assertEqual(records['nitro']['totalDistance'], 1200)
        self.assertEqual(records['nitro']['highestTier'], 4)

