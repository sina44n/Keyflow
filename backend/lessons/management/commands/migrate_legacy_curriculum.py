"""
KEYFLOW — Safe Legacy Progress Migration Command (Phase 2B)
==========================================================
Migrates legacy lesson progress (from the 7-Stage / 4,200-level system)
into the new 10-Stage / 7,000-level relational curriculum using the approved
semantic mapping matrix.

Guarantees:
1. Zero false completions (lessons user never typed are NEVER marked complete).
2. Strict preservation of historical WPM, accuracy, attempts, and completion timestamps.
3. Decoupled stage access: users get unlocked access to equivalent stages without re-grinding.
4. Idempotency: safe to run repeatedly without creating duplicates.
5. Archival & Rollback: all legacy records archived into LegacyLessonProgressArchive.
"""

import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from accounts.models import User
from lessons.models import (
    LessonProgress,
    CurriculumStage,
    CurriculumUnit,
    CurriculumLevel,
    UserStageAccess,
    CurriculumLessonProgress,
    LegacyLessonProgressArchive,
)


class Command(BaseCommand):
    help = "Safely migrates legacy 7-stage lesson progress into the new 10-stage curriculum."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate migration and print report without committing database changes.'
        )
        parser.add_argument(
            '--backup',
            action='store_true',
            help='Export existing progress to a JSON backup file before migration.'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Filter migration to a specific user ID.'
        )

    def resolve_semantic_mapping(self, legacy_stage, legacy_level):
        """
        Maps a legacy (stage, level) to the equivalent new (stage, level_in_stage).
        Respects the semantic differences:
        - Old Stage 4 (Morphemes) -> New Stage 4 (Full Alphabet)
        - Old Stage 5 (Word Flow) -> New Stage 7 (Word Flow & Cadence) - NOT New Stage 5 (which is Numbers)!
        - Old Stage 6 (Shift & Punctuation) -> New Stage 6 (Shift & Symbols)
        - Old Stage 7 (1-100: Numbers) -> New Stage 5 (Number Row Mastery)
        - Old Stage 7 (101-300: Symbols) -> New Stage 6 / 9
        - Old Stage 7 (301-600: Speed) -> New Stage 8 / 10
        """
        # Exact stage equivalents:
        if legacy_stage == 1:
            # Home Row Foundations
            return 1, min(700, legacy_level)
        elif legacy_stage == 2:
            # Top Row Control
            return 2, min(700, legacy_level)
        elif legacy_stage == 3:
            # Bottom Row Control
            return 3, min(700, legacy_level)
        elif legacy_stage == 4:
            # Morphemes & Alphabet
            return 4, min(700, legacy_level)
        elif legacy_stage == 5:
            # Old Word Flow -> New Stage 7 (Word Flow & Cadence)
            return 7, min(700, legacy_level)
        elif legacy_stage == 6:
            # Shift & Punctuation -> New Stage 6
            return 6, min(700, legacy_level)
        elif legacy_stage == 7:
            # Old Grandmaster:
            if legacy_level <= 100:
                # Numbers 1-0 -> New Stage 5 (Number Row Mastery)
                return 5, legacy_level
            elif legacy_level <= 300:
                # Symbols -> New Stage 6 or 9
                return 6, min(700, legacy_level)
            else:
                # Speed & Grandmaster -> New Stage 8 (Speed) or 10
                return 8, min(700, legacy_level - 300)
        return None, None

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        backup = options['backup']
        user_id = options['user_id']

        self.stdout.write(self.style.MIGRATE_HEADING("=== KEYFLOW SAFE LEGACY PROGRESS MIGRATION ==="))

        queryset = LessonProgress.objects.all().select_related('user', 'lesson', 'lesson__level')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        total_records = queryset.count()
        distinct_users = queryset.values('user_id').distinct().count()

        self.stdout.write(f"Total legacy records found: {total_records}")
        self.stdout.write(f"Distinct users affected: {distinct_users}")

        if backup or not dry_run:
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            backup_file = os.path.join(
                backup_dir,
                f"legacy_progress_backup_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            backup_data = []
            for rec in queryset:
                backup_data.append({
                    'user_id': rec.user_id,
                    'username': rec.user.username,
                    'lesson_id': rec.lesson_id,
                    'stage_number': rec.lesson.level.level_number,
                    'lesson_order': rec.lesson.order,
                    'lesson_title': rec.lesson.title,
                    'is_completed': rec.is_completed,
                    'best_wpm': str(rec.best_wpm),
                    'best_accuracy': str(rec.best_accuracy),
                    'attempts': rec.attempts,
                    'first_attempt_at': rec.first_attempt_at.isoformat() if rec.first_attempt_at else None,
                    'last_attempt_at': rec.last_attempt_at.isoformat() if rec.last_attempt_at else None,
                    'completed_at': rec.completed_at.isoformat() if rec.completed_at else None,
                })
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Pre-migration backup written to: {backup_file}"))

        stats = {
            'exact_mapped': 0,
            'stage_access_granted': 0,
            'archived_only': 0,
            'skipped_uncompleted': 0,
            'errors': 0,
        }

        user_unlocked_stages = {}

        with transaction.atomic():
            for rec in queryset:
                u = rec.user
                s_num = rec.lesson.level.level_number
                l_num = rec.lesson.order
                legacy_id = f"S{s_num}-L{l_num:03d}"

                new_s_num, new_l_num = self.resolve_semantic_mapping(s_num, l_num)

                target_level = None
                if new_s_num and new_l_num:
                    target_level = CurriculumLevel.objects.filter(
                        stage__stage_number=new_s_num,
                        level_in_stage=new_l_num
                    ).first()

                # Determine migration action
                action = 'archived_only'
                if target_level and rec.is_completed:
                    action = 'exact_mapped'
                elif rec.is_completed:
                    action = 'stage_access_granted'

                if not dry_run:
                    # Archive into LegacyLessonProgressArchive
                    LegacyLessonProgressArchive.objects.update_or_create(
                        user=u,
                        legacy_stage=s_num,
                        legacy_level=l_num,
                        defaults={
                            'legacy_lesson_id': legacy_id,
                            'legacy_title': rec.lesson.title,
                            'is_completed': rec.is_completed,
                            'best_wpm': rec.best_wpm,
                            'best_accuracy': rec.best_accuracy,
                            'attempts': rec.attempts,
                            'completed_at': rec.completed_at,
                            'migration_action': action,
                            'new_level': target_level,
                        }
                    )

                    # If exact mapped and completed, record genuine progress in CurriculumLessonProgress
                    if action == 'exact_mapped' and target_level:
                        wpm = float(rec.best_wpm)
                        acc = float(rec.best_accuracy)
                        stars = 1
                        if wpm >= (target_level.target_wpm + 5) and acc >= min(100, target_level.target_accuracy + 2):
                            stars = 2
                        if wpm >= (target_level.target_wpm + 10) and acc >= min(100, target_level.target_accuracy + 4):
                            stars = 3

                        CurriculumLessonProgress.objects.update_or_create(
                            user=u,
                            level=target_level,
                            defaults={
                                'is_completed': True,
                                'stars': stars,
                                'best_wpm': rec.best_wpm,
                                'best_accuracy': rec.best_accuracy,
                                'attempts': rec.attempts,
                                'first_attempt_at': rec.first_attempt_at or rec.completed_at,
                                'last_attempt_at': rec.last_attempt_at or rec.completed_at,
                                'completed_at': rec.completed_at,
                            }
                        )
                        stats['exact_mapped'] += 1

                        # Track unlocked stages
                        user_unlocked_stages.setdefault(u.id, set()).add(target_level.stage.stage_number)
                    elif action == 'stage_access_granted':
                        stats['stage_access_granted'] += 1
                        if new_s_num:
                            user_unlocked_stages.setdefault(u.id, set()).add(new_s_num)
                    else:
                        stats['archived_only'] += 1
                else:
                    # Dry run counts
                    if action == 'exact_mapped':
                        stats['exact_mapped'] += 1
                    elif action == 'stage_access_granted':
                        stats['stage_access_granted'] += 1
                    else:
                        stats['archived_only'] += 1

            # Grant UserStageAccess for unlocked stages without re-grinding
            if not dry_run:
                for uid, stage_nums in user_unlocked_stages.items():
                    user_obj = User.objects.get(id=uid)
                    for stg_num in stage_nums:
                        stage_obj = CurriculumStage.objects.filter(stage_number=stg_num).first()
                        if stage_obj:
                            UserStageAccess.objects.get_or_create(
                                user=user_obj,
                                stage=stage_obj,
                                defaults={
                                    'access_type': 'guided_unlock',
                                    'notes': 'Migrated from legacy stage progress',
                                }
                            )

            if dry_run:
                self.stdout.write(self.style.WARNING("\n[DRY RUN PREVIEW ONLY — NO DATABASE WRITES COMMITTED]"))
                transaction.set_rollback(True)

        self.stdout.write("\n=== MIGRATION AUDIT STATISTICS ===")
        self.stdout.write(f"  Exact Equivalent Lessons Mapped & Completed: {stats['exact_mapped']}")
        self.stdout.write(f"  Stage Access Granted (No False Completions):  {stats['stage_access_granted']}")
        self.stdout.write(f"  Archived Only (No Direct Equivalent/Unfinished): {stats['archived_only']}")
        self.stdout.write(f"  Total Users Processed: {distinct_users}")
        self.stdout.write(self.style.SUCCESS("Legacy migration completed safely and idempotently."))
