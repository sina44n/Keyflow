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
    POST /api/lessons/record/ or POST /api/lessons/<int:lesson_id>/record/
    Record typing lesson attempt and update best WPM, accuracy, and completion status.
    Protected endpoint (requires Knox token authentication).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id=None):
        target_lesson = None

        if lesson_id is not None:
            try:
                target_lesson = Lesson.objects.get(id=lesson_id, is_published=True)
            except Lesson.DoesNotExist:
                return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            raw_stage = request.data.get('stage') or request.data.get('stageId') or 1
            raw_lesson = request.data.get('lesson') or request.data.get('lessonNum') or 1
            try:
                stage_num = max(1, min(7, int(raw_stage)))
                lesson_num = max(1, int(raw_lesson))
            except (ValueError, TypeError):
                return Response({'error': 'Invalid stage or lesson number.'}, status=status.HTTP_400_BAD_REQUEST)

            level, _ = Level.objects.get_or_create(
                level_number=stage_num,
                defaults={'title': f'Level {stage_num}', 'description': f'Stage {stage_num} Curriculum'}
            )
            target_lesson = Lesson.objects.filter(level=level, order=lesson_num).first()
            if not target_lesson:
                target_lesson = Lesson.objects.create(
                    level=level,
                    order=lesson_num,
                    title=f'Stage {stage_num} Lesson {lesson_num}',
                    slug=f'level-{stage_num}-lesson-{lesson_num}',
                    exercise_content='',
                    target_wpm=20,
                    target_accuracy=80,
                )

        try:
            wpm = float(request.data.get('wpm', 0))
            accuracy = float(request.data.get('accuracy', 0))
        except (ValueError, TypeError):
            wpm = 0.0
            accuracy = 0.0

        completed = bool(request.data.get('completed', False))
        if not completed and wpm >= target_lesson.target_wpm and accuracy >= target_lesson.target_accuracy:
            completed = True

        now = timezone.now()
        progress, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=target_lesson,
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


class UserLessonProgressSummaryView(APIView):
    """
    GET /api/lessons/progress/summary/
    Returns full lesson progress map, highest reached level per stage,
    and unlocked stages for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = LessonProgress.objects.filter(
            user=request.user
        ).select_related('lesson', 'lesson__level')

        lessons_map = {}
        stage_progress = {'1': 1, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0}
        unlocked_stages = [1]

        for rec in records:
            s_num = rec.lesson.level.level_number
            l_num = rec.lesson.order
            stable_key = f"S{s_num}-L{str(l_num).zfill(3)}"
            direct_key = f"s{s_num}_l{l_num}"

            item = {
                'completed': rec.is_completed,
                'bestWpm': float(rec.best_wpm),
                'bestAccuracy': float(rec.best_accuracy),
                'attempts': rec.attempts,
                'completedAt': rec.completed_at.isoformat() if rec.completed_at else None,
            }
            lessons_map[stable_key] = item
            lessons_map[direct_key] = item

            if rec.is_completed:
                stage_progress[str(s_num)] = max(stage_progress.get(str(s_num), 0), l_num + 1)
                if l_num >= 600 and s_num < 7 and (s_num + 1) not in unlocked_stages:
                    unlocked_stages.append(s_num + 1)

        return Response({
            'lessons': lessons_map,
            'stageProgress': stage_progress,
            'unlockedStages': sorted(unlocked_stages),
        }, status=status.HTTP_200_OK)
