"""
Django Management Command: reconcile_privileged_account
======================================================
Safely audits and reconciles unexpected privileged non-owner accounts that would
otherwise trigger Migration 0011 Precondition 4 aborts.

Safety Features:
1. Audit Mode (default with no arguments): Lists all unexpected privileged non-owner
   accounts in read-only mode without mutating the database.
2. Mandatory Three-Factor Target Identity Verification:
   When targeting an account, strictly requires ALL THREE identifiers:
   - --target-id <ID>
   - --target-email <EMAIL>
   - --clerk-id <CLERK_ID>
   All three must match the exact same database row; any mismatch or omission aborts.
3. Row-Level Concurrency Locking: Uses select_for_update() inside transaction.atomic()
   and repeats every identity and safety check immediately before mutation.
4. Absolute Owner Protection: Strictly refuses to demote the Platform Owner (sina44n07@gmail.com).
5. Legacy Account Protection: Strictly refuses to touch archived legacy accounts (*@archived.keyflow.local).
6. Preview by Default: Requires --confirm to apply changes; defaults to dry-run preview.
7. Audit Log Output: Displays before-and-after audit values of every modified field.
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from django.db.models import Q

User = get_user_model()


class Command(BaseCommand):
    help = 'Safely audit and reconcile unexpected privileged non-owner accounts before Migration 0011.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--target-id',
            type=int,
            default=None,
            help='Database user ID of the exact unexpected privileged account to reconcile.',
        )
        parser.add_argument(
            '--target-email',
            type=str,
            default=None,
            help='Email of the exact unexpected privileged account (must match user record).',
        )
        parser.add_argument(
            '--clerk-id',
            type=str,
            default=None,
            help='Mandatory Clerk ID of target user for complete identity verification.',
        )
        parser.add_argument(
            '--expected-clerk-id',
            type=str,
            default=None,
            help='Alias for --clerk-id for backward compatibility.',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm execution of single-account privilege demotion. If omitted, runs in preview mode.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Explicitly run in preview mode without modifying the database (default behavior).',
        )

    def handle(self, *args, **options):
        owner_email = getattr(settings, 'OWNER_EMAIL', 'sina44n07@gmail.com').strip().lower()
        owner_clerk_ids = set(getattr(settings, 'OWNER_CLERK_IDS', ['user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn']))

        target_id = options.get('target_id')
        target_email = options.get('target_email')
        clerk_id = options.get('clerk_id') or options.get('expected_clerk_id')
        is_confirmed = options.get('confirm', False) and not options.get('dry_run', False)

        has_any_target_arg = (target_id is not None) or (target_email is not None) or (clerk_id is not None)

        # -----------------------------------------------------------------------
        # MODE 1: Audit Scan (if no targeting arguments are specified)
        # -----------------------------------------------------------------------
        if not has_any_target_arg:
            self.stdout.write(self.style.NOTICE(
                "=== KEYFLOW PRIVILEGED ACCOUNT AUDIT (READ-ONLY) ===\n"
                f"Canonical Owner Email: {owner_email}\n"
                f"Configured Owner Clerk IDs: {sorted(list(owner_clerk_ids))}\n"
            ))

            unexpected = User.objects.exclude(email__iexact=owner_email).filter(
                Q(role__in=['SUPER_ADMIN', 'ADMIN']) | Q(is_staff=True) | Q(is_superuser=True)
            ).order_by('id')

            count = unexpected.count()
            if count == 0:
                self.stdout.write(self.style.SUCCESS(
                    "[OK] Zero unexpected privileged non-owner accounts detected.\n"
                    "Migration 0011 Precondition 4 will PASS without reconciliation."
                ))
                return

            self.stdout.write(self.style.WARNING(
                f"[WARNING] Detected {count} unexpected privileged non-owner account(s) that would "
                "trigger a Migration 0011 ValidationError abort:\n"
            ))

            for u in unexpected:
                self.stdout.write(
                    f"  - ID: {u.id} | Email: {u.email} | Username: {u.username} | "
                    f"Clerk ID: {u.clerk_id} | Role: {u.role} | "
                    f"is_staff={u.is_staff} | is_superuser={u.is_superuser}"
                )

            self.stdout.write(self.style.NOTICE(
                "\nTo safely reconcile a specific account, all 3 identifiers are mandatory:\n"
                "  python manage.py reconcile_privileged_account --target-id <ID> --target-email <EMAIL> --clerk-id <CLERK_ID> [--confirm]\n"
            ))
            return

        # -----------------------------------------------------------------------
        # MODE 2: Narrowly Scoped Target Reconciliation (Strict 3-Way Identity Match)
        # -----------------------------------------------------------------------
        # Check 1: Enforce presence of all three target identity fields
        missing_fields = []
        if target_id is None:
            missing_fields.append('--target-id')
        if not target_email:
            missing_fields.append('--target-email')
        if not clerk_id:
            missing_fields.append('--clerk-id')

        if missing_fields:
            raise CommandError(
                f"SAFETY ABORT: All three target identifiers (--target-id, --target-email, --clerk-id) "
                f"are strictly required to target an account. Missing: {', '.join(missing_fields)}."
            )

        clean_email = str(target_email).strip().lower()
        clean_clerk_id = str(clerk_id).strip()

        # Check 2: Owner Protection
        if clean_email == owner_email or clean_clerk_id in owner_clerk_ids:
            raise CommandError(f"SECURITY VIOLATION: Cannot demote the Platform Owner account ({owner_email}).")

        # Check 3: Legacy Account Protection
        if clean_email.endswith('@archived.keyflow.local') or clean_email == 'sinan.legacy1@archived.keyflow.local':
            raise CommandError("SECURITY VIOLATION: Archived legacy accounts are excluded from modification.")

        # Check 4: Locate exact target by ID
        target = User.objects.filter(id=target_id).first()
        if not target:
            raise CommandError(f"Target account with ID {target_id} does not exist.")

        # Check 5: Verify email matches target record
        if target.email.lower() != clean_email:
            raise CommandError(
                f"SAFETY MISMATCH: User ID {target_id} has email '{target.email}', "
                f"which does not match provided --target-email '{clean_email}'."
            )

        # Check 6: Verify target has a Clerk ID and it matches provided --clerk-id
        if not target.clerk_id:
            raise CommandError(
                f"SAFETY ABORT: User ID {target_id} ({target.email}) has no bound Clerk ID. "
                "Cannot perform cryptographic identity verification."
            )

        if target.clerk_id != clean_clerk_id:
            raise CommandError(
                f"SAFETY MISMATCH: User ID {target_id} has Clerk ID '{target.clerk_id}', "
                f"which does not match provided --clerk-id '{clean_clerk_id}'."
            )

        # Check 7: Verify target Clerk ID is not Owner Clerk ID
        if target.clerk_id in owner_clerk_ids:
            raise CommandError("SECURITY VIOLATION: Target account is bound to an authorized Owner Clerk ID.")

        self.stdout.write(self.style.NOTICE(
            f"=== TARGET PRIVILEGE RECONCILIATION ===\n"
            f"User ID: {target.id}\n"
            f"Username: {target.username}\n"
            f"Email: {target.email}\n"
            f"Clerk ID: {target.clerk_id}\n"
            f"Current Role: {target.role} -> New Role: USER\n"
            f"Current is_staff: {target.is_staff} -> New is_staff: False\n"
            f"Current is_superuser: {target.is_superuser} -> New is_superuser: False\n"
            f"Mode: {'CONFIRMED EXECUTION' if is_confirmed else 'PREVIEW ONLY (No changes will be made)'}\n"
        ))

        if not is_confirmed:
            self.stdout.write(self.style.SUCCESS(
                "[PREVIEW COMPLETE] Zero database rows were modified.\n"
                "Pass --confirm to execute the single-account privilege reconciliation."
            ))
            return

        # -----------------------------------------------------------------------
        # Confirmed Execution with Row-Level Lock & Pre-Mutation Re-Verification
        # -----------------------------------------------------------------------
        with transaction.atomic():
            # Acquire row-level lock on the target user
            locked_target = User.objects.select_for_update().filter(id=target_id).first()
            if not locked_target:
                raise CommandError(f"Target account with ID {target_id} disappeared during lock acquisition.")

            # Re-verify all identity fields on the locked row immediately before mutation
            if locked_target.email.lower() != clean_email:
                raise CommandError("SAFETY ABORT: Email changed concurrently during execution.")
            if locked_target.clerk_id != clean_clerk_id:
                raise CommandError("SAFETY ABORT: Clerk ID changed concurrently during execution.")
            if locked_target.email.lower() == owner_email or locked_target.clerk_id in owner_clerk_ids:
                raise CommandError("SECURITY VIOLATION: Target identified as Owner during locked execution.")

            old_state = {
                'role': locked_target.role,
                'is_staff': locked_target.is_staff,
                'is_superuser': locked_target.is_superuser,
            }

            locked_target.role = 'USER'
            locked_target.is_staff = False
            locked_target.is_superuser = False
            locked_target.save(update_fields=['role', 'is_staff', 'is_superuser'])

            # Verify post-condition
            locked_target.refresh_from_db()
            if locked_target.role != 'USER' or locked_target.is_staff or locked_target.is_superuser:
                raise CommandError("Reconciliation post-condition failed: Privileges were not correctly revoked.")

            # Verify Owner integrity
            owner = User.objects.filter(email__iexact=owner_email).first()
            if owner and (not owner.is_staff or not owner.is_superuser):
                raise CommandError("CRITICAL FAULT: Owner privileges were altered during reconciliation!")

        self.stdout.write(self.style.SUCCESS(
            f"[SUCCESS] Successfully reconciled user ID {target_id} ({locked_target.email}):\n"
            f"  - role: {old_state['role']} -> USER\n"
            f"  - is_staff: {old_state['is_staff']} -> False\n"
            f"  - is_superuser: {old_state['is_superuser']} -> False\n"
            "All other accounts remain untouched."
        ))
