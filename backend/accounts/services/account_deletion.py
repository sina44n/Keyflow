"""
KEYFLOW Account Deletion & Data Purge Service
===========================================
Provides safe, auditable, transaction-atomic deletion of the verified secondary
account and its exclusively owned data, while strictly preventing accidental deletion
of the Platform Owner, preserving shared platform resources, and guaranteeing
that newly registered accounts cannot be deleted by stale deletion requests.
"""

import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.exceptions import PermissionDenied, ValidationError

logger = logging.getLogger(__name__)
User = get_user_model()


def audit_user_data_scope(user):
    """
    Computes an exact count of all exclusively owned child records and
    shared platform relationships for the target user.
    """
    from accounts.models import UserProfile, UserPreferences, EmailVerificationToken
    from practice.models import PracticeSession, Competition, CompetitionParticipant
    from lessons.models import (
        LessonProgress,
        CurriculumLessonProgress,
        UserStageAccess,
        PlacementAssessment,
        AdaptiveRemedialSession,
        LegacyLessonProgressArchive,
    )
    from games.models import GameSession, GameLike, GamePlaySession, MultiplayerRoom, RoomParticipant
    from progress.models import DailyActivity
    from achievements.models import UserAchievement
    from knox.models import AuthToken
    from django_rest_passwordreset.models import ResetPasswordToken
    from admin_api.models import AdminAuditLog, UserTypingRestriction, PlatformAnnouncement

    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'clerk_id': user.clerk_id,
        'role': user.role,
        'is_owner': getattr(user, 'is_owner', False),
        'exclusively_owned': {
            'practice_sessions': PracticeSession.objects.filter(user=user).count(),
            'lesson_progress': LessonProgress.objects.filter(user=user).count(),
            'curriculum_progress': CurriculumLessonProgress.objects.filter(user=user).count(),
            'stage_access': UserStageAccess.objects.filter(user=user).count(),
            'placement_assessments': PlacementAssessment.objects.filter(user=user).count(),
            'remedial_sessions': AdaptiveRemedialSession.objects.filter(user=user).count(),
            'legacy_progress_archive': LegacyLessonProgressArchive.objects.filter(user=user).count(),
            'game_sessions': GameSession.objects.filter(user=user).count(),
            'game_likes': GameLike.objects.filter(user=user).count(),
            'game_play_sessions': GamePlaySession.objects.filter(user=user).count(),
            'daily_activity': DailyActivity.objects.filter(user=user).count(),
            'achievements': UserAchievement.objects.filter(user=user).count(),
            'auth_tokens': AuthToken.objects.filter(user=user).count(),
            'password_reset_tokens': ResetPasswordToken.objects.filter(user=user).count(),
            'email_verification_tokens': EmailVerificationToken.objects.filter(user=user).count(),
            'typing_restrictions': UserTypingRestriction.objects.filter(user=user).count(),
            'user_profile': UserProfile.objects.filter(user=user).count(),
            'user_preferences': UserPreferences.objects.filter(user=user).count(),
        },
        'shared_references_preserved': {
            'competitions_created': Competition.objects.filter(created_by=user).count(),
            'competition_participations': CompetitionParticipant.objects.filter(user=user).count(),
            'multiplayer_rooms_hosted': MultiplayerRoom.objects.filter(host=user).count(),
            'room_participations': RoomParticipant.objects.filter(user=user).count(),
            'admin_audit_logs': AdminAuditLog.objects.filter(admin_user=user).count(),
            'announcements_created': PlatformAnnouncement.objects.filter(created_by=user).count(),
        },
    }


def safe_delete_account(target_email, expected_clerk_id, dry_run=False):
    """
    Safely deletes the target account matching target_email AND expected_clerk_id.

    Preconditions & Safeguards:
    1. Both target_email and expected_clerk_id are strictly required.
    2. Strictly refuses to target the Platform Owner.
    3. Verifies that the resolved user's clerk_id matches expected_clerk_id.
       If the clerk_id differs (e.g. a new account re-registered with the same email),
       aborts with ValidationError to protect the new account.
    4. Legacy accounts (sinan.legacy1@archived.keyflow.local) are excluded from deletion scope.
    5. Runs inside transaction.atomic(); rolls back cleanly on any failure.

    Returns:
        dict: Complete audit report of deleted user and purged data counts.
    """
    owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
    owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))

    if not target_email or not expected_clerk_id:
        raise ValidationError(
            "Both target_email and expected_clerk_id are required to prevent ambiguous or accidental deletion."
        )

    clean_email = str(target_email).strip().lower()
    clean_clerk_id = str(expected_clerk_id).strip()

    # Owner immunity check
    if clean_email == owner_email:
        raise PermissionDenied("SECURITY VIOLATION: Cannot delete the Platform Owner account (email match).")

    if clean_clerk_id in owner_clerk_ids:
        raise PermissionDenied("SECURITY VIOLATION: Cannot delete the Platform Owner account (Clerk ID match).")

    # Legacy archived account protection
    if clean_email.endswith('@archived.keyflow.local') or clean_email == 'sinan.legacy1@archived.keyflow.local':
        raise PermissionDenied("SECURITY VIOLATION: Archived legacy accounts are excluded from deletion.")

    # Locate account by email
    matches = User.objects.filter(email__iexact=clean_email)
    match_count = matches.count()

    if match_count == 0:
        return {
            'status': 'no_matching_accounts_found',
            'matched_count': 0,
            'dry_run': dry_run,
            'audits': [],
        }

    if match_count > 1:
        raise ValidationError(
            f"SAFETY ABORT: Multiple accounts ({match_count}) matched email '{clean_email}'. "
            "Ambiguous target; manual administrative audit required."
        )

    user = matches.first()

    # Verify Clerk ID matches expected historical Clerk ID
    if user.clerk_id != clean_clerk_id:
        raise ValidationError(
            f"SAFETY ABORT: Account with email '{clean_email}' has Clerk ID '{user.clerk_id}', "
            f"which does not match expected target Clerk ID '{clean_clerk_id}'. "
            "This account appears to be a newly registered or different account. "
            "Deletion aborted to protect new account data."
        )

    # Double-check user is not owner
    if user.is_owner or user.email.lower() == owner_email or user.clerk_id in owner_clerk_ids:
        raise PermissionDenied("SECURITY VIOLATION: Target user is the Platform Owner.")

    audit = audit_user_data_scope(user)

    if dry_run:
        return {
            'status': 'dry_run_preview',
            'matched_count': 1,
            'dry_run': True,
            'audits': [audit],
        }

    # Execute atomic deletion
    with transaction.atomic():
        uid = user.id
        u_email = user.email
        u_clerk = user.clerk_id

        # 1. Record deleted identity in RevokedClerkIdentity tombstone registry FIRST
        from accounts.models import RevokedClerkIdentity
        if u_clerk:
            RevokedClerkIdentity.objects.get_or_create(
                clerk_id=u_clerk,
                defaults={
                    'original_email': u_email,
                    'revocation_reason': 'account_deletion',
                }
            )

        # 2. Delete user and exclusively owned child records
        user.delete()
        logger.info(
            f"[KEYFLOW Deletion] Successfully deleted user id={uid}, email={u_email}, clerk_id={u_clerk}"
        )

        # 3. Post-condition check
        if User.objects.filter(id=uid).exists():
            raise RuntimeError(f"Deletion post-condition check failed: user {uid} still exists.")

        # 4. Ensure Owner integrity
        owner = User.objects.filter(email__iexact=owner_email).first()
        if not owner or not owner.is_owner:
            raise RuntimeError("CRITICAL ERROR: Platform Owner integrity was compromised during deletion!")

    return {
        'status': 'deleted',
        'matched_count': 1,
        'deleted_ids': [uid],
        'revoked_clerk_id': u_clerk,
        'dry_run': False,
        'audits': [audit],
    }
