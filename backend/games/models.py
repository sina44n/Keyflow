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


class MultiplayerRoom(models.Model):
    """Real Multiplayer Racing Room for synchronous competitive typing."""
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Racers'),
        ('countdown', 'Starting Countdown'),
        ('racing', 'Race in Progress'),
        ('finished', 'Race Concluded'),
    ]

    code = models.CharField(max_length=16, unique=True, db_index=True)
    name = models.CharField(max_length=64, default='Speedway Grand Prix')
    track = models.CharField(max_length=32, default='speedway')
    tier = models.PositiveSmallIntegerField(default=1)
    target_distance = models.PositiveIntegerField(default=1000)
    host = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hosted_racing_rooms'
    )
    host_name = models.CharField(max_length=64, default='Host')
    max_players = models.PositiveSmallIntegerField(default=4)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='waiting')
    countdown_started_at = models.DateTimeField(null=True, blank=True)
    race_started_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'racing_multiplayer_rooms'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} — {self.name} ({self.status})'


class RoomParticipant(models.Model):
    """Active participant in a multiplayer racing room."""
    room = models.ForeignKey(
        MultiplayerRoom,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='racing_participations'
    )
    guest_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    display_name = models.CharField(max_length=50, default='Racer')
    vehicle_id = models.CharField(max_length=32, default='apex-gt')
    primary_color = models.CharField(max_length=32, default='#EF4444')
    nitro_style = models.CharField(max_length=32, default='fire')
    wheel_finish = models.CharField(max_length=32, default='chrome')
    lane = models.PositiveSmallIntegerField(default=0)
    is_ready = models.BooleanField(default=False)
    distance = models.FloatField(default=0.0)
    speed = models.FloatField(default=0.0)
    wpm = models.PositiveIntegerField(default=0)
    accuracy = models.FloatField(default=100.0)
    placement = models.PositiveSmallIntegerField(default=1)
    is_finished = models.BooleanField(default=False)
    finish_time = models.FloatField(null=True, blank=True)
    last_heartbeat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'racing_room_participants'
        ordering = ['lane']
        constraints = [
            models.UniqueConstraint(
                fields=['room', 'lane'],
                name='unique_room_lane'
            )
        ]

    def __str__(self):
        return f'{self.display_name} in {self.room.code} (Lane {self.lane})'

