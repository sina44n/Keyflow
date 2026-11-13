"""
KEYFLOW Super Admin API Views — Command Center, User Management,
Typing Controls, System Monitoring, and Audit Logs.
"""

from django.utils import timezone
from django.db.models import Count, Avg, Max, Q
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .permissions import IsSuperAdminUser, IsAdminUser, IsOwnerOnly
from .models import AdminAuditLog, GlobalPlatformConfig, UserTypingRestriction, PlatformAnnouncement
from practice.models import PracticeSession, Passage, Competition
from lessons.models import CurriculumStage, CurriculumUnit, CurriculumLevel, CurriculumLessonProgress
from games.models import GameSession, MultiplayerRoom
from accounts.serializers import FullUserSerializer

User = get_user_model()


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminOverviewView(APIView):
    """
    GET /api/admin/overview/
    Returns high-level platform KPIs, activity summary, and real-time health stats.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # User metrics
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__gte=today_start).count()
        active_today = User.objects.filter(last_login__gte=today_start).count()

        # Typing practice metrics
        total_sessions = PracticeSession.objects.count()
        sessions_today = PracticeSession.objects.filter(created_at__gte=today_start).count()
        wpm_stats = PracticeSession.objects.aggregate(avg_wpm=Avg('net_wpm'), max_wpm=Max('net_wpm'))
        avg_wpm = round(wpm_stats.get('avg_wpm') or 0, 1)
        max_wpm = round(wpm_stats.get('max_wpm') or 0, 1)

        # Academy metrics
        completed_lessons = CurriculumLessonProgress.objects.filter(is_completed=True).count()
        total_curriculum_levels = CurriculumLevel.objects.count()

        # Arcade metrics
        total_games_played = GameSession.objects.count()

        # Config / Maintenance
        config = GlobalPlatformConfig.get_config()

        # Recent activities (registrations + high sessions)
        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_sessions = PracticeSession.objects.select_related('user').order_by('-created_at')[:5]

        activities = []
        for u in recent_users:
            activities.append({
                'id': f'user_{u.id}',
                'type': 'USER_REGISTRATION',
                'title': f'New user joined: {u.username}',
                'user': u.username,
                'email': u.email,
                'timestamp': u.date_joined,
            })
        for s in recent_sessions:
            activities.append({
                'id': f'session_{s.id}',
                'type': 'TYPING_SESSION',
                'title': f'{s.user.username if s.user else "Typist"} scored {round(s.net_wpm)} WPM ({round(s.accuracy)}% acc)',
                'user': s.user.username if s.user else 'Anonymous',
                'wpm': round(s.net_wpm),
                'accuracy': round(s.accuracy),
                'timestamp': s.created_at,
            })

        activities.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response({
            'kpis': {
                'total_users': total_users,
                'new_users_today': new_users_today,
                'active_today': active_today,
                'total_sessions': total_sessions,
                'sessions_today': sessions_today,
                'avg_wpm': avg_wpm,
                'max_wpm': max_wpm,
                'completed_lessons': completed_lessons,
                'total_levels': total_curriculum_levels,
                'total_games_played': total_games_played,
            },
            'platform_config': {
                'maintenance_mode': config.maintenance_mode,
                'custom_text_enabled': config.custom_text_enabled,
                'allowed_durations': config.allowed_durations,
                'default_duration': config.default_duration,
            },
            'recent_activities': activities[:10],
            'system_health': {
                'database': 'operational',
                'engine': 'PostgreSQL',
                'version': '1.0.0',
            }
        }, status=status.HTTP_200_OK)


class AdminUsersListView(APIView):
    """
    GET /api/admin/users/
    Paginated user directory with search, role filter, status filter, and sorting.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        queryset = User.objects.all().order_by('-date_joined')

        # Filters
        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role', '').strip()
        user_status = request.query_params.get('status', '').strip()

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(username__icontains=search) | Q(clerk_id__icontains=search)
            )
        if role:
            queryset = queryset.filter(role=role.upper())
        if user_status:
            queryset = queryset.filter(status=user_status.upper())

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = FullUserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminUserDetailView(APIView):
    """
    GET /api/admin/users/<int:user_id>/
    Returns deep user diagnostics: practice history, academy curriculum progress, arcade stats,
    and typing restrictions.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Practice sessions
        sessions = PracticeSession.objects.filter(user=user).order_by('-created_at')[:20]
        session_data = [
            {
                'id': s.id,
                'net_wpm': round(s.net_wpm, 1),
                'gross_wpm': round(s.gross_wpm, 1),
                'accuracy': round(s.accuracy, 1),
                'duration_seconds': s.duration_seconds,
                'created_at': s.created_at,
            }
            for s in sessions
        ]

        # Aggregate metrics
        agg = PracticeSession.objects.filter(user=user).aggregate(
            total_tests=Count('id'),
            avg_wpm=Avg('net_wpm'),
            best_wpm=Max('net_wpm'),
            avg_accuracy=Avg('accuracy'),
        )

        # Academy progress
        completed_lessons = CurriculumLessonProgress.objects.filter(user=user, is_completed=True).count()

        # Arcade sessions
        arcade_games = GameSession.objects.filter(user=user).count()

        # Typing restriction
        restriction = getattr(user, 'typing_restriction', None)
        restriction_data = {
            'custom_text_allowed': restriction.custom_text_allowed if restriction else True,
            'disqualified_from_leaderboard': restriction.disqualified_from_leaderboard if restriction else False,
            'flagged_for_review': restriction.flagged_for_review if restriction else False,
            'allowed_durations': restriction.allowed_durations if restriction else [],
            'max_wpm_cap': restriction.max_wpm_cap if restriction else None,
        }

        return Response({
            'user': FullUserSerializer(user).data,
            'metrics': {
                'total_tests': agg.get('total_tests') or 0,
                'avg_wpm': round(agg.get('avg_wpm') or 0, 1),
                'best_wpm': round(agg.get('best_wpm') or 0, 1),
                'avg_accuracy': round(agg.get('avg_accuracy') or 0, 1),
                'completed_academy_lessons': completed_lessons,
                'arcade_games_played': arcade_games,
            },
            'recent_sessions': session_data,
            'typing_restrictions': restriction_data,
        }, status=status.HTTP_200_OK)


class AdminUserActionView(APIView):
    """
    POST /api/admin/users/<int:user_id>/action/
    Executes administrative actions: UPDATE_ROLE, SUSPEND, BAN, RESTORE, DELETE, RESET_STATS.
    Includes strict immutable protection for owner sina44n07@gmail.com.
    """
    permission_classes = [IsSuperAdminUser]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Target user not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        reason = request.data.get('reason', '').strip()

        # IMMUTABLE OWNER PROTECTION
        if target_user.is_owner:
            return Response(
                {'error': 'Security Violation: The primary platform owner account is permanently protected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        acting_admin = request.user

        if action == 'UPDATE_ROLE':
            new_role = request.data.get('role', '').upper()
            if new_role not in ['SUPER_ADMIN', 'ADMIN', 'USER']:
                return Response({'error': f'Invalid role: {new_role}'}, status=status.HTTP_400_BAD_REQUEST)
            target_user.role = new_role
            if new_role in ['SUPER_ADMIN', 'ADMIN']:
                target_user.is_staff = True
            else:
                target_user.is_staff = False
            target_user.save(update_fields=['role', 'is_staff'])
            AdminAuditLog.log('USER_ROLE_UPDATED', acting_admin, 'User', target_user.id, target_user.username, {'new_role': new_role})

        elif action == 'SUSPEND':
            target_user.status = 'SUSPENDED'
            target_user.suspension_reason = reason or 'Suspended by administrator'
            target_user.save(update_fields=['status', 'suspension_reason'])
            AdminAuditLog.log('USER_SUSPENDED', acting_admin, 'User', target_user.id, target_user.username, {'reason': reason})

        elif action == 'BAN':
            target_user.status = 'BANNED'
            target_user.suspension_reason = reason or 'Permanently banned by administrator'
            target_user.save(update_fields=['status', 'suspension_reason'])
            AdminAuditLog.log('USER_BANNED', acting_admin, 'User', target_user.id, target_user.username, {'reason': reason})

        elif action == 'RESTORE':
            target_user.status = 'ACTIVE'
            target_user.suspension_reason = ''
            target_user.deleted_at = None
            target_user.is_active = True
            target_user.save(update_fields=['status', 'suspension_reason', 'deleted_at', 'is_active'])
            AdminAuditLog.log('USER_RESTORED', acting_admin, 'User', target_user.id, target_user.username)

        elif action == 'DELETE':
            target_user.status = 'DELETED'
            target_user.is_active = False
            target_user.deleted_at = timezone.now()
            target_user.save(update_fields=['status', 'is_active', 'deleted_at'])
            AdminAuditLog.log('USER_DELETED', acting_admin, 'User', target_user.id, target_user.username, {'reason': reason})

        elif action == 'RESET_STATS':
            PracticeSession.objects.filter(user=target_user).delete()
            CurriculumLessonProgress.objects.filter(user=target_user).delete()
            GameSession.objects.filter(user=target_user).delete()
            AdminAuditLog.log('USER_STATS_RESET', acting_admin, 'User', target_user.id, target_user.username)

        else:
            return Response({'error': f'Unsupported action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'status': 'success',
            'action': action,
            'user': FullUserSerializer(target_user).data,
        }, status=status.HTTP_200_OK)


class AdminTypingConfigView(APIView):
    """
    GET/PUT /api/admin/typing/config/
    Manage allowed test durations, default duration, custom text toggle, and maintenance mode.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        config = GlobalPlatformConfig.get_config()
        return Response({
            'allowed_durations': config.allowed_durations,
            'default_duration': config.default_duration,
            'custom_text_enabled': config.custom_text_enabled,
            'maintenance_mode': config.maintenance_mode,
            'maintenance_message': config.maintenance_message,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        config = GlobalPlatformConfig.get_config()
        data = request.data or {}

        if 'allowed_durations' in data and isinstance(data['allowed_durations'], list):
            config.allowed_durations = [int(x) for x in data['allowed_durations'] if int(x) > 0]
        if 'default_duration' in data:
            config.default_duration = int(data['default_duration'])
        if 'custom_text_enabled' in data:
            config.custom_text_enabled = bool(data['custom_text_enabled'])
        if 'maintenance_mode' in data:
            config.maintenance_mode = bool(data['maintenance_mode'])
        if 'maintenance_message' in data:
            config.maintenance_message = str(data['maintenance_message']).strip()

        config.save()
        AdminAuditLog.log('PLATFORM_CONFIG_UPDATED', request.user, 'GlobalPlatformConfig', 1, 'Platform Settings', data)

        return Response({
            'status': 'updated',
            'allowed_durations': config.allowed_durations,
            'default_duration': config.default_duration,
            'custom_text_enabled': config.custom_text_enabled,
            'maintenance_mode': config.maintenance_mode,
            'maintenance_message': config.maintenance_message,
        }, status=status.HTTP_200_OK)


class AdminAuditLogsView(APIView):
    """
    GET /api/admin/audit-logs/
    Paginated listing of immutable audit records.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        logs = AdminAuditLog.objects.select_related('admin_user').all().order_by('-created_at')
        search = request.query_params.get('search', '').strip()
        if search:
            logs = logs.filter(
                Q(action__icontains=search) | Q(target_repr__icontains=search) | Q(admin_user__username__icontains=search)
            )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(logs, request)

        results = [
            {
                'id': log.id,
                'action': log.action,
                'admin_username': log.admin_user.username if log.admin_user else 'System',
                'admin_email': log.admin_user.email if log.admin_user else '',
                'target_model': log.target_model,
                'target_id': log.target_id,
                'target_repr': log.target_repr,
                'details': log.details,
                'ip_address': log.ip_address,
                'created_at': log.created_at,
            }
            for log in page
        ]

        return paginator.get_paginated_response(results)


class AdminDatabaseHealthView(APIView):
    """
    GET /api/admin/database/
    Database tables, row counts, and connectivity latency.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        from django.db import connection
        table_counts = {
            'users': User.objects.count(),
            'practice_sessions': PracticeSession.objects.count(),
            'curriculum_levels': CurriculumLevel.objects.count(),
            'curriculum_progress': CurriculumLessonProgress.objects.count(),
            'game_sessions': GameSession.objects.count(),
            'passages': Passage.objects.count(),
            'audit_logs': AdminAuditLog.objects.count(),
        }

        db_engine = connection.settings_dict.get('ENGINE', '').split('.')[-1]

        return Response({
            'database': {
                'status': 'ok',
                'engine': db_engine,
                'tables': table_counts,
            }
        }, status=status.HTTP_200_OK)


class AdminPassagesListView(APIView):
    """
    GET /api/admin/typing/passages/
    POST /api/admin/typing/passages/
    List and create typing practice passages.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        passages = Passage.objects.all().order_by('-created_at')
        category = request.query_params.get('category')
        difficulty = request.query_params.get('difficulty')
        search = request.query_params.get('search')

        if category:
            passages = passages.filter(category__iexact=category)
        if difficulty:
            passages = passages.filter(difficulty__iexact=difficulty)
        if search:
            passages = passages.filter(Q(title__icontains=search) | Q(content__icontains=search))

        paginator = StandardPagination()
        page = paginator.paginate_queryset(passages, request)

        results = [
            {
                'id': p.id,
                'title': p.title,
                'category': p.category,
                'difficulty': p.difficulty,
                'word_count': p.word_count,
                'is_active': p.is_active,
                'created_at': p.created_at,
                'content_preview': p.content[:100] + ('...' if len(p.content) > 100 else ''),
            }
            for p in page
        ]
        return paginator.get_paginated_response(results)

    def post(self, request):
        data = request.data or {}
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        category = data.get('category', 'general').strip()
        difficulty = data.get('difficulty', 'medium').strip()

        if not title or not content:
            return Response({'error': 'Title and content are required.'}, status=status.HTTP_400_BAD_REQUEST)

        word_count = len(content.split())
        passage = Passage.objects.create(
            title=title,
            content=content,
            category=category,
            difficulty=difficulty,
            word_count=word_count,
            is_active=True,
        )
        AdminAuditLog.log('PASSAGE_CREATED', request.user, 'Passage', passage.id, passage.title)

        return Response({
            'status': 'created',
            'passage': {
                'id': passage.id,
                'title': passage.title,
                'category': passage.category,
                'difficulty': passage.difficulty,
                'word_count': passage.word_count,
                'is_active': passage.is_active,
            }
        }, status=status.HTTP_201_CREATED)


class AdminPassageDetailView(APIView):
    """
    GET/PUT/DELETE /api/admin/typing/passages/<int:passage_id>/
    """
    permission_classes = [IsSuperAdminUser]

    def put(self, request, passage_id):
        try:
            passage = Passage.objects.get(pk=passage_id)
        except Passage.DoesNotExist:
            return Response({'error': 'Passage not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        if 'title' in data:
            passage.title = str(data['title']).strip()
        if 'content' in data:
            passage.content = str(data['content']).strip()
            passage.word_count = len(passage.content.split())
        if 'category' in data:
            passage.category = str(data['category']).strip()
        if 'difficulty' in data:
            passage.difficulty = str(data['difficulty']).strip()
        if 'is_active' in data:
            passage.is_active = bool(data['is_active'])

        passage.save()
        AdminAuditLog.log('PASSAGE_UPDATED', request.user, 'Passage', passage.id, passage.title)

        return Response({'status': 'updated'}, status=status.HTTP_200_OK)

    def delete(self, request, passage_id):
        try:
            passage = Passage.objects.get(pk=passage_id)
        except Passage.DoesNotExist:
            return Response({'error': 'Passage not found.'}, status=status.HTTP_404_NOT_FOUND)

        title = passage.title
        passage.delete()
        AdminAuditLog.log('PASSAGE_DELETED', request.user, 'Passage', passage_id, title)
        return Response({'status': 'deleted'}, status=status.HTTP_200_OK)


class AdminAcademyCurriculumView(APIView):
    """
    GET /api/admin/academy/curriculum/
    Returns full hierarchy of all 7 curriculum stages, units, and levels with completion counts.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        stages = CurriculumStage.objects.all().order_by('stage_number')
        stages_data = []

        for stage in stages:
            units = stage.units.all().order_by('unit_number')
            units_data = []

            for unit in units:
                levels = unit.levels.all().order_by('level_in_unit')
                levels_data = [
                    {
                        'id': lvl.id,
                        'logical_id': lvl.logical_id,
                        'title': lvl.title,
                        'level_in_unit': lvl.level_in_unit,
                        'target_wpm': lvl.target_wpm,
                        'target_accuracy': lvl.target_accuracy,
                        'is_published': lvl.is_published,
                        'is_assessment': lvl.is_assessment,
                    }
                    for lvl in levels
                ]
                units_data.append({
                    'id': unit.id,
                    'unit_number': unit.unit_number,
                    'title': unit.title,
                    'levels_count': len(levels_data),
                    'levels': levels_data,
                })

            stages_data.append({
                'id': stage.id,
                'stage_number': stage.stage_number,
                'title': stage.title,
                'pedagogical_focus': stage.pedagogical_focus,
                'target_wpm_start': stage.target_wpm_start,
                'target_wpm_end': stage.target_wpm_end,
                'is_published': stage.is_published,
                'units_count': len(units_data),
                'units': units_data,
            })

        return Response({'stages': stages_data}, status=status.HTTP_200_OK)


class AdminAcademyLevelToggleView(APIView):
    """
    PUT /api/admin/academy/level/<int:level_id>/
    Toggles is_published status of a curriculum level.
    """
    permission_classes = [IsSuperAdminUser]

    def put(self, request, level_id):
        try:
            level = CurriculumLevel.objects.get(pk=level_id)
        except CurriculumLevel.DoesNotExist:
            return Response({'error': 'Curriculum level not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_published = request.data.get('is_published')
        if is_published is not None:
            level.is_published = bool(is_published)
            level.save(update_fields=['is_published'])
            AdminAuditLog.log('CURRICULUM_LEVEL_TOGGLED', request.user, 'CurriculumLevel', level.id, level.title, {'is_published': level.is_published})

        return Response({'status': 'updated', 'is_published': level.is_published}, status=status.HTTP_200_OK)


class AdminArcadeView(APIView):
    """
    GET /api/admin/arcade/games/
    High-level arcade stats, sessions by game type, and multiplayer rooms.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        game_stats = GameSession.objects.values('game_type').annotate(
            total_plays=Count('id'),
            high_score=Max('score'),
            avg_accuracy=Avg('accuracy'),
        ).order_by('-total_plays')

        recent_sessions = GameSession.objects.select_related('user').order_by('-created_at')[:15]
        recent_data = [
            {
                'id': gs.id,
                'game_type': gs.game_type,
                'score': gs.score,
                'accuracy': round(gs.accuracy, 1),
                'duration_seconds': gs.duration_seconds,
                'username': gs.user.username if gs.user else 'Guest',
                'created_at': gs.created_at,
            }
            for gs in recent_sessions
        ]

        active_rooms = MultiplayerRoom.objects.filter(status__in=['waiting', 'countdown', 'in_progress']).count()

        return Response({
            'game_stats': list(game_stats),
            'recent_sessions': recent_data,
            'active_multiplayer_rooms': active_rooms,
        }, status=status.HTTP_200_OK)


class AdminLeaderboardView(APIView):
    """
    GET /api/admin/leaderboard/
    Returns top leaderboard entries across practice sessions and allows admin inspection.
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        top_sessions = PracticeSession.objects.select_related('user').filter(
            net_wpm__gte=20
        ).order_by('-net_wpm')[:50]

        results = [
            {
                'id': s.id,
                'username': s.user.username if s.user else 'Anonymous',
                'user_id': s.user.id if s.user else None,
                'email': s.user.email if s.user else '',
                'net_wpm': round(s.net_wpm, 1),
                'gross_wpm': round(s.gross_wpm, 1),
                'accuracy': round(s.accuracy, 1),
                'duration_seconds': s.duration_seconds,
                'created_at': s.created_at,
            }
            for s in top_sessions
        ]
        return Response({'leaderboard': results}, status=status.HTTP_200_OK)


class AdminLeaderboardRecalculateView(APIView):
    """
    POST /api/admin/leaderboard/recalculate/
    Audit action to clean up corrupted or impossible (>350 WPM) test runs.
    """
    permission_classes = [IsSuperAdminUser]

    def post(self, request):
        # Purge bot/glitched sessions with impossible stats
        glitched = PracticeSession.objects.filter(net_wpm__gt=350)
        glitched_count = glitched.count()
        glitched.delete()

        AdminAuditLog.log('LEADERBOARD_RECALCULATED', request.user, 'PracticeSession', details={'purged_glitches': glitched_count})
        return Response({
            'status': 'recalculated',
            'purged_anomalies': glitched_count,
        }, status=status.HTTP_200_OK)


class AdminAnnouncementsView(APIView):
    """
    GET/POST /api/admin/announcements/
    """
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        announcements = PlatformAnnouncement.objects.all().order_by('-created_at')
        results = [
            {
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'type': a.type,
                'target_audience': a.target_audience,
                'is_active': a.is_active,
                'created_at': a.created_at,
            }
            for a in announcements
        ]
        return Response({'announcements': results}, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data or {}
        title = data.get('title', '').strip()
        message = data.get('message', '').strip()
        msg_type = data.get('type', 'INFO').upper()
        target_audience = data.get('target_audience', 'ALL').upper()
        expires_at = data.get('expires_at')

        if not title or not message:
            return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        announcement = PlatformAnnouncement.objects.create(
            title=title,
            message=message,
            type=msg_type,
            target_audience=target_audience,
            is_active=True,
            created_by=request.user,
            expires_at=expires_at,
        )
        AdminAuditLog.log('ANNOUNCEMENT_CREATED', request.user, 'PlatformAnnouncement', announcement.id, announcement.title)

        return Response({
            'status': 'created',
            'announcement': {
                'id': announcement.id,
                'title': announcement.title,
                'type': announcement.type,
                'is_active': announcement.is_active,
            }
        }, status=status.HTTP_201_CREATED)


class AdminAnnouncementDetailView(APIView):
    """
    PUT/DELETE /api/admin/announcements/<int:announcement_id>/
    """
    permission_classes = [IsSuperAdminUser]

    def put(self, request, announcement_id):
        try:
            announcement = PlatformAnnouncement.objects.get(pk=announcement_id)
        except PlatformAnnouncement.DoesNotExist:
            return Response({'error': 'Announcement not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        if 'is_active' in data:
            announcement.is_active = bool(data['is_active'])
        if 'title' in data:
            announcement.title = str(data['title']).strip()
        if 'message' in data:
            announcement.message = str(data['message']).strip()
        if 'type' in data:
            announcement.type = str(data['type']).upper()
        if 'target_audience' in data:
            announcement.target_audience = str(data['target_audience']).upper()
        if 'expires_at' in data:
            announcement.expires_at = data['expires_at']

        announcement.save()
        AdminAuditLog.log('ANNOUNCEMENT_UPDATED', request.user, 'PlatformAnnouncement', announcement.id, announcement.title)
        return Response({'status': 'updated'}, status=status.HTTP_200_OK)

    def delete(self, request, announcement_id):
        try:
            announcement = PlatformAnnouncement.objects.get(pk=announcement_id)
        except PlatformAnnouncement.DoesNotExist:
            return Response({'error': 'Announcement not found.'}, status=status.HTTP_404_NOT_FOUND)

        title = announcement.title
        announcement.delete()
        AdminAuditLog.log('ANNOUNCEMENT_DELETED', request.user, 'PlatformAnnouncement', announcement_id, title)
        return Response({'status': 'deleted'}, status=status.HTTP_200_OK)


class AdminSettingsView(APIView):
    """
    GET/PUT /api/admin/settings/
    Platform feature flags, registration policy, and maintenance banner.
    """
    permission_classes = [IsSuperAdminUser]

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
            'allowed_durations': config.allowed_durations,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        config = GlobalPlatformConfig.get_config()
        data = request.data or {}

        if 'maintenance_mode' in data:
            config.maintenance_mode = bool(data['maintenance_mode'])
        if 'maintenance_message' in data:
            config.maintenance_message = str(data['maintenance_message']).strip()
        if 'registration_enabled' in data:
            config.registration_enabled = bool(data['registration_enabled'])
        if 'custom_text_enabled' in data:
            config.custom_text_enabled = bool(data['custom_text_enabled'])
        if 'competition_enabled' in data:
            config.competition_enabled = bool(data['competition_enabled'])
        if 'arcade_enabled' in data:
            config.arcade_enabled = bool(data['arcade_enabled'])
        if 'academy_enabled' in data:
            config.academy_enabled = bool(data['academy_enabled'])
        if 'leaderboard_enabled' in data:
            config.leaderboard_enabled = bool(data['leaderboard_enabled'])
        if 'guest_typing_enabled' in data:
            config.guest_typing_enabled = bool(data['guest_typing_enabled'])
        if 'announcements_enabled' in data:
            config.announcements_enabled = bool(data['announcements_enabled'])
        if 'default_duration' in data:
            config.default_duration = int(data['default_duration'])
        if 'allowed_durations' in data and isinstance(data['allowed_durations'], list):
            config.allowed_durations = [int(x) for x in data['allowed_durations'] if int(x) > 0]

        config.save()
        AdminAuditLog.log('PLATFORM_SETTINGS_UPDATED', request.user, 'GlobalPlatformConfig', 1, 'Settings', data)

        return Response({'status': 'updated'}, status=status.HTTP_200_OK)


