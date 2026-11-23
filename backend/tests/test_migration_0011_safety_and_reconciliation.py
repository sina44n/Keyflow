"""
KEYFLOW Phase 7.28: Migration 0011 Safety Preconditions & Targeted Privilege Reconciliation Tests
==================================================================================================
Covers:
1. Migration 0011 Preconditions (Scenarios A through G):
   - A. Canonical Owner correctly configured (succeeds, enforces fields).
   - B. Unexpected privileged non-owner exists (aborts with ValidationError).
   - C. Owner Clerk ID missing (aborts with ValidationError).
   - D. Owner Clerk ID incorrect / unverified (aborts with ValidationError).
   - E. Multiple unexpected privileged non-owner accounts exist (aborts with details).
   - F. Migration failure / rollback leaves database unchanged.
   - G. Rerunning migration after success is completely idempotent.
2. Narrowly Scoped Privilege Reconciliation Command:
   - Audit mode (zero mutations).
   - Dry-run preview mode (zero mutations).
   - Missing arguments safety abort.
   - Target ID / Email mismatch abort.
   - Owner demotion protection (refuses to demote Owner).
   - Legacy account protection (refuses to touch legacy archived accounts).
   - Successful targeted demotion of a single unexpected privileged account without affecting others.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.core.exceptions import ValidationError
from django.apps import apps

import importlib

from accounts.models import (
    ROLE_SUPER_ADMIN,
    ROLE_ADMIN,
    ROLE_USER,
    STATUS_ACTIVE,
    UserProfile,
    UserPreferences,
)

migration_0011 = importlib.import_module('accounts.migrations.0011_enforce_owner_isolation_and_demote_non_owners')
enforce_owner_isolation_and_demote_non_owners = migration_0011.enforce_owner_isolation_and_demote_non_owners

User = get_user_model()


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
)
class Migration0011SafetyPreconditionTests(TestCase):
    def setUp(self):
        User.objects.all().delete()

    # Scenario A: Canonical Owner exists and is correctly configured -> Migration passes
    def test_scenario_a_canonical_owner_passes_migration(self):
        owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_USER,  # Starts as user, migration promotes to SUPER_ADMIN
            is_staff=False,
            is_superuser=False,
        )
        # Normal non-privileged user exists alongside
        User.objects.create_user(
            email='student@example.com',
            username='student1',
            clerk_id='user_student_1',
            role=ROLE_USER,
            is_staff=False,
            is_superuser=False,
        )

        enforce_owner_isolation_and_demote_non_owners(apps, None)

        owner.refresh_from_db()
        self.assertEqual(owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(owner.is_staff)
        self.assertTrue(owner.is_superuser)
        self.assertEqual(owner.status, STATUS_ACTIVE)
        self.assertTrue(owner.is_active)
        self.assertTrue(owner.is_email_verified)

    # Scenario B: Unexpected privileged non-owner exists -> Aborts with ValidationError
    def test_scenario_b_unexpected_privileged_non_owner_aborts(self):
        User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
        )
        # Rogue / unexpected account with superuser flag
        User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinubai',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        with self.assertRaises(ValidationError) as ctx:
            enforce_owner_isolation_and_demote_non_owners(apps, None)
        self.assertIn('Unexpected privileged non-owner accounts detected', str(ctx.exception))

    # Scenario C: Owner Clerk ID is missing -> Aborts with ValidationError
    def test_scenario_c_owner_missing_clerk_id_aborts(self):
        User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id=None,  # Missing clerk_id
        )
        with self.assertRaises(ValidationError) as ctx:
            enforce_owner_isolation_and_demote_non_owners(apps, None)
        self.assertIn('missing its Clerk ID', str(ctx.exception))

    # Scenario D: Owner Clerk ID is incorrect -> Aborts with ValidationError
    def test_scenario_d_owner_incorrect_clerk_id_aborts(self):
        User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_wrong_unauthorized_id',
        )
        with self.assertRaises(ValidationError) as ctx:
            enforce_owner_isolation_and_demote_non_owners(apps, None)
        self.assertIn('unverified/conflicting Clerk ID', str(ctx.exception))

    # Scenario E: Multiple privileged non-owner accounts exist -> Aborts with details
    def test_scenario_e_multiple_privileged_non_owners_aborts(self):
        User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
        )
        User.objects.create_user(
            email='user1@example.com',
            username='user1',
            role=ROLE_ADMIN,
            is_staff=True,
        )
        User.objects.create_user(
            email='user2@example.com',
            username='user2',
            role=ROLE_USER,
            is_superuser=True,
        )
        with self.assertRaises(ValidationError) as ctx:
            enforce_owner_isolation_and_demote_non_owners(apps, None)
        err_msg = str(ctx.exception)
        self.assertIn('user1@example.com', err_msg)
        self.assertIn('user2@example.com', err_msg)

    # Scenario F: Interrupted or aborted migration leaves database unchanged
    def test_scenario_f_aborted_migration_leaves_database_unchanged(self):
        owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
        )
        owner.is_staff = False
        owner.is_superuser = False
        owner.is_email_verified = False
        owner.save(update_fields=['is_staff', 'is_superuser', 'is_email_verified'])

        # Create condition that triggers Precondition 4
        User.objects.create_user(
            email='privileged_intruder@example.com',
            username='intruder',
            role=ROLE_ADMIN,
            is_staff=True,
        )

        with self.assertRaises(ValidationError):
            enforce_owner_isolation_and_demote_non_owners(apps, None)

        # Owner must NOT have been modified by the aborted migration (remains unchanged)
        owner.refresh_from_db()
        self.assertFalse(owner.is_staff)
        self.assertFalse(owner.is_superuser)
        self.assertFalse(owner.is_email_verified)

    # Scenario G: Migration is rerun after successful completion (idempotence)
    def test_scenario_g_rerun_migration_is_idempotent(self):
        owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        # Run 1
        enforce_owner_isolation_and_demote_non_owners(apps, None)
        # Run 2
        enforce_owner_isolation_and_demote_non_owners(apps, None)
        # Run 3
        enforce_owner_isolation_and_demote_non_owners(apps, None)

        owner.refresh_from_db()
        self.assertEqual(owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(owner.is_staff)
        self.assertTrue(owner.is_superuser)


@override_settings(
    OWNER_EMAIL='sina44n07@gmail.com',
    OWNER_CLERK_IDS=['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn'],
)
class ReconcilePrivilegedAccountCommandTests(TestCase):
    def setUp(self):
        User.objects.all().delete()
        self.owner = User.objects.create_user(
            email='sina44n07@gmail.com',
            username='sinankp',
            clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.secondary = User.objects.create_user(
            email='muhammedsinankp2005@gmail.com',
            username='sinubai',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            role=ROLE_SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.legacy = User.objects.create_user(
            email='sinan.legacy1@archived.keyflow.local',
            username='sinan_legacy',
            role=ROLE_USER,
            is_staff=False,
            is_superuser=False,
        )
        self.other_admin = User.objects.create_user(
            email='legit_moderator@keyflow.app',
            username='moderator',
            role=ROLE_ADMIN,
            is_staff=True,
            is_superuser=False,
        )

    # 1. Audit mode with no target arguments lists privileged non-owner accounts without mutations
    def test_audit_mode_zero_mutations(self):
        call_command('reconcile_privileged_account')
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.secondary.is_staff)
        self.other_admin.refresh_from_db()
        self.assertEqual(self.other_admin.role, ROLE_ADMIN)

    # 2. Dry run preview of targeted reconciliation leaves target untouched
    def test_targeted_reconciliation_dry_run_preserves_target(self):
        call_command(
            'reconcile_privileged_account',
            target_id=self.secondary.id,
            target_email='muhammedsinankp2005@gmail.com',
            clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            dry_run=True
        )
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.secondary.is_staff)

    # 3. Missing any of the 3 target identity arguments raises CommandError
    def test_missing_identity_fields_raises_error(self):
        with self.assertRaises(CommandError) as ctx:
            call_command('reconcile_privileged_account', target_id=self.secondary.id)
        self.assertIn('All three target identifiers', str(ctx.exception))
        self.assertIn('--target-email', str(ctx.exception))
        self.assertIn('--clerk-id', str(ctx.exception))

    # 3b. Missing clerk-id specifically raises CommandError
    def test_missing_clerk_id_raises_error(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=self.secondary.id,
                target_email='muhammedsinankp2005@gmail.com',
            )
        self.assertIn('Missing: --clerk-id', str(ctx.exception))

    # 4. Target ID / Email mismatch aborts
    def test_id_and_email_mismatch_aborts(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=self.secondary.id,
                target_email='wrong_email@example.com',
                clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
                confirm=True
            )
        self.assertIn('SAFETY MISMATCH', str(ctx.exception))
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_SUPER_ADMIN)

    # 4b. Target Clerk ID mismatch aborts
    def test_clerk_id_mismatch_aborts(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=self.secondary.id,
                target_email='muhammedsinankp2005@gmail.com',
                clerk_id='user_wrong_different_clerk_id',
                confirm=True
            )
        self.assertIn('SAFETY MISMATCH', str(ctx.exception))
        self.assertIn('does not match provided --clerk-id', str(ctx.exception))
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_SUPER_ADMIN)

    # 4c. Target account without bound Clerk ID aborts
    def test_target_without_clerk_id_aborts(self):
        no_clerk_user = User.objects.create_user(
            email='no_clerk@example.com',
            username='noclerk',
            role=ROLE_ADMIN,
            is_staff=True,
        )
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=no_clerk_user.id,
                target_email='no_clerk@example.com',
                clerk_id='user_placeholder_clerk',
                confirm=True
            )
        self.assertIn('has no bound Clerk ID', str(ctx.exception))

    # 5. Owner demotion is strictly rejected
    def test_owner_demotion_rejected(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=self.owner.id,
                target_email='sina44n07@gmail.com',
                clerk_id='user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
                confirm=True
            )
        self.assertIn('Cannot demote the Platform Owner', str(ctx.exception))
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.is_staff)
        self.assertTrue(self.owner.is_superuser)

    # 6. Legacy archived account modification is strictly rejected
    def test_legacy_account_demotion_rejected(self):
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'reconcile_privileged_account',
                target_id=self.legacy.id,
                target_email='sinan.legacy1@archived.keyflow.local',
                clerk_id='user_legacy_1',
                confirm=True
            )
        self.assertIn('Archived legacy accounts are excluded', str(ctx.exception))

    # 7. Successful targeted reconciliation demotes ONLY target, leaving others untouched
    def test_targeted_reconciliation_success_isolates_change(self):
        call_command(
            'reconcile_privileged_account',
            target_id=self.secondary.id,
            target_email='muhammedsinankp2005@gmail.com',
            expected_clerk_id='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            confirm=True
        )

        # 1. Target was demoted
        self.secondary.refresh_from_db()
        self.assertEqual(self.secondary.role, ROLE_USER)
        self.assertFalse(self.secondary.is_staff)
        self.assertFalse(self.secondary.is_superuser)

        # 2. Owner remained intact
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, ROLE_SUPER_ADMIN)
        self.assertTrue(self.owner.is_staff)
        self.assertTrue(self.owner.is_superuser)

        # 3. Other administrator was completely untouched (NOT blanket demoted!)
        self.other_admin.refresh_from_db()
        self.assertEqual(self.other_admin.role, ROLE_ADMIN)
        self.assertTrue(self.other_admin.is_staff)
