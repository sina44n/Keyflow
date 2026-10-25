"""
Lessons App — Curriculum: 7 Levels, Lessons, LessonProgress
"""
from django.db import models
from django.utils.text import slugify


class Level(models.Model):
    """A top-level grouping of lessons (Level 1 through 7)."""
    level_number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='BookOpen')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'lesson_levels'
        ordering = ['level_number']

    def __str__(self):
        return f'Level {self.level_number}: {self.title}'


class Lesson(models.Model):
    """Individual lesson within a level."""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    objective = models.TextField()
    description = models.TextField(blank=True)
    exercise_content = models.TextField(help_text='The text passage the student will type.')
    target_keys = models.CharField(
        max_length=100,
        blank=True,
        help_text='Comma-separated key characters featured in this lesson.'
    )
    finger_guide = models.JSONField(
        default=dict,
        blank=True,
        help_text='JSON mapping of keys to recommended fingers.'
    )
    target_wpm = models.PositiveSmallIntegerField(default=20)
    target_accuracy = models.PositiveSmallIntegerField(default=80)
    estimated_seconds = models.PositiveSmallIntegerField(default=180)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    order = models.PositiveSmallIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    prerequisite = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='unlocks',
        help_text='Lesson that must be completed before this one is unlocked.'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['level__level_number', 'order']

    def __str__(self):
        return f'[L{self.level.level_number}] {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"level-{self.level.level_number}-{self.title}")
            self.slug = base_slug
        super().save(*args, **kwargs)


class LessonProgress(models.Model):
    """Tracks a user's progress through a specific lesson."""
    from django.conf import settings

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    is_completed = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    best_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    best_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    first_attempt_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = [['user', 'lesson']]
        indexes = [
            models.Index(fields=['user', 'lesson']),
            models.Index(fields=['user', 'is_completed']),
        ]

    def __str__(self):
        status = 'Completed' if self.is_completed else 'In Progress'
        return f'{self.user.username} — {self.lesson.title} ({status})'
