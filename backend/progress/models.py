"""Progress App — Daily Goals, Streaks, Activity Calendar."""
from django.db import models


class DailyActivity(models.Model):
    """
    One record per user per calendar day.
    activity_date is in the user's configured timezone (resolved server-side).
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='daily_activity'
    )
    activity_date = models.DateField()
    practice_seconds = models.PositiveIntegerField(default=0)
    sessions_completed = models.PositiveIntegerField(default=0)
    lessons_completed = models.PositiveIntegerField(default=0)
    goal_met = models.BooleanField(default=False)

    class Meta:
        db_table = 'daily_activity'
        unique_together = [['user', 'activity_date']]
        ordering = ['-activity_date']
        indexes = [
            models.Index(fields=['user', '-activity_date']),
        ]

    def __str__(self):
        return f'{self.user.username} — {self.activity_date} ({self.practice_seconds}s)'
