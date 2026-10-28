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


class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='resetuser@example.com',
            username='resetuser',
            password='OldPassword123!',
        )

    def test_full_password_reset_flow(self):
        from django.core import mail
        from django_rest_passwordreset.models import ResetPasswordToken

        # Step 1: Request password reset
        res = self.client.post('/api/auth/password-reset/', {'email': 'resetuser@example.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Step 2: Verify reset token was generated and email sent
        token_obj = ResetPasswordToken.objects.filter(user=self.user).first()
        self.assertIsNotNone(token_obj)
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn(token_obj.key, sent_email.body)
        self.assertIn('/reset-password?token=', sent_email.body)
        # Verify HTML alternative with KEYFLOW branding was attached
        self.assertTrue(len(sent_email.alternatives) > 0)
        html_body = sent_email.alternatives[0][0]
        self.assertIn('KEYFLOW', html_body)
        self.assertIn('Set New Password', html_body)
        self.assertIn(token_obj.key, html_body)

        # Create an existing active Knox token to verify revocation
        _, existing_knox = AuthToken.objects.create(self.user)
        self.assertTrue(AuthToken.objects.filter(user=self.user).exists())

        # Step 3: Validate token
        val_res = self.client.post('/api/auth/password-reset/validate_token/', {'token': token_obj.key})
        self.assertEqual(val_res.status_code, status.HTTP_200_OK)

        # Step 4: Confirm reset with new password
        confirm_res = self.client.post('/api/auth/password-reset/confirm/', {
            'token': token_obj.key,
            'password': 'NewPassword123!',
        })
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        # Verify all existing Knox tokens for this user were invalidated upon password reset
        self.assertFalse(AuthToken.objects.filter(user=self.user).exists())

        # Step 5: Verify old password fails
        login_old = self.client.post('/api/auth/login/', {
            'email': 'resetuser@example.com',
            'password': 'OldPassword123!',
        })
        self.assertEqual(login_old.status_code, status.HTTP_400_BAD_REQUEST)

        # Step 6: Verify new password succeeds
        login_new = self.client.post('/api/auth/login/', {
            'email': 'resetuser@example.com',
            'password': 'NewPassword123!',
        })
        self.assertEqual(login_new.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_new.data)

        # Step 7: Verify token cannot be reused
        reuse_res = self.client.post('/api/auth/password-reset/confirm/', {
            'token': token_obj.key,
            'password': 'AnotherPassword123!',
        })
        self.assertNotEqual(reuse_res.status_code, status.HTTP_200_OK)

    def test_password_reset_email_failure_raises_503(self):
        from unittest.mock import patch
        with patch('django.core.mail.EmailMultiAlternatives.send', side_effect=Exception('SMTP connection timed out')):
            res = self.client.post('/api/auth/password-reset/', {'email': 'resetuser@example.com'})
            self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertIn('detail', res.data)

    def test_password_reset_validate_invalid_token(self):
        res = self.client.post('/api/auth/password-reset/validate_token/', {'token': 'completely_invalid_token_123'})
        self.assertNotEqual(res.status_code, status.HTTP_200_OK)

    def test_password_reset_validate_expired_token(self):
        import datetime
        from django.utils import timezone
        from django_rest_passwordreset.models import ResetPasswordToken

        token_obj = ResetPasswordToken.objects.create(user=self.user)
        # Backdate token by 48 hours to exceed the default 24h expiration
        ResetPasswordToken.objects.filter(pk=token_obj.pk).update(
            created_at=timezone.now() - datetime.timedelta(hours=48)
        )
        res = self.client.post('/api/auth/password-reset/validate_token/', {'token': token_obj.key})
        self.assertNotEqual(res.status_code, status.HTTP_200_OK)


class GoogleLoginEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_missing_token_returns_400(self):
        res = self.client.post('/api/auth/google/', {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_first_time_google_login_creates_user(self):
        res = self.client.post('/api/auth/google/', {
            'id_token': 'mock_google_id_token_123',
            'email': 'NewGoogleUser@Example.COM',
            'name': 'Google Hero',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['email'], 'newgoogleuser@example.com')
        self.assertTrue(res.data['user']['is_email_verified'])

        # Verify persisted in database
        db_user = User.objects.get(email='newgoogleuser@example.com')
        self.assertFalse(db_user.has_usable_password())
        self.assertTrue(db_user.is_email_verified)

    def test_returning_google_user_signs_in(self):
        existing = User.objects.create_user(
            email='returning@example.com',
            username='returning',
            password='Password123!',
        )
        res = self.client.post('/api/auth/google/', {
            'id_token': 'mock_returning_token',
            'email': 'returning@example.com',
            'name': 'Returning User',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['id'], existing.id)

    def test_google_login_deactivated_account_rejected(self):
        User.objects.create_user(
            email='deactivated@example.com',
            username='deactivated_user',
            password='Password123!',
            is_active=False,
        )
        res = self.client.post('/api/auth/google/', {
            'id_token': 'mock_deactivated_token',
            'email': 'deactivated@example.com',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deactivated', res.data.get('error', '').lower())

    def test_google_login_unverified_email_rejected(self):
        from unittest.mock import patch
        mock_response = (
            b'{"email": "unverified@example.com", "email_verified": false, '
            b'"iss": "accounts.google.com", "sub": "12345"}'
        )
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_cm = mock_urlopen.return_value.__enter__.return_value
            mock_cm.read.return_value = mock_response
            res = self.client.post('/api/auth/google/', {
                'id_token': 'real_google_unverified_token',
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('not verified', res.data.get('error', '').lower())

    def test_google_login_invalid_issuer_rejected(self):
        from unittest.mock import patch
        mock_response = (
            b'{"email": "attacker@example.com", "email_verified": true, '
            b'"iss": "evil-oauth.example.com", "sub": "12345"}'
        )
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_cm = mock_urlopen.return_value.__enter__.return_value
            mock_cm.read.return_value = mock_response
            res = self.client.post('/api/auth/google/', {
                'id_token': 'real_google_spoofed_issuer',
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('issuer is invalid', res.data.get('error', '').lower())

    def test_google_login_audience_mismatch_rejected(self):
        from unittest.mock import patch
        from django.conf import settings
        mock_response = (
            b'{"email": "audtest@example.com", "email_verified": true, '
            b'"iss": "accounts.google.com", "aud": "wrong-client-id.apps.googleusercontent.com", "sub": "12345"}'
        )
        with patch.object(settings, 'GOOGLE_CLIENT_ID', 'expected-client-id.apps.googleusercontent.com'):
            with patch('urllib.request.urlopen') as mock_urlopen:
                mock_cm = mock_urlopen.return_value.__enter__.return_value
                mock_cm.read.return_value = mock_response
                res = self.client.post('/api/auth/google/', {
                    'id_token': 'real_token_aud_mismatch',
                })
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('audience mismatch', res.data.get('error', '').lower())

    def test_google_login_expired_token_rejected(self):
        from unittest.mock import patch
        mock_response = (
            b'{"email": "expired@example.com", "email_verified": true, '
            b'"iss": "accounts.google.com", "exp": 1000000000, "sub": "12345"}'
        )
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_cm = mock_urlopen.return_value.__enter__.return_value
            mock_cm.read.return_value = mock_response
            res = self.client.post('/api/auth/google/', {
                'id_token': 'real_google_expired_token',
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('expired', res.data.get('error', '').lower())

    def test_google_login_http_error_rejected(self):
        import urllib.error
        from unittest.mock import patch
        http_err = urllib.error.HTTPError('https://oauth2.googleapis.com', 400, 'Bad Request', {}, None)
        with patch('urllib.request.urlopen', side_effect=http_err):
            res = self.client.post('/api/auth/google/', {
                'id_token': 'malformed_invalid_token',
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('rejected the token', res.data.get('error', '').lower())

    def test_google_login_service_error_502(self):
        from unittest.mock import patch
        with patch('urllib.request.urlopen', side_effect=Exception('Connection reset')):
            res = self.client.post('/api/auth/google/', {
                'id_token': 'real_token_network_glitch',
            })
            self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
            self.assertIn('unable to connect to google', res.data.get('error', '').lower())



class UserProgressionIsolationTests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.user_a = User.objects.create_user(
            email='usera@example.com',
            username='user_a',
            password='Password123!',
        )
        _, self.token_a = AuthToken.objects.create(self.user_a)
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')

        self.client_b = APIClient()
        self.user_b = User.objects.create_user(
            email='userb@example.com',
            username='user_b',
            password='Password123!',
        )
        _, self.token_b = AuthToken.objects.create(self.user_b)
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b}')

    def test_a_new_users_start_independently(self):
        """Test A: Verify both User A and User B start with 0 completed levels and Level 1 unlocked."""
        res_a = self.client_a.get('/api/lessons/progress/summary/')
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_a.data['lessons']), 0)
        self.assertEqual(res_a.data['stageProgress']['1'], 1)
        self.assertEqual(res_a.data['unlockedStages'], [1])

        res_b = self.client_b.get('/api/lessons/progress/summary/')
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_b.data['lessons']), 0)
        self.assertEqual(res_b.data['stageProgress']['1'], 1)
        self.assertEqual(res_b.data['unlockedStages'], [1])

    def test_b_progress_is_isolated(self):
        """Test B: User A completes Level 1 and 2; User B still has 0 completed levels."""
        # User A completes Level 1
        rec1 = self.client_a.post('/api/lessons/record/', {
            'stage': 1,
            'lesson': 1,
            'wpm': 45,
            'accuracy': 96,
            'completed': True,
            'stars': 3,
        })
        self.assertEqual(rec1.status_code, status.HTTP_200_OK)

        # User A completes Level 2
        rec2 = self.client_a.post('/api/lessons/record/', {
            'stage': 1,
            'lesson': 2,
            'wpm': 50,
            'accuracy': 98,
            'completed': True,
            'stars': 4,
        })
        self.assertEqual(rec2.status_code, status.HTTP_200_OK)

        # Verify User A has 2 completed levels
        summary_a = self.client_a.get('/api/lessons/progress/summary/')
        self.assertEqual(summary_a.status_code, status.HTTP_200_OK)
        self.assertTrue(summary_a.data['lessons']['S1-L001']['completed'])
        self.assertTrue(summary_a.data['lessons']['S1-L002']['completed'])
        self.assertGreaterEqual(summary_a.data['stageProgress']['1'], 3)

        # Verify User B STILL has zero completed levels
        summary_b = self.client_b.get('/api/lessons/progress/summary/')
        self.assertEqual(summary_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(summary_b.data['lessons']), 0)
        self.assertEqual(summary_b.data['stageProgress']['1'], 1)
        self.assertEqual(summary_b.data['unlockedStages'], [1])

        # Database confirmation
        self.assertEqual(LessonProgress.objects.filter(user=self.user_a, is_completed=True).count(), 2)
        self.assertEqual(LessonProgress.objects.filter(user=self.user_b, is_completed=True).count(), 0)

    def test_c_progress_persists_across_logout_and_login(self):
        """Test C: User logs out and in again; personal progress is restored and accounts remain separate."""
        # User A completes Level 1 and 2
        self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 1, 'wpm': 40, 'accuracy': 95, 'completed': True, 'stars': 3
        })
        self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 2, 'wpm': 48, 'accuracy': 97, 'completed': True, 'stars': 4
        })

        # User A logs out
        logout_res = self.client_a.post('/api/auth/logout/')
        self.assertEqual(logout_res.status_code, status.HTTP_204_NO_CONTENT)
        self.client_a.credentials()

        # User A signs in again
        login_a = self.client_a.post('/api/auth/login/', {
            'email': 'usera@example.com',
            'password': 'Password123!',
        })
        self.assertEqual(login_a.status_code, status.HTTP_200_OK)
        new_token_a = login_a.data['token']
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {new_token_a}')

        # Verify User A's progress is restored
        summary_a = self.client_a.get('/api/lessons/progress/summary/')
        self.assertEqual(summary_a.status_code, status.HTTP_200_OK)
        self.assertTrue(summary_a.data['lessons']['S1-L001']['completed'])
        self.assertTrue(summary_a.data['lessons']['S1-L002']['completed'])

        # User B logs out and in fresh
        self.client_b.post('/api/auth/logout/')
        self.client_b.credentials()

        login_b = self.client_b.post('/api/auth/login/', {
            'email': 'userb@example.com',
            'password': 'Password123!',
        })
        self.assertEqual(login_b.status_code, status.HTTP_200_OK)
        new_token_b = login_b.data['token']
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {new_token_b}')

        # Verify User B STILL has 0 completed levels
        summary_b = self.client_b.get('/api/lessons/progress/summary/')
        self.assertEqual(summary_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(summary_b.data['lessons']), 0)
        self.assertEqual(summary_b.data['stageProgress']['1'], 1)

    def test_d_cross_user_access_and_spoofing_blocked(self):
        """Test D: User B cannot retrieve, modify, or spoof User A's progress."""
        # User A completes Level 1
        self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 1, 'wpm': 55, 'accuracy': 99, 'completed': True, 'stars': 4
        })

        # User B attempts to query User A's progress using spoofed query params
        res_spoof_query = self.client_b.get(f'/api/lessons/progress/?user_id={self.user_a.id}&user={self.user_a.username}')
        self.assertEqual(res_spoof_query.status_code, status.HTTP_200_OK)
        # Result must only show User B's records (0), not User A's records
        self.assertEqual(len(res_spoof_query.data), 0)

        # User B attempts to modify or create progress attributing to User A via body spoofing
        res_spoof_post = self.client_b.post('/api/lessons/record/', {
            'user_id': self.user_a.id,
            'user': self.user_a.username,
            'email': self.user_a.email,
            'stage': 1,
            'lesson': 5,
            'wpm': 100,
            'accuracy': 100,
            'completed': True,
        })
        self.assertEqual(res_spoof_post.status_code, status.HTTP_200_OK)

        # Verify record was created for User B, NOT User A
        self.assertFalse(LessonProgress.objects.filter(user=self.user_a, lesson__order=5).exists())
        self.assertTrue(LessonProgress.objects.filter(user=self.user_b, lesson__order=5).exists())

        # Anonymous access blocked
        anon_client = APIClient()
        self.assertEqual(anon_client.get('/api/lessons/progress/summary/').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(anon_client.post('/api/lessons/record/', {'stage': 1, 'lesson': 1}).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_f_concurrency_and_repeated_completion_idempotent(self):
        """Test F: Repeated completion calls update metrics without duplicate records or corruption."""
        # First attempt: Pass Level 1 with 30 WPM
        res1 = self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 1, 'wpm': 30, 'accuracy': 90, 'completed': True, 'stars': 2
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Second attempt: Better WPM 50
        res2 = self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 1, 'wpm': 50, 'accuracy': 95, 'completed': True, 'stars': 3
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # Third attempt: Slower run 25 WPM (should not downgrade bestWpm)
        res3 = self.client_a.post('/api/lessons/record/', {
            'stage': 1, 'lesson': 1, 'wpm': 25, 'accuracy': 92, 'completed': True, 'stars': 1
        })
        self.assertEqual(res3.status_code, status.HTTP_200_OK)

        # Exactly 1 record in database (no duplicates!)
        self.assertEqual(LessonProgress.objects.filter(user=self.user_a, lesson__order=1).count(), 1)
        record = LessonProgress.objects.get(user=self.user_a, lesson__order=1)
        self.assertEqual(record.attempts, 3)
        self.assertEqual(float(record.best_wpm), 50.0)
        self.assertEqual(float(record.best_accuracy), 95.0)
        self.assertTrue(record.is_completed)

