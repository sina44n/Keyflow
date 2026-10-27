from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.management import call_command
from knox.models import AuthToken
from lessons.models import Level, Lesson, LessonProgress

User = get_user_model()


class LessonsAPITests(TestCase):
    """Test lessons endpoints: levels listing, lesson detail, and authenticated progress recording."""

    def setUp(self):
        self.client = Client()
        call_command('seed_curriculum')
        self.user = User.objects.create_user(
            username='typist1',
            email='typist1@keyflow.dev',
            password='TestPassword123!',
        )
        _, self.token = AuthToken.objects.create(self.user)
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Token {self.token}'}

    def test_curriculum_seeds_seven_levels(self):
        """Verify exactly 7 academy levels are seeded in the database."""
        self.assertEqual(Level.objects.count(), 7)
        self.assertEqual(Lesson.objects.count(), 7)

    def test_get_levels_endpoint(self):
        """Verify GET /api/v1/lessons/levels/ returns all 7 levels with nested lessons."""
        response = self.client.get('/api/lessons/levels/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 7)
        self.assertEqual(data[0]['level_number'], 1)
        self.assertEqual(data[0]['title'], 'Home Row Foundations')
        self.assertEqual(len(data[0]['lessons']), 1)
        self.assertEqual(data[0]['lessons'][0]['target_wpm'], 20)

    def test_get_lesson_detail(self):
        """Verify GET /api/v1/lessons/<pk>/ returns lesson content."""
        lesson = Lesson.objects.first()
        response = self.client.get(f'/api/v1/lessons/{lesson.id}/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], lesson.id)
        self.assertTrue('a lad' in data['exercise_content'])

    def test_record_progress_requires_authentication(self):
        """Verify unauthenticated requests cannot record progress."""
        lesson = Lesson.objects.first()
        response = self.client.post(
            f'/api/v1/lessons/{lesson.id}/record/',
            {'wpm': 35.5, 'accuracy': 98.0, 'completed': True},
            content_type='application/json',
        )
        self.assertIn(response.status_code, [401, 403])

    def test_authenticated_user_records_progress_and_unlocks(self):
        """Verify authenticated user can record lesson attempt and update progress."""
        lesson = Lesson.objects.get(level__level_number=1)
        response = self.client.post(
            f'/api/v1/lessons/{lesson.id}/record/',
            {'wpm': 42.0, 'accuracy': 99.0, 'completed': True},
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['is_completed'])
        self.assertEqual(float(data['best_wpm']), 42.0)
        self.assertEqual(float(data['best_accuracy']), 99.0)

        # Check in DB
        progress = LessonProgress.objects.get(user=self.user, lesson=lesson)
        self.assertTrue(progress.is_completed)
        self.assertEqual(progress.attempts, 1)

        # Record a second attempt with higher WPM
        response2 = self.client.post(
            f'/api/v1/lessons/{lesson.id}/record/',
            {'wpm': 48.5, 'accuracy': 99.5, 'completed': True},
            content_type='application/json',
            **self.auth_headers,
        )
        self.assertEqual(response2.status_code, 200)
        progress.refresh_from_db()
        self.assertEqual(progress.attempts, 2)
        self.assertEqual(float(progress.best_wpm), 48.5)

    def test_get_user_progress_list(self):
        """Verify GET /api/v1/lessons/progress/ returns only current user records."""
        lesson = Lesson.objects.first()
        LessonProgress.objects.create(
            user=self.user,
            lesson=lesson,
            is_completed=True,
            attempts=1,
            best_wpm=38.0,
            best_accuracy=96.0,
        )

        response = self.client.get('/api/v1/lessons/progress/', **self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['lesson'], lesson.id)
        self.assertTrue(data[0]['is_completed'])
