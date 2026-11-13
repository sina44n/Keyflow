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

    def test_06_allowed_durations_enforcement(self):
        """Unsupported timed test durations are rejected with 400 Bad Request."""
        config = GlobalPlatformConfig.get_config()
        config.allowed_durations = [15, 30, 60, 120]
        config.guest_typing_enabled = True
        config.maintenance_mode = False
        config.save()

        self.client.force_authenticate(user=None)

        # 1. Timed test with unsupported duration (45s) -> 400
        invalid_payload = {
            'session_type': 'timed',
            'duration_seconds': 45,
            'total_chars': 200,
            'correct_chars': 190,
            'incorrect_chars': 10,
        }
        res_invalid = self.client.post(
            '/api/practice/sessions/',
            data=json.dumps(invalid_payload),
            content_type='application/json',
        )
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_invalid.json().get('error'), 'unsupported_duration')

        # 2. Timed test with allowed duration (60s) -> 201
        valid_payload = {
            'session_type': 'timed',
            'duration_seconds': 60,
            'total_chars': 200,
            'correct_chars': 190,
            'incorrect_chars': 10,
        }
        res_valid = self.client.post(
            '/api/practice/sessions/',
            data=json.dumps(valid_payload),
            content_type='application/json',
        )
        self.assertEqual(res_valid.status_code, status.HTTP_201_CREATED)

    def test_07_custom_text_and_registration_flags(self):
        """Custom text and registration flags strictly block restricted submissions."""
        config = GlobalPlatformConfig.get_config()
        config.maintenance_mode = False
        config.custom_text_enabled = False
        config.registration_enabled = False
        config.save()

        # 1. Custom text submission -> 403
        self.client.force_authenticate(user=self.normal_user)
        custom_payload = {
            'session_type': 'custom',
            'duration_seconds': 60,
            'total_chars': 100,
            'correct_chars': 95,
            'incorrect_chars': 5,
        }
        res_custom = self.client.post(
            '/api/practice/sessions/',
            data=json.dumps(custom_payload),
            content_type='application/json',
        )
        self.assertEqual(res_custom.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_custom.json().get('error'), 'custom_text_disabled')

        # 2. Registration disabled -> 403
        self.client.force_authenticate(user=None)
        register_payload = {
            'username': 'newuser123',
            'email': 'newuser123@example.com',
            'password': 'SecurePassword123!',
        }
        res_reg = self.client.post(
            '/api/auth/register/',
            data=json.dumps(register_payload),
            content_type='application/json',
        )
        self.assertEqual(res_reg.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Registration is currently disabled', res_reg.json().get('error', ''))

    def test_08_announcement_crud_and_admin_leak_protection(self):
        """Owner can CRUD announcements, normal user cannot, and ADMINS announcements never leak to public."""
        # 1. Normal user tries to create announcement -> 403
        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_create_denied = self.client.post(
            '/api/admin/announcements/',
            data={'title': 'Hack', 'message': 'Deny me'},
        )
        self.assertEqual(res_create_denied.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Owner creates admin-only announcement
        self.client.force_login(self.owner)
        self.client.force_authenticate(user=self.owner)
        res_create_admin = self.client.post(
            '/api/admin/announcements/',
            data={
                'title': 'Internal Security Notice',
                'message': 'Audit logs are being rotated',
                'type': 'WARNING',
                'target_audience': 'ADMINS',
            },
        )
        self.assertEqual(res_create_admin.status_code, status.HTTP_201_CREATED)
        admin_anno_id = res_create_admin.json().get('announcement', {}).get('id')

        # 3. Owner creates public announcement
        res_create_pub = self.client.post(
            '/api/admin/announcements/',
            data={
                'title': 'Welcome New Typists',
                'message': 'Enjoy learning flow',
                'type': 'INFO',
                'target_audience': 'ALL',
            },
        )
        self.assertEqual(res_create_pub.status_code, status.HTTP_201_CREATED)
        pub_anno_id = res_create_pub.json().get('announcement', {}).get('id')

        # 4. Normal user queries active announcements -> sees ALL, does NOT see ADMINS
        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_annos = self.client.get('/api/announcements/active/')
        self.assertEqual(res_annos.status_code, status.HTTP_200_OK)
        active_ids = [a['id'] for a in res_annos.json().get('announcements', [])]
        self.assertIn(pub_anno_id, active_ids)
        self.assertNotIn(admin_anno_id, active_ids)

        # 5. Owner edits public announcement
        self.client.force_login(self.owner)
        self.client.force_authenticate(user=self.owner)
        res_update = self.client.put(
            f'/api/admin/announcements/{pub_anno_id}/',
            data={'title': 'Updated Welcome Banner', 'message': 'Updated text'},
            content_type='application/json',
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)

        # 6. Public announcement has updated content
        res_annos_updated = self.client.get('/api/announcements/active/')
        updated_pub = next(a for a in res_annos_updated.json()['announcements'] if a['id'] == pub_anno_id)
        self.assertEqual(updated_pub['title'], 'Updated Welcome Banner')

        # 7. Owner deletes announcement
        res_delete = self.client.delete(f'/api/admin/announcements/{pub_anno_id}/')
        self.assertEqual(res_delete.status_code, status.HTTP_200_OK)
        self.assertEqual(res_delete.json().get('status'), 'deleted')

    def test_09_maintenance_mode_reversible_recovery(self):
        """Toggling maintenance mode immediately blocks and restores consumer access without restart."""
        config = GlobalPlatformConfig.get_config()

        # Step 1: Enable maintenance
        config.maintenance_mode = True
        config.maintenance_message = 'Undergoing scheduled maintenance.'
        config.save()

        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_blocked = self.client.get('/api/practice/passages/')
        self.assertEqual(res_blocked.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

        # Step 2: Disable maintenance
        config.maintenance_mode = False
        config.save()

        res_restored = self.client.get('/api/practice/passages/')
        self.assertEqual(res_restored.status_code, status.HTTP_200_OK)

    def test_10_account_switching_and_privilege_boundary(self):
        """Switching between accounts completely decouples permissions and rejects forged owner claims."""
        # Step 1: Normal user attempts to claim owner identity via ClerkSyncView -> 403 Forbidden
        self.client.force_login(self.normal_user)
        self.client.force_authenticate(user=self.normal_user)
        res_forgery = self.client.post(
            '/api/auth/clerk-sync/',
            data={'email': 'sina44n07@gmail.com', 'display_name': 'Hacker Impersonator'},
            content_type='application/json',
        )
        self.assertEqual(res_forgery.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission denied', res_forgery.json().get('detail', ''))

        # Step 2: Normal user cannot access admin
        res_admin_normal = self.client.get('/api/admin/overview/')
        self.assertEqual(res_admin_normal.status_code, status.HTTP_403_FORBIDDEN)

        # Step 3: Owner signs in -> has access
        self.client.force_login(self.owner)
        self.client.force_authenticate(user=self.owner)
        res_admin_owner = self.client.get('/api/admin/overview/')
        self.assertEqual(res_admin_owner.status_code, status.HTTP_200_OK)
