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
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,testserver,.railway.app,.onrender.com,.vercel.app,keyflow-typing.vercel.app',
    cast=Csv()
)
_allowed_hosts_list = [h.strip() for h in ALLOWED_HOSTS if h.strip()]
for _h in ['localhost', '127.0.0.1', 'testserver', '.railway.app', '.onrender.com', '.vercel.app', 'keyflow-typing.vercel.app']:
    if _h not in _allowed_hosts_list:
        _allowed_hosts_list.append(_h)
ALLOWED_HOSTS = _allowed_hosts_list

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
# Database Configuration & Multi-Source Resolution
# ---------------------------------------------------------------------------
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

SUPPORTED_DB_ENV_VARS = (
    'DATABASE_URL',
    'INTERNAL_DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRESQL_URL',
)


def _sanitize_env_value(val):
    """Safely strips leading/trailing whitespace and matching surrounding quotes."""
    if not val or not isinstance(val, str):
        return None
    cleaned = val.strip()
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        cleaned = cleaned[1:-1].strip()
    return cleaned if cleaned else None


def _resolve_database_url():
    """
    Resolves the database URL according to strict priority:
    1. Exact os.environ matching (DATABASE_URL -> INTERNAL_DATABASE_URL -> POSTGRES_URL -> POSTGRESQL_URL)
    2. Trimmed os.environ key matching with diagnostic reporting (guards against accidental UI whitespace)
    3. Decouple config() fallback (reads local backend/.env)
    Never exposes credentials or secrets.
    """
    # 1. Exact os.environ matching
    for key in SUPPORTED_DB_ENV_VARS:
        raw_val = os.environ.get(key)
        cleaned = _sanitize_env_value(raw_val)
        if cleaned:
            return cleaned, key, False

    # 2. Trimmed os.environ key matching (guards against UI whitespace errors)
    for k, v in os.environ.items():
        trimmed_k = k.strip()
        if trimmed_k in SUPPORTED_DB_ENV_VARS and trimmed_k != k:
            cleaned = _sanitize_env_value(v)
            if cleaned:
                logger.warning(
                    f"[KEYFLOW Configuration Diagnostic] Environment variable '{k}' contained "
                    f"accidental whitespace and was matched as '{trimmed_k}'."
                )
                return cleaned, trimmed_k, True

    # 3. Decouple config() fallback (reads local backend/.env)
    for key in SUPPORTED_DB_ENV_VARS:
        try:
            raw_val = config(key, default=None)
            cleaned = _sanitize_env_value(raw_val)
            if cleaned:
                return cleaned, key, False
        except Exception:
            pass

    return None, None, False


def validate_and_configure_database(raw_url, is_debug=DEBUG):
    """
    Validates database URL against production security policies:
    - Value is not empty
    - URL is parseable
    - Scheme is supported PostgreSQL (postgresql:// or postgres://)
    - Production SQLite is strictly rejected (SQLite requires explicit DEBUG=True)
    - Hostname exists
    - Database name exists
    - Django database engine resolves to PostgreSQL
    Never reveals credentials in exceptions or logs.
    """
    if not raw_url:
        raise ImproperlyConfigured(
            "\n\n"
            "===================================================\n"
            "  KEYFLOW DATABASE CONFIGURATION ERROR\n"
            "===================================================\n"
            "  No valid PostgreSQL database configuration was detected.\n"
            "\n"
            "  Checked:\n"
            "    - DATABASE_URL\n"
            "    - INTERNAL_DATABASE_URL\n"
            "    - POSTGRES_URL\n"
            "    - POSTGRESQL_URL\n"
            "\n"
            "  PostgreSQL is required in production.\n"
            "  No database credentials were exposed.\n"
            "===================================================\n"
        )

    try:
        parsed = urlparse(raw_url)
    except Exception as exc:
        raise ImproperlyConfigured(
            "KEYFLOW DATABASE CONFIGURATION ERROR: Malformed database URL. "
            "Unable to parse configuration. No credentials exposed."
        ) from exc

    scheme = (parsed.scheme or '').lower()

    # Handle SQLite (strictly local-development opt-in only)
    if scheme == 'sqlite':
        if not is_debug:
            raise ImproperlyConfigured(
                "KEYFLOW DATABASE CONFIGURATION ERROR: SQLite is only permitted in local "
                "development (DEBUG=True). Production deployments require PostgreSQL. "
                "No credentials exposed."
            )
        db_config = dj_database_url.parse(raw_url, conn_max_age=600)
        return db_config

    # Handle PostgreSQL
    if scheme not in ('postgresql', 'postgres'):
        raise ImproperlyConfigured(
            f"KEYFLOW DATABASE CONFIGURATION ERROR: Unsupported database scheme '{scheme}'. "
            "PostgreSQL ('postgresql://' or 'postgres://') is required. "
            "No credentials exposed."
        )

    if not parsed.hostname:
        raise ImproperlyConfigured(
            "KEYFLOW DATABASE CONFIGURATION ERROR: Missing hostname in PostgreSQL configuration. "
            "URL must follow the format 'postgresql://USER:PASSWORD@HOST:PORT/DBNAME'. "
            "No credentials exposed."
        )

    db_name = (parsed.path or '').lstrip('/')
    if not db_name:
        raise ImproperlyConfigured(
            "KEYFLOW DATABASE CONFIGURATION ERROR: Missing database name in PostgreSQL configuration. "
            "URL must follow the format 'postgresql://USER:PASSWORD@HOST:PORT/DBNAME'. "
            "No credentials exposed."
        )

    db_config = dj_database_url.parse(raw_url, conn_max_age=600)
    if db_config.get('ENGINE') != 'django.db.backends.postgresql':
        raise ImproperlyConfigured(
            "KEYFLOW DATABASE CONFIGURATION ERROR: Resolved database engine is not PostgreSQL. "
            "No credentials exposed."
        )

    return db_config


# Execute resolution and validation
_raw_database_url, _matched_source, _has_key_whitespace = _resolve_database_url()
_database_config = validate_and_configure_database(_raw_database_url, is_debug=DEBUG)

DATABASES = {
    'default': _database_config
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

# Ensure configured FRONTEND_URL and Vercel domains are trusted by CORS and CSRF
_cors_list = [origin.strip() for origin in CORS_ALLOWED_ORIGINS if origin.strip()]
for _trusted_cors in ['https://keyflow-typing.vercel.app']:
    if _trusted_cors not in _cors_list:
        _cors_list.append(_trusted_cors)
if FRONTEND_URL and FRONTEND_URL.strip() not in _cors_list:
    _cors_list.append(FRONTEND_URL.strip())
CORS_ALLOWED_ORIGINS = _cors_list

_csrf_list = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS if origin.strip()]
for _trusted_csrf in ['https://keyflow-typing.vercel.app', 'https://*.vercel.app']:
    if _trusted_csrf not in _csrf_list:
        _csrf_list.append(_trusted_csrf)
if FRONTEND_URL and FRONTEND_URL.strip() not in _csrf_list:
    _csrf_list.append(FRONTEND_URL.strip())
CSRF_TRUSTED_ORIGINS = _csrf_list

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
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'

