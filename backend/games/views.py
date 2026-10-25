"""Games Views — stub (populated in later phases)."""
from rest_framework.views import APIView
from rest_framework.response import Response

class GamesHealthView(APIView):
    def get(self, request):
        return Response({'app': 'games', 'status': 'ok'})
