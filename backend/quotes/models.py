"""
Quotes App — Models
===================
Personalized 12-hour rotating typing quotes.
Each user receives independently assigned quotes avoiding recent repetitions.
"""

from django.db import models
from django.utils import timezone


class Quote(models.Model):
    """A curated motivational or technical quote for typing learners."""
    CATEGORY_CHOICES = [
        ('typing', 'Typing & Rhythm'),
        ('focus', 'Deep Focus'),
        ('discipline', 'Discipline & Practice'),
        ('patience', 'Patience & Persistence'),
        ('consistency', 'Consistency & Growth'),
        ('mastery', 'Craftsmanship & Mastery'),
        ('flow', 'Flow State'),
    ]

    text = models.TextField(help_text='The full quote text.')
    author = models.CharField(max_length=150, default='KEYFLOW', help_text='Verified author or KEYFLOW.')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='focus')
    language = models.CharField(max_length=10, default='en')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quotes'
        ordering = ['id']

    def __str__(self):
        return f'"{self.text[:40]}..." — {self.author}'


class UserQuoteAssignment(models.Model):
    """
    Current 12-hour quote assignment for an authenticated user.
    Deterministic within 12 hours from assigned_at.
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='quote_assignment'
    )
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(default=timezone.now)
    rotation_window_hours = models.PositiveSmallIntegerField(default=12)

    class Meta:
        db_table = 'user_quote_assignments'

    def __str__(self):
        return f'{self.user.username} -> Quote #{self.quote_id} @ {self.assigned_at}'

    def is_expired(self):
        elapsed = timezone.now() - self.assigned_at
        return elapsed.total_seconds() >= (self.rotation_window_hours * 3600)


class QuoteAssignmentHistory(models.Model):
    """
    Bounded assignment history per user to prevent immediate repetitions.
    Used by the rotation engine to exclude recent quotes from the eligible pool.
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='quote_history'
    )
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'quote_assignment_history'
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['user', '-assigned_at']),
        ]

    def __str__(self):
        return f'{self.user.username} - Quote #{self.quote_id} ({self.assigned_at:%Y-%m-%d %H:%M})'
