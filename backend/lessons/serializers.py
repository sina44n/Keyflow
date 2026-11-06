"""
Lessons Serializers — DRF serializers for Level, Lesson, and LessonProgress.
"""
from rest_framework import serializers
from .models import Level, Lesson, LessonProgress


class LessonSerializer(serializers.ModelSerializer):
    level_number = serializers.IntegerField(source='level.level_number', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id',
            'level_number',
            'title',
            'slug',
            'objective',
            'description',
            'exercise_content',
            'target_keys',
            'finger_guide',
            'target_wpm',
            'target_accuracy',
            'estimated_seconds',
            'difficulty',
            'order',
        ]


class LevelSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Level
        fields = [
            'id',
            'level_number',
            'title',
            'description',
            'icon',
            'order',
            'lessons',
        ]


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    level_number = serializers.IntegerField(source='lesson.level.level_number', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id',
            'lesson',
            'lesson_title',
            'level_number',
            'is_completed',
            'attempts',
            'best_wpm',
            'best_accuracy',
            'first_attempt_at',
            'last_attempt_at',
            'completed_at',
        ]
        read_only_fields = ['id', 'user', 'first_attempt_at', 'last_attempt_at', 'completed_at']


# ============================================================================
# 10-Stage 7,000-Level Relational Curriculum Serializers
# ============================================================================

from .models import (
    CurriculumStage,
    CurriculumUnit,
    CurriculumLevel,
    UserStageAccess,
    CurriculumLessonProgress,
    PlacementAssessment,
    PlacementSkillResult,
    AdaptiveRemedialSession,
    LegacyLessonProgressArchive,
)


class CurriculumLevelSerializer(serializers.ModelSerializer):
    stage_id = serializers.IntegerField(source='stage.stage_number', read_only=True)
    unit_number = serializers.IntegerField(source='unit.unit_number', read_only=True)
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumLevel
        fields = [
            'id',
            'logical_id',
            'stage_id',
            'unit_number',
            'level_in_unit',
            'level_in_stage',
            'title',
            'objective',
            'exercise_text',
            'target_keys',
            'home_keys',
            'finger_map',
            'target_wpm',
            'target_accuracy',
            'estimated_seconds',
            'difficulty',
            'is_assessment',
            'is_milestone',
            'guidance',
            'skills',
            'user_progress',
        ]

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        progress = obj.progress_records.filter(user=request.user).first()
        if not progress:
            return None
        return {
            'is_completed': progress.is_completed,
            'stars': progress.stars,
            'best_wpm': float(progress.best_wpm),
            'best_accuracy': float(progress.best_accuracy),
            'attempts': progress.attempts,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
        }


class CurriculumUnitSerializer(serializers.ModelSerializer):
    stage_id = serializers.IntegerField(source='stage.stage_number', read_only=True)
    total_levels = serializers.IntegerField(default=10, read_only=True)
    completed_levels_count = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumUnit
        fields = [
            'id',
            'stage_id',
            'unit_number',
            'global_unit_number',
            'title',
            'objective',
            'introduced_keys',
            'is_milestone_unit',
            'order',
            'total_levels',
            'completed_levels_count',
        ]

    def get_completed_levels_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return CurriculumLessonProgress.objects.filter(
            user=request.user,
            level__unit=obj,
            is_completed=True
        ).count()


class UserStageAccessSerializer(serializers.ModelSerializer):
    stage_number = serializers.IntegerField(source='stage.stage_number', read_only=True)
    stage_title = serializers.CharField(source='stage.title', read_only=True)

    class Meta:
        model = UserStageAccess
        fields = [
            'id',
            'stage_number',
            'stage_title',
            'access_type',
            'unlocked_at',
            'max_accessible_unit',
            'notes',
        ]


class CurriculumStageSerializer(serializers.ModelSerializer):
    user_access = serializers.SerializerMethodField()
    completed_levels_count = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumStage
        fields = [
            'id',
            'stage_number',
            'title',
            'slug',
            'description',
            'pedagogical_focus',
            'target_wpm_start',
            'target_wpm_end',
            'target_accuracy_min',
            'total_units',
            'total_levels',
            'order',
            'user_access',
            'completed_levels_count',
        ]

    def get_user_access(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            # Stage 1 is unlocked by default for guests
            return {
                'is_unlocked': (obj.stage_number == 1),
                'access_type': 'guided_unlock' if obj.stage_number == 1 else 'locked',
            }
        access = obj.user_accesses.filter(user=request.user).first()
        if access:
            return {
                'is_unlocked': True,
                'access_type': access.access_type,
                'unlocked_at': access.unlocked_at.isoformat(),
                'max_accessible_unit': access.max_accessible_unit,
            }
        return {
            'is_unlocked': (obj.stage_number == 1),
            'access_type': 'guided_unlock' if obj.stage_number == 1 else 'locked',
        }

    def get_completed_levels_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return CurriculumLessonProgress.objects.filter(
            user=request.user,
            level__stage=obj,
            is_completed=True
        ).count()


class PlacementSkillResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementSkillResult
        fields = [
            'skill_name',
            'wpm',
            'accuracy',
            'error_count',
            'passed_threshold',
        ]


class PlacementAssessmentSerializer(serializers.ModelSerializer):
    skill_results = PlacementSkillResultSerializer(many=True, read_only=True)
    recommended_stage_number = serializers.IntegerField(source='recommended_stage.stage_number', read_only=True)
    recommended_stage_title = serializers.CharField(source='recommended_stage.title', read_only=True)

    class Meta:
        model = PlacementAssessment
        fields = [
            'session_id',
            'overall_wpm',
            'overall_accuracy',
            'consistency_score',
            'recommended_stage_number',
            'recommended_stage_title',
            'recommended_unit',
            'recommended_level',
            'status',
            'applied_at',
            'weak_keys',
            'created_at',
            'completed_at',
            'skill_results',
        ]


class AdaptiveRemedialSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdaptiveRemedialSession
        fields = [
            'id',
            'weak_keys',
            'source',
            'drill_type',
            'drill_content',
            'accuracy_achieved',
            'wpm_achieved',
            'is_completed',
            'created_at',
            'completed_at',
        ]
