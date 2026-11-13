"""
Admin API Data Models — Audit Logs, Global Platform Configuration,
User Typing Restrictions, and Platform Announcements.
"""

from django.db import models
from django.conf import settings


class AdminAuditLog(models.Model):
    """
    Immutable audit trail for all sensitive administrative actions.
    Records who did what, when, to which resource, and with what details.
    """
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_audit_logs',
    )
    action = models.CharField(max_length=64, db_index=True)
    target_model = models.CharField(max_length=64, blank=True, db_index=True)
    target_id = models.CharField(max_length=64, blank=True, db_index=True)
    target_repr = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'admin_audit_logs'
        ordering = ['-created_at']
        verbose_name = 'Admin Audit Log'
        verbose_name_plural = 'Admin Audit Logs'

    def __str__(self):
        admin = self.admin_user.username if self.admin_user else 'System'
        return f'[{self.created_at:%Y-%m-%d %H:%M}] {admin} -> {self.action} on {self.target_model}:{self.target_id}'

    @classmethod
    def log(cls, action, admin_user=None, target_model='', target_id='', target_repr='', details=None, ip_address=None):
        """Helper method to append an audit log entry."""
        return cls.objects.create(
            admin_user=admin_user,
            action=action,
            target_model=target_model,
            target_id=str(target_id) if target_id else '',
            target_repr=str(target_repr)[:255] if target_repr else '',
            details=details or {},
            ip_address=ip_address,
        )


class GlobalPlatformConfig(models.Model):
    """
    Platform-wide singleton configuration for typing controls, feature flags,
    and maintenance states.
    """
    allowed_durations = models.JSONField(default=list, help_text="List of allowed test durations in seconds e.g. [15, 30, 60, 120, 300]")
    default_duration = models.IntegerField(default=60)
    custom_text_enabled = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(
        blank=True,
        default='KEYFLOW is currently undergoing scheduled optimization. We will be back shortly.'
    )
    registration_enabled = models.BooleanField(default=True)
    competition_enabled = models.BooleanField(default=True)
    arcade_enabled = models.BooleanField(default=True)
    academy_enabled = models.BooleanField(default=True)
    leaderboard_enabled = models.BooleanField(default=True)
    guest_typing_enabled = models.BooleanField(default=True)
    announcements_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'global_platform_config'
        verbose_name = 'Global Platform Config'
        verbose_name_plural = 'Global Platform Config'

    def save(self, *args, **kwargs):
        # Enforce singleton
        self.pk = 1
        if not self.allowed_durations:
            self.allowed_durations = [15, 30, 60, 120, 300]
        super().save(*args, **kwargs)

    @classmethod
    def get_config(cls):
        """Fetches or creates the singleton platform config."""
        config, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'allowed_durations': [15, 30, 60, 120, 300],
                'default_duration': 60,
                'custom_text_enabled': True,
                'maintenance_mode': False,
            }
        )
        return config


class UserTypingRestriction(models.Model):
    """
    Per-user overrides for typing durations, custom texts, and leaderboard qualification.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='typing_restriction',
    )
    allowed_durations = models.JSONField(
        default=list,
        blank=True,
        help_text="Custom list of allowed durations for this specific user. Empty = use platform default."
    )
    custom_text_allowed = models.BooleanField(default=True)
    disqualified_from_leaderboard = models.BooleanField(default=False)
    flagged_for_review = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True, default='')
    max_wpm_cap = models.IntegerField(null=True, blank=True, help_text="Optional safety cap on WPM for anti-cheat.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_typing_restrictions'
        verbose_name = 'User Typing Restriction'
        verbose_name_plural = 'User Typing Restrictions'

    def __str__(self):
        return f'Restrictions for {self.user.username}'


class PlatformAnnouncement(models.Model):
    """
    Administrative announcements shown on user dashboards or global banner.
    """
    TYPE_CHOICES = [
        ('INFO', 'Informational'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical Notice'),
        ('SUCCESS', 'Update / Release'),
    ]

    AUDIENCE_CHOICES = [
        ('ALL', 'All Users'),
        ('STUDENTS', 'Academy Students'),
        ('ADMINS', 'Admins Only'),
    ]

    title = models.CharField(max_length=150)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='ALL')
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_announcements',
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'platform_announcements'
        ordering = ['-created_at']
        verbose_name = 'Platform Announcement'
        verbose_name_plural = 'Platform Announcements'

    def __str__(self):
        return f'{self.title} ({self.type})'

