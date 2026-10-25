"""Games App — Arcade Game Session Records."""
from django.db import models


class GameSession(models.Model):
    """Records a completed arcade game session."""
    GAME_TYPE_CHOICES = [
        ('word_rain', 'Word Rain'),
        ('speed_race', 'Speed Race'),
        ('word_sprint', 'Word Sprint'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='game_sessions'
    )
    game_type = models.CharField(max_length=20, choices=GAME_TYPE_CHOICES)
    score = models.PositiveIntegerField(default=0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    duration_seconds = models.PositiveIntegerField()
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
        return f'{self.user.username} — {self.game_type} score:{self.score}'
