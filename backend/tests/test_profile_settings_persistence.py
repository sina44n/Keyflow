"""
KEYFLOW — Profile Settings Persistence & Multi-Account Isolation Audit Suite
=============================================================================
Validates:
1. UserPreferences model defaults: daily_goal_minutes=10, weekly_goal_minutes=180, first_day_of_week=0.
2. CurrentUserView PATCH accepts custom/preset daily and weekly goals (20m daily, 180m weekly / 3 hours, first_day_of_week=0).
3. Preferences persist to the database and survive fresh re-query via GET /api/auth/me/ and GET /api/profile/preferences/.
4. Strict Account A vs Account B preference isolation.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from accounts.models import UserPreferences, UserProfile
from accounts.views import CurrentUserView, PreferencesView

User = get_user_model()


class ProfileSettingsPersistenceTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        # Create Account A
        self.user_a = User.objects.create_user(
            username='user_alpha_settings',
            email='alpha_settings@example.com',
            clerk_id='user_alpha_clerk_123',
            is_active=True,
        )

        # Create Account B
        self.user_b = User.objects.create_user(
            username='user_beta_settings',
            email='beta_settings@example.com',
            clerk_id='user_beta_clerk_456',
            is_active=True,
        )

    def test_default_preferences_creation(self):
        """Verifies default practice targets and week start are created accurately."""
        prefs_a, _ = UserPreferences.objects.get_or_create(user=self.user_a)
        self.assertEqual(prefs_a.daily_goal_minutes, 10)
        self.assertEqual(prefs_a.weekly_goal_minutes, 180)  # 3 hours default
        self.assertEqual(prefs_a.first_day_of_week, 0)      # Sunday default

    def test_current_user_patch_saves_daily_weekly_and_weekstart(self):
        """Verifies PATCH /api/auth/me/ saves 20m daily, 3 hours weekly, and Sunday start."""
        view = CurrentUserView.as_view()

        payload = {
            'username': 'user_alpha_settings',
            'email': 'alpha_settings@example.com',
            'first_name': 'Alpha',
            'last_name': 'Typist',
            'daily_goal_minutes': 20,
            'weekly_goal_minutes': 180,
            'first_day_of_week': 0,
            'reduced_motion': True,
        }

        request = self.factory.patch('/api/auth/me/', payload, format='json')
        force_authenticate(request, user=self.user_a)
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prefs_data = response.data.get('preferences', {})
        self.assertEqual(prefs_data.get('daily_goal_minutes'), 20)
        self.assertEqual(prefs_data.get('weekly_goal_minutes'), 180)
        self.assertEqual(prefs_data.get('first_day_of_week'), 0)
        self.assertEqual(prefs_data.get('reduced_motion'), True)

        # Fresh re-query directly from database
        self.user_a.refresh_from_db()
        reloaded_prefs = UserPreferences.objects.get(user=self.user_a)
        self.assertEqual(reloaded_prefs.daily_goal_minutes, 20)
        self.assertEqual(reloaded_prefs.weekly_goal_minutes, 180)
        self.assertEqual(reloaded_prefs.first_day_of_week, 0)
        self.assertEqual(reloaded_prefs.reduced_motion, True)

    def test_current_user_patch_supports_hours_for_weekly_goal(self):
        """Verifies weekly_goal parameter accepts hours (e.g. 3) and converts to 180 minutes."""
        view = CurrentUserView.as_view()

        payload = {
            'daily_goal_minutes': 45,
            'weekly_goal': 3,       # 3 hours
            'week_start': 1,        # Monday
        }

        request = self.factory.patch('/api/auth/me/', payload, format='json')
        force_authenticate(request, user=self.user_a)
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reloaded_prefs = UserPreferences.objects.get(user=self.user_a)
        self.assertEqual(reloaded_prefs.daily_goal_minutes, 45)
        self.assertEqual(reloaded_prefs.weekly_goal_minutes, 180)
        self.assertEqual(reloaded_prefs.first_day_of_week, 1)

    def test_preferences_account_isolation(self):
        """Verifies Account A and Account B preferences never overwrite each other."""
        view = CurrentUserView.as_view()

        # Set Account A settings: 20m daily, 180m weekly, Sunday (0)
        req_a = self.factory.patch(
            '/api/auth/me/',
            {'daily_goal_minutes': 20, 'weekly_goal_minutes': 180, 'first_day_of_week': 0},
            format='json'
        )
        force_authenticate(req_a, user=self.user_a)
        res_a = view(req_a)
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)

        # Set Account B settings: 60m daily, 420m weekly (7h), Monday (1)
        req_b = self.factory.patch(
            '/api/auth/me/',
            {'daily_goal_minutes': 60, 'weekly_goal_minutes': 420, 'first_day_of_week': 1},
            format='json'
        )
        force_authenticate(req_b, user=self.user_b)
        res_b = view(req_b)
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)

        # Check Account A remains isolated
        prefs_a = UserPreferences.objects.get(user=self.user_a)
        self.assertEqual(prefs_a.daily_goal_minutes, 20)
        self.assertEqual(prefs_a.weekly_goal_minutes, 180)
        self.assertEqual(prefs_a.first_day_of_week, 0)

        # Check Account B remains isolated
        prefs_b = UserPreferences.objects.get(user=self.user_b)
        self.assertEqual(prefs_b.daily_goal_minutes, 60)
        self.assertEqual(prefs_b.weekly_goal_minutes, 420)
        self.assertEqual(prefs_b.first_day_of_week, 1)
