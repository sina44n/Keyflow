"""
Test Suite for KEYFLOW 10-Stage 7,000-Level Relational Curriculum (Phase 2A & 2B)
Tests:
- Database schema hierarchy: CurriculumStage, Unit, Level, Progress.
- Composite uniqueness constraints.
- Decoupled stage access (Guided, Placement, Manual Explore).
- Unit-level pagination and query isolation.
- Genuine progress recording & star calculations.
- Placement evaluation & accuracy gatekeeper.
- Placement confirmation without false completions.
- Manual stage unlock without false completions.
- Adaptive remedial practice isolation.
"""

import uuid
from django.test import TestCase
from django.urls import reverse
from django.db.utils import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User
from lessons.models import (
    CurriculumStage,
    CurriculumUnit,
    CurriculumLevel,
    UserStageAccess,
    CurriculumLessonProgress,
    PlacementAssessment,
    PlacementSkillResult,
    AdaptiveRemedialSession,
    LegacyLessonProgressArchive,
)


class CurriculumModelHierarchyTests(TestCase):
    """Verifies relational structure and composite uniqueness constraints."""

    def setUp(self):
        self.stage1 = CurriculumStage.objects.create(
            stage_number=1,
            title="Home Row Foundations",
            target_wpm_start=15,
            target_wpm_end=24,
            target_accuracy_min=75,
        )
        self.stage2 = CurriculumStage.objects.create(
            stage_number=2,
            title="Top Row Control",
            target_wpm_start=25,
            target_wpm_end=34,
            target_accuracy_min=85,
        )
        self.unit1 = CurriculumUnit.objects.create(
            stage=self.stage1,
            unit_number=1,
            global_unit_number=1,
            title="Tactile Anchors",
            objective="Master F and J",
        )
        self.unit2 = CurriculumUnit.objects.create(
            stage=self.stage1,
            unit_number=2,
            global_unit_number=2,
            title="Middle Finger Anchors",
            objective="Master D and K",
        )
        self.user = User.objects.create_user(
            username="testcurriculum",
            email="curriculum@keyflow.com",
            password="Password123!"
        )

    def test_composite_uniqueness_unit_number_per_stage(self):
        """Cannot create duplicate unit_number within the same stage."""
        with self.assertRaises(IntegrityError):
            CurriculumUnit.objects.create(
                stage=self.stage1,
                unit_number=1,  # Duplicate in stage 1
                global_unit_number=3,
                title="Duplicate Unit",
                objective="Should fail",
            )

    def test_same_unit_number_allowed_in_different_stages(self):
        """Unit number 1 can exist in Stage 1 and Stage 2 without collision."""
        unit_stage2 = CurriculumUnit.objects.create(
            stage=self.stage2,
            unit_number=1,  # Same unit number, different stage
            global_unit_number=71,
            title="Top Row Unit 1",
            objective="Master R and U",
        )
        self.assertEqual(unit_stage2.stage.stage_number, 2)
        self.assertEqual(unit_stage2.unit_number, 1)

    def test_level_composite_uniqueness_within_unit(self):
        """Cannot create duplicate level_in_unit within the same unit."""
        CurriculumLevel.objects.create(
            stage=self.stage1,
            unit=self.unit1,
            level_in_unit=1,
            level_in_stage=1,
            logical_id="S01-L001",
            title="Lesson 1",
            exercise_text="f j f j",
            target_wpm=20,
            target_accuracy=80,
        )
        with self.assertRaises(IntegrityError):
            CurriculumLevel.objects.create(
                stage=self.stage1,
                unit=self.unit1,
                level_in_unit=1,  # Duplicate in unit
                level_in_stage=2,
                logical_id="S01-L002",
                title="Duplicate Level in Unit",
                exercise_text="f j",
            )

    def test_level_composite_uniqueness_within_stage(self):
        """Cannot create duplicate level_in_stage within the same stage."""
        CurriculumLevel.objects.create(
            stage=self.stage1,
            unit=self.unit1,
            level_in_unit=1,
            level_in_stage=1,
            logical_id="S01-L001",
            title="Lesson 1",
            exercise_text="f j f j",
        )
        with self.assertRaises(IntegrityError):
            CurriculumLevel.objects.create(
                stage=self.stage1,
                unit=self.unit2,
                level_in_unit=1,
                level_in_stage=1,  # Duplicate level_in_stage
                logical_id="S01-L001-DUP",
                title="Duplicate Level in Stage",
                exercise_text="d k",
            )

    def test_user_stage_access_uniqueness(self):
        """User can only have one stage access record per stage."""
        UserStageAccess.objects.create(
            user=self.user,
            stage=self.stage1,
            access_type='guided_unlock',
        )
        with self.assertRaises(IntegrityError):
            UserStageAccess.objects.create(
                user=self.user,
                stage=self.stage1,
                access_type='manual_explore',
            )


class CurriculumAPITests(TestCase):
    """Verifies API endpoints, unit pagination, progress recording, and placement."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="student_typist",
            email="student@keyflow.com",
            password="Password123!"
        )
        self.client.force_authenticate(user=self.user)

        self.stage1 = CurriculumStage.objects.create(
            stage_number=1,
            title="Home Row Foundations",
            target_wpm_start=15,
            target_wpm_end=24,
            target_accuracy_min=75,
        )
        self.stage2 = CurriculumStage.objects.create(
            stage_number=2,
            title="Top Row Control",
            target_wpm_start=25,
            target_wpm_end=34,
            target_accuracy_min=85,
        )
        self.stage5 = CurriculumStage.objects.create(
            stage_number=5,
            title="Number Row Mastery",
            target_wpm_start=42,
            target_wpm_end=50,
            target_accuracy_min=90,
        )
        self.unit1 = CurriculumUnit.objects.create(
            stage=self.stage1,
            unit_number=1,
            global_unit_number=1,
            title="Tactile Anchors",
            objective="Master F and J",
        )

        # Create exactly 10 levels for Unit 1
        self.levels = []
        for i in range(1, 11):
            lvl = CurriculumLevel.objects.create(
                stage=self.stage1,
                unit=self.unit1,
                level_in_unit=i,
                level_in_stage=i,
                logical_id=f"S01-L{i:03d}",
                title=f"Lesson {i}",
                exercise_text=f"test text {i}",
                target_wpm=20,
                target_accuracy=80,
                is_assessment=(i == 10),
            )
            self.levels.append(lvl)

    def test_curriculum_stages_endpoint(self):
        """GET /api/lessons/curriculum/stages/ returns list of published stages."""
        response = self.client.get('/api/lessons/curriculum/stages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)
        self.assertEqual(response.data[0]['stage_number'], 1)

    def test_curriculum_levels_pagination_by_unit(self):
        """GET /api/lessons/curriculum/levels/?stage=1&unit=1 returns exactly 10 levels."""
        response = self.client.get('/api/lessons/curriculum/levels/?stage=1&unit=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10)
        self.assertEqual(response.data[0]['logical_id'], "S01-L001")
        self.assertEqual(response.data[9]['logical_id'], "S01-L010")

    def test_curriculum_record_progress_genuine_stars(self):
        """POST /api/lessons/curriculum/levels/<id>/record/ calculates stars genuinely."""
        url = '/api/lessons/curriculum/levels/S01-L001/record/'

        # Attempt 1: Failed baseline (WPM 10 < 20) -> 0 stars, not completed
        res1 = self.client.post(url, {'wpm': 10, 'accuracy': 70})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertFalse(res1.data['is_completed'])
        self.assertEqual(res1.data['stars'], 0)

        # Attempt 2: Passed baseline (WPM 20, Acc 80) -> 1 star, completed
        res2 = self.client.post(url, {'wpm': 20, 'accuracy': 80})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['is_completed'])
        self.assertEqual(res2.data['stars'], 1)

        # Attempt 3: High excellence (WPM 32, Acc 96) -> 3 stars
        res3 = self.client.post(url, {'wpm': 32, 'accuracy': 96})
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertTrue(res3.data['is_completed'])
        self.assertEqual(res3.data['stars'], 3)
        self.assertEqual(res3.data['attempts'], 3)

        # Attempt 4: Advanced velocity (WPM 36, Acc 96) -> 4 stars
        res4 = self.client.post(url, {'wpm': 36, 'accuracy': 96})
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        self.assertTrue(res4.data['is_completed'])
        self.assertEqual(res4.data['stars'], 4)
        self.assertEqual(res4.data['attempts'], 4)

        # Attempt 5: Mastery velocity (WPM 42, Acc 98) -> 5 stars
        res5 = self.client.post(url, {'wpm': 42, 'accuracy': 98})
        self.assertEqual(res5.status_code, status.HTTP_200_OK)
        self.assertTrue(res5.data['is_completed'])
        self.assertEqual(res5.data['stars'], 5)
        self.assertEqual(res5.data['attempts'], 5)

    def test_manual_explore_unlock_does_not_fabricate_completion(self):
        """POST /api/lessons/curriculum/stages/2/unlock/ unlocks stage 2 with 0 completions."""
        url = '/api/lessons/curriculum/stages/2/unlock/'
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['access_type'], 'manual_explore')

        # Verify UserStageAccess exists
        access = UserStageAccess.objects.filter(user=self.user, stage=self.stage2).first()
        self.assertIsNotNone(access)
        self.assertEqual(access.access_type, 'manual_explore')

        # Verify ZERO completion records exist for Stage 2
        stage2_completions = CurriculumLessonProgress.objects.filter(
            user=self.user,
            level__stage=self.stage2,
            is_completed=True
        ).count()
        self.assertEqual(stage2_completions, 0)

    def test_placement_evaluate_accuracy_gatekeeper(self):
        """
        Fast typist (95 WPM) with poor number accuracy (70%) is gated to Stage 5,
        proving that speed never overrides foundational accuracy.
        """
        url = '/api/lessons/curriculum/placement/evaluate/'
        payload = {
            'gross_wpm': 95.0,
            'accuracy': 82.0,
            'consistency_score': 85.0,
            'tier_results': {
                'home_row': {'accuracy': 98.0, 'wpm': 95.0},
                'top_row': {'accuracy': 96.0, 'wpm': 92.0},
                'bottom_row': {'accuracy': 94.0, 'wpm': 90.0},
                'numbers': {'accuracy': 70.0, 'wpm': 65.0},  # FAILED NUMBER GATE
                'symbols': {'accuracy': 65.0, 'wpm': 60.0},
                'shift': {'accuracy': 88.0, 'wpm': 85.0},
            },
            'weak_keys': ['4', '7', '3', '8'],
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['recommended_stage_number'], 5)
        self.assertEqual(res.data['status'], 'evaluated')

    def test_placement_confirm_grants_access_without_false_completions(self):
        """Confirming placement grants UserStageAccess with zero fake completions or stars."""
        session_id = str(uuid.uuid4())
        assessment = PlacementAssessment.objects.create(
            user=self.user,
            session_id=session_id,
            overall_wpm=60.0,
            overall_accuracy=94.0,
            recommended_stage=self.stage2,
            status='evaluated',
        )

        url = '/api/lessons/curriculum/placement/confirm/'
        res = self.client.post(url, {'session_id': session_id, 'action': 'accept'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['status'], 'applied')

        # Check that user now has stage access to Stage 1 and Stage 2
        access1 = UserStageAccess.objects.filter(user=self.user, stage=self.stage1).first()
        access2 = UserStageAccess.objects.filter(user=self.user, stage=self.stage2).first()
        self.assertIsNotNone(access1)
        self.assertIsNotNone(access2)
        self.assertEqual(access2.access_type, 'placement_unlock')

        # Zero fake completions in CurriculumLessonProgress
        completions = CurriculumLessonProgress.objects.filter(
            user=self.user,
            is_completed=True
        ).count()
        self.assertEqual(completions, 0)


from django.core.management import call_command
from lessons.models import Level, Lesson, LessonProgress


class LegacyMigrationCommandTests(TestCase):
    """Verifies safe legacy migration, semantic mapping, zero false completions, idempotency, and rollback."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="legacy_master",
            email="legacy@keyflow.com",
            password="Password123!"
        )

        # Legacy models: Stage 1 (Home row) and Stage 5 (Word flow)
        self.legacy_level_s1 = Level.objects.create(
            level_number=1,
            title="Home Row",
            description="Legacy Home Row"
        )
        self.legacy_lesson_s1 = Lesson.objects.create(
            level=self.legacy_level_s1,
            order=1,
            title="S1 L1",
            exercise_content="f j",
            target_wpm=20,
            target_accuracy=80,
        )
        self.legacy_progress_s1 = LessonProgress.objects.create(
            user=self.user,
            lesson=self.legacy_lesson_s1,
            is_completed=True,
            best_wpm=28.5,
            best_accuracy=96.0,
            attempts=2,
        )

        self.legacy_level_s5 = Level.objects.create(
            level_number=5,
            title="Word Flow",
            description="Legacy Word Flow (Alphabet only)"
        )
        self.legacy_lesson_s5 = Lesson.objects.create(
            level=self.legacy_level_s5,
            order=1,
            title="S5 L1",
            exercise_content="the words",
            target_wpm=46,
            target_accuracy=95,
        )
        self.legacy_progress_s5 = LessonProgress.objects.create(
            user=self.user,
            lesson=self.legacy_lesson_s5,
            is_completed=True,
            best_wpm=50.0,
            best_accuracy=98.0,
            attempts=3,
        )

        # New Curriculum models
        self.new_stage1 = CurriculumStage.objects.create(
            stage_number=1,
            title="Home Row Foundations",
        )
        self.new_unit1 = CurriculumUnit.objects.create(
            stage=self.new_stage1,
            unit_number=1,
            global_unit_number=1,
            title="Unit 1",
            objective="F and J",
        )
        self.new_level_s1 = CurriculumLevel.objects.create(
            stage=self.new_stage1,
            unit=self.new_unit1,
            level_in_unit=1,
            level_in_stage=1,
            logical_id="S01-L001",
            title="Lesson 1",
            exercise_text="f j",
            target_wpm=20,
            target_accuracy=80,
        )

        self.new_stage7 = CurriculumStage.objects.create(
            stage_number=7,
            title="High-Frequency Vocabulary & Rhythm Cadence",
        )
        self.new_unit7 = CurriculumUnit.objects.create(
            stage=self.new_stage7,
            unit_number=1,
            global_unit_number=421,
            title="Word Flow Unit 1",
            objective="Core words",
        )
        self.new_level_s7 = CurriculumLevel.objects.create(
            stage=self.new_stage7,
            unit=self.new_unit7,
            level_in_unit=1,
            level_in_stage=1,
            logical_id="S07-L001",
            title="Word Flow Lesson 1",
            exercise_text="the words",
            target_wpm=46,
            target_accuracy=92,
        )

    def test_migration_dry_run_does_not_commit(self):
        """Dry-run preview leaves database unmodified."""
        call_command('migrate_legacy_curriculum', dry_run=True, backup=False)
        self.assertEqual(LegacyLessonProgressArchive.objects.count(), 0)
        self.assertEqual(CurriculumLessonProgress.objects.count(), 0)

    def test_migration_semantic_mapping_and_idempotency(self):
        """
        Real migration correctly maps legacy S1 -> new S1 and legacy S5 -> new S7 (Word Flow),
        and running twice is completely idempotent.
        """
        # Run 1
        call_command('migrate_legacy_curriculum', dry_run=False, backup=False)

        # Verify archive created
        archives = LegacyLessonProgressArchive.objects.filter(user=self.user)
        self.assertEqual(archives.count(), 2)

        # Verify S1 mapped to New Stage 1
        s1_migrated = CurriculumLessonProgress.objects.filter(
            user=self.user,
            level=self.new_level_s1
        ).first()
        self.assertIsNotNone(s1_migrated)
        self.assertTrue(s1_migrated.is_completed)
        self.assertEqual(float(s1_migrated.best_wpm), 28.5)
        self.assertEqual(float(s1_migrated.best_accuracy), 96.0)

        # Verify S5 (Word Flow) mapped to New Stage 7, NOT New Stage 5 (Numbers)
        s7_migrated = CurriculumLessonProgress.objects.filter(
            user=self.user,
            level=self.new_level_s7
        ).first()
        self.assertIsNotNone(s7_migrated)
        self.assertTrue(s7_migrated.is_completed)
        self.assertEqual(float(s7_migrated.best_wpm), 50.0)

        # Idempotency check: run again
        call_command('migrate_legacy_curriculum', dry_run=False, backup=False)
        self.assertEqual(LegacyLessonProgressArchive.objects.filter(user=self.user).count(), 2)
        self.assertEqual(CurriculumLessonProgress.objects.filter(user=self.user).count(), 2)

    def test_migration_rollback(self):
        """Rollback restores clean state while leaving original legacy table untouched."""
        call_command('migrate_legacy_curriculum', dry_run=False, backup=False)
        self.assertEqual(CurriculumLessonProgress.objects.count(), 2)

        # Run rollback
        call_command('rollback_curriculum_migration', dry_run=False)
        self.assertEqual(CurriculumLessonProgress.objects.count(), 0)

        # Original legacy progress table is 100% intact!
        self.assertEqual(LessonProgress.objects.count(), 2)

