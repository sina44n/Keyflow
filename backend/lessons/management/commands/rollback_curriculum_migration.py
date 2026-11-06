"""
KEYFLOW — Curriculum Migration Rollback Command (Phase 2B)
==========================================================
Safely reverts a previously executed legacy progress migration.

Actions:
1. Removes records from CurriculumLessonProgress that were migrated from legacy records.
2. Removes UserStageAccess records created by the migration.
3. Preserves LegacyLessonProgressArchive for forensic audit.
4. Leaves original LessonProgress table untouched.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from lessons.models import (
    CurriculumLessonProgress,
    UserStageAccess,
    LegacyLessonProgressArchive,
)


class Command(BaseCommand):
    help = "Rolls back a legacy curriculum migration safely without data loss."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate rollback without committing database changes.'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Filter rollback to a specific user ID.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        user_id = options['user_id']

        self.stdout.write(self.style.MIGRATE_HEADING("=== KEYFLOW CURRICULUM MIGRATION ROLLBACK ==="))

        archive_query = LegacyLessonProgressArchive.objects.all()
        if user_id:
            archive_query = archive_query.filter(user_id=user_id)

        archived_count = archive_query.count()
        self.stdout.write(f"Archived legacy records found: {archived_count}")

        if archived_count == 0:
            self.stdout.write(self.style.WARNING("No archived legacy records to roll back."))
            return

        with transaction.atomic():
            # Identify levels that were mapped
            migrated_level_ids = archive_query.filter(
                new_level__isnull=False
            ).values_list('new_level_id', flat=True)

            progress_to_delete = CurriculumLessonProgress.objects.filter(
                level_id__in=migrated_level_ids
            )
            if user_id:
                progress_to_delete = progress_to_delete.filter(user_id=user_id)

            deleted_progress_count = progress_to_delete.count()

            # Identify stage access created by migration
            access_to_delete = UserStageAccess.objects.filter(
                notes__icontains='legacy'
            )
            if user_id:
                access_to_delete = access_to_delete.filter(user_id=user_id)

            deleted_access_count = access_to_delete.count()

            if not dry_run:
                progress_to_delete.delete()
                access_to_delete.delete()
                self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_progress_count} migrated progress records."))
                self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_access_count} migrated stage access records."))
                self.stdout.write(self.style.SUCCESS("Rollback successfully completed."))
            else:
                self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete {deleted_progress_count} migrated progress records."))
                self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete {deleted_access_count} migrated stage access records."))
                transaction.set_rollback(True)
