"""Games App Serializers."""
from rest_framework import serializers
from .models import GameSession, MultiplayerRoom, RoomParticipant


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


class RoomParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomParticipant
        fields = [
            'id',
            'guest_id',
            'display_name',
            'vehicle_id',
            'primary_color',
            'nitro_style',
            'wheel_finish',
            'lane',
            'is_ready',
            'distance',
            'speed',
            'wpm',
            'accuracy',
            'placement',
            'is_finished',
            'finish_time',
            'last_heartbeat',
        ]
        read_only_fields = ['id', 'last_heartbeat']


class MultiplayerRoomSerializer(serializers.ModelSerializer):
    participants = RoomParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = MultiplayerRoom
        fields = [
            'id',
            'code',
            'name',
            'track',
            'tier',
            'target_distance',
            'host_name',
            'max_players',
            'status',
            'countdown_started_at',
            'race_started_at',
            'created_at',
            'participants',
            'participant_count',
        ]
        read_only_fields = ['id', 'code', 'created_at', 'participants', 'participant_count']

    def get_participant_count(self, obj):
        return obj.participants.count()
