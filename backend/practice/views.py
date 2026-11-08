"""
Practice Views — Passages and Session recording endpoints.
"""
from datetime import datetime, time, timedelta
import zoneinfo
from django.utils import timezone
from django.db import models
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Passage, PracticeSession, Competition, CompetitionParticipant
from .serializers import (
    PassageSerializer,
    PracticeSessionSerializer,
    CompetitionSerializer,
    CompetitionParticipantSerializer,
)


class PracticeHealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'app': 'practice', 'status': 'ok'})


class PassageListView(generics.ListAPIView):
    """
    GET /api/practice/passages/
    List curated passages for practice tests, optionally filtered by category or difficulty.
    """
    permission_classes = [AllowAny]
    serializer_class = PassageSerializer
    pagination_class = None

    def get_queryset(self):
        qs = Passage.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        if category:
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        return qs


class PassageDetailView(generics.RetrieveAPIView):
    """
    GET /api/practice/passages/<int:pk>/
    Retrieve a specific passage.
    """
    permission_classes = [AllowAny]
    serializer_class = PassageSerializer
    queryset = Passage.objects.filter(is_active=True)


class RecordPracticeSessionView(APIView):
    """
    POST /api/practice/sessions/
    Record typing test result. Accepts requests from authenticated users or guests.
    Scientifically validates and computes authentic Gross WPM, Net WPM, and Raw Accuracy.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        data = request.data or {}

        # Idempotency check: prevent duplicate session creation on retries
        client_session_id = str(data.get('session_id') or data.get('sessionId') or data.get('id') or '').strip() or None
        if client_session_id:
            existing = PracticeSession.objects.filter(client_session_id=client_session_id).first()
            if existing:
                return Response(PracticeSessionSerializer(existing).data, status=status.HTTP_200_OK)

        duration = max(1, int(data.get('duration_seconds', 0)))
        total_chars = max(0, int(data.get('total_chars', 0)))
        correct_chars = max(0, int(data.get('correct_chars', 0)))
        incorrect_chars = max(0, int(data.get('incorrect_chars', 0)))
        error_count = max(0, int(data.get('error_count', 0)))
        session_type = data.get('session_type', 'timed')
        passage_id = data.get('passage_id')

        # Total valid character entries = correct_chars + incorrect_chars if total_chars is 0 or less
        if total_chars < (correct_chars + incorrect_chars):
            total_chars = correct_chars + incorrect_chars

        minutes = max(duration / 60.0, 0.001)

        # Standard Gross WPM: Total Valid Character Entries / 5 / Minutes
        computed_gross = round(total_chars / 5.0 / minutes, 2) if total_chars > 0 else 0.0

        # Uncorrected Errors per Minute = Remaining Uncorrected Errors / Minutes
        uncorrected_errors = min(error_count, incorrect_chars) if error_count > 0 else 0
        uncorrected_per_min = uncorrected_errors / minutes
        computed_net = max(0.0, round(computed_gross - uncorrected_per_min, 2))

        # Raw Keystroke Accuracy: Correct Character Entries / Total Valid Character Entries * 100
        if total_chars > 0:
            computed_acc = round(min(100.0, max(0.0, (correct_chars / total_chars) * 100.0)), 2)
        elif (correct_chars + incorrect_chars) > 0:
            computed_acc = round(min(100.0, max(0.0, (correct_chars / (correct_chars + incorrect_chars)) * 100.0)), 2)
        else:
            computed_acc = 0.0

        # Accept client-provided values if consistent with authoritative formulas within integer rounding
        try:
            raw_gross = float(data.get('gross_wpm', computed_gross))
            gross_wpm = raw_gross if abs(raw_gross - computed_gross) <= 2.0 else computed_gross
        except (ValueError, TypeError):
            gross_wpm = computed_gross

        try:
            raw_net = float(data.get('net_wpm', computed_net))
            net_wpm = raw_net if (abs(raw_net - computed_net) <= 2.0 and raw_net <= (gross_wpm + 0.5)) else computed_net
        except (ValueError, TypeError):
            net_wpm = computed_net

        try:
            raw_acc = float(data.get('accuracy', computed_acc))
            accuracy = raw_acc if (abs(raw_acc - computed_acc) <= 2.0 and 0.0 <= raw_acc <= 100.0) else computed_acc
        except (ValueError, TypeError):
            accuracy = computed_acc

        passage = None
        if passage_id:
            try:
                passage = Passage.objects.get(id=passage_id)
            except Passage.DoesNotExist:
                pass

        character_stats = data.get('character_stats') or data.get('characterStats') or {}
        if not isinstance(character_stats, dict):
            character_stats = {}

        finger_stats = data.get('finger_stats') or data.get('fingerStats') or {}
        if not isinstance(finger_stats, (dict, list)):
            finger_stats = {}

        session = PracticeSession.objects.create(
            user=user,
            session_type=session_type,
            duration_seconds=duration,
            total_chars=total_chars,
            correct_chars=correct_chars,
            incorrect_chars=incorrect_chars,
            gross_wpm=gross_wpm,
            net_wpm=net_wpm,
            accuracy=accuracy,
            error_count=uncorrected_errors,
            passage=passage,
            client_session_id=client_session_id,
            character_stats=character_stats,
            finger_stats=finger_stats,
        )

        return Response(PracticeSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class KeyboardMasteryView(APIView):
    """
    GET /api/practice/keyboard-mastery/?period=today|weekly|overall
    Aggregates authentic per-character speed (CPM, WPM) and accuracy metrics
    for the authenticated user across the requested time window,
    strictly respecting user timezone and first_day_of_week preference.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        period = request.query_params.get('period', 'overall').lower()

        if not user:
            return Response({
                'period': period,
                'total_sessions': 0,
                'character_stats': {},
            }, status=status.HTTP_200_OK)

        # Respect user timezone & first_day_of_week preference
        tz_name = 'UTC'
        first_day_of_week = 0  # 0 = Sunday, 1 = Monday
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.timezone:
                tz_name = user.profile.timezone
            if hasattr(user, 'preferences') and user.preferences and user.preferences.first_day_of_week is not None:
                first_day_of_week = user.preferences.first_day_of_week
        except Exception:
            pass

        try:
            user_tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            user_tz = zoneinfo.ZoneInfo('UTC')

        now_user = timezone.now().astimezone(user_tz)
        qs = PracticeSession.objects.filter(user=user)

        if period in ('today', 'daily'):
            start_of_day = datetime.combine(now_user.date(), time.min, tzinfo=user_tz)
            qs = qs.filter(created_at__gte=start_of_day)
        elif period == 'weekly':
            weekday = now_user.weekday()  # Monday=0 ... Sunday=6
            target_start = 6 if first_day_of_week == 0 else 0
            days_back = (weekday - target_start) % 7
            start_of_week = datetime.combine(now_user.date() - timedelta(days=days_back), time.min, tzinfo=user_tz)
            qs = qs.filter(created_at__gte=start_of_week)

        sessions = list(qs.only('character_stats', 'gross_wpm', 'duration_seconds'))
        total_sessions = len(sessions)

        char_aggregates = {}
        for sess in sessions:
            cstats = sess.character_stats
            if not isinstance(cstats, dict):
                continue
            for char, stats in cstats.items():
                if not char or not isinstance(stats, dict):
                    continue
                k = str(char).lower()
                if k not in char_aggregates:
                    char_aggregates[k] = {
                        'char': char,
                        'total': 0,
                        'correct': 0,
                        'incorrect': 0,
                        'cpm_sum': 0.0,
                        'cpm_count': 0,
                        'wpm_sum': 0.0,
                        'wpm_count': 0,
                    }
                tot = int(stats.get('total', 0) or 0)
                cor = int(stats.get('correct', 0) or 0)
                inc = int(stats.get('incorrect', 0) or 0)
                char_aggregates[k]['total'] += tot
                char_aggregates[k]['correct'] += cor
                char_aggregates[k]['incorrect'] += inc

                cpm_val = float(stats.get('cpm', 0) or 0)
                wpm_val = float(stats.get('wpm', 0) or 0)
                if cpm_val > 0:
                    char_aggregates[k]['cpm_sum'] += cpm_val
                    char_aggregates[k]['cpm_count'] += 1
                if wpm_val > 0:
                    char_aggregates[k]['wpm_sum'] += wpm_val
                    char_aggregates[k]['wpm_count'] += 1

        formatted_stats = {}
        for k, v in char_aggregates.items():
            tot = v['total']
            cor = v['correct']
            inc = v['incorrect']
            acc = round((cor / tot) * 100.0, 1) if tot > 0 else 0.0
            cpm = round(v['cpm_sum'] / v['cpm_count'], 1) if v['cpm_count'] > 0 else (round(v['wpm_sum'] / v['wpm_count'] * 5, 1) if v['wpm_count'] > 0 else 0.0)
            wpm = round(v['wpm_sum'] / v['wpm_count'], 1) if v['wpm_count'] > 0 else round(cpm / 5, 1)
            formatted_stats[k] = {
                'char': v['char'],
                'total': tot,
                'correct': cor,
                'incorrect': inc,
                'accuracy': acc,
                'cpm': cpm,
                'wpm': wpm,
            }

        return Response({
            'period': period,
            'total_sessions': total_sessions,
            'character_stats': formatted_stats,
        }, status=status.HTTP_200_OK)


FINGER_CONFIG = [
    {'id': 'left-pinky', 'name': 'Pinky', 'hand': 'Left', 'keys': 'Q, A, Z, 1', 'active_digit': 'pinky'},
    {'id': 'left-ring', 'name': 'Ring', 'hand': 'Left', 'keys': 'W, S, X, 2', 'active_digit': 'ring'},
    {'id': 'left-middle', 'name': 'Middle', 'hand': 'Left', 'keys': 'E, D, C, 3', 'active_digit': 'middle'},
    {'id': 'left-index', 'name': 'Index', 'hand': 'Left', 'keys': 'R, F, V, T, G, B, 4, 5', 'active_digit': 'index'},
    {'id': 'right-index', 'name': 'Index', 'hand': 'Right', 'keys': 'Y, H, N, U, J, M, 6, 7', 'active_digit': 'index'},
    {'id': 'right-middle', 'name': 'Middle', 'hand': 'Right', 'keys': 'I, K, ,, <, 8', 'active_digit': 'middle'},
    {'id': 'right-ring', 'name': 'Ring', 'hand': 'Right', 'keys': 'O, L, ., >, 9', 'active_digit': 'ring'},
    {'id': 'right-pinky', 'name': 'Pinky', 'hand': 'Right', 'keys': 'P, ;, :, \', ", ?, /, 0, -, =', 'active_digit': 'pinky'},
    {'id': 'thumb', 'name': 'Thumbs', 'hand': 'Both', 'keys': 'Spacebar', 'active_digit': 'thumb'},
]


def get_authoritative_finger_for_char(char):
    """Maps characters to physical touch typing fingers."""
    if not char:
        return None
    c = str(char).lower()
    if c in (' ', 'space'):
        return 'thumb'
    if c in 'qaz1`~!':
        return 'left-pinky'
    if c in 'wsx2@':
        return 'left-ring'
    if c in 'edc3#':
        return 'left-middle'
    if c in 'rfvtgb4$5%':
        return 'left-index'
    if c in 'yhnujm6^7&':
        return 'right-index'
    if c in 'ik,8*<':
        return 'right-middle'
    if c in 'ol.9(>':
        return 'right-ring'
    if c in 'p;:0)-_=+[{]}\\|/?\'"':
        return 'right-pinky'
    return None


class FingerMasteryView(APIView):
    """
    GET /api/practice/finger-mastery/?period=today|weekly|overall
    Aggregates authentic 10-finger typing speed (WPM) and accuracy metrics,
    along with Left Hand, Right Hand, and Thumbs summaries for the authenticated user.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        period = request.query_params.get('period', 'overall').lower()

        empty_finger_stats = {
            f['id']: {
                'id': f['id'],
                'name': f['name'],
                'hand': f['hand'],
                'keys': f['keys'],
                'active_digit': f['active_digit'],
                'speed': 0.0,
                'accuracy': 0.0,
                'total': 0,
                'correct': 0,
                'incorrect': 0,
                'has_data': False,
            } for f in FINGER_CONFIG
        }
        empty_left = {'speed': 0.0, 'accuracy': 0.0, 'total_keystrokes': 0, 'has_data': False, 'strongest_finger': None}
        empty_right = {'speed': 0.0, 'accuracy': 0.0, 'total_keystrokes': 0, 'has_data': False, 'strongest_finger': None}
        empty_thumbs = {'speed': 0.0, 'accuracy': 0.0, 'total_keystrokes': 0, 'has_data': False}

        if not user:
            return Response({
                'period': period,
                'total_sessions': 0,
                'finger_stats': empty_finger_stats,
                'left_hand': empty_left,
                'right_hand': empty_right,
                'thumbs': empty_thumbs,
            }, status=status.HTTP_200_OK)

        # Respect user timezone & first_day_of_week preference
        tz_name = 'UTC'
        first_day_of_week = 0  # 0 = Sunday, 1 = Monday
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.timezone:
                tz_name = user.profile.timezone
            if hasattr(user, 'preferences') and user.preferences and user.preferences.first_day_of_week is not None:
                first_day_of_week = user.preferences.first_day_of_week
        except Exception:
            pass

        try:
            user_tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            user_tz = zoneinfo.ZoneInfo('UTC')

        now_user = timezone.now().astimezone(user_tz)
        qs = PracticeSession.objects.filter(user=user)

        if period in ('today', 'daily'):
            start_of_day = datetime.combine(now_user.date(), time.min, tzinfo=user_tz)
            qs = qs.filter(created_at__gte=start_of_day)
        elif period == 'weekly':
            weekday = now_user.weekday()
            target_start = 6 if first_day_of_week == 0 else 0
            days_back = (weekday - target_start) % 7
            start_of_week = datetime.combine(now_user.date() - timedelta(days=days_back), time.min, tzinfo=user_tz)
            qs = qs.filter(created_at__gte=start_of_week)

        sessions = list(qs.only('finger_stats', 'character_stats', 'gross_wpm', 'duration_seconds'))
        total_sessions = len(sessions)

        accumulators = {
            f['id']: {
                'total': 0,
                'correct': 0,
                'incorrect': 0,
                'wpm_strokes_sum': 0.0,
                'strokes_for_wpm': 0,
                'wpm_sum': 0.0,
                'wpm_count': 0,
            }
            for f in FINGER_CONFIG
        }

        for sess in sessions:
            fstats = sess.finger_stats
            has_valid_fstats = False

            # Check if finger_stats is present
            if isinstance(fstats, list) and fstats:
                has_valid_fstats = True
                for item in fstats:
                    if not isinstance(item, dict):
                        continue
                    fid = item.get('id')
                    if fid not in accumulators:
                        continue
                    tot = int(item.get('totalKeystrokes') or item.get('total') or 0)
                    cor = int(item.get('correct') or 0)
                    inc = int(item.get('incorrect') or item.get('errors') or 0)
                    if cor == 0 and inc == 0 and tot > 0:
                        cor = tot
                    wpm = float(item.get('speed') or item.get('wpm') or 0)
                    accumulators[fid]['total'] += tot
                    accumulators[fid]['correct'] += cor
                    accumulators[fid]['incorrect'] += inc
                    if wpm > 0 and tot > 0:
                        accumulators[fid]['wpm_strokes_sum'] += wpm * tot
                        accumulators[fid]['strokes_for_wpm'] += tot
                    if wpm > 0:
                        accumulators[fid]['wpm_sum'] += wpm
                        accumulators[fid]['wpm_count'] += 1
            elif isinstance(fstats, dict) and fstats:
                # Could be dictionary keyed by finger id
                has_valid_fstats = True
                for fid, item in fstats.items():
                    if fid not in accumulators or not isinstance(item, dict):
                        continue
                    tot = int(item.get('totalKeystrokes') or item.get('total') or 0)
                    cor = int(item.get('correct') or 0)
                    inc = int(item.get('incorrect') or item.get('errors') or 0)
                    if cor == 0 and inc == 0 and tot > 0:
                        cor = tot
                    wpm = float(item.get('speed') or item.get('wpm') or 0)
                    accumulators[fid]['total'] += tot
                    accumulators[fid]['correct'] += cor
                    accumulators[fid]['incorrect'] += inc
                    if wpm > 0 and tot > 0:
                        accumulators[fid]['wpm_strokes_sum'] += wpm * tot
                        accumulators[fid]['strokes_for_wpm'] += tot
                    if wpm > 0:
                        accumulators[fid]['wpm_sum'] += wpm
                        accumulators[fid]['wpm_count'] += 1

            # If session didn't have finger_stats, infer from character_stats!
            if not has_valid_fstats and isinstance(sess.character_stats, dict):
                for char, cdata in sess.character_stats.items():
                    if not isinstance(cdata, dict):
                        continue
                    fid = get_authoritative_finger_for_char(char)
                    if not fid or fid not in accumulators:
                        continue
                    tot = int(cdata.get('total', 0) or 0)
                    cor = int(cdata.get('correct', 0) or 0)
                    inc = int(cdata.get('incorrect', 0) or 0)
                    wpm = float(cdata.get('wpm', 0) or (cdata.get('cpm', 0) / 5.0 if cdata.get('cpm') else 0) or 0)
                    accumulators[fid]['total'] += tot
                    accumulators[fid]['correct'] += cor
                    accumulators[fid]['incorrect'] += inc
                    if wpm > 0 and tot > 0:
                        accumulators[fid]['wpm_strokes_sum'] += wpm * tot
                        accumulators[fid]['strokes_for_wpm'] += tot
                    if wpm > 0:
                        accumulators[fid]['wpm_sum'] += wpm
                        accumulators[fid]['wpm_count'] += 1

        final_finger_stats = {}
        for f in FINGER_CONFIG:
            fid = f['id']
            data = accumulators[fid]
            tot = data['total']
            cor = data['correct']
            inc = data['incorrect']
            has_data = tot >= 3
            acc = round((cor / tot) * 100.0, 1) if tot > 0 else 0.0

            if data['strokes_for_wpm'] > 0:
                speed = round(data['wpm_strokes_sum'] / data['strokes_for_wpm'], 1)
            elif data['wpm_count'] > 0:
                speed = round(data['wpm_sum'] / data['wpm_count'], 1)
            else:
                speed = 0.0

            final_finger_stats[fid] = {
                'id': fid,
                'name': f['name'],
                'hand': f['hand'],
                'keys': f['keys'],
                'active_digit': f['active_digit'],
                'speed': speed,
                'accuracy': acc,
                'total': tot,
                'correct': cor,
                'incorrect': inc,
                'has_data': has_data,
            }

        # Calculate Left Hand Summary
        left_fids = ['left-pinky', 'left-ring', 'left-middle', 'left-index']
        left_fingers = [final_finger_stats[k] for k in left_fids]
        left_tot = sum(item['total'] for item in left_fingers)
        left_cor = sum(item['correct'] for item in left_fingers)
        left_has_data = left_tot >= 3
        left_acc = round((left_cor / left_tot) * 100.0, 1) if left_tot > 0 else 0.0

        left_active = [item for item in left_fingers if item['has_data'] and item['total'] > 0]
        if left_active and sum(item['total'] for item in left_active) > 0:
            left_speed = round(
                sum(item['speed'] * item['total'] for item in left_active) / sum(item['total'] for item in left_active),
                1
            )
        else:
            left_speed = 0.0

        left_candidates = [item for item in left_fingers if item['has_data']]
        left_best_obj = max(left_candidates, key=lambda x: (x['speed'], x['accuracy'])) if left_candidates else None
        left_strongest = left_best_obj['name'] if left_best_obj else None
        left_strongest_details = {
            'name': left_best_obj['name'],
            'speed': left_best_obj['speed'],
            'accuracy': left_best_obj['accuracy'],
        } if left_best_obj else None

        left_summary = {
            'speed': left_speed,
            'accuracy': left_acc,
            'total_keystrokes': left_tot,
            'has_data': left_has_data,
            'strongest_finger': left_strongest,
            'strongest_finger_details': left_strongest_details,
        }

        # Calculate Right Hand Summary
        right_fids = ['right-index', 'right-middle', 'right-ring', 'right-pinky']
        right_fingers = [final_finger_stats[k] for k in right_fids]
        right_tot = sum(item['total'] for item in right_fingers)
        right_cor = sum(item['correct'] for item in right_fingers)
        right_has_data = right_tot >= 3
        right_acc = round((right_cor / right_tot) * 100.0, 1) if right_tot > 0 else 0.0

        right_active = [item for item in right_fingers if item['has_data'] and item['total'] > 0]
        if right_active and sum(item['total'] for item in right_active) > 0:
            right_speed = round(
                sum(item['speed'] * item['total'] for item in right_active) / sum(item['total'] for item in right_active),
                1
            )
        else:
            right_speed = 0.0

        right_candidates = [item for item in right_fingers if item['has_data']]
        right_best_obj = max(right_candidates, key=lambda x: (x['speed'], x['accuracy'])) if right_candidates else None
        right_strongest = right_best_obj['name'] if right_best_obj else None
        right_strongest_details = {
            'name': right_best_obj['name'],
            'speed': right_best_obj['speed'],
            'accuracy': right_best_obj['accuracy'],
        } if right_best_obj else None

        right_summary = {
            'speed': right_speed,
            'accuracy': right_acc,
            'total_keystrokes': right_tot,
            'has_data': right_has_data,
            'strongest_finger': right_strongest,
            'strongest_finger_details': right_strongest_details,
        }

        # Calculate Thumbs Summary
        thumb_item = final_finger_stats['thumb']
        thumbs_summary = {
            'speed': thumb_item['speed'],
            'accuracy': thumb_item['accuracy'],
            'total_keystrokes': thumb_item['total'],
            'has_data': thumb_item['has_data'],
        }

        return Response({
            'period': period,
            'total_sessions': total_sessions,
            'finger_stats': final_finger_stats,
            'left_hand': left_summary,
            'right_hand': right_summary,
            'thumbs': thumbs_summary,
        }, status=status.HTTP_200_OK)


class UserPracticeHistoryView(generics.ListAPIView):
    """
    GET /api/practice/history/
    Lists recent sessions for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PracticeSessionSerializer

    def get_queryset(self):
        try:
            limit = int(self.request.query_params.get('limit', 100))
            limit = max(1, min(limit, 500))
        except (ValueError, TypeError):
            limit = 100
        return PracticeSession.objects.filter(user=self.request.user).order_by('-created_at')[:limit]


class CompetitionListView(APIView):
    """
    GET /api/practice/competitions/ — List public active/waiting competitions
    POST /api/practice/competitions/ — Create a new competition lobby
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Competition.objects.filter(is_public=True).exclude(status='cancelled')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = CompetitionSerializer(qs[:30], many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        name = (data.get('name') or '').strip()
        if not name:
            return Response({'error': 'Competition name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        challenge_type = data.get('challenge_type', 'words')
        if challenge_type not in ['words', 'timed']:
            challenge_type = 'words'

        target_limit = int(data.get('target_limit', 25))
        if target_limit < 5 or target_limit > 500:
            target_limit = 25

        max_participants = int(data.get('max_participants', 10))
        if max_participants != 0 and (max_participants < 2 or max_participants > 500):
            max_participants = 10

        is_public = bool(data.get('is_public', True))
        difficulty = data.get('difficulty', 'medium')

        # Challenge text selection
        challenge_text = (data.get('challenge_text') or '').strip()
        if not challenge_text:
            passage = Passage.objects.filter(is_active=True).order_by('?').first()
            if passage:
                challenge_text = passage.content
            else:
                challenge_text = 'Typing with precision, rhythm, and clarity transforms thought into velocity on the keyboard.'

        user = request.user if request.user and request.user.is_authenticated else None

        competition = Competition.objects.create(
            name=name,
            challenge_text=challenge_text,
            challenge_type=challenge_type,
            target_limit=target_limit,
            difficulty=difficulty,
            max_participants=max_participants,
            is_public=is_public,
            status='waiting',
            created_by=user,
        )

        # Automatically join the creator as first participant
        creator_name = (data.get('display_name') or (user.username if user else 'Host')).strip()
        if not creator_name:
            creator_name = 'Host'

        creator_participant = CompetitionParticipant.objects.create(
            competition=competition,
            user=user,
            display_name=creator_name,
            status='joined',
        )

        resp_data = CompetitionSerializer(competition).data
        resp_data['participant_id'] = creator_participant.id
        return Response(resp_data, status=status.HTTP_201_CREATED)


class CompetitionDetailView(APIView):
    """
    GET    /api/practice/competitions/<str:code>/ — Retrieve status, challenge text, and leaderboard.
    DELETE /api/practice/competitions/<str:code>/ — Host cancels and deletes competition room.
    """
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CompetitionSerializer(competition)
        return Response(serializer.data)

    def delete(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user if request.user and request.user.is_authenticated else None
        participant_id = request.data.get('participant_id') or request.query_params.get('participant_id')

        is_host = False
        if competition.created_by:
            if user and competition.created_by == user:
                is_host = True
        else:
            # Guest-created room: verify participant is first participant (host)
            first_p = competition.participants.order_by('id').first()
            if first_p and str(first_p.id) == str(participant_id):
                is_host = True
            elif not participant_id:
                is_host = True

        if not is_host:
            return Response({'error': 'Only the host can delete this competition room.'}, status=status.HTTP_403_FORBIDDEN)

        competition_code = competition.code
        competition.delete()
        return Response({'status': 'deleted', 'code': competition_code}, status=status.HTTP_200_OK)


class CompetitionStartView(APIView):
    """
    POST /api/practice/competitions/<str:code>/start/
    Host starts competition, advancing status from 'waiting' to 'active'.
    """
    permission_classes = [AllowAny]

    def post(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        if competition.status == 'cancelled':
            return Response({'error': 'Cannot start a cancelled competition.'}, status=status.HTTP_400_BAD_REQUEST)

        competition.status = 'active'
        competition.save(update_fields=['status'])
        return Response(CompetitionSerializer(competition).data, status=status.HTTP_200_OK)


class CompetitionJoinView(APIView):
    """
    POST /api/practice/competitions/<str:code>/join/
    Join an existing competition by its unique code.
    """
    permission_classes = [AllowAny]

    def post(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition with this code does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        if competition.status in ['completed', 'cancelled']:
            return Response({'error': f'This competition is already {competition.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        current_count = competition.participants.count()
        if competition.max_participants > 0 and current_count >= competition.max_participants:
            return Response({'error': 'Competition lobby is full.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user and request.user.is_authenticated else None
        display_name = (request.data.get('display_name') or (user.username if user else '')).strip()
        if not display_name:
            display_name = f'Typist #{current_count + 1}'

        # Check for duplicate user joining
        if user and competition.participants.filter(user=user).exists():
            existing = competition.participants.get(user=user)
            resp = CompetitionSerializer(competition).data
            resp['participant_id'] = existing.id
            return Response(resp, status=status.HTTP_200_OK)

        participant = CompetitionParticipant.objects.create(
            competition=competition,
            user=user,
            display_name=display_name,
            status='joined',
        )

        resp = CompetitionSerializer(competition).data
        resp['participant_id'] = participant.id
        return Response(resp, status=status.HTTP_201_CREATED)


class CompetitionSubmitView(APIView):
    """
    POST /api/practice/competitions/<str:code>/submit/
    Submit verified test results for a participant and return updated leaderboard.
    """
    permission_classes = [AllowAny]

    def post(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        participant_id = request.data.get('participant_id')
        try:
            participant = competition.participants.get(id=participant_id)
        except CompetitionParticipant.DoesNotExist:
            return Response({'error': 'Participant record not found in this competition.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce participant ownership if user is associated
        if participant.user:
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required to submit results for this registered participant.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if participant.user != request.user:
                return Response(
                    {'error': 'You are not authorized to submit results for another participant.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Idempotent response if participant already submitted
        if participant.status == 'completed':
            serializer = CompetitionSerializer(competition)
            return Response({
                'status': 'success',
                'competition': serializer.data,
                'participant': CompetitionParticipantSerializer(participant).data,
            })

        from django.utils import timezone

        duration = max(1, int(request.data.get('duration_seconds', 0)))
        correct_chars = max(0, int(request.data.get('correct_chars', 0)))
        incorrect_chars = max(0, int(request.data.get('incorrect_chars', 0)))
        total_chars = max(correct_chars + incorrect_chars, int(request.data.get('total_chars', correct_chars + incorrect_chars)))

        minutes = max(duration / 60.0, 0.001)
        computed_gross = round(total_chars / 5.0 / minutes, 2) if total_chars > 0 else 0.0

        try:
            client_gross = max(0.0, float(request.data.get('gross_wpm', computed_gross)))
            gross_wpm = client_gross if abs(client_gross - computed_gross) <= 2.0 else computed_gross
        except (ValueError, TypeError):
            gross_wpm = computed_gross

        try:
            client_net = max(0.0, float(request.data.get('net_wpm', gross_wpm)))
            net_wpm = client_net if client_net <= (gross_wpm + 0.5) else gross_wpm
        except (ValueError, TypeError):
            net_wpm = gross_wpm

        if total_chars > 0:
            computed_acc = round(min(100.0, max(0.0, (correct_chars / total_chars) * 100.0)), 2)
        else:
            computed_acc = 0.0

        try:
            client_acc = min(100.0, max(0.0, float(request.data.get('accuracy', computed_acc))))
            accuracy = client_acc if abs(client_acc - computed_acc) <= 2.0 else computed_acc
        except (ValueError, TypeError):
            accuracy = computed_acc

        participant.net_wpm = net_wpm
        participant.gross_wpm = gross_wpm
        participant.accuracy = accuracy
        participant.duration_seconds = duration
        participant.correct_chars = correct_chars
        participant.incorrect_chars = incorrect_chars
        participant.status = 'completed'
        participant.completed_at = timezone.now()
        participant.save()

        # Update competition status to active or completed
        total_p = competition.participants.count()
        completed_p = competition.participants.filter(status='completed').count()
        if completed_p >= total_p and total_p > 0:
            competition.status = 'completed'
            competition.save()
        elif competition.status == 'waiting':
            competition.status = 'active'
            competition.save()

        serializer = CompetitionSerializer(competition)
        return Response({
            'status': 'success',
            'competition': serializer.data,
            'participant': CompetitionParticipantSerializer(participant).data,
        })


class UserCompetitionsView(APIView):
    """
    GET /api/practice/competitions/my/
    List competitions created or joined by authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Competition.objects.filter(
            models.Q(created_by=user) | models.Q(participants__user=user)
        ).distinct()[:20]
        serializer = CompetitionSerializer(qs, many=True)
        return Response(serializer.data)

