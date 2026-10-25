"""Achievements Views — stub (populated in later phases)."""
from rest_framework.views import APIView
from rest_framework.response import Response

class AchievementsHealthView(APIView):
    def get(self, request):
        return Response({'app': 'achievements', 'status': 'ok'})
