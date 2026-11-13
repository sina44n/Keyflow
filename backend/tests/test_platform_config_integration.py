"""
KEYFLOW Platform Configuration, Maintenance Middleware & Feature Flags Integration Tests
========================================================================================
Comprehensive verification covering:
1. Public Platform Configuration endpoint (/api/platform/config/)
2. Public Active Announcements endpoint (/api/announcements/active/) and dismissals
3. Platform Maintenance Middleware (503 for consumers, bypass for health/admin/superadmins)
4. Feature Flag enforcements (practice, arcade, academy, leaderboard)
5. Account isolation between Platform Owner (sina44n07@gmail.com) and Secondary User (muhammedsinankp2005@gmail.com)
"""

import json
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from admin_api.models import GlobalPlatformConfig, PlatformAnnouncement
from accounts.models import UserProfile

User = get_user_model()


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']
)
class PlatformConfigIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Platform Owner (User ID 3 persona)
        self.owner = User.objects.create_user(
            username='sina44n07',
            email='sina44n07@gmail.com',
            password='TestPassword123!',
            role='SUPER_ADMIN',
            is_staff=True,
            is_superuser=True,
        )
        self.owner.clerk_id = 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'
        self.owner.save()
        profile_owner, _ = UserProfile.objects.get_or_create(user=self.owner)
        profile_owner.display_name = 'SINAN KP (Owner)'
        profile_owner.save()

        # 2. Secondary Normal User (User ID 1 persona)
        self.normal_user = User.objects.create_user(
            username='muhammedsinankp2005',
            email='muhammedsinankp2005@gmail.com',
            password='TestPassword123!',
            role='USER',
            is_staff=False,
            is_superuser=False,
        )
        self.normal_user.clerk_id = 'user_3LN4sX9cg3bUng1YzwiEB18Emh2'
        self.normal_user.save()
        profile_normal, _ = UserProfile.objects.get_or_create(user=self.normal_user)
        profile_normal.display_name = 'Muhammed Sinan (Normal)'
        profile_normal.save()

    def test_01_public_platform_config_endpoint(self):
        """Public platform config returns live database settings with correct schema."""
        response = self.client.get('/api/platform/config/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn('maintenance_mode', data)
        self.assertIn('maintenance_message', data)
        self.assertIn('registration_enabled', data)
        self.assertIn('arcade_enabled', data)
        self.assertIn('academy_enabled', data)
        self.assertIn('leaderboard_enabled', data)
        self.assertIn('guest_typing_enabled', data)
        self.assertIn('announcements_enabled', data)
        self.assertIn('default_duration', data)
        self.assertIn('allowed_durations', data)

        # Toggle via GlobalPlatformConfig model and verify live response reflects immediately
        config = GlobalPlatformConfig.get_config()
        config.maintenance_mode = True
        config.maintenance_message = 'Upgrading server cores'
        config.guest_typing_enabled = False
        config.save()

        res2 = self.client.get('/api/platform/config/')
        data2 = res2.json()
        self.assertTrue(data2['maintenance_mode'])
        self.assertEqual(data2['maintenance_message'], 'Upgrading server cores')
        self.assertFalse(data2['guest_typing_enabled'])

    def test_02_public_announcements_filtering_and_dismissal(self):
        """Active announcements are returned based on audience and unexpired status."""
        now = timezone.now()

        # Active Announcement for all
        a1 = PlatformAnnouncement.objects.create(
            title='Speed Sprint Tournament',
            message='Tournament is live this weekend!',
            type='INFO',
            target_audience='ALL',
            is_active=True,
            expires_at=now + timedelta(days=2),
            created_by=self.owner,
        )

        # Active Announcement for students/auth only
        a2 = PlatformAnnouncement.objects.create(
            title='Academy Update',
            message='New lessons added',
            type='SUCCESS',
            target_audience='STUDENTS',
            is_active=True,
            expires_at=now + timedelta(hours=5),
            created_by=self.owner,
        )

        # Inactive Announcement
        PlatformAnnouncement.objects.create(
            title='Old announcement',
            message='Expired',
            type='WARNING',
            target_audience='ALL',
            is_active=False,
            created_by=self.owner,
        )

        # Anonymous request -> only a1
        self.client.force_authenticate(user=None)
        res_anon = self.client.get('/api/announcements/active/')
        self.assertEqual(res_anon.status_code, status.HTTP_200_OK)
        items_anon = res_anon.json().get('announcements', [])
        self.assertEqual(len(items_anon), 1)
        self.assertEqual(items_anon[0]['id'], a1.id)

        # Authenticated request -> both a1 and a2
        self.client.force_authenticate(user=self.normal_user)
        res_auth = self.client.get('/api/announcements/active/')
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        items_auth = res_auth.json().get('announcements', [])
        self.assertEqual(len(items_auth), 2)

        # Dismissal
        dismiss_res = self.client.post(f'/api/announcements/{a1.id}/dismiss/')
        self.assertEqual(dismiss_res.status_code, status.HTTP_200_OK)
        self.assertEqual(dismiss_res.json().get('status'), 'dismissed')

    def test_03_maintenance_middleware_blocking_and_bypass(self):
        """PlatformMaintenanceMiddleware returns 503 for consumers when active, but exempts superusers and admin routes."""
        config = GlobalPlatformConfig.get_config()
        config.maintenance_mode = True
        config.maintenance_message = 'Under scheduled platform upgrade.'
        config.save()

        # 1. Public config and health endpoints remain 200
        res_config = self.client.get('/api/platform/config/')
        self.assertEqual(res_config.status_code, status.HTTP_200_OK)

        res_health = self.client.get('/api/health/')
        self.assertEqual(res_health.status_code, status.HTTP_200_OK)

        # 2. Anonymous consumer endpoint is blocked with 503
        self.client.force_authenticate(user=None)
        res_consumer = self.client.get('/api/practice/passages/')
        self.assertEqual(res_consumer.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = res_consumer.json()
        self.assertEqual(data.get('error'), 'maintenance_mode')
        self.assertEqual(data.get('detail'), 'Under scheduled platform upgrade.')

        # 3. Super Admin bypasses maintenance mode
        self.client.force_login(self.owner)
        self.client.force_authenticate(user=self.owner)
        res_owner_consumer = self.client.get('/api/practice/passages/')
        self.assertEqual(res_owner_consumer.status_code, status.HTTP_200_OK)

        # 4. Super Admin can access admin routes
        res_admin = self.client.get('/api/admin/overview/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

        # 5. Normal user is blocked with 503 even when logged in
        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_normal_consumer = self.client.get('/api/practice/passages/')
        self.assertEqual(res_normal_consumer.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_04_feature_flag_enforcements(self):
        """Feature flags in GlobalPlatformConfig strictly restrict corresponding feature modules."""
        config = GlobalPlatformConfig.get_config()
        config.maintenance_mode = False
        config.arcade_enabled = False
        config.academy_enabled = False
        config.leaderboard_enabled = False
        config.guest_typing_enabled = False
        config.save()

        self.client.force_authenticate(user=None)

        # 1. Arcade is disabled -> 403
        res_arcade = self.client.get('/api/games/stats/')
        self.assertEqual(res_arcade.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_arcade.json().get('error'), 'arcade_disabled')

        # 2. Academy is disabled -> 403
        res_academy = self.client.get('/api/lessons/curriculum/stages/')
        self.assertEqual(res_academy.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_academy.json().get('error'), 'academy_disabled')

        # 3. Leaderboard is disabled -> gracefully paused with disabled: True
        res_leaderboard = self.client.get('/api/leaderboard/')
        self.assertEqual(res_leaderboard.status_code, status.HTTP_200_OK)
        self.assertTrue(res_leaderboard.json().get('disabled'))

        # 4. Guest typing disabled -> guest cannot submit practice session
        session_payload = {
            'wpm': 55.0,
            'net_wpm': 52.0,
            'accuracy': 95.0,
            'duration_seconds': 60,
            'mode': 'timed',
            'keystrokes_total': 300,
            'keystrokes_correct': 285,
            'backspaces_count': 5,
        }
        res_guest_session = self.client.post(
            '/api/practice/sessions/',
            data=json.dumps(session_payload),
            content_type='application/json',
        )
        self.assertEqual(res_guest_session.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_guest_session.json().get('error'), 'guest_typing_disabled')

    def test_05_strict_account_isolation_owner_vs_secondary(self):
        """Owner and secondary user are strictly isolated: secondary user cannot access admin or owner data."""
        # 1. Owner can access admin status & overview
        self.client.force_login(self.owner)
        self.client.force_authenticate(user=self.owner)
        res_status_owner = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res_status_owner.status_code, status.HTTP_200_OK)
        self.assertTrue(res_status_owner.json().get('is_super_admin'))
        self.assertEqual(res_status_owner.json().get('email'), 'sina44n07@gmail.com')

        # 2. Secondary user is strictly rejected with 403
        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_status_normal = self.client.get('/api/admin/auth/status/')
        self.assertEqual(res_status_normal.status_code, status.HTTP_403_FORBIDDEN)

        res_overview_normal = self.client.get('/api/admin/overview/')
        self.assertEqual(res_overview_normal.status_code, status.HTTP_403_FORBIDDEN)

        res_settings_normal = self.client.get('/api/admin/settings/')
        self.assertEqual(res_settings_normal.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Secondary user identity remains Muhammed Sinan, never Sina
        self.assertNotEqual(self.owner.id, self.normal_user.id)
        self.assertNotEqual(self.owner.email, self.normal_user.email)
        self.assertNotEqual(self.owner.clerk_id, self.normal_user.clerk_id)
        self.assertEqual(self.normal_user.role, 'USER')
        self.assertFalse(self.normal_user.is_super_admin)
