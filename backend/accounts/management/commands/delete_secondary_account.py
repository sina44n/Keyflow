"""
Django Management Command: delete_secondary_account
==================================================
Auditable CLI command to safely preview and delete the secondary account
(muhammedsinankp2005@gmail.com / user_3LN4sX9cg3bUng1YzwiEB18Emh2).

Safety:
- Defaults to --dry-run unless --confirm is explicitly passed.
- Requires both --email and --clerk-id to match before deletion is permitted.
- Refuses deletion if the account's Clerk ID has changed (e.g. fresh re-registration).
- Strictly refuses to touch the Platform Owner account.
- Legacy accounts (sinan.legacy1@archived.keyflow.local) are excluded from deletion scope.
- Performs atomic database deletion with pre- and post-condition checks.
"""

from django.core.management.base import BaseCommand, CommandError
from accounts.services.account_deletion import safe_delete_account


class Command(BaseCommand):
    help = 'Safely preview and delete the secondary user account and its exclusively owned personal data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='muhammedsinankp2005@gmail.com',
            help='Target email to delete (default: muhammedsinankp2005@gmail.com)',
        )
        parser.add_argument(
            '--clerk-id',
            type=str,
            default='user_3LN4sX9cg3bUng1YzwiEB18Emh2',
            help='Target Clerk ID to delete (default: user_3LN4sX9cg3bUng1YzwiEB18Emh2)',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm execution of deletion. If omitted or combined with --dry-run, command runs in dry-run preview mode.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Explicitly run in dry-run preview mode (default behavior). Overrides --confirm.',
        )

    def handle(self, *args, **options):
        email = options['email']
        clerk_id = options['clerk_id']
        force_dry_run = options.get('dry_run', False)
        is_confirmed = options['confirm'] and not force_dry_run
        dry_run = not is_confirmed

        self.stdout.write(self.style.NOTICE(
            f"=== KEYFLOW ACCOUNT DELETION TOOL ===\n"
            f"Target Email: {email}\n"
            f"Target Clerk ID: {clerk_id}\n"
            f"Mode: {'CONFIRMED DELETION' if is_confirmed else 'DRY-RUN PREVIEW (No changes will be made)'}\n"
        ))

        try:
            result = safe_delete_account(
                target_email=email,
                expected_clerk_id=clerk_id,
                dry_run=dry_run,
            )
        except Exception as exc:
            raise CommandError(f"Account deletion failed safety check: {exc}")

        matched = result.get('matched_count', 0)
        self.stdout.write(f"Matched accounts count: {matched}")

        for audit in result.get('audits', []):
            self.stdout.write(self.style.WARNING(
                f"\n--- Account To Delete: ID {audit['user_id']} ({audit['username']}) ---"
            ))
            self.stdout.write(f"  Email: {audit['email']}")
            self.stdout.write(f"  Clerk ID: {audit['clerk_id']}")
            self.stdout.write(f"  Role: {audit['role']} (is_owner={audit['is_owner']})")
            self.stdout.write("  Exclusively owned records:")
            for k, v in audit['exclusively_owned'].items():
                if v > 0:
                    self.stdout.write(f"    - {k}: {v}")
            self.stdout.write("  Shared records preserved:")
            for k, v in audit['shared_references_preserved'].items():
                if v > 0:
                    self.stdout.write(f"    - {k}: {v}")

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                "\n[DRY RUN COMPLETE] Zero database rows were modified.\n"
                "Pass --confirm to execute permanent deletion."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\n[DELETION COMPLETE] Successfully purged account and exclusively owned records.\n"
                f"Deleted user IDs: {result.get('deleted_ids', [])}\n"
                f"Revoked Clerk ID Tombstone: {result.get('revoked_clerk_id')}"
            ))
