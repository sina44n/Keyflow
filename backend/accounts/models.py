"""
Accounts App — Custom User Model, Profile, Preferences, Authentication

Custom User uses email as the primary login identifier.
Handles: registration, login (Knox tokens), profile, preferences.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.conf import settings
from urllib.parse import urlparse
import base64
import json
import uuid

def is_google_avatar_host(url: str) -> bool:
    """
    Validates that a URL originates strictly from verified Google profile picture domains
    (e.g. *.googleusercontent.com or *.ggpht.com) over HTTPS.
    """
    if not url or not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url.strip())
        if parsed.scheme != 'https':
            return False
        hostname = (parsed.hostname or '').lower().strip()
        if not hostname:
            return False
        if hostname == 'googleusercontent.com' or hostname.endswith('.googleusercontent.com'):
            return True
        if hostname == 'ggpht.com' or hostname.endswith('.ggpht.com'):
            return True
        return False
    except Exception:
        return False

def is_authentic_avatar_url(url: str) -> bool:
    """
    Validates whether an avatar URL points to an authentic Google profile picture.
    Accepts:
    1. Direct HTTPS Google profile picture URLs (*.googleusercontent.com, *.ggpht.com).
    2. Approved Clerk image proxy URLs (img.clerk.com) wrapping verified Google profile picture URLs.
    Rejects:
    - Arbitrary external HTTPS image URLs from non-Google domains.
    - Clerk's auto-generated generic purple placeholder avatars (type: default).
    - Clerk proxies wrapping non-Google URLs.
    - Misleading domains, non-HTTPS schemes (http, javascript, data, blob), and empty/malformed URLs.
    """
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if not clean:
        return False
    try:
        parsed = urlparse(clean)
        if parsed.scheme != 'https':
            return False
        hostname = (parsed.hostname or '').lower().strip()
        if not hostname:
            return False

        # 1. Direct verified Google profile picture host
        if is_google_avatar_host(clean):
            return True

        # 2. Approved Clerk image proxy wrapping an authentic Google photo
        if hostname == 'img.clerk.com' or hostname.endswith('.clerk.com') or hostname.endswith('.clerk.dev'):
            token = parsed.path.strip('/').split('/')[0]
            if not token:
                return False
            padded = token + '=' * (-len(token) % 4)
            data = json.loads(base64.b64decode(padded.replace('-', '+').replace('_', '/')).decode('utf-8'))
            if isinstance(data, dict) and data.get('type') == 'proxy':
                src = data.get('src')
                return bool(src and is_google_avatar_host(src))
            return False

        return False
    except Exception:
        return False

OWNER_EMAIL = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com')

ROLE_SUPER_ADMIN = 'SUPER_ADMIN'
ROLE_ADMIN = 'ADMIN'
ROLE_USER = 'USER'

ROLE_CHOICES = [
    (ROLE_SUPER_ADMIN, 'Super Admin'),
    (ROLE_ADMIN, 'Admin'),
    (ROLE_USER, 'User'),
]

STATUS_ACTIVE = 'ACTIVE'
STATUS_SUSPENDED = 'SUSPENDED'
STATUS_BANNED = 'BANNED'
STATUS_DELETED = 'DELETED'

STATUS_CHOICES = [
    (STATUS_ACTIVE, 'Active'),
    (STATUS_SUSPENDED, 'Suspended'),
    (STATUS_BANNED, 'Banned'),
    (STATUS_DELETED, 'Deleted'),
]


class UserManager(BaseUserManager):
    """Custom manager for User model with email as the unique identifier."""

    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        if not username:
            raise ValueError('Username is required.')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        if email.lower() == OWNER_EMAIL.lower():
            extra_fields['role'] = ROLE_SUPER_ADMIN
            extra_fields['is_staff'] = True
            extra_fields['is_superuser'] = True
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', ROLE_SUPER_ADMIN)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for KEYFLOW.
    Uses email + username for authentication.
    All password hashing delegated to Django's AbstractBaseUser.
    """
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=30, unique=True, db_index=True)
    clerk_id = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    suspension_reason = models.TextField(blank=True, default='')
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.username} <{self.email}>'

    @property
    def display_name(self):
        """Returns profile display name if set, otherwise username."""
        try:
            return self.profile.display_name or self.username
        except UserProfile.DoesNotExist:
            return self.username

    @property
    def is_super_admin(self):
        """Strictly verified platform owner check."""
        return bool(self.is_owner)

    @property
    def is_admin(self):
        """Strictly verified platform owner check."""
        return bool(self.is_owner)

    @property
    def is_owner(self):
        """
        True ONLY if this account represents the verified platform owner with BOTH
        canonical email and verified Clerk ID. Fails closed if clerk_id is missing or unverified.
        """
        owner_email = getattr(settings, 'OWNER_EMAIL', OWNER_EMAIL).strip().lower()
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
        if not self.email or self.email.strip().lower() != owner_email:
            return False
        clerk_id = getattr(self, 'clerk_id', None)
        if not clerk_id or clerk_id not in owner_clerk_ids:
            return False
        return True

    def can_be_managed_by(self, acting_user):
        """
        Safety check: The Owner account can NEVER be demoted, suspended, or deleted,
        even by another admin or self-destructive requests.
        """
        if self.is_owner:
            return False
        return True


class UserProfile(models.Model):
    """Extended profile information for authenticated users."""
    CONTINENT_CHOICES = [
        ('africa', 'Africa'),
        ('asia', 'Asia'),
        ('europe', 'Europe'),
        ('north_america', 'North America'),
        ('south_america', 'South America'),
        ('oceania', 'Oceania'),
        ('antarctica', 'Antarctica'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=50, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar_url = models.URLField(blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    continent = models.CharField(max_length=30, blank=True, default='', choices=CONTINENT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f'Profile: {self.user.username}'

    def save(self, *args, **kwargs):
        if not self.display_name:
            self.display_name = self.user.username
        super().save(*args, **kwargs)

    @property
    def authentic_avatar_url(self) -> str:
        """Returns avatar_url only if it is an authentic provider-sourced profile picture."""
        raw = self.avatar_url or ''
        return raw if is_authentic_avatar_url(raw) else ''


class UserPreferences(models.Model):
    """
    User application preferences — persisted and synced across devices.
    Frontend reads these on login and applies them immediately.
    """
    THEME_CHOICES = [
        ('dark-theme', 'Dark Theme'),
        ('dark-charcoal-lime', 'Charcoal Lime'),
        ('classic-black-white', 'Classic Black + White'),
        ('burgundy-cream', 'Burgundy + Cream'),
        ('midnight-blue', 'Midnight Ocean'),
        ('lavender-purple', 'Lavender Dream'),
        ('forest-green', 'Electric Cobalt'),
        ('ocean-teal', 'Ocean Teal'),
        ('sunset-orange', 'Fiery Orange'),
        ('rose-pink', 'Rose Pink'),
        ('arctic-blue', 'Warm Sage'),
        ('solarized-light', 'Solarized Light'),
        ('warm-sand', 'Warm Sand'),
        ('glacier-aqua', 'Glacier Aqua'),
        ('forest-sage', 'Forest Green'),
        ('midnight-slate', 'Sunny Golden Yellow'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme_preset = models.CharField(
        max_length=50,
        default='burgundy-cream'
    )
    daily_goal_minutes = models.PositiveSmallIntegerField(
        default=10
    )
    weekly_goal_minutes = models.PositiveIntegerField(
        default=180,
        help_text='Weekly practice target in minutes (e.g. 180m = 3 hours)'
    )
    first_day_of_week = models.PositiveSmallIntegerField(
        default=0,
        help_text='0 = Sunday, 1 = Monday, ..., 6 = Saturday'
    )
    preferred_duration = models.PositiveSmallIntegerField(
        default=60
    )
    preferred_word_count = models.PositiveSmallIntegerField(default=25)
    preferred_mode = models.CharField(max_length=20, default='timed')
    passage_category = models.CharField(max_length=30, default='general')
    sound_enabled = models.BooleanField(default=True)
    sound_profile = models.CharField(max_length=50, default='mechanical-blue')
    keyboard_visual_enabled = models.BooleanField(default=True)
    hand_guide_enabled = models.BooleanField(default=True)
    reduced_motion = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='en')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'
        verbose_name = 'User Preferences'
        verbose_name_plural = 'User Preferences'

    def __str__(self):
        return f'Prefs: {self.user.username}'

    @property
    def theme(self):
        """Convenience alias for theme_preset."""
        return self.theme_preset

    @theme.setter
    def theme(self, value):
        self.theme_preset = value


class EmailVerificationToken(models.Model):
    """Single-use verification token with 24-hour expiration."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'email_verification_tokens'
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at


class RevokedClerkIdentity(models.Model):
    """
    Tombstone registry of deleted or permanently revoked Clerk authentication identities.
    Prevents unexpired Clerk session JWTs or delayed webhooks from resurrecting deleted accounts.
    Keyed strictly by clerk_id (sub claim), NOT by email alone, ensuring that future legitimate
    re-registrations using the same email with a new Clerk ID succeed cleanly.
    """
    clerk_id = models.CharField(max_length=128, unique=True, db_index=True)
    original_email = models.EmailField(db_index=True)
    revoked_at = models.DateTimeField(auto_now_add=True)
    revocation_reason = models.CharField(max_length=255, default='account_deletion')

    class Meta:
        db_table = 'auth_revoked_clerk_identities'
        ordering = ['-revoked_at']
        verbose_name = 'Revoked Clerk Identity'
        verbose_name_plural = 'Revoked Clerk Identities'

    def __str__(self):
        return f'RevokedClerkIdentity({self.clerk_id}, {self.original_email})'


class WebhookEventReceipt(models.Model):
    """
    Durable event-receipt registry for webhook deduplication and failure-safe retry handling.
    Tracks incoming Svix webhook message IDs across distributed backend workers.
    Ensures that:
    1. A successfully processed event is never executed twice.
    2. An event that fails during downstream processing remains retryable.
    3. An event is not marked PROCESSED until downstream processing succeeds.
    """
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_PROCESSED = 'PROCESSED'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = (
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_PROCESSED, 'Processed'),
        (STATUS_FAILED, 'Failed'),
    )

    svix_id = models.CharField(max_length=255, unique=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PROCESSING, db_index=True)
    claim_token = models.UUIDField(default=uuid.uuid4, db_index=True)
    lease_expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'auth_webhook_event_receipts'
        ordering = ['-created_at']
        verbose_name = 'Webhook Event Receipt'
        verbose_name_plural = 'Webhook Event Receipts'

    def __str__(self):
        return f'WebhookEventReceipt({self.svix_id}, {self.event_type}, {self.status})'


