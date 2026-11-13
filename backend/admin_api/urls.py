"""
KEYFLOW Admin API URL Dispatcher.
All endpoints are nested under /api/admin/.
"""

from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .permissions import IsSuperAdminUser
from .views import (
    AdminOverviewView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminUserActionView,
    AdminTypingConfigView,
    AdminPassagesListView,
    AdminPassageDetailView,
    AdminAcademyCurriculumView,
    AdminAcademyLevelToggleView,
    AdminArcadeView,
    AdminLeaderboardView,
    AdminLeaderboardRecalculateView,
    AdminAnnouncementsView,
    AdminAnnouncementDetailView,
    AdminSettingsView,
    AdminAuditLogsView,
    AdminDatabaseHealthView,
)


class AdminAuthStatusView(APIView):
    """
    GET /api/admin/auth/status/
    Validates current user's administrative privileges and returns their owner/admin role details.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        user = request.user
        return Response({
            'status': 'authorized',
            'user_id': user.id,
            'email': user.email,
            'username': user.username,
            'role': getattr(user, 'role', 'USER'),
            'is_owner': user.is_owner,
            'is_super_admin': user.is_super_admin,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }, status=status.HTTP_200_OK)


urlpatterns = [
    # Auth
    path('auth/status/', AdminAuthStatusView.as_view(), name='admin_auth_status'),

    # Module 01: Overview
    path('overview/', AdminOverviewView.as_view(), name='admin_overview'),

    # Module 02: Users
    path('users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('users/<int:user_id>/action/', AdminUserActionView.as_view(), name='admin_user_action'),

    # Module 03: Typing Controls & Passages
    path('typing/config/', AdminTypingConfigView.as_view(), name='admin_typing_config'),
    path('typing/passages/', AdminPassagesListView.as_view(), name='admin_passages_list'),
    path('typing/passages/<int:passage_id>/', AdminPassageDetailView.as_view(), name='admin_passage_detail'),

    # Module 04: Academy Curriculum
    path('academy/curriculum/', AdminAcademyCurriculumView.as_view(), name='admin_academy_curriculum'),
    path('academy/level/<int:level_id>/', AdminAcademyLevelToggleView.as_view(), name='admin_academy_level_toggle'),

    # Module 05: Arcade
    path('arcade/games/', AdminArcadeView.as_view(), name='admin_arcade_games'),

    # Module 06: Leaderboard
    path('leaderboard/', AdminLeaderboardView.as_view(), name='admin_leaderboard'),
    path('leaderboard/recalculate/', AdminLeaderboardRecalculateView.as_view(), name='admin_leaderboard_recalculate'),

    # Module 08: Announcements
    path('announcements/', AdminAnnouncementsView.as_view(), name='admin_announcements'),
    path('announcements/<int:announcement_id>/', AdminAnnouncementDetailView.as_view(), name='admin_announcement_detail'),

    # Module 09: Settings
    path('settings/', AdminSettingsView.as_view(), name='admin_settings'),

    # Module 11 & 12: Database & Health
    path('database/', AdminDatabaseHealthView.as_view(), name='admin_database_health'),
    path('health/', AdminDatabaseHealthView.as_view(), name='admin_health_status'),

    # Module 13: Audit Logs
    path('audit-logs/', AdminAuditLogsView.as_view(), name='admin_audit_logs'),
]
