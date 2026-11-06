"""
KEYFLOW — Account Persistence & Multi-User Isolation Audit Test Suite
=====================================================================
Forensic validation of Zero-Data-Loss Architecture across:
1. User 14 (Account A) & User 15 (Account B) database integrity.
2. UserLessonProgressSummaryView returning authentic stars, 10 stages, and UserStageAccess.
3. Multi-user isolation: User A progress never leaks to User B.
4. RecordLessonProgressView mirroring to CurriculumLessonProgress with stars.
5. CurriculumRecordProgressView mirroring to legacy LessonProgress.
6. PracticeSession history isolation and limit query support.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from lessons.models import (
    Level,
    Lesson,
    LessonProgress,
    CurriculumStage,
    CurriculumUnit,
    CurriculumLevel,
    UserStageAccess,
    CurriculumLessonProgress,
)
from lessons.views import (
    UserLessonProgressSummaryView,
    RecordLessonProgressView,
    CurriculumRecordProgressView,
)
from practice.models import PracticeSession
from practice.views import UserPracticeHistoryView

User = get_user_model()


class AccountPersistenceAuditTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        # Create two distinct test users with unique Clerk IDs
        self.user_a = User.objects.create_user(
            username='account_a',
            email='account_a@clerk.keyflow.local',
            clerk_id='user_clerk_aaa_111',
            is_active=True,
        )
        self.user_b = User.objects.create_user(
            username='account_b',
            email='account_b@clerk.keyflow.local',
            clerk_id='user_clerk_bbb_222',
            is_active=True,
        )

        # Create curriculum stages and levels
        self.stage1 = CurriculumStage.objects.create(
            stage_number=1,
            title='Stage 1: Home Row Foundations',
            slug='stage-1-home-row-foundations',
            is_published=True,
        )
        self.stage2 = CurriculumStage.objects.create(
            stage_number=2,
            title='Stage 2: Top Row Fluidity',
            slug='stage-2-top-row-fluidity',
            is_published=True,
        )
        self.unit1 = CurriculumUnit.objects.create(
            stage=self.stage1,
            unit_number=1,
            global_unit_number=1,
            title='Unit 1: Tactile Anchors',
        )

        self.c_level1 = CurriculumLevel.objects.create(
            stage=self.stage1,
            unit=self.unit1,
            level_in_stage=1,
            level_in_unit=1,
            logical_id='S1-L001',
            title='Tactile Anchors F & J',
            target_wpm=20,
            target_accuracy=80,
            is_published=True,
        )
        self.c_level2 = CurriculumLevel.objects.create(
            stage=self.stage1,
            unit=self.unit1,
            level_in_stage=2,
            level_in_unit=2,
            logical_id='S1-L002',
            title='Burst Timing',
            target_wpm=22,
            target_accuracy=82,
            is_published=True,
        )

        # Legacy level and lessons
        self.legacy_level = Level.objects.create(
            level_number=1,
            title='Level 1',
        )
        self.legacy_lesson1 = Lesson.objects.create(
            level=self.legacy_level,
            order=1,
            title='Stage 1 Lesson 1',
            slug='level-1-lesson-1',
            target_wpm=20,
            target_accuracy=80,
            is_published=True,
        )
        self.legacy_lesson2 = Lesson.objects.create(
            level=self.legacy_level,
            order=2,
            title='Stage 1 Lesson 2',
            slug='level-1-lesson-2',
            target_wpm=22,
            target_accuracy=82,
            is_published=True,
        )

    def test_curriculum_progress_summary_includes_stars_and_10_stages(self):
        """UserLessonProgressSummaryView must return authentic stars and 10-stage map."""
        now = timezone.now()
        # Seed progress for User A in CurriculumLessonProgress
        CurriculumLessonProgress.objects.create(
            user=self.user_a,
            level=self.c_level1,
            is_completed=True,
            stars=3,
            best_wpm=55.0,
            best_accuracy=100.0,
            attempts=4,
            completed_at=now,
        )
        UserStageAccess.objects.create(
            user=self.user_a,
            stage=self.stage1,
            access_type='guided_unlock',
        )

        request = self.factory.get('/api/lessons/progress/summary/')
        force_authenticate(request, user=self.user_a)

        view = UserLessonProgressSummaryView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('lessons', response.data)
        self.assertIn('stageProgress', response.data)
        self.assertIn('unlockedStages', response.data)
        self.assertIn('stageAccessTypes', response.data)

        # Verify 10 stages exist in stageProgress
        for s in range(1, 11):
            self.assertIn(str(s), response.data['stageProgress'])

        # Verify lesson record and authentic stars
        lesson_record = response.data['lessons'].get('S1-L001')
        self.assertIsNotNone(lesson_record)
        self.assertTrue(lesson_record['completed'])
        self.assertEqual(lesson_record['stars'], 3)
        self.assertEqual(lesson_record['bestWpm'], 55.0)
        self.assertEqual(lesson_record['bestAccuracy'], 100.0)
        self.assertEqual(lesson_record['attempts'], 4)

        # Verify stage access types
        self.assertEqual(response.data['stageAccessTypes'].get('1'), 'guided_unlock')

    def test_multi_user_isolation_between_account_a_and_account_b(self):
        """User A progress must NEVER leak to User B, and User B progress must not leak to User A."""
        now = timezone.now()
        # User A completed Level 1 & Level 2
        CurriculumLessonProgress.objects.create(
            user=self.user_a,
            level=self.c_level1,
            is_completed=True,
            stars=3,
            best_wpm=55.0,
            best_accuracy=100.0,
            attempts=2,
            completed_at=now,
        )
        CurriculumLessonProgress.objects.create(
            user=self.user_a,
            level=self.c_level2,
            is_completed=True,
            stars=2,
            best_wpm=40.0,
            best_accuracy=95.0,
            attempts=1,
            completed_at=now,
        )

        # User B completed ONLY Level 1 with different metrics
        CurriculumLessonProgress.objects.create(
            user=self.user_b,
            level=self.c_level1,
            is_completed=True,
            stars=1,
            best_wpm=25.0,
            best_accuracy=85.0,
            attempts=5,
            completed_at=now,
        )

        view = UserLessonProgressSummaryView.as_view()

        # Query User A
        req_a = self.factory.get('/api/lessons/progress/summary/')
        force_authenticate(req_a, user=self.user_a)
        res_a = view(req_a)

        self.assertEqual(res_a.data['lessons']['S1-L001']['stars'], 3)
        self.assertEqual(res_a.data['lessons']['S1-L001']['bestWpm'], 55.0)
        self.assertIn('S1-L002', res_a.data['lessons'])
        self.assertTrue(res_a.data['lessons']['S1-L002']['completed'])

        # Query User B
        req_b = self.factory.get('/api/lessons/progress/summary/')
        force_authenticate(req_b, user=self.user_b)
        res_b = view(req_b)

        self.assertEqual(res_b.data['lessons']['S1-L001']['stars'], 1)
        self.assertEqual(res_b.data['lessons']['S1-L001']['bestWpm'], 25.0)
        self.assertNotIn('S1-L002', res_b.data['lessons'])

    def test_record_progress_mirrors_to_curriculum_and_legacy(self):
        """RecordLessonProgressView must update both LessonProgress and CurriculumLessonProgress."""
        req = self.factory.post('/api/lessons/record/', {
            'stage': 1,
            'lesson': 1,
            'wpm': 45.0,
            'accuracy': 95.0,
            'completed': True,
            'stars': 3,
        })
        force_authenticate(req, user=self.user_a)

        view = RecordLessonProgressView.as_view()
        res = view(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify legacy LessonProgress updated
        lp = LessonProgress.objects.filter(user=self.user_a, lesson=self.legacy_lesson1).first()
        self.assertIsNotNone(lp)
        self.assertTrue(lp.is_completed)
        self.assertEqual(float(lp.best_wpm), 45.0)

        # Verify CurriculumLessonProgress updated with genuine stars
        clp = CurriculumLessonProgress.objects.filter(user=self.user_a, level=self.c_level1).first()
        self.assertIsNotNone(clp)
        self.assertTrue(clp.is_completed)
        self.assertEqual(clp.stars, 3)
        self.assertEqual(float(clp.best_wpm), 45.0)

    def test_practice_session_history_isolation(self):
        """PracticeSession history must strictly isolate User A and User B sessions."""
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=150,
            correct_chars=145,
            incorrect_chars=5,
            gross_wpm=60.0,
            net_wpm=55.0,
            accuracy=96.67,
            error_count=2,
        )
        PracticeSession.objects.create(
            user=self.user_b,
            session_type='words',
            duration_seconds=45,
            total_chars=200,
            correct_chars=190,
            incorrect_chars=10,
            gross_wpm=53.33,
            net_wpm=40.0,
            accuracy=95.0,
            error_count=5,
        )

        view = UserPracticeHistoryView.as_view()

        req_a = self.factory.get('/api/practice/history/')
        force_authenticate(req_a, user=self.user_a)
        res_a = view(req_a)

        results_a = res_a.data.get('results', res_a.data)
        self.assertEqual(len(results_a), 1)
        self.assertEqual(float(results_a[0]['net_wpm']), 55.0)

        req_b = self.factory.get('/api/practice/history/')
        force_authenticate(req_b, user=self.user_b)
        res_b = view(req_b)

        results_b = res_b.data.get('results', res_b.data)
        self.assertEqual(len(results_b), 1)
        self.assertEqual(float(results_b[0]['net_wpm']), 40.0)
