"""
Quotes App — Views
==================
Endpoints for personalized quotes and public quotes.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .services import get_or_rotate_user_quote, get_public_quote


class CurrentQuoteView(APIView):
    """
    GET /api/quotes/current/
    Returns the current active quote.
    - If authenticated: returns the user's personalized 12-hour rotating quote.
    - If anonymous: returns an active public quote without creating a fake account.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            data = get_or_rotate_user_quote(request.user)
        else:
            data = get_public_quote()
        return Response(data, status=status.HTTP_200_OK)


class ForceRotateQuoteView(APIView):
    """
    POST /api/quotes/rotate/
    For testing: forces rotation of the authenticated user's quote.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Force expiration of current assignment
        from .models import UserQuoteAssignment
        from datetime import timedelta
        from django.utils import timezone

        assignment = UserQuoteAssignment.objects.filter(user=request.user).first()
        if assignment:
            assignment.assigned_at = timezone.now() - timedelta(hours=13)
            assignment.save(update_fields=['assigned_at'])

        data = get_or_rotate_user_quote(request.user)
        return Response(data, status=status.HTTP_200_OK)
