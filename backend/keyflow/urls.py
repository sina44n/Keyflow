"""KEYFLOW Django URL Configuration — Root URL Dispatcher"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_health(request):
    """Health check endpoint for deployment monitoring and uptime probes."""
    db_status = 'ok'
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1;')
    except Exception as exc:
        db_status = f'unavailable: {type(exc).__name__}'

    is_healthy = db_status == 'ok'
    return JsonResponse({
        'status': 'ok' if is_healthy else 'degraded',
        'database': db_status,
        'service': 'KEYFLOW API',
        'version': '1.0.0',
    }, status=200 if is_healthy else 503)


urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),

    # API Health Checks (supports root, prefixed, and Kubernetes/cloud probes)
    path('api/', api_health, name='api_health'),
    path('api/health/', api_health, name='api_health_alt'),
    path('health/', api_health, name='health_check'),
    path('healthz/', api_health, name='healthz_check'),

    # Authentication & User Accounts
    path('api/auth/', include('accounts.urls')),
    path('api/profile/', include('accounts.profile_urls')),

    # Lessons Academy
    path('api/lessons/', include('lessons.urls')),
    path('api/v1/lessons/', include('lessons.urls')),

    # Practice & Typing Sessions
    path('api/practice/', include('practice.urls')),

    # Progress & Analytics
    path('api/progress/', include('progress.urls')),

    # Achievements
    path('api/achievements/', include('achievements.urls')),

    # Leaderboard
    path('api/leaderboard/', include('leaderboard.urls')),

    # Typing Arcade Games
    path('api/games/', include('games.urls')),

    # Random Personalized Quotes
    path('api/quotes/', include('quotes.urls')),
]

# Customize admin site
admin.site.site_header = 'KEYFLOW Administration'
admin.site.site_title = 'KEYFLOW Admin'
admin.site.index_title = 'KEYFLOW Content Management'
