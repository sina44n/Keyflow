"""
Accounts App — Custom User Model, Profile, Preferences, Authentication

Custom User uses email as the primary login identifier.
Handles: registration, login (Knox tokens), profile, preferences.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.conf import settings

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
        """Owner or explicit Super Admin role check."""
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
        if (self.email and self.email.lower() == OWNER_EMAIL.lower()) or (getattr(self, 'clerk_id', '') in owner_clerk_ids):
            return True
        return self.role == ROLE_SUPER_ADMIN or self.is_superuser

    @property
    def is_admin(self):
        """Admin or Super Admin check."""
        return self.is_super_admin or self.role == ROLE_ADMIN or self.is_staff

    @property
    def is_owner(self):
        """True if this account represents the verified platform owner."""
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))
        return bool((self.email and self.email.lower() == OWNER_EMAIL.lower()) or (getattr(self, 'clerk_id', '') in owner_clerk_ids))

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


class UserPreferences(models.Model):
    """
    User application preferences — persisted and synced across devices.
    Frontend reads these on login and applies them immediately.
    """
    THEME_CHOICES = [
        ('dark-theme', 'Dark Theme'),
        ('dark-charcoal-lime', 'Dark Charcoal + Lime'),
        ('classic-black-white', 'Classic Black + White'),
        ('burgundy-cream', 'Burgundy + Cream'),
        ('midnight-blue', 'Midnight Blue'),
        ('lavender-purple', 'Lavender + Purple'),
        ('forest-green', 'Forest Green'),
        ('ocean-teal', 'Ocean Teal'),
        ('sunset-orange', 'Sunset Orange'),
        ('rose-pink', 'Rose Pink'),
        ('arctic-blue', 'Arctic Blue'),
        ('solarized-light', 'Solarized Light'),
        ('warm-sand', 'Warm Sand'),
        ('espresso-latte', 'Espresso & Latte'),
        ('forest-sage', 'Forest Sage'),
        ('midnight-slate', 'Midnight Slate'),
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
