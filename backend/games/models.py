"""Games App — Arcade Game Session Records, Real Likes, and Unique Play Sessions."""
from django.db import models
from django.db.models import Q


class GameSession(models.Model):
    """Records a completed arcade game session."""
    GAME_TYPE_CHOICES = [
        ('cascade', 'Key Cascade'),
        ('sprint', 'Speed Sprint'),
        ('hunter', 'Word Hunter'),
        ('ninja', 'Key Ninja'),
        ('runner', 'Word Runner'),
        ('memory', 'Typing Memory'),
        ('boss', 'Boss Battle'),
        ('nitro', 'Nitro Type Pro'),
        ('word_rain', 'Word Rain'),
        ('speed_race', 'Speed Race'),
        ('word_sprint', 'Word Sprint'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='game_sessions'
    )
    game_type = models.CharField(max_length=20, choices=GAME_TYPE_CHOICES)
    score = models.PositiveIntegerField(default=0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    words_correct = models.PositiveIntegerField(default=0)
    words_missed = models.PositiveIntegerField(default=0)
    difficulty = models.CharField(max_length=20, default='normal')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'game_sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'game_type', '-score']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Guest'
        return f'{username} — {self.game_type} score:{self.score}'


class GameLike(models.Model):
    """Records a user's or guest's like for an arcade game."""
    game_id = models.CharField(max_length=32, db_index=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='game_likes'
    )
    guest_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'game_likes'
        indexes = [
            models.Index(fields=['game_id', 'created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'game_id'],
                condition=Q(user__isnull=False),
                name='unique_user_game_like'
            ),
            models.UniqueConstraint(
                fields=['guest_id', 'game_id'],
                condition=Q(user__isnull=True) & Q(guest_id__isnull=False),
                name='unique_guest_game_like'
            ),
        ]

    def __str__(self):
        user_label = self.user.username if self.user else f'Guest({self.guest_id[:8]})'
        return f'{user_label} liked {self.game_id}'


class GamePlaySession(models.Model):
    """
    Records an authentic unique play session.
    A play is recorded strictly when a player explicitly starts playing.
    Session ID guarantees idempotent requests (refreshing the page does not increment plays).
    """
    game_id = models.CharField(max_length=32, db_index=True)
    session_id = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='game_play_sessions'
    )
    guest_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'game_play_sessions'
        indexes = [
            models.Index(fields=['game_id', 'started_at']),
        ]

    def __str__(self):
        return f'Play {self.game_id} ({self.session_id[:8]})'
