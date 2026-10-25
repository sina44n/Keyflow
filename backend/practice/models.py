"""
Practice App — Typing Sessions, Passages, Personal Bests.
"""
from django.db import models


class Passage(models.Model):
    """A curated text passage available for typing practice."""
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('literature', 'Literature'),
        ('technology', 'Technology'),
        ('science', 'Science'),
        ('quotes', 'Quotes'),
        ('code', 'Code'),
        ('custom', 'Custom'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    ]

    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    word_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'practice_passages'
        ordering = ['difficulty', 'category']

    def __str__(self):
        return f'{self.title or "Passage"} ({self.category}/{self.difficulty})'

    def save(self, *args, **kwargs):
        if not self.word_count:
            self.word_count = len(self.content.split())
        super().save(*args, **kwargs)


class PracticeSession(models.Model):
    """
    Records a completed typing test session.
    User is nullable so guest results can be displayed without DB persistence.
    """
    SESSION_TYPE_CHOICES = [
        ('timed', 'Timed Test'),
        ('words', 'Word Count'),
        ('passage', 'Full Passage'),
        ('lesson', 'Lesson Exercise'),
        ('game', 'Arcade Game'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='practice_sessions',
    )
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='timed')
    duration_seconds = models.PositiveIntegerField()
    total_chars = models.PositiveIntegerField()
    correct_chars = models.PositiveIntegerField()
    incorrect_chars = models.PositiveIntegerField()
    # Use Decimal for numeric metrics to avoid float precision issues
    gross_wpm = models.DecimalField(max_digits=6, decimal_places=2)
    net_wpm = models.DecimalField(max_digits=6, decimal_places=2)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2)
    error_count = models.PositiveIntegerField(default=0)
    passage = models.ForeignKey(
        Passage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sessions',
    )
    lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='practice_sessions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'practice_sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'session_type']),
            models.Index(fields=['user', '-net_wpm']),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'Guest'
        return f'{user_str} — {self.net_wpm} WPM ({self.accuracy}% acc) @ {self.created_at:%Y-%m-%d}'
