"""Games App Serializers."""
from rest_framework import serializers
from .models import GameSession


class GameSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSession
        fields = [
            'id',
            'game_type',
            'score',
            'accuracy',
            'duration_seconds',
            'words_correct',
            'words_missed',
            'difficulty',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
