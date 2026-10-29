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


def generate_competition_code():
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return 'KF-' + ''.join(random.choices(chars, k=6))


class Competition(models.Model):
    """
    A genuine typing competition lobby with shared text and real-time leaderboard.
    """
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Participants'),
        ('active', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    CHALLENGE_TYPE_CHOICES = [
        ('words', 'Word Count'),
        ('timed', 'Time Trial'),
    ]

    code = models.CharField(max_length=16, unique=True, db_index=True, default=generate_competition_code)
    name = models.CharField(max_length=120)
    challenge_text = models.TextField()
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPE_CHOICES, default='words')
    target_limit = models.PositiveIntegerField(default=25)
    difficulty = models.CharField(max_length=20, default='medium')
    max_participants = models.PositiveIntegerField(default=10)
    is_public = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_competitions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'practice_competitions'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.code}] {self.name} ({self.status})'


class CompetitionParticipant(models.Model):
    """
    Participant in a typing competition with verified results.
    """
    PARTICIPANT_STATUS_CHOICES = [
        ('joined', 'Joined Lobby'),
        ('typing', 'Typing'),
        ('completed', 'Completed Test'),
    ]

    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name='participants',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='competition_participations',
    )
    display_name = models.CharField(max_length=60)
    status = models.CharField(max_length=20, choices=PARTICIPANT_STATUS_CHOICES, default='joined')
    gross_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    net_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    duration_seconds = models.PositiveIntegerField(default=0)
    correct_chars = models.PositiveIntegerField(default=0)
    incorrect_chars = models.PositiveIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'practice_competition_participants'
        ordering = ['-net_wpm', '-accuracy', 'duration_seconds']
        indexes = [
            models.Index(fields=['competition', '-net_wpm']),
        ]

    def __str__(self):
        return f'{self.display_name} in {self.competition.code} — {self.net_wpm} WPM'

