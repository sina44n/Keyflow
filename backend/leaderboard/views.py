"""
Leaderboard Views
=================
Data-driven Global Leaderboard powered by genuine typing performance from registered KEYFLOW users.
Calculates authentic rankings across:
- Time periods: Daily, Weekly, Monthly, All Time
- Categories: Speed (Net WPM), Accuracy (%), Overall (Speed x Accuracy x Duration factor)
- Platform & Period Overview Stats
- Personal Rank identification for authenticated users
"""

import datetime
from django.utils import timezone
from django.db.models import Count, Avg, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from accounts.models import User
from practice.models import PracticeSession
from .serializers import LeaderboardResponseSerializer


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
      - period: 'daily' | 'weekly' | 'monthly' | 'all_time' (default: 'all_time')
      - category: 'speed' | 'accuracy' | 'overall' (default: 'speed')
      - limit: int between 1 and 100 (default: 10)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # 1. Parse and validate query parameters
        period = request.query_params.get('period', 'all_time').lower().strip()
        if period not in ['daily', 'weekly', 'monthly', 'all_time']:
            period = 'all_time'

        category = request.query_params.get('category', 'speed').lower().strip()
        if category not in ['speed', 'accuracy', 'overall']:
            category = 'speed'

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

        # 3. Base Eligible Sessions Filter
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

        if period_start:
            base_qs = base_qs.filter(created_at__gte=period_start)

        # 4. Aggregation per user (single best qualifying session)
        eligible_sessions = list(
            base_qs.select_related('user', 'user__profile')
            .order_by('-created_at')
        )

        # Distinct user IDs in this filtered cohort
        user_ids_in_period = {s.user_id for s in eligible_sessions}

        # User total sessions count (all-time experience)
        user_total_sessions = dict(
            PracticeSession.objects.filter(user_id__in=user_ids_in_period)
            .values('user_id')
            .annotate(cnt=Count('id'))
            .values_list('user_id', 'cnt')
        )

        # Map each user to their single best session for this category
        user_best_sessions = {}
        for s in eligible_sessions:
            uid = s.user_id
            net_wpm = float(s.net_wpm)
            gross_wpm = float(s.gross_wpm)
            accuracy = float(s.accuracy)
            duration = int(s.duration_seconds)
            timestamp = s.created_at.timestamp()

            if category == 'speed':
                score = net_wpm
                sort_key = (net_wpm, accuracy, -duration, -timestamp)
            elif category == 'accuracy':
                score = accuracy
                sort_key = (accuracy, net_wpm, -duration, -timestamp)
            else:  # overall
                # Transparent balanced formula:
                # score = Net WPM * (Accuracy / 100) * min(1.0, (duration / 30)^0.5)
                dur_factor = min(1.0, (duration / 30.0) ** 0.5)
                score = round(net_wpm * (accuracy / 100.0) * dur_factor, 2)
                sort_key = (score, net_wpm, accuracy, -timestamp)

            if uid not in user_best_sessions or sort_key > user_best_sessions[uid]['sort_key']:
                avatar_url = ''
                display_name = s.user.username
                try:
                    if hasattr(s.user, 'profile'):
                        avatar_url = s.user.profile.avatar_url or ''
                        display_name = s.user.profile.display_name or s.user.username
                except Exception:
                    pass

                user_best_sessions[uid] = {
                    'sort_key': sort_key,
                    'user_id': uid,
                    'username': s.user.username,
                    'display_name': display_name,
                    'avatar_url': avatar_url,
                    'net_wpm': round(net_wpm, 2),
                    'gross_wpm': round(gross_wpm, 2),
                    'accuracy': round(accuracy, 2),
                    'score': round(score, 2),
                    'duration_seconds': duration,
                    'session_type': s.session_type,
                    'total_chars': s.total_chars,
                    'sessions_count': user_total_sessions.get(uid, 1),
                    'achieved_at': s.created_at,
                }

        # 5. Sort entries and assign ranks
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

        # 6. Platform & Period Overview Stats
        registered_typists = User.objects.filter(is_active=True).count()
        active_competitors = len(all_ranked_entries)

        top_speed = 0.0
        top_speed_user = None
        if all_ranked_entries:
            # Fastest typist in this period
            fastest_entry = max(all_ranked_entries, key=lambda x: x['net_wpm'])
            top_speed = fastest_entry['net_wpm']
            top_speed_user = fastest_entry['display_name'] or fastest_entry['username']

        # Weighted / average accuracy of sessions in this period
        if eligible_sessions:
            avg_acc_val = base_qs.aggregate(avg_acc=Avg('accuracy'))['avg_acc']
            avg_accuracy = round(float(avg_acc_val or 0.0), 1)
        else:
            # Fall back to all-time average if period has no sessions yet
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

        # 7. Authenticated User Rank Calculation
        my_rank_data = None
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            my_entry = next((e for e in all_ranked_entries if e['user_id'] == user.id), None)
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
                user_all_time_count = PracticeSession.objects.filter(user=user).count()
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
                    'message': "No qualifying practice sessions found for this period. Complete a session on the Workstation to establish your rank!",
                }

        # 8. Sliced Entries for Top Limit
        top_entries = all_ranked_entries[:limit]

        response_data = {
            'period': period,
            'category': category,
            'stats': stats_data,
            'entries': top_entries,
            'my_rank': my_rank_data,
        }

        serializer = LeaderboardResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
