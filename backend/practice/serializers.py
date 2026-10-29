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
            'joined_at',
            'completed_at',
            'rank',
        ]
        read_only_fields = ['id', 'joined_at', 'completed_at', 'rank']

    def get_rank(self, obj):
        # Only rank completed participants
        if obj.status != 'completed':
            return None
        # Rank by net_wpm desc, accuracy desc, duration asc
        higher_count = CompetitionParticipant.objects.filter(
            competition=obj.competition,
            status='completed',
        ).filter(
            models.Q(net_wpm__gt=obj.net_wpm) |
            models.Q(net_wpm=obj.net_wpm, accuracy__gt=obj.accuracy) |
            models.Q(net_wpm=obj.net_wpm, accuracy=obj.accuracy, duration_seconds__lt=obj.duration_seconds)
        ).count()
        return higher_count + 1


class CompetitionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='Anonymous')
    participant_count = serializers.IntegerField(source='participants.count', read_only=True)
    participants = CompetitionParticipantSerializer(many=True, read_only=True)

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
        ]
        read_only_fields = ['id', 'code', 'created_by_name', 'created_at', 'participant_count', 'participants']

