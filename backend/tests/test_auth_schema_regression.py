"""
Regression tests for KEYFLOW authentication, UserPreferences schema integrity,
migration consistency, and orphan user preferences handling.
"""
from django.test import TestCase
from django.urls import reverse
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, UserPreferences, UserProfile


class UserPreferencesSchemaAndAuthRegressionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_migration_state_is_fully_applied(self):
        """Verify that all migrations across all apps are fully applied."""
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        plan = executor.migration_plan(targets)
        self.assertEqual(
            len(plan), 0,
            f"There are unapplied migrations in the migration plan: {plan}"
        )

    def test_user_preferences_table_has_all_expected_columns(self):
        """Verify that user_preferences database table physically contains all required model columns."""
        with connection.cursor() as cursor:
            columns = [col[0] for col in connection.introspection.get_table_description(cursor, 'user_preferences')]

        expected_columns = [
            'id',
            'user_id',
            'theme_preset',
            'daily_goal_minutes',
            'preferred_duration',
            'preferred_word_count',
            'preferred_mode',
            'passage_category',
            'sound_enabled',
            'sound_profile',
            'keyboard_visual_enabled',
            'hand_guide_enabled',
            'reduced_motion',
            'language',
            'updated_at',
        ]
        for col in expected_columns:
            self.assertIn(
                col, columns,
                f"Column '{col}' is missing from the 'user_preferences' database table!"
            )

    def test_registration_and_immediate_login_flow(self):
        """Verify complete registration followed by immediate login."""
        reg_payload = {
            'username': 'reguser_test',
            'email': 'reguser_test@keyflow.app',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
        }
        reg_res = self.client.post('/api/auth/register/', reg_payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', reg_res.data)
        self.assertIn('user', reg_res.data)
        self.assertEqual(reg_res.data['user']['email'], 'reguser_test@keyflow.app')
        self.assertIn('preferences', reg_res.data['user'])
        self.assertEqual(reg_res.data['user']['preferences']['preferred_word_count'], 25)
        self.assertEqual(reg_res.data['user']['preferences']['theme_preset'], 'burgundy-cream')

        # Immediate login
        login_payload = {
            'email': 'reguser_test@keyflow.app',
            'password': 'StrongPassword123!',
        }
        login_res = self.client.post('/api/auth/login/', login_payload, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.data)
        self.assertIn('user', login_res.data)
        self.assertEqual(login_res.data['user']['preferences']['preferred_word_count'], 25)
        self.assertEqual(login_res.data['user']['preferences']['sound_profile'], 'mechanical-blue')

    def test_login_with_existing_user_missing_preferences(self):
        """
        Verify that login does not crash with HTTP 500 when a user's preferences
        record is absent in the database, but safely creates default preferences.
        """
        user = User.objects.create_user(
            username='legacy_user_no_prefs',
            email='legacy_user@keyflow.app',
            password='LegacyPassword123!'
        )
        # Explicitly delete the preferences record to simulate legacy/orphan user
        UserPreferences.objects.filter(user=user).delete()
        self.assertFalse(UserPreferences.objects.filter(user=user).exists())

        login_payload = {
            'email': 'legacy_user@keyflow.app',
            'password': 'LegacyPassword123!',
        }
        res = self.client.post('/api/auth/login/', login_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)
        self.assertIsNotNone(res.data['user']['preferences'])
        self.assertEqual(res.data['user']['preferences']['preferred_word_count'], 25)
        self.assertEqual(res.data['user']['preferences']['theme_preset'], 'burgundy-cream')

        # Confirm preferences record now exists in the database
        self.assertTrue(UserPreferences.objects.filter(user=user).exists())

    def test_invalid_login_credentials(self):
        """Verify invalid credentials return HTTP 400 Bad Request with clear error."""
        res = self.client.post('/api/auth/login/', {
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', res.data)

    def test_duplicate_registration_validation(self):
        """Verify duplicate email and username are rejected with HTTP 400."""
        User.objects.create_user(
            username='existing_hero',
            email='existing_hero@keyflow.app',
            password='Password123!'
        )

        res = self.client.post('/api/auth/register/', {
            'username': 'existing_hero',
            'email': 'other@keyflow.app',
            'password': 'Password123!',
            'password2': 'Password123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', res.data)

        res2 = self.client.post('/api/auth/register/', {
            'username': 'new_hero',
            'email': 'existing_hero@keyflow.app',
            'password': 'Password123!',
            'password2': 'Password123!',
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res2.data)

    def test_authenticated_me_and_preferences_endpoints(self):
        """Verify authenticated Knox token accesses /api/auth/me/ and /api/profile/preferences/."""
        user = User.objects.create_user(
            username='token_user',
            email='token_user@keyflow.app',
            password='Password123!'
        )
        login_res = self.client.post('/api/auth/login/', {
            'email': 'token_user@keyflow.app',
            'password': 'Password123!',
        }, format='json')
        token = login_res.data['token']

        # Set Knox auth header
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['email'], 'token_user@keyflow.app')
        self.assertEqual(me_res.data['preferences']['preferred_word_count'], 25)

        # Update preferences
        pref_patch_res = self.client.patch('/api/profile/preferences/', {
            'preferred_word_count': 50,
            'theme_preset': 'midnight-blue',
            'sound_profile': 'enthusiast-topre',
        }, format='json')
        self.assertEqual(pref_patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pref_patch_res.data['preferred_word_count'], 50)
        self.assertEqual(pref_patch_res.data['theme_preset'], 'midnight-blue')
        self.assertEqual(pref_patch_res.data['sound_profile'], 'enthusiast-topre')
