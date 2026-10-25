"""Leaderboard Views — stub (populated in later phases)."""
from rest_framework.views import APIView
from rest_framework.response import Response

class LeaderboardHealthView(APIView):
    def get(self, request):
        return Response({'app': 'leaderboard', 'status': 'ok'})
