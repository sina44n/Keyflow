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
from .models import Passage, PracticeSession, Competition, CompetitionParticipant, CustomPassage
from .serializers import (
    PassageSerializer,
    PracticeSessionSerializer,
    CompetitionSerializer,
    CompetitionParticipantSerializer,
    CustomPassageSerializer,
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

        try:
            from admin_api.models import GlobalPlatformConfig
            config = GlobalPlatformConfig.get_config()
            if not user and not config.guest_typing_enabled:
                return Response(
                    {'error': 'guest_typing_disabled', 'detail': 'Guest practice is currently disabled. Please sign in to practice.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            session_type = data.get('session_type', 'timed')
            if (session_type == 'custom' or data.get('is_custom')) and not config.custom_text_enabled:
                return Response(
                    {'error': 'custom_text_disabled', 'detail': 'Custom text typing is currently disabled by administrator.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if session_type == 'timed':
                duration_val = int(data.get('duration_seconds', 0))
                allowed = config.allowed_durations or [15, 30, 60, 120, 300]
                if allowed and duration_val not in allowed:
                    return Response(
                        {
                            'error': 'unsupported_duration',
                            'detail': f'Test duration {duration_val}s is not permitted. Allowed durations: {allowed}',
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception:
            pass

        # Idempotency check: prevent duplicate session creation on retries
        client_session_id = str(data.get('session_id') or data.get('sessionId') or data.get('id') or '').strip() or None
        if client_session_id:
            existing = PracticeSession.objects.filter(client_session_id=client_session_id).first()
            if existing:
                return Response(PracticeSessionSerializer(existing).data, status=status.HTTP_200_OK)

        duration_raw = int(data.get('duration_seconds', 0))
        correct_chars = max(0, int(data.get('correct_chars', 0)))
        incorrect_chars = max(0, int(data.get('incorrect_chars', 0)))
        error_count = max(0, int(data.get('error_count', 0)))
        session_type = data.get('session_type', 'timed')
        passage_id = data.get('passage_id')

        # Total valid character entries = correct_chars + incorrect_chars
        valid_entries = correct_chars + incorrect_chars
        total_chars = valid_entries if valid_entries > 0 else max(0, int(data.get('total_chars', 0)))

        if duration_raw <= 0 or total_chars <= 0:
            duration = max(1, duration_raw) if duration_raw > 0 else 1
            computed_gross = 0.0
            computed_net = 0.0
            computed_acc = 0.0
        else:
            duration = duration_raw
            minutes = duration / 60.0
            computed_gross = round(total_chars / 5.0 / minutes, 2)
            uncorrected_errors = min(error_count, incorrect_chars) if (error_count > 0 and incorrect_chars > 0) else 0
            uncorrected_per_min = uncorrected_errors / minutes
            computed_net = min(computed_gross, max(0.0, round(computed_gross - uncorrected_per_min, 2)))
            computed_acc = round(min(100.0, max(0.0, (correct_chars / total_chars) * 100.0)), 2)

        # Accept client-provided values if consistent with authoritative formulas within integer rounding
        try:
            raw_gross = float(data.get('gross_wpm', computed_gross))
            gross_wpm = raw_gross if (abs(raw_gross - computed_gross) <= 1.5 or raw_gross <= computed_gross) else computed_gross
        except (ValueError, TypeError):
            gross_wpm = computed_gross

        try:
            raw_net = float(data.get('net_wpm', computed_net))
            max_allowed_net = min(gross_wpm, max(0.0, gross_wpm - uncorrected_per_min))
            net_wpm = raw_net if (0.0 <= raw_net <= max_allowed_net) else max_allowed_net
        except (ValueError, TypeError):
            net_wpm = computed_net

        try:
            raw_acc = float(data.get('accuracy', computed_acc))
            accuracy = raw_acc if (abs(raw_acc - computed_acc) <= 1.5 and 0.0 <= raw_acc <= 100.0) else computed_acc
        except (ValueError, TypeError):
            accuracy = computed_acc

        passage = None
        if passage_id:
            try:
                passage = Passage.objects.get(id=passage_id)
            except Passage.DoesNotExist:
                pass

        lesson_obj = None
        lesson_id = data.get('lesson_id') or data.get('lessonId')
        if lesson_id:
            try:
                from lessons.models import Lesson
                lesson_obj = Lesson.objects.filter(id=lesson_id).first()
            except Exception:
                pass

        character_stats = data.get('character_stats') or data.get('characterStats') or {}
        if not isinstance(character_stats, dict):
            character_stats = {}

        source = (data.get('source') or data.get('source_environment') or data.get('sourceEnvironment') or '').strip().lower()
        if not source:
            source = 'academy' if session_type == 'lesson' else 'workstation_a'

        # Ensure metadata is stored within character_stats for lossless persistence
        if not isinstance(character_stats.get('_meta'), dict):
            character_stats['_meta'] = {}
        character_stats['_meta']['source'] = source
        if data.get('stage_id') or data.get('stageId'):
            character_stats['_meta']['stage_id'] = data.get('stage_id') or data.get('stageId')
        if data.get('level_number') or data.get('levelNumber'):
            character_stats['_meta']['level_number'] = data.get('level_number') or data.get('levelNumber')
        if data.get('mode'):
            character_stats['_meta']['mode'] = data.get('mode')

        finger_stats = data.get('finger_stats') or data.get('fingerStats') or {}
        if not isinstance(finger_stats, (dict, list)):
            finger_stats = {}

        session = PracticeSession.objects.create(
            user=user,
            session_type=session_type,
            source_environment=source,
            duration_seconds=duration,
            total_chars=total_chars,
            correct_chars=correct_chars,
            incorrect_chars=incorrect_chars,
            gross_wpm=gross_wpm,
            net_wpm=net_wpm,
            accuracy=accuracy,
            error_count=uncorrected_errors,
            passage=passage,
            lesson=lesson_obj,
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

        # Optional Competition Timer Configuration
        time_limit_raw = data.get('time_limit_seconds')
        time_limit_seconds = None
        if time_limit_raw is not None and str(time_limit_raw).isdigit():
            val = int(time_limit_raw)
            if val in [15, 30, 60, 120, 300]:
                time_limit_seconds = val

        competition_mode = 'timed' if time_limit_seconds is not None else 'text_completion'

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
            competition_mode=competition_mode,
            time_limit_seconds=time_limit_seconds,
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

        guest_token = None
        if not user:
            import secrets
            guest_token = secrets.token_urlsafe(32)
            creator_participant.set_guest_token(guest_token)
            creator_participant.save(update_fields=['guest_token_hash'])

        resp_data = CompetitionSerializer(competition).data
        resp_data['participant_id'] = creator_participant.id
        if guest_token:
            resp_data['participant_token'] = guest_token
        return Response(resp_data, status=status.HTTP_201_CREATED)


class CompetitionDetailView(APIView):
    """
    GET    /api/practice/competitions/<str:code>/ — Retrieve status, challenge text, and leaderboard.
    PATCH  /api/practice/competitions/<str:code>/ — Host updates competition room configuration.
    DELETE /api/practice/competitions/<str:code>/ — Host cancels and deletes competition room.
    """
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        from django.utils import timezone
        if competition.status == 'active' and competition.ended_at and timezone.now() >= competition.ended_at:
            competition.status = 'completed'
            competition.save(update_fields=['status'])

        serializer = CompetitionSerializer(competition)
        return Response(serializer.data)

    def patch(self, request, code):
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
            first_p = competition.participants.order_by('id').first()
            provided_token = (
                request.data.get('participant_token') or
                request.query_params.get('participant_token') or
                request.headers.get('X-Participant-Token')
            )
            if first_p and str(first_p.id) == str(participant_id):
                if first_p.guest_token_hash:
                    if provided_token and first_p.verify_guest_token(provided_token):
                        is_host = True
                else:
                    is_host = True
            elif not participant_id and first_p and not first_p.guest_token_hash:
                is_host = True

        if not is_host:
            return Response({'error': 'Only the host can edit this competition room.'}, status=status.HTTP_403_FORBIDDEN)

        if competition.status != 'waiting':
            return Response({'error': f'Cannot edit a competition that is already {competition.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        update_fields = []
        if 'name' in data:
            name = (data.get('name') or '').strip()
            if not name:
                return Response({'error': 'Room name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            competition.name = name
            update_fields.append('name')

        if 'challenge_type' in data:
            ctype = data.get('challenge_type')
            if ctype in ['words', 'timed']:
                competition.challenge_type = ctype
                update_fields.append('challenge_type')

        if 'target_limit' in data:
            try:
                tlimit = int(data.get('target_limit'))
                if 5 <= tlimit <= 500:
                    competition.target_limit = tlimit
                    update_fields.append('target_limit')
            except (ValueError, TypeError):
                pass

        if 'max_participants' in data:
            try:
                mpart = int(data.get('max_participants'))
                if 2 <= mpart <= 500:
                    competition.max_participants = mpart
                    update_fields.append('max_participants')
            except (ValueError, TypeError):
                pass

        if 'challenge_text' in data:
            ctext = (data.get('challenge_text') or '').strip()
            if ctext:
                competition.challenge_text = ctext
                update_fields.append('challenge_text')

        if 'is_public' in data:
            competition.is_public = bool(data.get('is_public'))
            update_fields.append('is_public')

        if 'time_limit_seconds' in data:
            tl_val = data.get('time_limit_seconds')
            if tl_val in [15, 30, 60, 120, 300, '15', '30', '60', '120', '300']:
                competition.time_limit_seconds = int(tl_val)
                competition.competition_mode = 'timed'
            elif tl_val in [None, 0, '0', '', False]:
                competition.time_limit_seconds = None
                competition.competition_mode = 'text_completion'
            update_fields.extend(['time_limit_seconds', 'competition_mode'])

        if update_fields:
            competition.save(update_fields=list(set(update_fields)))

        return Response(CompetitionSerializer(competition).data, status=status.HTTP_200_OK)

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
            provided_token = (
                request.data.get('participant_token') or
                request.query_params.get('participant_token') or
                request.headers.get('X-Participant-Token')
            )
            if first_p and str(first_p.id) == str(participant_id):
                if first_p.guest_token_hash:
                    if provided_token and first_p.verify_guest_token(provided_token):
                        is_host = True
                else:
                    is_host = True
            elif not participant_id and first_p and not first_p.guest_token_hash:
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
            from admin_api.models import GlobalPlatformConfig
            if not GlobalPlatformConfig.get_config().competition_enabled:
                return Response(
                    {'error': 'competitions_disabled', 'detail': 'Live competitions are currently disabled by administrator.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        if competition.status == 'cancelled':
            return Response({'error': 'Cannot start a cancelled competition.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        from datetime import timedelta

        competition.status = 'active'
        competition.started_at = timezone.now()
        if competition.time_limit_seconds:
            competition.ended_at = competition.started_at + timedelta(seconds=competition.time_limit_seconds)
        else:
            competition.ended_at = None

        competition.save(update_fields=['status', 'started_at', 'ended_at'])
        return Response(CompetitionSerializer(competition).data, status=status.HTTP_200_OK)


class CompetitionJoinView(APIView):
    """
    POST /api/practice/competitions/<str:code>/join/
    Join an existing competition by its unique code.
    """
    permission_classes = [AllowAny]

    def post(self, request, code):
        try:
            from admin_api.models import GlobalPlatformConfig
            if not GlobalPlatformConfig.get_config().competition_enabled:
                return Response(
                    {'error': 'competitions_disabled', 'detail': 'Live competitions are currently disabled by administrator.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

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

        guest_token = None
        if not user:
            import secrets
            guest_token = secrets.token_urlsafe(32)
            participant.set_guest_token(guest_token)
            participant.save(update_fields=['guest_token_hash'])

        resp = CompetitionSerializer(competition).data
        resp['participant_id'] = participant.id
        if guest_token:
            resp['participant_token'] = guest_token
        return Response(resp, status=status.HTTP_201_CREATED)


class CompetitionSubmitView(APIView):
    """
    POST /api/practice/competitions/<str:code>/submit/
    Submit verified test results for a participant and return updated leaderboard.
    """
    permission_classes = [AllowAny]

    def post(self, request, code):
        try:
            from admin_api.models import GlobalPlatformConfig
            if not GlobalPlatformConfig.get_config().competition_enabled:
                return Response(
                    {'error': 'competitions_disabled', 'detail': 'Live competitions are currently disabled by administrator.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        participant_id = request.data.get('participant_id')
        try:
            participant = competition.participants.get(id=participant_id)
        except (CompetitionParticipant.DoesNotExist, ValueError):
            return Response({'error': 'Participant record not found in this competition.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce participant ownership
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
        else:
            # Guest participant ownership verification:
            # Requires cryptographically secure participant_token issued upon join/create
            provided_token = (
                request.data.get('participant_token') or
                request.headers.get('X-Participant-Token')
            )
            if not provided_token or not isinstance(provided_token, str):
                return Response(
                    {'error': 'Participant token required for guest submission.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not participant.verify_guest_token(provided_token):
                return Response(
                    {'error': 'Invalid participant token for this guest.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        typed_text = request.data.get('typed_text')
        if typed_text is None:
            typed_text = request.data.get('typed')
        challenge_text = competition.challenge_text or ''
        verification_level = 'server_verified' if (typed_text is not None and challenge_text) else 'client_reported_unverified'

        # Idempotent response if participant already submitted
        if participant.status == 'completed':
            serializer = CompetitionSerializer(competition)
            return Response({
                'status': 'success',
                'competition': serializer.data,
                'participant': CompetitionParticipantSerializer(participant).data,
                'verification': verification_level,
            })

        # Reject new submissions to completed or cancelled competitions
        if competition.status in ['completed', 'cancelled']:
            return Response(
                {'error': f'Cannot submit results: competition is already {competition.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.utils import timezone

        import math

        try:
            duration_raw = int(request.data.get('duration_seconds', 0))
        except (ValueError, TypeError):
            duration_raw = 0

        try:
            correct_chars_claimed = max(0, int(request.data.get('correct_chars', 0)))
        except (ValueError, TypeError):
            correct_chars_claimed = 0

        try:
            incorrect_chars_claimed = max(0, int(request.data.get('incorrect_chars', 0)))
        except (ValueError, TypeError):
            incorrect_chars_claimed = 0

        try:
            client_error_count = max(0, int(request.data.get('error_count', 0)))
        except (ValueError, TypeError):
            client_error_count = 0

        try:
            client_total_chars = max(0, int(request.data.get('total_chars', 0)))
        except (ValueError, TypeError):
            client_total_chars = 0

        # When typed_text is provided, derive correct_chars, uncorrected errors, and total characters
        # independently from server-verified evidence. Client values can NEVER increase the server-derived count.
        if typed_text is not None and challenge_text:
            actual_uncorrected = 0
            actual_correct = 0
            for i in range(len(typed_text)):
                if i < len(challenge_text) and typed_text[i] == challenge_text[i]:
                    actual_correct += 1
                else:
                    actual_uncorrected += 1

            correct_chars = actual_correct
            # Uncorrected mistakes in the submitted text
            incorrect_chars = actual_uncorrected
            # Server-verified printable attempts are bounded by actual submitted text length
            total_chars = len(typed_text)
            error_count = max(client_error_count, actual_uncorrected)
        elif typed_text is not None:
            # Challenge text is empty: no characters can match
            actual_uncorrected = len(typed_text)
            actual_correct = 0
            correct_chars = 0
            incorrect_chars = actual_uncorrected
            total_chars = len(typed_text)
            error_count = max(client_error_count, actual_uncorrected)
        else:
            # Missing typed_text follows documented trust policy:
            # Server cannot independently verify text matching; client-supplied counters are accepted as unverified,
            # but still bounded by physical duration plausibility.
            correct_chars = correct_chars_claimed
            incorrect_chars = incorrect_chars_claimed
            valid_entries = correct_chars + incorrect_chars
            total_chars = valid_entries if valid_entries > 0 else client_total_chars
            error_count = client_error_count

        # Physical plausibility check: bound minimum duration using upward rounding (max 300 Gross WPM = 25 chars/sec)
        # Prevents speed exceeding 300 WPM (e.g. 26 attempts in 1s would be 312 WPM with int(); math.ceil enforces 2s)
        min_physical_duration = max(1, math.ceil(total_chars / 25.0)) if total_chars > 0 else 1
        if duration_raw > 0 and duration_raw < min_physical_duration:
            duration_raw = min_physical_duration

        if duration_raw <= 0 or total_chars <= 0:
            duration = max(1, duration_raw) if duration_raw > 0 else 1
            computed_gross = 0.0
            computed_net = 0.0
            computed_acc = 0.0
            penalty = 0.0
        else:
            duration = duration_raw
            minutes = duration / 60.0
            computed_gross = round(total_chars / 5.0 / minutes, 2)
            penalty = error_count / minutes
            computed_net = min(computed_gross, max(0.0, round(computed_gross - penalty, 2)))
            computed_acc = round(min(100.0, max(0.0, (correct_chars / total_chars) * 100.0)), 2)

        try:
            client_gross = max(0.0, float(request.data.get('gross_wpm', computed_gross)))
            gross_wpm = client_gross if (abs(client_gross - computed_gross) <= 1.5 or client_gross <= computed_gross) else computed_gross
        except (ValueError, TypeError):
            gross_wpm = computed_gross

        try:
            client_net = max(0.0, float(request.data.get('net_wpm', gross_wpm)))
            max_allowed_net = min(gross_wpm, max(0.0, gross_wpm - penalty))
            net_wpm = client_net if (0.0 <= client_net <= max_allowed_net) else max_allowed_net
        except (ValueError, TypeError):
            net_wpm = max_allowed_net

        try:
            client_acc = min(100.0, max(0.0, float(request.data.get('accuracy', computed_acc))))
            # Client cannot inflate accuracy above server-computed Typed-Position Accuracy
            max_allowed_acc = computed_acc
            accuracy = client_acc if (0.0 <= client_acc <= max_allowed_acc or abs(client_acc - computed_acc) <= 0.05) else computed_acc
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
        is_timed_expired = bool(
            competition.time_limit_seconds and
            competition.ended_at and
            timezone.now() >= competition.ended_at
        )
        if (completed_p >= total_p and total_p > 0) or is_timed_expired:
            competition.status = 'completed'
            competition.save()
        elif competition.status == 'waiting':
            competition.status = 'active'
            competition.save()

        serializer = CompetitionSerializer(competition)
        verification_level = 'server_verified' if (typed_text is not None and challenge_text) else 'client_reported_unverified'
        return Response({
            'status': 'success',
            'competition': serializer.data,
            'participant': CompetitionParticipantSerializer(participant).data,
            'verification': verification_level,
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


class CustomPassageListCreateView(generics.ListCreateAPIView):
    """
    GET /api/practice/custom-passages/
    List all custom passages owned by the authenticated user.
    POST /api/practice/custom-passages/
    Create a new custom passage for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CustomPassageSerializer
    pagination_class = None

    def get_queryset(self):
        return CustomPassage.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '')
        if not title or not title.strip():
            title = f"Custom Passage ({timezone.now().strftime('%Y-%m-%d')})"
        else:
            title = title.strip()[:255]
        text = serializer.validated_data.get('text', '')
        words = len(text.split())
        chars = len(text)
        serializer.save(user=self.request.user, title=title, word_count=words, char_count=chars)


class CustomPassageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/practice/custom-passages/<int:pk>/
    PUT /api/practice/custom-passages/<int:pk>/
    DELETE /api/practice/custom-passages/<int:pk>/
    Strictly isolated to the passage owner.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CustomPassageSerializer

    def get_queryset(self):
        return CustomPassage.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        title = serializer.validated_data.get('title', serializer.instance.title)
        if title:
            title = title.strip()[:255]
        text = serializer.validated_data.get('text', serializer.instance.text)
        words = len(text.split())
        chars = len(text)
        serializer.save(title=title, word_count=words, char_count=chars)


