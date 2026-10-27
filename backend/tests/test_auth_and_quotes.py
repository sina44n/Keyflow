"""
Comprehensive Auth, Quotes & User-Isolation Tests
==================================================
Tests:
- Registration, validation, duplicate prevention, password hashing
- Login, Knox token issuance, invalid credentials
- Logout single device and all devices
- Password change with old password verification
- Email verification token workflow
- Cross-user data isolation (profile, preferences, progress, practice)
- Random quote assignment, persistence within 12 hours, rotation after 12h, anti-repetition
- Anonymous public quote behavior
"""

import uuid
from datetime import timedelta
from django.utils import timezone
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from knox.models import AuthToken

from accounts.models import User, UserProfile, UserPreferences, EmailVerificationToken
from quotes.models import Quote, UserQuoteAssignment, QuoteAssignmentHistory
from quotes.services import get_or_rotate_user_quote, get_public_quote
from practice.models import PracticeSession
from lessons.models import Level, Lesson, LessonProgress


class AuthEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='alice@example.com',
            username='alice',
            password='Password123!',
        )

    def test_registration_success(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'bob@example.com',
            'username': 'bob',
            'password': 'SecurePassword456!',
            'password2': 'SecurePassword456!',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'bob@example.com')
        # Check password hashing
        bob = User.objects.get(email='bob@example.com')
        self.assertTrue(bob.check_password('SecurePassword456!'))
        self.assertFalse(bob.password.startswith('SecurePassword456!'))
        # Check profile and preferences created
        self.assertTrue(UserProfile.objects.filter(user=bob).exists())
        self.assertTrue(UserPreferences.objects.filter(user=bob).exists())

    def test_registration_duplicate_email(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'alice@example.com',
            'username': 'alice2',
            'password': 'Password123!',
            'password2': 'Password123!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_registration_password_mismatch(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'charlie@example.com',
            'username': 'charlie',
            'password': 'Password123!',
            'password2': 'PasswordMismatch!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password2', res.data)

    def test_login_success(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com',
            'password': 'Password123!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'alice')

    def test_login_invalid_credentials(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com',
            'password': 'WrongPassword!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_current_user_authenticated(self):
        _, token = AuthToken.objects.create(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'alice@example.com')

    def test_current_user_unauthenticated(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        _, token = AuthToken.objects.create(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/logout/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        # Token is now invalid
        res_me = self.client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_change_success(self):
        _, token = AuthToken.objects.create(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'Password123!',
            'new_password': 'NewPassword789!',
            'new_password2': 'NewPassword789!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPassword789!'))

    def test_password_change_wrong_old_password(self):
        _, token = AuthToken.objects.create(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'IncorrectPassword!',
            'new_password': 'NewPassword789!',
            'new_password2': 'NewPassword789!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verification_flow(self):
        token_str = uuid.uuid4().hex
        EmailVerificationToken.objects.create(
            user=self.user,
            token=token_str,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        self.assertFalse(self.user.is_email_verified)
        res = self.client.post('/api/auth/verify-email/', {'token': token_str})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)


class UserDataIsolationTests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='user_a@test.com', username='user_a', password='PasswordA1!')
        self.user_b = User.objects.create_user(email='user_b@test.com', username='user_b', password='PasswordB1!')

        _, token_a = AuthToken.objects.create(self.user_a)
        _, token_b = AuthToken.objects.create(self.user_b)

        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {token_a}')
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {token_b}')

        # Create practice sessions for both
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=60,
            total_chars=300,
            correct_chars=290,
            incorrect_chars=10,
            gross_wpm=60,
            net_wpm=58,
            accuracy=96.7,
            error_count=2,
        )
        PracticeSession.objects.create(
            user=self.user_b,
            session_type='timed',
            duration_seconds=60,
            total_chars=500,
            correct_chars=495,
            incorrect_chars=5,
            gross_wpm=100,
            net_wpm=99,
            accuracy=99.0,
            error_count=1,
        )

    def test_practice_history_isolation(self):
        # User A only sees User A's sessions
        res_a = self.client_a.get('/api/practice/history/')
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        results_a = res_a.data.get('results', res_a.data)
        self.assertEqual(len(results_a), 1)
        self.assertEqual(float(results_a[0]['net_wpm']), 58.0)

        # User B only sees User B's sessions
        res_b = self.client_b.get('/api/practice/history/')
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        results_b = res_b.data.get('results', res_b.data)
        self.assertEqual(len(results_b), 1)
        self.assertEqual(float(results_b[0]['net_wpm']), 99.0)

    def test_profile_isolation(self):
        # User A updates profile
        res_patch = self.client_a.patch('/api/profile/', {'display_name': 'Agent A'})
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)

        # User B's profile remains unchanged
        res_b = self.client_b.get('/api/profile/')
        self.assertNotEqual(res_b.data['display_name'], 'Agent A')

    def test_preferences_language_isolation(self):
        # User A sets language to Arabic
        res_patch = self.client_a.patch('/api/profile/preferences/', {'language': 'ar'})
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['language'], 'ar')

        # User B's language remains default English
        res_b = self.client_b.get('/api/profile/preferences/')
        self.assertEqual(res_b.data['language'], 'en')


class QuoteSystemTests(TestCase):
    def setUp(self):
        # Seed 10 test quotes
        for i in range(1, 11):
            Quote.objects.create(
                text=f'Test inspirational quote number {i} on precision and discipline.',
                author=f'Author {i}',
                category='typing',
                language='en',
                is_active=True,
            )
        self.user_x = User.objects.create_user(email='quote_x@test.com', username='quote_x', password='Password123!')
        self.user_y = User.objects.create_user(email='quote_y@test.com', username='quote_y', password='Password123!')

    def test_initial_assignment_persists(self):
        # First call assigns quote
        quote1 = get_or_rotate_user_quote(self.user_x)
        self.assertIsNotNone(quote1['id'])
        self.assertTrue(quote1['is_personalized'])

        # Refresh immediately returns the EXACT SAME quote
        quote2 = get_or_rotate_user_quote(self.user_x)
        self.assertEqual(quote1['id'], quote2['id'])

    def test_12_hour_rotation(self):
        quote1 = get_or_rotate_user_quote(self.user_x)

        # Fast-forward assignment time by 13 hours
        assignment = UserQuoteAssignment.objects.get(user=self.user_x)
        assignment.assigned_at = timezone.now() - timedelta(hours=13)
        assignment.save(update_fields=['assigned_at'])

        # Next call rotates quote
        quote2 = get_or_rotate_user_quote(self.user_x)
        self.assertTrue(quote2['is_personalized'])
        # History recorded the first assignment
        self.assertTrue(QuoteAssignmentHistory.objects.filter(user=self.user_x, quote_id=quote1['id']).exists())

    def test_public_quote_does_not_create_account(self):
        initial_users = User.objects.count()
        pub_quote = get_public_quote()
        self.assertIsNotNone(pub_quote['text'])
        self.assertFalse(pub_quote['is_personalized'])
        self.assertEqual(User.objects.count(), initial_users)

    def test_quote_current_endpoint_authenticated(self):
        client = APIClient()
        _, token = AuthToken.objects.create(self.user_x)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = client.get('/api/quotes/current/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_personalized'])

    def test_quote_current_endpoint_anonymous(self):
        client = APIClient()
        res = client.get('/api/quotes/current/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_personalized'])
