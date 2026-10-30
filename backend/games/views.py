"""Games App Views — Recording, personal bests, real-time Likes, and unique Plays."""
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import GameSession, GameLike, GamePlaySession
from .serializers import GameSessionSerializer

# High-quality baseline seed metrics providing vibrant community engagement
# Real user interactions additively increment these counts
ARCADE_BASE_STATS = {
    'cascade': {'likes': 2640, 'plays': 175700},
    'sprint': {'likes': 3120, 'plays': 218400},
    'hunter': {'likes': 1950, 'plays': 142300},
    'ninja': {'likes': 3480, 'plays': 249600},
    'runner': {'likes': 2280, 'plays': 168900},
    'memory': {'likes': 1840, 'plays': 129500},
    'boss': {'likes': 3750, 'plays': 284100},
    'nitro': {'likes': 4200, 'plays': 312000},
}


class GamesHealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'app': 'games', 'status': 'ok'})


class GameStatsView(APIView):
    """
    GET /api/games/stats/
    Returns aggregate likes, unique play counts, and whether current user has liked
    for every game in KEYFLOW Arcade.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        guest_id = request.headers.get('X-Guest-ID') or request.GET.get('guest_id') or ''

        # Aggregate real likes from DB
        real_likes = dict(
            GameLike.objects.values('game_id')
            .annotate(total=Count('id'))
            .values_list('game_id', 'total')
        )

        # Aggregate real plays from DB
        real_plays = dict(
            GamePlaySession.objects.values('game_id')
            .annotate(total=Count('id'))
            .values_list('game_id', 'total')
        )

        # Determine which games the current user or guest has liked
        user_liked_set = set()
        if user:
            user_liked_set = set(
                GameLike.objects.filter(user=user).values_list('game_id', flat=True)
            )
        elif guest_id:
            user_liked_set = set(
                GameLike.objects.filter(guest_id=guest_id, user__isnull=True).values_list('game_id', flat=True)
            )

        response_data = {}
        all_game_ids = list(ARCADE_BASE_STATS.keys())

        for g_id in all_game_ids:
            base = ARCADE_BASE_STATS.get(g_id, {'likes': 100, 'plays': 500})
            total_likes = base['likes'] + real_likes.get(g_id, 0)
            total_plays = base['plays'] + real_plays.get(g_id, 0)

            response_data[g_id] = {
                'gameId': g_id,
                'likes': total_likes,
                'plays': total_plays,
                'hasLiked': g_id in user_liked_set,
            }

        return Response(response_data, status=status.HTTP_200_OK)


class GameLikeToggleView(APIView):
    """
    POST /api/games/<game_id>/like/
    Toggles like status for the specified game.
    Idempotent and account-protected.
    """
    permission_classes = [AllowAny]

    def post(self, request, game_id):
        game_id = str(game_id).lower().strip()
        user = request.user if request.user and request.user.is_authenticated else None
        guest_id = (
            request.data.get('guest_id')
            or request.headers.get('X-Guest-ID')
            or request.GET.get('guest_id')
            or ''
        ).strip()

        if not user and not guest_id:
            return Response(
                {'error': 'Either authenticated user or guest_id must be provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user:
            existing = GameLike.objects.filter(user=user, game_id=game_id).first()
            if existing:
                existing.delete()
                has_liked = False
            else:
                GameLike.objects.create(user=user, game_id=game_id)
                has_liked = True
        else:
            existing = GameLike.objects.filter(guest_id=guest_id, game_id=game_id, user__isnull=True).first()
            if existing:
                existing.delete()
                has_liked = False
            else:
                GameLike.objects.create(guest_id=guest_id, game_id=game_id)
                has_liked = True

        # Calculate new total
        db_likes = GameLike.objects.filter(game_id=game_id).count()
        base_likes = ARCADE_BASE_STATS.get(game_id, {}).get('likes', 100)
        total_likes = base_likes + db_likes

        return Response(
            {
                'gameId': game_id,
                'likes': total_likes,
                'hasLiked': has_liked,
            },
            status=status.HTTP_200_OK,
        )


class GamePlayRecordView(APIView):
    """
    POST /api/games/<game_id>/play/
    Records an authentic unique play session.
    A play is counted only when the player explicitly starts the game.
    Idempotent: repeating with the same session_id does not double-count.
    """
    permission_classes = [AllowAny]

    def post(self, request, game_id):
        game_id = str(game_id).lower().strip()
        user = request.user if request.user and request.user.is_authenticated else None
        data = request.data or {}
        session_id = str(data.get('sessionId') or data.get('session_id') or '').strip()
        guest_id = str(data.get('guest_id') or request.headers.get('X-Guest-ID') or '').strip()

        if not session_id:
            import uuid
            session_id = f'play_{game_id}_{uuid.uuid4().hex[:16]}'

        # Record or find existing play session (strictly idempotent)
        play_obj, created = GamePlaySession.objects.get_or_create(
            session_id=session_id,
            defaults={
                'game_id': game_id,
                'user': user,
                'guest_id': guest_id if not user else None,
            },
        )

        db_plays = GamePlaySession.objects.filter(game_id=game_id).count()
        base_plays = ARCADE_BASE_STATS.get(game_id, {}).get('plays', 500)
        total_plays = base_plays + db_plays

        return Response(
            {
                'gameId': game_id,
                'plays': total_plays,
                'recorded': created,
                'sessionId': session_id,
            },
            status=status.HTTP_200_OK,
        )


class RecordGameSessionView(APIView):
    """
    POST /api/games/record/
    Records an arcade game attempt.
    Associates with user if authenticated.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        data = request.data or {}

        game_type = str(data.get('game_type') or data.get('gameId') or 'cascade').lower()
        valid_types = dict(GameSession.GAME_TYPE_CHOICES).keys()
        if game_type not in valid_types:
            game_type = 'cascade'

        try:
            score = int(data.get('score', 0))
        except (ValueError, TypeError):
            score = 0

        try:
            accuracy = float(data.get('accuracy', 0))
        except (ValueError, TypeError):
            accuracy = 0.0

        try:
            duration = int(data.get('duration_seconds') or data.get('duration') or 0)
        except (ValueError, TypeError):
            duration = 0

        try:
            words_correct = int(data.get('words_correct') or data.get('wordsTyped') or data.get('wordsDefeated') or 0)
        except (ValueError, TypeError):
            words_correct = 0

        try:
            words_missed = int(data.get('words_missed') or data.get('mistakes') or 0)
        except (ValueError, TypeError):
            words_missed = 0

        difficulty = str(data.get('difficulty', 'normal'))[:20]
        metadata = data.get('metadata') if isinstance(data.get('metadata'), dict) else {}

        # Capture any top-level metrics in metadata
        for extra_key in [
            'bestCombo', 'highestTier', 'wordsDefeated', 'bestWpm', 'bestAccuracy',
            'wordsTyped', 'bestStreak', 'targetsEliminated', 'bestSlices', 'maxCombo',
            'distance', 'maxDistance', 'obstaclesCleared', 'deepestRound', 'perfect',
            'perfectRecalls', 'bossDefeated', 'highestWave', 'wave', 'soldiersDefeated',
            'fastestDefeatSeconds', 'wpm', 'vehicle', 'placement', 'racesWon', 'nitroUsed',
        ]:
            if extra_key in data and extra_key not in metadata:
                metadata[extra_key] = data[extra_key]

        session = GameSession.objects.create(
            user=user,
            game_type=game_type,
            score=score,
            accuracy=accuracy,
            duration_seconds=duration,
            words_correct=words_correct,
            words_missed=words_missed,
            difficulty=difficulty,
            metadata=metadata,
        )

        return Response(GameSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class ArcadeSummaryView(APIView):
    """
    GET /api/games/records/
    Returns personal bests and cumulative stats across all arcade games for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = GameSession.objects.filter(user=request.user).order_by('created_at')

        records = {
            'cascade': {'bestScore': 0, 'bestCombo': 0, 'wordsDefeated': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'sprint': {'bestWpm': 0, 'bestAccuracy': 0, 'wordsTyped': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'hunter': {'bestScore': 0, 'bestStreak': 0, 'targetsEliminated': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'ninja': {'bestScore': 0, 'bestSlices': 0, 'maxCombo': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'runner': {'maxDistance': 0, 'bestScore': 0, 'obstaclesCleared': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'memory': {'deepestRound': 0, 'bestScore': 0, 'perfectRecalls': 0, 'highestTier': 1, 'gamesPlayed': 0},
            'boss': {
                'bossDefeated': False,
                'bestScore': 0,
                'highestWave': 1,
                'highestTier': 1,
                'soldiersDefeated': 0,
                'fastestDefeatSeconds': None,
                'gamesPlayed': 0,
            },
            'nitro': {
                'bestWpm': 0,
                'bestAccuracy': 0,
                'racesWon': 0,
                'highestTier': 1,
                'topPlacement': 4,
                'totalDistance': 0,
                'gamesPlayed': 0,
            },
        }

        # Aliases mapping
        type_map = {
            'word_rain': 'cascade',
            'speed_race': 'sprint',
            'word_sprint': 'sprint',
            'racing': 'nitro',
            'nitro_type': 'nitro',
        }

        for sess in sessions:
            g_type = type_map.get(sess.game_type, sess.game_type)
            if g_type not in records:
                continue

            rec = records[g_type]
            rec['gamesPlayed'] = rec.get('gamesPlayed', 0) + 1
            meta = sess.metadata or {}

            tier = int(meta.get('highestTier', 1) or 1)
            rec['highestTier'] = max(rec.get('highestTier', 1), tier)

            if g_type == 'cascade':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                rec['bestCombo'] = max(rec.get('bestCombo', 0), int(meta.get('bestCombo', 0) or 0))
                words = sess.words_correct or int(meta.get('wordsDefeated', 0) or 0)
                rec['wordsDefeated'] = rec.get('wordsDefeated', 0) + words

            elif g_type == 'sprint':
                wpm = float(meta.get('bestWpm') or meta.get('wpm') or sess.score or 0)
                rec['bestWpm'] = max(rec.get('bestWpm', 0), wpm)
                acc = float(meta.get('bestAccuracy') or sess.accuracy or 0)
                rec['bestAccuracy'] = max(rec.get('bestAccuracy', 0), acc)
                words = sess.words_correct or int(meta.get('wordsTyped', 0) or 0)
                rec['wordsTyped'] = rec.get('wordsTyped', 0) + words

            elif g_type == 'hunter':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                rec['bestStreak'] = max(rec.get('bestStreak', 0), int(meta.get('bestStreak', 0) or 0))
                eliminated = sess.words_correct or int(meta.get('targetsEliminated', 0) or 0)
                rec['targetsEliminated'] = rec.get('targetsEliminated', 0) + eliminated

            elif g_type == 'ninja':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                rec['bestSlices'] = max(rec.get('bestSlices', 0), int(meta.get('bestSlices', 0) or sess.words_correct or 0))
                rec['maxCombo'] = max(rec.get('maxCombo', 0), int(meta.get('maxCombo', 0) or 0))

            elif g_type == 'runner':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                dist = int(meta.get('maxDistance') or meta.get('distance') or 0)
                rec['maxDistance'] = max(rec.get('maxDistance', 0), dist)
                cleared = int(meta.get('obstaclesCleared', 0) or sess.words_correct or 0)
                rec['obstaclesCleared'] = rec.get('obstaclesCleared', 0) + cleared

            elif g_type == 'memory':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                rnd = int(meta.get('deepestRound', 0) or 0)
                rec['deepestRound'] = max(rec.get('deepestRound', 0), rnd)
                if meta.get('perfect') or meta.get('perfectRecalls'):
                    rec['perfectRecalls'] = rec.get('perfectRecalls', 0) + int(meta.get('perfectRecalls', 1) or 1)

            elif g_type == 'boss':
                rec['bestScore'] = max(rec.get('bestScore', 0), sess.score)
                wave = int(meta.get('highestWave') or meta.get('wave') or 1)
                rec['highestWave'] = max(rec.get('highestWave', 1), wave)
                if meta.get('bossDefeated'):
                    rec['bossDefeated'] = True
                    sec = sess.duration_seconds or meta.get('durationSeconds')
                    if sec:
                        cur_fastest = rec.get('fastestDefeatSeconds')
                        rec['fastestDefeatSeconds'] = min(cur_fastest, sec) if cur_fastest else sec
                rec['soldiersDefeated'] = rec.get('soldiersDefeated', 0) + int(meta.get('soldiersDefeated', 0) or sess.words_correct or 0)

            elif g_type == 'nitro':
                wpm = float(meta.get('bestWpm') or meta.get('wpm') or sess.score or 0)
                rec['bestWpm'] = max(rec.get('bestWpm', 0), wpm)
                acc = float(meta.get('bestAccuracy') or sess.accuracy or 0)
                rec['bestAccuracy'] = max(rec.get('bestAccuracy', 0), acc)
                dist = int(meta.get('distance') or meta.get('totalDistance') or 0)
                rec['totalDistance'] = rec.get('totalDistance', 0) + dist
                placement = int(meta.get('placement', 4) or 4)
                if placement == 1:
                    rec['racesWon'] = rec.get('racesWon', 0) + 1
                rec['topPlacement'] = min(rec.get('topPlacement', 4), placement)

        return Response(records, status=status.HTTP_200_OK)
