"""
Leaderboard Serializers
=======================
Serializers for the Global Leaderboard API:
- LeaderboardEntrySerializer: individual ranked typist performance record
- LeaderboardStatsSerializer: summary platform and period statistics
- CompetitionSummarySerializer: available typing competition lobbies
- LeaderboardResponseSerializer: top-level response envelope
"""

from rest_framework import serializers


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    avatar_url = serializers.CharField(allow_blank=True, default='')
    continent = serializers.CharField(allow_blank=True, default='')
    net_wpm = serializers.FloatField()
    gross_wpm = serializers.FloatField()
    accuracy = serializers.FloatField()
    score = serializers.FloatField()
    duration_seconds = serializers.IntegerField()
    session_type = serializers.CharField()
    total_chars = serializers.IntegerField()
    sessions_count = serializers.IntegerField()
    achieved_at = serializers.DateTimeField()


class PeriodTimeRemainingSerializer(serializers.Serializer):
    total_seconds = serializers.IntegerField()
    days = serializers.IntegerField()
    hours = serializers.IntegerField()
    minutes = serializers.IntegerField()
    seconds = serializers.IntegerField()
    formatted = serializers.CharField()


class LeaderboardStatsSerializer(serializers.Serializer):
    registered_typists = serializers.IntegerField()
    active_competitors = serializers.IntegerField()
    top_speed = serializers.FloatField()
    top_speed_user = serializers.CharField(allow_null=True)
    avg_accuracy = serializers.FloatField()
    period_time_remaining = PeriodTimeRemainingSerializer(allow_null=True, required=False)


class MyRankSerializer(serializers.Serializer):
    ranked = serializers.BooleanField()
    rank = serializers.IntegerField(allow_null=True, required=False)
    total_competitors = serializers.IntegerField()
    percentile = serializers.FloatField(allow_null=True, required=False)
    net_wpm = serializers.FloatField(allow_null=True, required=False)
    gross_wpm = serializers.FloatField(allow_null=True, required=False)
    accuracy = serializers.FloatField(allow_null=True, required=False)
    score = serializers.FloatField(allow_null=True, required=False)
    duration_seconds = serializers.IntegerField(allow_null=True, required=False)
    sessions_count = serializers.IntegerField(allow_null=True, required=False)
    achieved_at = serializers.DateTimeField(allow_null=True, required=False)
    message = serializers.CharField(allow_blank=True, required=False)


class CompetitionSummarySerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    challenge_type = serializers.CharField()
    target_limit = serializers.IntegerField()
    status = serializers.CharField()
    participants_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class LeaderboardResponseSerializer(serializers.Serializer):
    scope = serializers.CharField(default='global')
    period = serializers.CharField()
    category = serializers.CharField()
    duration = serializers.CharField(default='all')
    continent = serializers.CharField(default='all')
    stats = LeaderboardStatsSerializer()
    entries = LeaderboardEntrySerializer(many=True)
    my_rank = MyRankSerializer(allow_null=True)
    competitions = CompetitionSummarySerializer(many=True, required=False, allow_null=True)
