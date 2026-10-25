from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from accounts.models import UserPreferences, UserProfile

User = get_user_model()


class HealthCheckAPITests(TestCase):
    """Test root health-check and configuration endpoints."""

    def setUp(self):
        self.client = Client()

    def test_api_health_endpoint(self):
        """Verify GET /api/ returns 200 OK and expected JSON schema."""
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertEqual(data.get('service'), 'KEYFLOW API')
        self.assertEqual(data.get('version'), '1.0.0')

    def test_postgresql_configuration_parsing(self):
        """Verify dj_database_url configures PostgreSQL engine for postgresql:// URLs."""
        import dj_database_url
        pg_url = "postgresql://keyflow_user:secret@localhost:5432/keyflow_dev"
        config = dj_database_url.parse(pg_url)
        self.assertEqual(config['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(config['NAME'], 'keyflow_dev')
        self.assertEqual(config['USER'], 'keyflow_user')
        self.assertEqual(config['HOST'], 'localhost')
        self.assertEqual(config['PORT'], 5432)


class AccountsAndThemesTests(TestCase):
    """Test user model, auto-signals, profile, preferences, and 12 themes."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='flowmaster',
            email='typist@keyflow.dev',
            password='Password123!',
        )

    def test_custom_user_creation(self):
        """Verify custom User uses email and username correctly."""
        self.assertEqual(self.user.email, 'typist@keyflow.dev')
        self.assertEqual(self.user.username, 'flowmaster')
        self.assertTrue(self.user.check_password('Password123!'))

    def test_signals_create_profile_and_preferences(self):
        """Verify UserProfile and UserPreferences are automatically created on User creation."""
        self.assertTrue(hasattr(self.user, 'profile'))
        self.assertTrue(hasattr(self.user, 'preferences'))
        self.assertEqual(self.user.profile.display_name, 'flowmaster')
        self.assertEqual(self.user.preferences.theme, 'dark-charcoal-lime')

    def test_all_12_themes_available(self):
        """Verify exactly 12 themes exist in UserPreferences.THEME_CHOICES."""
        expected_theme_ids = {
            'dark-charcoal-lime',
            'classic-black-white',
            'burgundy-cream',
            'midnight-blue',
            'lavender-purple',
            'forest-green',
            'ocean-teal',
            'sunset-orange',
            'rose-pink',
            'arctic-blue',
            'solarized-light',
            'warm-sand',
        }
        actual_theme_ids = {choice[0] for choice in UserPreferences.THEME_CHOICES}
        self.assertEqual(actual_theme_ids, expected_theme_ids)
        self.assertEqual(len(UserPreferences.THEME_CHOICES), 12)

    def test_theme_update_persistence(self):
        """Verify user can update and persist theme preference."""
        prefs = self.user.preferences
        prefs.theme = 'midnight-blue'
        prefs.save()

        # Reload from database
        reloaded = UserPreferences.objects.get(user=self.user)
        self.assertEqual(reloaded.theme, 'midnight-blue')


class RouteRegistrationTests(TestCase):
    """Test all app route endpoints are mapped and do not 404/500 unexpectedly."""

    def setUp(self):
        self.client = Client()

    def test_auth_routes_registered(self):
        """Verify Knox login/register/user routes exist."""
        # Registration endpoint check
        resp_reg = self.client.get('/api/auth/register/')
        # DRF MethodNotAllowed (405) since GET is not allowed on Register (only POST)
        self.assertIn(resp_reg.status_code, [405, 400])

        # Login endpoint check
        resp_login = self.client.get('/api/auth/login/')
        self.assertIn(resp_login.status_code, [405, 400])

    def test_curriculum_and_games_routes_registered(self):
        """Verify API paths are properly routed."""
        resp_lessons = self.client.get('/api/lessons/')
        self.assertNotEqual(resp_lessons.status_code, 404)

        resp_games = self.client.get('/api/games/')
        self.assertNotEqual(resp_games.status_code, 404)
