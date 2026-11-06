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


# ============================================================================
# 10-Stage 7,000-Level Relational Curriculum API Views
# ============================================================================

import uuid
from .models import (
    CurriculumStage,
    CurriculumUnit,
    CurriculumLevel,
    UserStageAccess,
    CurriculumLessonProgress,
    PlacementAssessment,
    PlacementSkillResult,
    AdaptiveRemedialSession,
)
from .serializers import (
    CurriculumStageSerializer,
    CurriculumUnitSerializer,
    CurriculumLevelSerializer,
    UserStageAccessSerializer,
    PlacementAssessmentSerializer,
    AdaptiveRemedialSessionSerializer,
)


class CurriculumStageListView(APIView):
    """
    GET /api/lessons/curriculum/stages/
    Lists all 10 stages with user access status and completion stats.
    Publicly readable.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        stages = CurriculumStage.objects.filter(is_published=True).order_by('stage_number')
        serializer = CurriculumStageSerializer(stages, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurriculumUnitListView(APIView):
    """
    GET /api/lessons/curriculum/stages/<int:stage_number>/units/
    Lists the 70 units for a given stage.
    Publicly readable.
    """
    permission_classes = [AllowAny]

    def get(self, request, stage_number):
        units = CurriculumUnit.objects.filter(
            stage__stage_number=stage_number
        ).order_by('unit_number')
        serializer = CurriculumUnitSerializer(units, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurriculumLevelListView(APIView):
    """
    GET /api/lessons/curriculum/levels/?stage=<stage>&unit=<unit>
    Query strictly returns the 10 levels of the requested unit (pagination enforced).
    Never loads all 7,000 levels into memory.
    Publicly readable.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        stage_num = request.query_params.get('stage')
        unit_num = request.query_params.get('unit')

        if not stage_num or not unit_num:
            return Response(
                {'error': 'Both "stage" and "unit" parameters are required for unit-level pagination.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            stage_num = int(stage_num)
            unit_num = int(unit_num)
        except ValueError:
            return Response({'error': 'Stage and unit must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

        levels = CurriculumLevel.objects.filter(
            stage__stage_number=stage_num,
            unit__unit_number=unit_num,
            is_published=True
        ).order_by('level_in_unit')

        serializer = CurriculumLevelSerializer(levels, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurriculumLevelDetailView(APIView):
    """
    GET /api/lessons/curriculum/levels/<str:identifier>/
    Retrieves a single level by logical ID (e.g. S01-L001) or primary key.
    Publicly readable.
    """
    permission_classes = [AllowAny]

    def get(self, request, identifier):
        if identifier.isdigit():
            level = CurriculumLevel.objects.filter(id=int(identifier), is_published=True).first()
        else:
            level = CurriculumLevel.objects.filter(logical_id__iexact=identifier, is_published=True).first()

        if not level:
            return Response({'error': 'Curriculum level not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CurriculumLevelSerializer(level, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurriculumRecordProgressView(APIView):
    """
    POST /api/lessons/curriculum/levels/<str:identifier>/record/
    Records genuine completion, calculates star rating (0-3), and unlocks next stage if completed.
    Requires Knox/JWT authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, identifier):
        if identifier.isdigit():
            level = CurriculumLevel.objects.filter(id=int(identifier), is_published=True).first()
        else:
            level = CurriculumLevel.objects.filter(logical_id__iexact=identifier, is_published=True).first()

        if not level:
            return Response({'error': 'Curriculum level not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            wpm = float(request.data.get('wpm', 0.0))
            accuracy = float(request.data.get('accuracy', 0.0))
        except (ValueError, TypeError):
            wpm = 0.0
            accuracy = 0.0

        # Calculate genuine stars
        # 1 Star: Reached baseline target WPM and target Accuracy
        # 2 Stars: Target WPM + 5 and Target Accuracy + 2%
        # 3 Stars: Target WPM + 10 and Target Accuracy + 4%
        is_passed = (wpm >= level.target_wpm and accuracy >= level.target_accuracy)
        stars = 0
        if is_passed:
            stars = 1
            if wpm >= (level.target_wpm + 5) and accuracy >= min(100, level.target_accuracy + 2):
                stars = 2
            if wpm >= (level.target_wpm + 10) and accuracy >= min(100, level.target_accuracy + 4):
                stars = 3

        now = timezone.now()
        progress, created = CurriculumLessonProgress.objects.get_or_create(
            user=request.user,
            level=level,
            defaults={
                'first_attempt_at': now,
                'last_attempt_at': now,
                'attempts': 1,
                'best_wpm': wpm,
                'best_accuracy': accuracy,
                'is_completed': is_passed,
                'stars': stars,
                'completed_at': now if is_passed else None,
            }
        )

        if not created:
            progress.attempts += 1
            progress.last_attempt_at = now
            if wpm > float(progress.best_wpm):
                progress.best_wpm = wpm
            if accuracy > float(progress.best_accuracy):
                progress.best_accuracy = accuracy
            if is_passed:
                if not progress.is_completed:
                    progress.is_completed = True
                    progress.completed_at = now
                if stars > progress.stars:
                    progress.stars = stars
            progress.save()

        # If user completed the final level of this stage (level_in_stage == 700),
        # automatically grant guided unlock access to the next stage
        next_stage_unlocked = None
        if is_passed and level.level_in_stage >= 700 and level.stage.stage_number < 10:
            next_stage_num = level.stage.stage_number + 1
            next_stage = CurriculumStage.objects.filter(stage_number=next_stage_num).first()
            if next_stage:
                UserStageAccess.objects.get_or_create(
                    user=request.user,
                    stage=next_stage,
                    defaults={
                        'access_type': 'guided_unlock',
                        'notes': f'Unlocked automatically after completing Stage {level.stage.stage_number}',
                    }
                )
                next_stage_unlocked = next_stage_num

        return Response({
            'success': True,
            'is_completed': progress.is_completed,
            'stars': progress.stars,
            'best_wpm': float(progress.best_wpm),
            'best_accuracy': float(progress.best_accuracy),
            'attempts': progress.attempts,
            'next_stage_unlocked': next_stage_unlocked,
        }, status=status.HTTP_200_OK)


class CurriculumStageUnlockView(APIView):
    """
    POST /api/lessons/curriculum/stages/<int:stage_number>/unlock/
    Manual Self-Paced Unlock ("Explore Levels").
    Unlocks all 700 levels of the selected stage.
    DOES NOT fabricate lesson completions, stars, or achievements.
    Requires Knox/JWT authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, stage_number):
        stage = CurriculumStage.objects.filter(stage_number=stage_number).first()
        if not stage:
            return Response({'error': f'Stage {stage_number} does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        access, created = UserStageAccess.objects.get_or_create(
            user=request.user,
            stage=stage,
            defaults={
                'access_type': 'manual_explore',
                'max_accessible_unit': 70,
                'notes': 'Manually unlocked via Explore Levels path',
            }
        )

        if not created and access.access_type != 'manual_explore':
            # User previously had guided or placement unlock; preserve access
            pass

        return Response({
            'success': True,
            'stage_number': stage.stage_number,
            'stage_title': stage.title,
            'access_type': access.access_type,
            'unlocked_at': access.unlocked_at.isoformat(),
            'message': f'Stage {stage.stage_number}: {stage.title} unlocked for manual self-paced exploration.',
        }, status=status.HTTP_200_OK)


class PlacementEvaluateView(APIView):
    """
    POST /api/lessons/curriculum/placement/evaluate/
    Evaluates multi-competency Placement Test diagnostics.
    Calculates recommended stage, unit, and skill radar without immediately applying.
    Publicly accessible (supports guests and authenticated users).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        gross_wpm = float(data.get('gross_wpm', data.get('wpm', 0.0)))
        overall_acc = float(data.get('accuracy', 0.0))
        consistency = float(data.get('consistency_score', 75.0))
        weak_keys = data.get('weak_keys', [])
        tier_results = data.get('tier_results', {})

        # Decision Matrix with Strict Accuracy Gatekeeping:
        # High speed NEVER overrides foundational accuracy.
        home_acc = float(tier_results.get('home_row', {}).get('accuracy', overall_acc))
        top_acc = float(tier_results.get('top_row', {}).get('accuracy', overall_acc))
        bottom_acc = float(tier_results.get('bottom_row', {}).get('accuracy', overall_acc))
        number_acc = float(tier_results.get('numbers', {}).get('accuracy', overall_acc))
        symbol_acc = float(tier_results.get('symbols', {}).get('accuracy', overall_acc))
        shift_acc = float(tier_results.get('shift', {}).get('accuracy', overall_acc))

        recommended_stage_num = 1
        recommendation_reason = "Home Row foundation recommended to establish tactile anchors."

        if home_acc < 90.0 or gross_wpm < 20.0:
            recommended_stage_num = 1
            recommendation_reason = "Novice placement: Home-Row anchor stabilization needed."
        elif top_acc < 90.0 or gross_wpm < 28.0:
            recommended_stage_num = 2
            recommendation_reason = "Home Row mastered; Top Row upward reach discipline needed."
        elif bottom_acc < 90.0 or gross_wpm < 34.0:
            recommended_stage_num = 3
            recommendation_reason = "Home and Top Rows stable; Bottom Row downward reach discipline needed."
        elif gross_wpm < 42.0 or consistency < 60.0:
            recommended_stage_num = 4
            recommendation_reason = "Full alphabet accessible; cross-row transition flow needed."
        elif number_acc < 88.0:
            # GATED: Even if typist is 90 WPM, poor numbers => Stage 5!
            recommended_stage_num = 5
            recommendation_reason = "Alphabet mastered, but Number Row dexterity requires structured training."
        elif shift_acc < 90.0 or symbol_acc < 85.0:
            # GATED: Even if high speed, poor shift/symbols => Stage 6!
            recommended_stage_num = 6
            recommendation_reason = "Numbers mastered; Opposite-hand Shift coordination and punctuation needed."
        elif gross_wpm < 63.0 or consistency < 75.0:
            recommended_stage_num = 7
            recommendation_reason = "All keys accessible; High-Frequency English rhythm and cadence needed."
        elif gross_wpm < 73.0 or overall_acc < 93.0:
            recommended_stage_num = 8
            recommendation_reason = "Fluid cadence demonstrated; Speed burst and sustained stamina needed."
        elif gross_wpm < 83.0 or overall_acc < 95.0:
            recommended_stage_num = 9
            recommendation_reason = "High speed typing confirmed; Technical syntax and structured data needed."
        else:
            recommended_stage_num = 10
            recommendation_reason = "Grandmaster qualified: Literary and dense technical manual mastery."

        recommended_stage = CurriculumStage.objects.filter(stage_number=recommended_stage_num).first()
        session_id = data.get('session_id') or str(uuid.uuid4())

        user = request.user if request.user.is_authenticated else None
        assessment = PlacementAssessment.objects.create(
            user=user,
            session_id=session_id,
            overall_wpm=gross_wpm,
            overall_accuracy=overall_acc,
            consistency_score=consistency,
            recommended_stage=recommended_stage,
            recommended_unit=1,
            recommended_level=1,
            status='evaluated',
            weak_keys=weak_keys,
        )

        # Create diagnostic skill breakdown records
        skills_data = [
            ('home_row', home_acc, tier_results.get('home_row', {}).get('wpm', gross_wpm)),
            ('top_row', top_acc, tier_results.get('top_row', {}).get('wpm', gross_wpm)),
            ('bottom_row', bottom_acc, tier_results.get('bottom_row', {}).get('wpm', gross_wpm)),
            ('numbers', number_acc, tier_results.get('numbers', {}).get('wpm', gross_wpm)),
            ('shift_symbols', min(shift_acc, symbol_acc), tier_results.get('symbols', {}).get('wpm', gross_wpm)),
            ('cadence', consistency, gross_wpm),
        ]
        for s_name, s_acc, s_wpm in skills_data:
            PlacementSkillResult.objects.create(
                assessment=assessment,
                skill_name=s_name,
                wpm=s_wpm,
                accuracy=s_acc,
                passed_threshold=(s_acc >= 90.0),
            )

        serializer = PlacementAssessmentSerializer(assessment)
        res_data = serializer.data
        res_data['recommendation_reason'] = recommendation_reason
        return Response(res_data, status=status.HTTP_200_OK)


class PlacementConfirmView(APIView):
    """
    POST /api/lessons/curriculum/placement/confirm/
    Explicit User Confirmation for Placement Assessment.
    Grants UserStageAccess up to the recommended stage.
    DOES NOT fabricate lesson completions or stars.
    Requires Knox/JWT authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        action = request.data.get('action', 'accept')  # 'accept' or 'decline'

        if not session_id:
            return Response({'error': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        assessment = PlacementAssessment.objects.filter(session_id=session_id).first()
        if not assessment:
            return Response({'error': 'Placement assessment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'decline':
            assessment.status = 'declined'
            assessment.save()
            return Response({
                'success': True,
                'status': 'declined',
                'message': 'Placement result declined. User will begin from Stage 1 Guided Learning.',
            }, status=status.HTTP_200_OK)

        # Action == 'accept':
        assessment.user = request.user
        assessment.status = 'applied'
        assessment.applied_at = timezone.now()
        assessment.save()

        target_stage_num = assessment.recommended_stage.stage_number if assessment.recommended_stage else 1

        # Grant decoupled stage access for stages 1 up to recommended_stage
        unlocked_stages = []
        for s_num in range(1, target_stage_num + 1):
            stg = CurriculumStage.objects.filter(stage_number=s_num).first()
            if stg:
                UserStageAccess.objects.get_or_create(
                    user=request.user,
                    stage=stg,
                    defaults={
                        'access_type': 'placement_unlock',
                        'notes': f'Unlocked via Placement Assessment {session_id[:8]}',
                    }
                )
                unlocked_stages.append(s_num)

        return Response({
            'success': True,
            'status': 'applied',
            'recommended_stage': target_stage_num,
            'unlocked_stages': unlocked_stages,
            'message': f'Placement confirmed! Stage 1 through Stage {target_stage_num} access granted. Zero false completions awarded.',
        }, status=status.HTTP_200_OK)


class AdaptiveRemedialCreateView(APIView):
    """
    POST /api/lessons/curriculum/remedial/create/
    Generates an isolated adaptive remedial practice session for weak keys.
    Publicly accessible.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        weak_keys = request.data.get('weak_keys', [])
        source = request.data.get('source', 'lesson_failure')
        drill_type = request.data.get('drill_type', 'reach_targeting')

        if not weak_keys:
            weak_keys = ['f', 'j']

        # Generate targeted exercise text emphasizing the weak keys
        key_str = " ".join([f"{k} {k}{k}" for k in weak_keys])
        drill_content = f"{key_str} with mindful posture and accurate recovery {key_str}"

        user = request.user if request.user.is_authenticated else None
        session = AdaptiveRemedialSession.objects.create(
            user=user,
            weak_keys=weak_keys,
            source=source,
            drill_type=drill_type,
            drill_content=drill_content,
        )

        serializer = AdaptiveRemedialSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdaptiveRemedialCompleteView(APIView):
    """
    POST /api/lessons/curriculum/remedial/<int:pk>/complete/
    Marks a remedial session complete. Isolated from official curriculum progression.
    Publicly accessible.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        session = AdaptiveRemedialSession.objects.filter(id=pk).first()
        if not session:
            return Response({'error': 'Remedial session not found.'}, status=status.HTTP_404_NOT_FOUND)

        session.is_completed = True
        session.completed_at = timezone.now()
        session.wpm_achieved = float(request.data.get('wpm', 0.0))
        session.accuracy_achieved = float(request.data.get('accuracy', 0.0))
        session.save()

        return Response({
            'success': True,
            'session_id': session.id,
            'is_completed': True,
            'message': 'Remedial drill completed. Official curriculum progression remains unmodified.',
        }, status=status.HTTP_200_OK)
