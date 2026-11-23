"""
KEYFLOW Migration 0011: Strict Platform Owner Enforcement & Identity Fail-Closed Gate
=====================================================================================
Enforces that only the verified Platform Owner (sina44n07@gmail.com with verified
Clerk ID user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn) holds administrative privileges.

Strict Preconditions (Evaluated inside an atomic transaction BEFORE any mutation):
1. Exactly ONE canonical Owner account (sina44n07@gmail.com) must exist.
   - 0 matches: Aborts with ValidationError.
   - >1 matches: Aborts with ValidationError.
2. The canonical Owner record must already have its verified Clerk ID bound.
   - Missing clerk_id: Aborts with ValidationError (never auto-assigns or guesses).
   - Conflicting clerk_id: Aborts with ValidationError.
3. No non-owner account may be bound to an Owner Clerk ID.
   - Any conflict: Aborts with ValidationError.
4. No unexpected privileged non-owner accounts may exist.
   - If any non-owner holds SUPER_ADMIN, ADMIN, is_staff, or is_superuser:
     Aborts with ValidationError to prevent silent global account mutations.

Reversibility:
- This migration is strictly irreversible via migrate reverse.
- Recovery must follow the documented pre-migration database backup and restore procedure.
"""

from django.db import migrations, transaction
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.db.migrations.exceptions import IrreversibleError
from django.conf import settings

DEFAULT_OWNER_EMAIL = 'sina44n07@gmail.com'
DEFAULT_OWNER_CLERK_IDS = {'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'}


def enforce_owner_isolation_and_demote_non_owners(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    owner_email = getattr(settings, 'OWNER_EMAIL', DEFAULT_OWNER_EMAIL).strip().lower()
    configured_ids = getattr(settings, 'OWNER_CLERK_IDS', None)
    if configured_ids:
        owner_clerk_ids = set(configured_ids)
    else:
        owner_clerk_ids = set(DEFAULT_OWNER_CLERK_IDS)

    with transaction.atomic():
        # If the database is completely empty (e.g. test runner creating fresh schema before test seeding),
        # there are no accounts to evaluate or demote.
        if not User.objects.exists():
            return

        # Precondition 1: Verify exactly one canonical Owner record exists
        owner_matches = User.objects.filter(email__iexact=owner_email)
        owner_count = owner_matches.count()
        if owner_count == 0:
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Canonical Owner account ({owner_email}) not found. "
                "Exactly one canonical Owner account must exist before this migration can run."
            )
        if owner_count > 1:
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Multiple owner records detected ({owner_count}) for {owner_email}."
            )

        owner = owner_matches.first()

        # Precondition 2: Check for conflicting clerk_id on a non-owner record
        conflicting_clerk_users = User.objects.filter(
            clerk_id__in=owner_clerk_ids
        ).exclude(email__iexact=owner_email)
        if conflicting_clerk_users.exists():
            conflicts = list(conflicting_clerk_users.values_list('id', 'email', 'clerk_id'))
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Non-owner account bound to Owner Clerk ID: {conflicts}."
            )

        # Precondition 3: Verify Owner Clerk identity
        if not owner.clerk_id:
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Canonical Owner record ({owner_email}) is missing its Clerk ID. "
                "Cannot automatically assign or guess Clerk ID. Verified Clerk identity must be linked before running migration."
            )
        if owner.clerk_id not in owner_clerk_ids:
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Owner record ({owner_email}) has unverified/conflicting Clerk ID '{owner.clerk_id}'. "
                f"Expected one of: {sorted(list(owner_clerk_ids))}."
            )

        # Precondition 4: Check for unexpected privileged non-owner accounts
        unexpected_privileged = User.objects.exclude(email__iexact=owner_email).filter(
            Q(role__in=['SUPER_ADMIN', 'ADMIN']) | Q(is_staff=True) | Q(is_superuser=True)
        )
        if unexpected_privileged.exists():
            details = list(unexpected_privileged.values_list('id', 'email', 'username', 'role', 'is_staff', 'is_superuser'))
            raise ValidationError(
                f"MIGRATION 0011 ABORTED: Unexpected privileged non-owner accounts detected: {details}. "
                "Broad automatic demotion is disabled. Manual administrative audit and reconciliation required."
            )

        # All preconditions satisfied -> Enforce canonical Owner state
        owner.role = 'SUPER_ADMIN'
        owner.is_staff = True
        owner.is_superuser = True
        owner.status = 'ACTIVE'
        owner.is_active = True
        owner.is_email_verified = True
        owner.save(update_fields=[
            'role', 'is_staff', 'is_superuser', 'status',
            'is_active', 'is_email_verified'
        ])


def reverse_migration(apps, schema_editor):
    raise IrreversibleError(
        "MIGRATION 0011 IS IRREVERSIBLE: Owner privilege enforcement cannot be automatically "
        "reversed without restoring from a verified database snapshot taken prior to migration execution."
    )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_userprofile_continent'),
    ]

    operations = [
        migrations.RunPython(enforce_owner_isolation_and_demote_non_owners, reverse_migration),
    ]
