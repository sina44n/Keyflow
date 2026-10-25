"""
Practice Views — Passages and Session recording endpoints.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Passage, PracticeSession
from .serializers import PassageSerializer, PracticeSessionSerializer


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
