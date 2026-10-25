"""
Lessons Views — Levels, Lessons, and Progress API endpoints.
"""
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Level, Lesson, LessonProgress
from .serializers import LevelSerializer, LessonSerializer, LessonProgressSerializer


class LessonsHealthView(APIView):
    """Health check for the lessons app."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'app': 'lessons', 'status': 'ok'})


class LevelListView(generics.ListAPIView):
    """
    GET /api/lessons/levels/ (and /api/v1/lessons/levels/)
    Lists all 7 curriculum levels with their published lessons.
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    serializer_class = LevelSerializer
    queryset = Level.objects.prefetch_related('lessons').all().order_by('level_number')
    pagination_class = None


class LessonDetailView(generics.RetrieveAPIView):
    """
    GET /api/lessons/<int:pk>/
    Retrieves full lesson content and parameters.
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    serializer_class = LessonSerializer
    queryset = Lesson.objects.filter(is_published=True)


class LessonProgressListView(generics.ListAPIView):
    """
    GET /api/lessons/progress/
    Lists lesson progress records for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LessonProgressSerializer
    pagination_class = None

    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user).select_related('lesson', 'lesson__level')


class RecordLessonProgressView(APIView):
    """
    POST /api/v1/lessons/<int:lesson_id>/record/
    Record typing lesson attempt and update best WPM, accuracy, and completion status.
    Protected endpoint (requires Knox token authentication).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id, is_published=True)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

        wpm = float(request.data.get('wpm', 0))
        accuracy = float(request.data.get('accuracy', 0))
        completed = request.data.get('completed', False)

        now = timezone.now()
        progress, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
            defaults={
                'first_attempt_at': now,
                'last_attempt_at': now,
                'attempts': 1,
                'best_wpm': wpm,
                'best_accuracy': accuracy,
                'is_completed': completed,
                'completed_at': now if completed else None,
            }
        )

        if not created:
            progress.attempts += 1
            progress.last_attempt_at = now
            if wpm > float(progress.best_wpm):
                progress.best_wpm = wpm
            if accuracy > float(progress.best_accuracy):
                progress.best_accuracy = accuracy
            if completed and not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = now
            progress.save()

        return Response(LessonProgressSerializer(progress).data, status=status.HTTP_200_OK)
