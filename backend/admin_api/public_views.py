"""
Public Platform Endpoints — Configuration & Active Announcements.
Exposes read-only platform configuration and active announcements to the consumer frontend.
Never exposes credentials, secrets, or administrative data.
"""

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import GlobalPlatformConfig, PlatformAnnouncement


class PublicPlatformConfigView(APIView):
    """
    GET /api/platform/config/
    Publicly exposes current platform feature flags, maintenance status, and typing defaults.
    Accessible anonymously by any visitor or authenticated user.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        config = GlobalPlatformConfig.get_config()
        return Response({
            'maintenance_mode': config.maintenance_mode,
            'maintenance_message': config.maintenance_message,
            'registration_enabled': config.registration_enabled,
            'custom_text_enabled': config.custom_text_enabled,
            'competition_enabled': config.competition_enabled,
            'arcade_enabled': config.arcade_enabled,
            'academy_enabled': config.academy_enabled,
            'leaderboard_enabled': config.leaderboard_enabled,
            'guest_typing_enabled': config.guest_typing_enabled,
            'announcements_enabled': config.announcements_enabled,
            'default_duration': config.default_duration,
            'allowed_durations': config.allowed_durations or [15, 30, 60, 120, 300],
            'updated_at': config.updated_at.isoformat() if config.updated_at else None,
        }, status=status.HTTP_200_OK)


class PublicAnnouncementsView(APIView):
    """
    GET /api/announcements/active/
    Returns currently active, unexpired announcements for the consumer website.
    Filters by target audience where appropriate.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        config = GlobalPlatformConfig.get_config()
        if not config.announcements_enabled:
            return Response({'announcements': []}, status=status.HTTP_200_OK)

        now = timezone.now()
        qs = PlatformAnnouncement.objects.filter(is_active=True)
        # Exclude expired announcements
        qs = qs.exclude(expires_at__isnull=False, expires_at__lte=now)

        # Check audience filter
        user = request.user
        is_admin = user.is_authenticated and (getattr(user, 'is_staff', False) or getattr(user, 'role', '') in ['ADMIN', 'SUPER_ADMIN'])
        
        if is_admin:
            audience_filter = ['ALL', 'STUDENTS', 'ADMINS']
        elif user.is_authenticated:
            audience_filter = ['ALL', 'STUDENTS']
        else:
            audience_filter = ['ALL']

        announcements = qs.filter(target_audience__in=audience_filter).order_by('-created_at')

        results = [
            {
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'type': a.type,
                'target_audience': a.target_audience,
                'created_at': a.created_at.isoformat() if a.created_at else None,
                'expires_at': a.expires_at.isoformat() if a.expires_at else None,
            }
            for a in announcements
        ]

        return Response({'announcements': results}, status=status.HTTP_200_OK)


class PublicAnnouncementDismissView(APIView):
    """
    POST /api/announcements/<int:announcement_id>/dismiss/
    Acknowledges client-side dismissal of an announcement.
    """
    permission_classes = [AllowAny]

    def post(self, request, announcement_id):
        return Response({'status': 'dismissed', 'id': announcement_id}, status=status.HTTP_200_OK)

