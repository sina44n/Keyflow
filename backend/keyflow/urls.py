"""KEYFLOW Django URL Configuration — Root URL Dispatcher"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_health(request):
    """Health check endpoint for deployment monitoring."""
    return JsonResponse({
        'status': 'ok',
        'service': 'KEYFLOW API',
        'version': '1.0.0',
    })


urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),

    # API Health Check
    path('api/', api_health, name='api_health'),

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
