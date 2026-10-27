"""
Quotes App — Rotation & Assignment Services
============================================
Handles per-user quote assignment, 12-hour rotation in UTC,
and recent repetition prevention.
"""

import random
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Quote, UserQuoteAssignment, QuoteAssignmentHistory

RECENT_HISTORY_LOOKBACK = 20  # Avoid repeating the last 20 quotes


def get_public_quote(seed=None, category=None):
    """
    Returns an active quote for unauthenticated landing-page visitors.
    Does NOT create fake accounts or database records.
    """
    qs = Quote.objects.filter(is_active=True)
    if category:
        qs = qs.filter(category=category)

    count = qs.count()
    if count == 0:
        return {
            'id': 0,
            'text': 'Precision comes before speed. Type with intention, and velocity will follow.',
            'author': 'KEYFLOW',
            'category': 'typing',
            'language': 'en',
            'assigned_at': timezone.now().isoformat(),
            'next_rotation_at': (timezone.now() + timedelta(hours=12)).isoformat(),
            'hours_remaining': 12.0,
            'is_personalized': False,
        }

    if seed is not None:
        rnd = random.Random(seed)
        idx = rnd.randint(0, count - 1)
    else:
        idx = random.randint(0, count - 1)

    quote = qs[idx]
    now = timezone.now()
    return {
        'id': quote.id,
        'text': quote.text,
        'author': quote.author,
        'category': quote.category,
        'language': quote.language,
        'assigned_at': now.isoformat(),
        'next_rotation_at': (now + timedelta(hours=12)).isoformat(),
        'hours_remaining': 12.0,
        'is_personalized': False,
    }


def get_or_rotate_user_quote(user):
    """
    Retrieves or assigns the active quote for an authenticated user.
    Enforces a strict 12-hour rotation window per user in UTC.
    Avoids recent repetitions by excluding the last 20 assigned quotes.
    Thread-safe and deterministic within each 12-hour window.
    """
    now = timezone.now()

    # Fast path: check current assignment without lock
    assignment = (
        UserQuoteAssignment.objects
        .filter(user=user)
        .select_related('quote')
        .first()
    )

    if assignment and not assignment.is_expired():
        elapsed = (now - assignment.assigned_at).total_seconds()
        remaining_seconds = max(0, (assignment.rotation_window_hours * 3600) - elapsed)
        next_rot = assignment.assigned_at + timedelta(hours=assignment.rotation_window_hours)
        return {
            'id': assignment.quote.id,
            'text': assignment.quote.text,
            'author': assignment.quote.author,
            'category': assignment.quote.category,
            'language': assignment.quote.language,
            'assigned_at': assignment.assigned_at.isoformat(),
            'next_rotation_at': next_rot.isoformat(),
            'hours_remaining': round(remaining_seconds / 3600, 1),
            'is_personalized': True,
        }

    # Rotation needed or initial assignment: use atomic transaction
    with transaction.atomic():
        # Re-fetch with row lock to avoid race conditions
        assignment, created = (
            UserQuoteAssignment.objects
            .select_for_update()
            .get_or_create(
                user=user,
                defaults={
                    'quote': Quote.objects.filter(is_active=True).order_by('?').first() or Quote.objects.first(),
                    'assigned_at': now,
                }
            )
        )

        if not created and assignment.is_expired():
            # Recent history of quotes to exclude
            recent_quote_ids = list(
                QuoteAssignmentHistory.objects
                .filter(user=user)
                .order_by('-assigned_at')
                .values_list('quote_id', flat=True)[:RECENT_HISTORY_LOOKBACK]
            )

            # Available pool excluding recent
            eligible_qs = Quote.objects.filter(is_active=True).exclude(id__in=recent_quote_ids)
            total_eligible = eligible_qs.count()

            # Fallback if eligible pool is exhausted
            if total_eligible == 0:
                eligible_qs = Quote.objects.filter(is_active=True)
                total_eligible = eligible_qs.count()

            if total_eligible > 0:
                random_index = random.randint(0, total_eligible - 1)
                new_quote = eligible_qs[random_index]
            else:
                new_quote = assignment.quote  # Fallback to current if no quotes exist

            assignment.quote = new_quote
            assignment.assigned_at = now
            assignment.save(update_fields=['quote', 'assigned_at'])

        # Record in history (bounded)
        QuoteAssignmentHistory.objects.create(
            user=user,
            quote=assignment.quote,
            assigned_at=assignment.assigned_at
        )

        # Keep history table bounded per user (last 50 max)
        excess_ids = list(
            QuoteAssignmentHistory.objects
            .filter(user=user)
            .order_by('-assigned_at')[50:]
            .values_list('id', flat=True)
        )
        if excess_ids:
            QuoteAssignmentHistory.objects.filter(id__in=excess_ids).delete()

    next_rot = assignment.assigned_at + timedelta(hours=assignment.rotation_window_hours)
    return {
        'id': assignment.quote.id,
        'text': assignment.quote.text,
        'author': assignment.quote.author,
        'category': assignment.quote.category,
        'language': assignment.quote.language,
        'assigned_at': assignment.assigned_at.isoformat(),
        'next_rotation_at': next_rot.isoformat(),
        'hours_remaining': float(assignment.rotation_window_hours),
        'is_personalized': True,
    }
