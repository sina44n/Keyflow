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
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        data = request.data

        duration = int(data.get('duration_seconds', 0))
        total_chars = int(data.get('total_chars', 0))
        correct_chars = int(data.get('correct_chars', 0))
        incorrect_chars = int(data.get('incorrect_chars', 0))
        gross_wpm = float(data.get('gross_wpm', 0))
        net_wpm = float(data.get('net_wpm', 0))
        accuracy = float(data.get('accuracy', 0))
        error_count = int(data.get('error_count', 0))
        session_type = data.get('session_type', 'timed')
        passage_id = data.get('passage_id')

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
            error_count=error_count,
            passage=passage,
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
        return PracticeSession.objects.filter(user=self.request.user).order_by('-created_at')[:50]


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
        if max_participants < 2 or max_participants > 50:
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
    GET /api/practice/competitions/<str:code>/
    Retrieve competition status, challenge text, and live participant leaderboard.
    """
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            competition = Competition.objects.get(code__iexact=code)
        except Competition.DoesNotExist:
            return Response({'error': 'Competition not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CompetitionSerializer(competition)
        return Response(serializer.data)


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
        if current_count >= competition.max_participants:
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

        from django.utils import timezone

        net_wpm = max(0.0, float(request.data.get('net_wpm', 0.0)))
        gross_wpm = max(0.0, float(request.data.get('gross_wpm', 0.0)))
        accuracy = min(100.0, max(0.0, float(request.data.get('accuracy', 0.0))))
        duration = max(1, int(request.data.get('duration_seconds', 0)))
        correct_chars = max(0, int(request.data.get('correct_chars', 0)))
        incorrect_chars = max(0, int(request.data.get('incorrect_chars', 0)))

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

