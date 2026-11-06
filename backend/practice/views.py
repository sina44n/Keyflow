"""
Practice Views — Passages and Session recording endpoints.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.db import models
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
        )

        return Response(PracticeSessionSerializer(session).data, status=status.HTTP_201_CREATED)


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

