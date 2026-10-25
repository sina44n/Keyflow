"""
Practice Serializers — Passages and Session Results.
"""
from rest_framework import serializers
from .models import Passage, PracticeSession


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
