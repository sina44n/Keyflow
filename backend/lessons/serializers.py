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
