"""Achievements App — Badge Definitions and User Awards."""
from django.db import models


class Achievement(models.Model):
    """An unlockable achievement badge definition."""
    CATEGORY_CHOICES = [
        ('getting-started', 'Getting Started'),
        ('speed', 'Speed'),
        ('accuracy', 'Accuracy'),
        ('consistency', 'Consistency'),
        ('curriculum', 'Curriculum'),
        ('arcade', 'Arcade'),
        ('endurance', 'Endurance'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='Trophy')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='getting-started')
    criteria = models.JSONField(
        default=dict,
        help_text='JSON criteria object used by the achievement engine.'
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'achievements'
        ordering = ['order', 'category']

    def __str__(self):
        return f'[{self.code}] {self.name}'


class UserAchievement(models.Model):
    """Records that a user has earned a specific achievement."""
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='achievements'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='earned_by'
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_achievements'
        unique_together = [['user', 'achievement']]
        ordering = ['-unlocked_at']

    def __str__(self):
        return f'{self.user.username} — {self.achievement.name}'
