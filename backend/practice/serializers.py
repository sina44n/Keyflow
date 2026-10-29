"""
Practice Serializers — Passages and Session Results.
"""
from django.db import models
from rest_framework import serializers
from .models import Passage, PracticeSession, Competition, CompetitionParticipant


class PassageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passage
        fields = [
            'id',
            'title',
            'content',
            'category',
            'difficulty',
            'word_count',
            'created_at',
        ]
        read_only_fields = ['id', 'word_count', 'created_at']


class PracticeSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='Guest')

    class Meta:
        model = PracticeSession
        fields = [
            'id',
            'user',
            'username',
            'session_type',
            'duration_seconds',
            'total_chars',
            'correct_chars',
            'incorrect_chars',
            'gross_wpm',
            'net_wpm',
            'accuracy',
            'error_count',
            'passage',
            'lesson',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'username', 'created_at']


class CompetitionParticipantSerializer(serializers.ModelSerializer):
    rank = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    cpm = serializers.SerializerMethodField()
    total_chars = serializers.SerializerMethodField()
    correct_words = serializers.SerializerMethodField()
    incorrect_words = serializers.SerializerMethodField()
    words_completed = serializers.SerializerMethodField()

    class Meta:
        model = CompetitionParticipant
        fields = [
            'id',
            'display_name',
            'status',
            'gross_wpm',
            'net_wpm',
            'accuracy',
            'duration_seconds',
            'correct_chars',
            'incorrect_chars',
            'total_chars',
            'score',
            'cpm',
            'correct_words',
            'incorrect_words',
            'words_completed',
            'joined_at',
            'completed_at',
            'rank',
        ]
        read_only_fields = ['id', 'joined_at', 'completed_at', 'rank']

    def get_rank(self, obj):
        # Only rank completed participants
        if obj.status != 'completed':
            return None
        # Deterministic ranking: net_wpm desc, accuracy desc, duration asc, id asc
        higher_count = CompetitionParticipant.objects.filter(
            competition=obj.competition,
            status='completed',
        ).filter(
            models.Q(net_wpm__gt=obj.net_wpm) |
            models.Q(net_wpm=obj.net_wpm, accuracy__gt=obj.accuracy) |
            models.Q(net_wpm=obj.net_wpm, accuracy=obj.accuracy, duration_seconds__lt=obj.duration_seconds) |
            models.Q(net_wpm=obj.net_wpm, accuracy=obj.accuracy, duration_seconds=obj.duration_seconds, id__lt=obj.id)
        ).count()
        return higher_count + 1

    def get_score(self, obj):
        if obj.status != 'completed':
            return 0.0
        return round(float(obj.net_wpm) * (float(obj.accuracy) / 100.0) * 10.0, 1)

    def get_cpm(self, obj):
        if obj.status != 'completed':
            return 0
        return round(float(obj.net_wpm) * 5.0)

    def get_total_chars(self, obj):
        return obj.correct_chars + obj.incorrect_chars

    def get_correct_words(self, obj):
        return round(obj.correct_chars / 5.0)

    def get_incorrect_words(self, obj):
        return round(obj.incorrect_chars / 5.0)

    def get_words_completed(self, obj):
        return round((obj.correct_chars + obj.incorrect_chars) / 5.0)


class CompetitionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='Anonymous')
    participant_count = serializers.IntegerField(source='participants.count', read_only=True)
    participants = CompetitionParticipantSerializer(many=True, read_only=True)
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = [
            'id',
            'code',
            'name',
            'challenge_text',
            'challenge_type',
            'target_limit',
            'difficulty',
            'max_participants',
            'is_public',
            'status',
            'created_by_name',
            'created_at',
            'participant_count',
            'participants',
            'summary',
        ]
        read_only_fields = ['id', 'code', 'created_by_name', 'created_at', 'participant_count', 'participants', 'summary']

    def get_summary(self, obj):
        participants = list(obj.participants.all())
        completed = [p for p in participants if p.status == 'completed']
        total = len(participants)
        completed_count = len(completed)
        pending_count = total - completed_count

        avg_wpm = round(sum(float(p.net_wpm) for p in completed) / completed_count, 1) if completed_count > 0 else 0.0
        avg_acc = round(sum(float(p.accuracy) for p in completed) / completed_count, 1) if completed_count > 0 else 0.0
        top_wpm = max([float(p.net_wpm) for p in completed], default=0.0)
        top_acc = max([float(p.accuracy) for p in completed], default=0.0)
        top_score = max([round(float(p.net_wpm) * (float(p.accuracy) / 100.0) * 10.0, 1) for p in completed], default=0.0)

        # Sorted by net_wpm desc, accuracy desc, duration asc, id asc
        ranked = sorted(
            completed,
            key=lambda p: (-float(p.net_wpm), -float(p.accuracy), p.duration_seconds, p.id)
        )
        podium = [
            {
                'rank': i + 1,
                'id': p.id,
                'display_name': p.display_name,
                'net_wpm': float(p.net_wpm),
                'accuracy': float(p.accuracy),
                'score': round(float(p.net_wpm) * (float(p.accuracy) / 100.0) * 10.0, 1),
            }
            for i, p in enumerate(ranked[:3])
        ]

        return {
            'total_participants': total,
            'completed_count': completed_count,
            'pending_count': pending_count,
            'avg_wpm': avg_wpm,
            'avg_accuracy': avg_acc,
            'top_wpm': top_wpm,
            'top_accuracy': top_acc,
            'top_score': top_score,
            'podium': podium,
        }

