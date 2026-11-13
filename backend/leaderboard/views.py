"""
Leaderboard Views
=================
Data-driven Global Leaderboard powered by genuine typing performance from registered KEYFLOW users.
Calculates authentic rankings across:
- Scopes: Global, Weekly, Competitions
- Time periods: Daily, Weekly, Monthly, All Time
- Test durations: 15s, 30s, 60s, 120s, All
- Continents: All, Africa, Asia, Europe, North America, South America, Oceania, Antarctica
- Categories: Speed (Net WPM), Accuracy (%), Overall (Balanced formula)
- Platform & Period Overview Stats
- Personal Rank identification for authenticated users
"""

import datetime
import logging
from django.utils import timezone
from django.db.models import Count, Avg, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from accounts.models import User
from practice.models import PracticeSession, Competition, CompetitionParticipant
from .serializers import LeaderboardResponseSerializer

logger = logging.getLogger(__name__)


class LeaderboardHealthView(APIView):
    """Health check endpoint for leaderboard service."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'app': 'leaderboard', 'status': 'ok'})


class GlobalLeaderboardView(APIView):
    """
    GET /api/leaderboard/
    Returns real, data-driven leaderboard entries and summary statistics.
    Supported query parameters:
      - scope: 'global' | 'weekly' | 'competitions' (default: 'global')
      - period: 'daily' | 'weekly' | 'monthly' | 'all_time' (default: 'all_time')
      - category: 'speed' | 'accuracy' | 'overall' (default: 'speed')
      - duration: 'all' | '15' | '30' | '60' | '120' (default: 'all')
      - continent: 'all' | 'africa' | 'asia' | 'europe' | 'north_america' | 'south_america' | 'oceania' | 'antarctica' (default: 'all')
      - limit: int between 1 and 100 (default: 10)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            from admin_api.models import GlobalPlatformConfig
            if not GlobalPlatformConfig.get_config().leaderboard_enabled:
                return Response({
                    'podium': [],
                    'results': [],
                    'summary': {'total_registered': 0, 'total_participated': 0, 'top_wpm': 0, 'platform_accuracy': 0},
                    'disabled': True,
                    'message': 'Leaderboard is currently paused by platform administration.',
                }, status=status.HTTP_200_OK)
        except Exception:
            pass

        try:
            # 1. Parse and validate query parameters
            scope = request.query_params.get('scope', 'global').lower().strip()
            if scope not in ['global', 'weekly', 'competitions']:
                scope = 'global'

            period = request.query_params.get('period', 'all_time').lower().strip()
            if scope == 'weekly':
                period = 'weekly'
            elif period not in ['daily', 'weekly', 'monthly', 'all_time']:
                period = 'all_time'

            category = request.query_params.get('category', 'speed').lower().strip()
            if category not in ['speed', 'accuracy', 'overall']:
                category = 'speed'

            duration = request.query_params.get('duration', 'all').lower().strip()
            if duration not in ['all', '15', '30', '60', '120']:
                duration = 'all'

            continent = request.query_params.get('continent', 'all').lower().strip()
            valid_continents = ['all', 'africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania', 'antarctica']
            if continent not in valid_continents:
                continent = 'all'

            try:
                limit = int(request.query_params.get('limit', 10))
                limit = max(1, min(limit, 100))
            except (ValueError, TypeError):
                limit = 10

            now = timezone.now()

            # 2. Compute Period Start Time & Countdown Timer
            period_start = None
            period_end = None
            time_remaining = None

            if period == 'daily':
                period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + datetime.timedelta(days=1)
            elif period == 'weekly':
                # Monday 00:00:00 UTC through Sunday 23:59:59 UTC
                days_since_monday = now.weekday()
                period_start = (now - datetime.timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + datetime.timedelta(days=7)
            elif period == 'monthly':
                # 1st of current month 00:00:00 UTC
                period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if now.month == 12:
                    period_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    period_end = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                period_start = None
                period_end = None

            if period_end:
                diff = period_end - now
                total_seconds = max(0, int(diff.total_seconds()))
                days = total_seconds // 86400
                hours = (total_seconds % 86400) // 3600
                minutes = (total_seconds % 3600) // 60
                seconds = total_seconds % 60
                time_remaining = {
                    'total_seconds': total_seconds,
                    'days': days,
                    'hours': hours,
                    'minutes': minutes,
                    'seconds': seconds,
                    'formatted': f"{days:02d} : {hours:02d} : {minutes:02d}" if days > 0 else f"{hours:02d} : {minutes:02d} : {seconds:02d}",
                }

            # 3. Query Candidate Records Based on Scope
            available_competitions_data = None

            if scope == 'competitions':
                # Query competition participations
                comp_qs = CompetitionParticipant.objects.filter(
                    user__isnull=False,
                    user__is_active=True,
                    status='completed',
                    net_wpm__gt=0,
                    accuracy__gt=0,
                )

                if continent != 'all':
                    comp_qs = comp_qs.filter(user__profile__continent__iexact=continent)

                if period_start:
                    comp_qs = comp_qs.filter(completed_at__gte=period_start)

                # Slices of available competitions for the UI
                available_comps = Competition.objects.filter(is_public=True).order_by('-created_at')[:10]
                available_competitions_data = [
                    {
                        'code': c.code,
                        'name': c.name,
                        'challenge_type': c.challenge_type,
                        'target_limit': c.target_limit,
                        'status': c.status,
                        'participants_count': c.participants.count(),
                        'created_at': c.created_at,
                    }
                    for c in available_comps
                ]

                eligible_records = list(
                    comp_qs.select_related('user', 'user__profile', 'competition')
                    .order_by('-completed_at')
                )

                # Map user best competition results
                user_ids_in_cohort = {p.user_id for p in eligible_records}
                user_total_sessions = dict(
                    PracticeSession.objects.filter(user_id__in=user_ids_in_cohort)
                    .values('user_id')
                    .annotate(cnt=Count('id'))
                    .values_list('user_id', 'cnt')
                )

                user_best_sessions = {}
                for p in eligible_records:
                    uid = p.user_id
                    net_wpm = float(p.net_wpm)
                    gross_wpm = float(p.gross_wpm)
                    accuracy = float(p.accuracy)
                    duration = int(p.duration_seconds or 30)
                    timestamp = (p.completed_at or p.joined_at).timestamp()

                    if category == 'speed':
                        score = net_wpm
                        sort_key = (net_wpm, accuracy, -duration, -timestamp)
                    elif category == 'accuracy':
                        score = accuracy
                        sort_key = (accuracy, net_wpm, -duration, -timestamp)
                    else:  # overall
                        dur_factor = min(1.0, (duration / 30.0) ** 0.5)
                        score = round(net_wpm * (accuracy / 100.0) * dur_factor, 2)
                        sort_key = (score, net_wpm, accuracy, -timestamp)

                    if uid not in user_best_sessions or sort_key > user_best_sessions[uid]['sort_key']:
                        avatar_url = ''
                        display_name = p.user.username
                        user_continent = ''
                        try:
                            if hasattr(p.user, 'profile'):
                                avatar_url = p.user.profile.avatar_url or ''
                                display_name = p.user.profile.display_name or p.user.username
                                user_continent = p.user.profile.continent or ''
                        except Exception:
                            pass

                        user_best_sessions[uid] = {
                            'sort_key': sort_key,
                            'user_id': uid,
                            'username': p.user.username,
                            'display_name': display_name,
                            'avatar_url': avatar_url,
                            'continent': user_continent,
                            'net_wpm': round(net_wpm, 2),
                            'gross_wpm': round(gross_wpm, 2),
                            'accuracy': round(accuracy, 2),
                            'score': round(score, 2),
                            'duration_seconds': duration,
                            'session_type': 'competition',
                            'total_chars': p.correct_chars + p.incorrect_chars,
                            'sessions_count': user_total_sessions.get(uid, 1),
                            'achieved_at': p.completed_at or p.joined_at,
                        }

                base_eval_qs = comp_qs

            else:
                # Global or Weekly Practice Sessions
                base_qs = PracticeSession.objects.filter(
                    user__isnull=False,
                    user__is_active=True,
                    net_wpm__gt=0,
                    accuracy__gt=0,
                    total_chars__gte=15,
                    duration_seconds__gte=10,
                )

                if category == 'accuracy':
                    # Require at least 50 typed characters so that 1-word tests cannot monopolize accuracy
                    base_qs = base_qs.filter(total_chars__gte=50)

                if duration != 'all':
                    dur_int = int(duration)
                    base_qs = base_qs.filter(duration_seconds=dur_int)

                if continent != 'all':
                    base_qs = base_qs.filter(user__profile__continent__iexact=continent)

                if period_start:
                    base_qs = base_qs.filter(created_at__gte=period_start)

                eligible_records = list(
                    base_qs.select_related('user', 'user__profile')
                    .order_by('-created_at')
                )

                user_ids_in_cohort = {s.user_id for s in eligible_records}
                user_total_sessions = dict(
                    PracticeSession.objects.filter(user_id__in=user_ids_in_cohort)
                    .values('user_id')
                    .annotate(cnt=Count('id'))
                    .values_list('user_id', 'cnt')
                )

                user_best_sessions = {}
                for s in eligible_records:
                    uid = s.user_id
                    net_wpm = float(s.net_wpm)
                    gross_wpm = float(s.gross_wpm)
                    accuracy = float(s.accuracy)
                    duration_val = int(s.duration_seconds)
                    timestamp = s.created_at.timestamp()

                    if category == 'speed':
                        score = net_wpm
                        sort_key = (net_wpm, accuracy, -duration_val, -timestamp)
                    elif category == 'accuracy':
                        score = accuracy
                        sort_key = (accuracy, net_wpm, -duration_val, -timestamp)
                    else:  # overall
                        dur_factor = min(1.0, (duration_val / 30.0) ** 0.5)
                        score = round(net_wpm * (accuracy / 100.0) * dur_factor, 2)
                        sort_key = (score, net_wpm, accuracy, -timestamp)

                    if uid not in user_best_sessions or sort_key > user_best_sessions[uid]['sort_key']:
                        avatar_url = ''
                        display_name = s.user.username
                        user_continent = ''
                        try:
                            if hasattr(s.user, 'profile'):
                                avatar_url = s.user.profile.avatar_url or ''
                                display_name = s.user.profile.display_name or s.user.username
                                user_continent = s.user.profile.continent or ''
                        except Exception:
                            pass

                        user_best_sessions[uid] = {
                            'sort_key': sort_key,
                            'user_id': uid,
                            'username': s.user.username,
                            'display_name': display_name,
                            'avatar_url': avatar_url,
                            'continent': user_continent,
                            'net_wpm': round(net_wpm, 2),
                            'gross_wpm': round(gross_wpm, 2),
                            'accuracy': round(accuracy, 2),
                            'score': round(score, 2),
                            'duration_seconds': duration_val,
                            'session_type': s.session_type,
                            'total_chars': s.total_chars,
                            'sessions_count': user_total_sessions.get(uid, 1),
                            'achieved_at': s.created_at,
                        }

                base_eval_qs = base_qs

            # 4. Sort entries and assign ranks
            sorted_candidates = sorted(
                user_best_sessions.values(),
                key=lambda x: x['sort_key'],
                reverse=True,
            )

            all_ranked_entries = []
            for rank_idx, cand in enumerate(sorted_candidates, start=1):
                entry = dict(cand)
                entry.pop('sort_key', None)
                entry['rank'] = rank_idx
                all_ranked_entries.append(entry)

            # 5. Platform & Period Overview Stats
            registered_typists = User.objects.filter(is_active=True).count()
            active_competitors = len(all_ranked_entries)

            top_speed = 0.0
            top_speed_user = None
            if all_ranked_entries:
                fastest_entry = max(all_ranked_entries, key=lambda x: x['net_wpm'])
                top_speed = fastest_entry['net_wpm']
                top_speed_user = fastest_entry['display_name'] or fastest_entry['username']

            if eligible_records:
                avg_acc_val = base_eval_qs.aggregate(avg_acc=Avg('accuracy'))['avg_acc']
                avg_accuracy = round(float(avg_acc_val or 0.0), 1)
            else:
                all_time_acc = PracticeSession.objects.filter(
                    user__isnull=False, net_wpm__gt=0, accuracy__gt=0, total_chars__gte=15
                ).aggregate(avg_acc=Avg('accuracy'))['avg_acc']
                avg_accuracy = round(float(all_time_acc or 0.0), 1)

            stats_data = {
                'registered_typists': registered_typists,
                'active_competitors': active_competitors,
                'top_speed': top_speed,
                'top_speed_user': top_speed_user,
                'avg_accuracy': avg_accuracy,
                'period_time_remaining': time_remaining,
            }

            # 6. Authenticated User Rank Calculation
            my_rank_data = None
            user = getattr(request, 'user', None)
            if user and getattr(user, 'is_authenticated', False):
                try:
                    user_id = getattr(user, 'id', None) or getattr(user, 'pk', None)
                    if user_id:
                        my_entry = next((e for e in all_ranked_entries if e['user_id'] == user_id), None)
                        if my_entry:
                            percentile = (
                                round((1.0 - (my_entry['rank'] - 1) / max(1, len(all_ranked_entries))) * 100.0, 1)
                                if len(all_ranked_entries) > 0
                                else 100.0
                            )
                            my_rank_data = {
                                'ranked': True,
                                'rank': my_entry['rank'],
                                'total_competitors': len(all_ranked_entries),
                                'percentile': max(1.0, percentile),
                                'net_wpm': my_entry['net_wpm'],
                                'gross_wpm': my_entry['gross_wpm'],
                                'accuracy': my_entry['accuracy'],
                                'score': my_entry['score'],
                                'duration_seconds': my_entry['duration_seconds'],
                                'sessions_count': my_entry['sessions_count'],
                                'achieved_at': my_entry['achieved_at'],
                                'message': f"You are ranked #{my_entry['rank']} of {len(all_ranked_entries)} typists (Top {max(1.0, 100.0 - percentile + 1.0):.0f}%).",
                            }
                        else:
                            user_all_time_count = PracticeSession.objects.filter(user_id=user_id).count()
                            my_rank_data = {
                                'ranked': False,
                                'rank': None,
                                'total_competitors': len(all_ranked_entries),
                                'percentile': None,
                                'net_wpm': None,
                                'gross_wpm': None,
                                'accuracy': None,
                                'score': None,
                                'duration_seconds': None,
                                'sessions_count': user_all_time_count,
                                'achieved_at': None,
                                'message': "No qualifying practice sessions found for this filter. Complete a session on the Workstation to establish your rank!",
                            }
                except Exception as rank_err:
                    logger.warning(f"[KEYFLOW Leaderboard] Failed to calculate user rank: {rank_err}")
                    my_rank_data = None

            # 7. Sliced Entries for Top Limit
            top_entries = all_ranked_entries[:limit]

            response_data = {
                'scope': scope,
                'period': period,
                'category': category,
                'duration': duration,
                'continent': continent,
                'stats': stats_data,
                'entries': top_entries,
                'my_rank': my_rank_data,
                'competitions': available_competitions_data,
            }

            serializer = LeaderboardResponseSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.exception(f"[KEYFLOW Leaderboard] Unexpected error calculating leaderboard: {exc}")
            fallback_stats = {
                'registered_typists': User.objects.filter(is_active=True).count(),
                'active_competitors': 0,
                'top_speed': 0.0,
                'top_speed_user': None,
                'avg_accuracy': 0.0,
                'period_time_remaining': None,
            }
            fallback_data = {
                'scope': scope if 'scope' in locals() else 'global',
                'period': period if 'period' in locals() else 'all_time',
                'category': category if 'category' in locals() else 'speed',
                'duration': duration if 'duration' in locals() else 'all',
                'continent': continent if 'continent' in locals() else 'all',
                'stats': fallback_stats,
                'entries': [],
                'my_rank': None,
                'competitions': None,
            }
            serializer = LeaderboardResponseSerializer(fallback_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
