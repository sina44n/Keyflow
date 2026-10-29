"""
KEYFLOW Django Settings
=======================
Environment-based configuration using python-decouple.
Requires DATABASE_URL to be set in .env — no silent SQLite fallback.

Compatible:
  Python 3.14.5 | Django 5.2.18 LTS | DRF 3.18.3 | psycopg 3.3.6
"""

import os
from pathlib import Path
from datetime import timedelta

from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured
import dj_database_url

# ---------------------------------------------------------------------------
# Base Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Security — MUST be overridden in production
# ---------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY', default='dev-insecure-key-change-before-production-KEYFLOW')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'knox',
    'corsheaders',
    'django_rest_passwordreset',
]

LOCAL_APPS = [
    'accounts',
    'lessons',
    'practice',
    'progress',
    'achievements',
    'leaderboard',
    'games',
    'quotes',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',           # static files
    'corsheaders.middleware.CorsMiddleware',                # CORS — must be high
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'keyflow.urls'

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'keyflow.wsgi.application'

# ---------------------------------------------------------------------------
# Database — PostgreSQL required (explicit SQLite opt-in allowed)
# ---------------------------------------------------------------------------
_database_url = config('DATABASE_URL', default=None)

if not _database_url:
    raise ImproperlyConfigured(
        "\n\n"
        "===================================================\n"
        "  KEYFLOW: DATABASE_URL is not configured.\n"
        "===================================================\n"
        "  PostgreSQL is required. Set DATABASE_URL in your\n"
        "  .env file. Example:\n"
        "    DATABASE_URL=postgresql://user:pass@localhost:5432/keyflow_dev\n"
        "\n"
        "  To use SQLite for local development (explicit opt-in):\n"
        "    DATABASE_URL=sqlite:///./db.sqlite3\n"
        "===================================================\n"
    )

DATABASES = {
    'default': dj_database_url.parse(
        _database_url,
        conn_max_age=600,
    )
}

# Anchor relative SQLite paths to BASE_DIR so management commands and servers
# consistently access backend/db.sqlite3 regardless of the shell working directory.
if DATABASES['default'].get('ENGINE') == 'django.db.backends.sqlite3':
    _sqlite_name = DATABASES['default'].get('NAME')
    if _sqlite_name and not os.path.isabs(_sqlite_name):
        DATABASES['default']['NAME'] = str((BASE_DIR / _sqlite_name).resolve())

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'accounts.User'

# ---------------------------------------------------------------------------
# Password Validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static Files
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ---------------------------------------------------------------------------
# Default Auto Field
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.authentication.ClerkAuthentication',
        'knox.auth.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

# ---------------------------------------------------------------------------
# Knox Token Authentication
# ---------------------------------------------------------------------------
REST_KNOX = {
    'SECURE_HASH_ALGORITHM': 'hashlib.sha512',
    'AUTH_TOKEN_CHARACTER_LENGTH': 64,
    'TOKEN_TTL': timedelta(hours=720),          # 30 days
    'USER_SERIALIZER': 'accounts.serializers.UserSerializer',
    'TOKEN_LIMIT_PER_USER': 10,                 # max simultaneous devices
    'AUTO_REFRESH': False,
    'MIN_REFRESH_INTERVAL': 60,
}

# ---------------------------------------------------------------------------
# CORS — Frontend Origins
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175',
    cast=Csv()
)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    r"^https://.*\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF Trusted Origins for admin and API protection
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv()
)

# ---------------------------------------------------------------------------
# Frontend URL & Auth Settings (Clerk & Google)
# ---------------------------------------------------------------------------
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')

# Clerk Authentication Settings
CLERK_SECRET_KEY = config('CLERK_SECRET_KEY', default='')
CLERK_PUBLISHABLE_KEY = config('CLERK_PUBLISHABLE_KEY', default='')
CLERK_ISSUER = config('CLERK_ISSUER', default='')
CLERK_JWKS_URL = config('CLERK_JWKS_URL', default='')
CLERK_PEM_PUBLIC_KEY = config('CLERK_PEM_PUBLIC_KEY', default='')
CLERK_TEST_PUBLIC_KEY = None

# ---------------------------------------------------------------------------
# Email (Password Reset & Verification)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_TIMEOUT = config('EMAIL_TIMEOUT', default=10, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='KEYFLOW <no-reply@keyflow.app>')

# ---------------------------------------------------------------------------
# Password Reset Security (django-rest-passwordreset)
# ---------------------------------------------------------------------------
# Prevent account enumeration by returning standard success response
DJANGO_REST_PASSWORDRESET_NO_INFORMATION_LEAKAGE = config(
    'DJANGO_REST_PASSWORDRESET_NO_INFORMATION_LEAKAGE',
    default=True,
    cast=bool
)
# Reset token expiry in hours (default 24h)
DJANGO_REST_MULTITOKENAUTH_RESET_TOKEN_EXPIRY_TIME = config(
    'PASSWORD_RESET_TOKEN_EXPIRY_HOURS',
    default=24,
    cast=int
)

# ---------------------------------------------------------------------------
# Production Security Settings (applied when DEBUG=False)
# ---------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'

