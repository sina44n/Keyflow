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


class CurriculumStage(models.Model):
    """
    Academy Curriculum Stage (1 to 10).
    Represents one of the 10 core pedagogical stages in the KEYFLOW Academy.
    """
    stage_number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    description = models.TextField()
    pedagogical_focus = models.TextField(blank=True)
    target_wpm_start = models.PositiveSmallIntegerField(default=15)
    target_wpm_end = models.PositiveSmallIntegerField(default=24)
    target_accuracy_min = models.PositiveSmallIntegerField(default=75)
    total_units = models.PositiveSmallIntegerField(default=70)
    total_levels = models.PositiveIntegerField(default=700)
    order = models.PositiveSmallIntegerField(default=1)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_stages'
        ordering = ['stage_number']

    def __str__(self):
        return f"Stage {self.stage_number}: {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"stage-{self.stage_number}-{self.title}")
        super().save(*args, **kwargs)


class CurriculumUnit(models.Model):
    """
    Curriculum Unit (1 to 70 per Stage).
    Groups exactly 10 levels focused on a distinct ergonomic reach or skill.
    """
    stage = models.ForeignKey(CurriculumStage, on_delete=models.CASCADE, related_name='units')
    unit_number = models.PositiveSmallIntegerField()  # 1 to 70 within stage
    global_unit_number = models.PositiveIntegerField()  # 1 to 700 curriculum-wide
    title = models.CharField(max_length=200)
    objective = models.TextField()
    introduced_keys = models.CharField(max_length=200, blank=True)
    is_milestone_unit = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_units'
        ordering = ['stage__stage_number', 'unit_number']
        unique_together = [['stage', 'unit_number']]
        indexes = [
            models.Index(fields=['stage', 'unit_number']),
            models.Index(fields=['global_unit_number']),
        ]

    def __str__(self):
        return f"S{self.stage.stage_number} Unit {self.unit_number}: {self.title}"


class CurriculumLevel(models.Model):
    """
    Curriculum Level (1 to 10 per Unit, exactly 700 per Stage, 7,000 total).
    The atomic typing exercise with authentic text, ANSI finger mapping, and targets.
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    unit = models.ForeignKey(CurriculumUnit, on_delete=models.CASCADE, related_name='levels')
    stage = models.ForeignKey(CurriculumStage, on_delete=models.CASCADE, related_name='levels')
    level_in_unit = models.PositiveSmallIntegerField()  # 1 to 10
    level_in_stage = models.PositiveSmallIntegerField()  # 1 to 700
    logical_id = models.CharField(max_length=20, unique=True, db_index=True)  # e.g. "S01-L001" to "S10-L700"
    title = models.CharField(max_length=255)
    objective = models.TextField()
    exercise_text = models.TextField(help_text='The authentic pedagogical text the student types.')
    target_keys = models.JSONField(default=list)
    home_keys = models.JSONField(default=list)
    finger_map = models.JSONField(default=dict)
    target_wpm = models.PositiveSmallIntegerField(default=20)
    target_accuracy = models.PositiveSmallIntegerField(default=80)
    estimated_seconds = models.PositiveSmallIntegerField(default=60)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    is_assessment = models.BooleanField(default=False)
    is_milestone = models.BooleanField(default=False)
    guidance = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_levels'
        ordering = ['stage__stage_number', 'level_in_stage']
        unique_together = [
            ['unit', 'level_in_unit'],
            ['stage', 'level_in_stage'],
        ]
        indexes = [
            models.Index(fields=['stage', 'unit']),
            models.Index(fields=['stage', 'level_in_stage']),
            models.Index(fields=['logical_id']),
        ]

    def __str__(self):
        return f"[{self.logical_id}] {self.title}"


class UserStageAccess(models.Model):
    """
    Decoupled Stage Access.
    Grants access to a stage via Guided Learning, Placement Test, or Manual Explore.
    DOES NOT fabricate lesson completions or stars.
    """
    ACCESS_TYPE_CHOICES = [
        ('guided_unlock', 'Guided Learning Sequential Unlock'),
        ('placement_unlock', 'Placement Test Diagnostic Unlock'),
        ('manual_explore', 'Manual Self-Paced Unlock'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='stage_accesses'
    )
    stage = models.ForeignKey(
        CurriculumStage,
        on_delete=models.CASCADE,
        related_name='user_accesses'
    )
    access_type = models.CharField(max_length=30, choices=ACCESS_TYPE_CHOICES, default='guided_unlock')
    unlocked_at = models.DateTimeField(auto_now_add=True)
    max_accessible_unit = models.PositiveSmallIntegerField(default=70)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'user_stage_access'
        unique_together = [['user', 'stage']]
        indexes = [
            models.Index(fields=['user', 'stage']),
        ]

    def __str__(self):
        return f"{self.user.username} -> Stage {self.stage.stage_number} ({self.access_type})"


class CurriculumLessonProgress(models.Model):
    """
    Tracks genuine completion and performance metrics for a specific CurriculumLevel.
    Decoupled from stage access permissions.
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='curriculum_progress'
    )
    level = models.ForeignKey(
        CurriculumLevel,
        on_delete=models.CASCADE,
        related_name='progress_records'
    )
    is_completed = models.BooleanField(default=False)
    stars = models.PositiveSmallIntegerField(default=0)  # 0 to 5
    best_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    best_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    attempts = models.PositiveIntegerField(default=0)
    first_attempt_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'curriculum_lesson_progress'
        unique_together = [['user', 'level']]
        indexes = [
            models.Index(fields=['user', 'level']),
            models.Index(fields=['user', 'is_completed']),
        ]

    def __str__(self):
        status = 'Completed' if self.is_completed else 'In Progress'
        return f"{self.user.username} — {self.level.logical_id} ({status}, {self.stars}★)"


class PlacementAssessment(models.Model):
    """
    Records a user's multi-competency Placement Test assessment.
    Results must be explicitly confirmed by the user before stage access is applied.
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('evaluated', 'Evaluated (Pending User Confirmation)'),
        ('applied', 'Applied & Confirmed by User'),
        ('declined', 'Declined by User'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='placement_assessments',
        null=True,
        blank=True
    )
    session_id = models.CharField(max_length=64, unique=True, db_index=True)
    overall_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    overall_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    consistency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    recommended_stage = models.ForeignKey(
        CurriculumStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='placement_recommendations'
    )
    recommended_unit = models.PositiveSmallIntegerField(default=1)
    recommended_level = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    applied_at = models.DateTimeField(null=True, blank=True)
    weak_keys = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'placement_assessments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Placement {self.session_id[:8]} -> Stage {self.recommended_stage_id} ({self.status})"


class PlacementSkillResult(models.Model):
    """
    Diagnostic breakdown of an individual skill tier within a Placement Assessment.
    """
    assessment = models.ForeignKey(
        PlacementAssessment,
        on_delete=models.CASCADE,
        related_name='skill_results'
    )
    skill_name = models.CharField(max_length=50)  # 'home_row', 'top_row', 'bottom_row', 'numbers', 'shift_symbols', 'cadence'
    wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    error_count = models.PositiveIntegerField(default=0)
    passed_threshold = models.BooleanField(default=False)

    class Meta:
        db_table = 'placement_skill_results'
        unique_together = [['assessment', 'skill_name']]

    def __str__(self):
        return f"{self.skill_name}: {self.wpm} WPM @ {self.accuracy}%"


class AdaptiveRemedialSession(models.Model):
    """
    Remedial practice session generated for weak keys.
    Completely isolated from official curriculum progression.
    """
    DRILL_TYPE_CHOICES = [
        ('reach_targeting', 'Reach Targeting'),
        ('rhythm_stabilization', 'Rhythm Stabilization'),
        ('shift_coordination', 'Shift Coordination'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='remedial_sessions',
        null=True,
        blank=True
    )
    weak_keys = models.JSONField(default=list)
    source = models.CharField(max_length=30, default='lesson_failure')
    drill_type = models.CharField(max_length=30, choices=DRILL_TYPE_CHOICES, default='reach_targeting')
    drill_content = models.TextField()
    accuracy_achieved = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    wpm_achieved = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'adaptive_remedial_sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Remedial ({self.drill_type}) for keys {self.weak_keys}"


class LegacyLessonProgressArchive(models.Model):
    """
    Preserves original legacy lesson progress (from the 7-stage / 4,200-level system).
    Guarantees zero data loss and enables full rollback.
    """
    MIGRATION_ACTION_CHOICES = [
        ('exact_mapped', 'Mapped to Equivalent New Lesson'),
        ('stage_access_granted', 'Stage Access Granted Without False Completion'),
        ('archived_only', 'Archived Only (No Direct Equivalent)'),
    ]

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='legacy_progress_archives'
    )
    legacy_lesson_id = models.CharField(max_length=50)  # e.g. "S1-L001"
    legacy_stage = models.PositiveSmallIntegerField()
    legacy_level = models.PositiveSmallIntegerField()
    legacy_title = models.CharField(max_length=255, blank=True)
    is_completed = models.BooleanField(default=False)
    best_wpm = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    best_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    attempts = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    migration_action = models.CharField(max_length=50, choices=MIGRATION_ACTION_CHOICES, default='archived_only')
    new_level = models.ForeignKey(
        CurriculumLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='legacy_archives'
    )
    archived_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'legacy_lesson_progress_archives'
        indexes = [
            models.Index(fields=['user', 'legacy_stage', 'legacy_level']),
        ]

    def __str__(self):
        return f"Archive: {self.user.username} — {self.legacy_lesson_id} ({self.migration_action})"
