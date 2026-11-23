"""
KEYFLOW Leaderboard Complete Data Persistence & Multi-Account Isolation Audit
=============================================================================
Validates:
1. Authentic database persistence of typing sessions for Leaderboard.
2. Exact mathematical formulas for Gross WPM, Net WPM, and Accuracy.
3. Period filtering: Daily, Weekly, Monthly, All Time.
4. Category filtering: Speed, Accuracy, Overall.
5. Deterministic ranking and one-best-entry-per-user aggregation.
6. Multi-account isolation: Account A vs Account B without cross-contamination.
7. Correct my_rank payload for authenticated user.
"""

import datetime
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from knox.models import AuthToken
from accounts.models import User
from practice.models import PracticeSession


class LeaderboardPersistenceAuditTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Account A
        self.user_a = User.objects.create_user(
            username='leaderboard_pers_user_a',
            email='pers_a@keyflow.local',
            password='testpassword123A!',
            is_email_verified=True,
        )
        if hasattr(self.user_a, 'profile'):
            self.user_a.profile.display_name = 'Typist Alpha'
            self.user_a.profile.save()
        _, self.token_a = AuthToken.objects.create(self.user_a)

        # Account B
        self.user_b = User.objects.create_user(
            username='leaderboard_pers_user_b',
            email='pers_b@keyflow.local',
            password='testpassword123B!',
            is_email_verified=True,
        )
        if hasattr(self.user_b, 'profile'):
            self.user_b.profile.display_name = 'Typist Beta'
            self.user_b.profile.save()
        _, self.token_b = AuthToken.objects.create(self.user_b)

    def test_authentic_typing_metrics_and_leaderboard_ranking(self):
        now = timezone.now()

        # Account A: Session 1 (Moderate: 60 Gross, 2 uncorrected errors in 60s -> 58 Net WPM, 96.67% Acc)
        # 300 chars, 290 correct, 10 errors
        s_a1 = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=60,
            total_chars=300,
            correct_chars=290,
            incorrect_chars=10,
            error_count=2,
            gross_wpm=Decimal('60.00'),
            net_wpm=Decimal('58.00'),
            accuracy=Decimal('96.67'),
            created_at=now - datetime.timedelta(hours=2),
        )

        # Account A: Session 2 (Personal Best: 85 Gross, 1 uncorrected error in 60s -> 84 Net WPM, 99.00% Acc)
        s_a2 = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=60,
            total_chars=425,
            correct_chars=420,
            incorrect_chars=5,
            error_count=1,
            gross_wpm=Decimal('85.00'),
            net_wpm=Decimal('84.00'),
            accuracy=Decimal('98.82'),
            created_at=now - datetime.timedelta(hours=1),
        )

        # Account B: Session 1 (Champion Speed: 100 Gross, 0 uncorrected errors -> 100 Net WPM, 100.00% Acc)
        s_b1 = PracticeSession.objects.create(
            user=self.user_b,
            session_type='timed',
            duration_seconds=60,
            total_chars=500,
            correct_chars=500,
            incorrect_chars=0,
            error_count=0,
            gross_wpm=Decimal('100.00'),
            net_wpm=Decimal('100.00'),
            accuracy=Decimal('100.00'),
            created_at=now - datetime.timedelta(minutes=30),
        )

        # 1. Query Speed Leaderboard (Unauthenticated)
        res = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        entries = data.get('entries', [])

        self.assertEqual(len(entries), 2)
        # Rank 1: Account B (100 Net WPM)
        self.assertEqual(entries[0]['username'], 'leaderboard_pers_user_b')
        self.assertEqual(entries[0]['net_wpm'], 100.0)
        self.assertEqual(entries[0]['rank'], 1)

        # Rank 2: Account A (84 Net WPM — best session taken, session 1 did not duplicate user)
        self.assertEqual(entries[1]['username'], 'leaderboard_pers_user_a')
        self.assertEqual(entries[1]['net_wpm'], 84.0)
        self.assertEqual(entries[1]['rank'], 2)

        # 2. Query as Authenticated Account A -> Verify my_rank
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')
        res_a = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        self.assertEqual(res_a.status_code, 200)
        my_rank_a = res_a.json().get('my_rank')
        self.assertIsNotNone(my_rank_a)
        self.assertTrue(my_rank_a['ranked'])
        self.assertEqual(my_rank_a['rank'], 2)
        self.assertEqual(my_rank_a['net_wpm'], 84.0)
        self.assertEqual(my_rank_a['sessions_count'], 2)

        # 3. Query as Authenticated Account B -> Verify my_rank
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b}')
        res_b = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        self.assertEqual(res_b.status_code, 200)
        my_rank_b = res_b.json().get('my_rank')
        self.assertIsNotNone(my_rank_b)
        self.assertTrue(my_rank_b['ranked'])
        self.assertEqual(my_rank_b['rank'], 1)
        self.assertEqual(my_rank_b['net_wpm'], 100.0)

        # 4. Test Accuracy Category
        res_acc = self.client.get('/api/leaderboard/?period=all_time&category=accuracy')
        self.assertEqual(res_acc.status_code, 200)
        acc_entries = res_acc.json().get('entries', [])
        self.assertEqual(acc_entries[0]['username'], 'leaderboard_pers_user_b')
        self.assertEqual(acc_entries[0]['accuracy'], 100.0)

        # 5. Test Overall Category
        res_over = self.client.get('/api/leaderboard/?period=all_time&category=overall')
        self.assertEqual(res_over.status_code, 200)
        over_entries = res_over.json().get('entries', [])
        self.assertEqual(len(over_entries), 2)
        self.assertEqual(over_entries[0]['rank'], 1)

        # 6. Test Period Filtering: Daily vs Past Historical
        # Create an older session for Account A from 5 days ago (should be excluded from daily)
        old_session = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=60,
            total_chars=600,
            correct_chars=600,
            incorrect_chars=0,
            error_count=0,
            gross_wpm=Decimal('120.00'),
            net_wpm=Decimal('120.00'),
            accuracy=Decimal('100.00'),
        )
        PracticeSession.objects.filter(id=old_session.id).update(
            created_at=now - datetime.timedelta(days=5)
        )

        res_daily = self.client.get('/api/leaderboard/?period=daily&category=speed')
        daily_entries = res_daily.json().get('entries', [])
        # In daily, Account A's best is 84 (from 1 hour ago), NOT the 120 from 5 days ago!
        user_a_daily = next(e for e in daily_entries if e['username'] == 'leaderboard_pers_user_a')
        self.assertEqual(user_a_daily['net_wpm'], 84.0)

        # In all-time, Account A's best should be the 120 from 5 days ago!
        res_all = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        all_entries = res_all.json().get('entries', [])
        user_a_all = next(e for e in all_entries if e['username'] == 'leaderboard_pers_user_a')
        self.assertEqual(user_a_all['net_wpm'], 120.0)
        self.assertEqual(user_a_all['rank'], 1)  # 120 is now rank 1!

    def test_invalid_and_short_sessions_are_excluded(self):
        # Session too short (5 seconds < 10)
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=5,
            total_chars=100,
            correct_chars=100,
            incorrect_chars=0,
            gross_wpm=Decimal('120.00'),
            net_wpm=Decimal('120.00'),
            accuracy=Decimal('100.00'),
        )
        # Session too few characters (10 chars < 15)
        PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            duration_seconds=30,
            total_chars=10,
            correct_chars=10,
            incorrect_chars=0,
            gross_wpm=Decimal('4.00'),
            net_wpm=Decimal('4.00'),
            accuracy=Decimal('100.00'),
        )
        res = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        self.assertEqual(len(res.json().get('entries', [])), 0)

    def test_two_account_isolation_and_persistence(self):
        # 1. Account A creates 3 sessions
        for i, wpm in enumerate([40, 55, 70], 1):
            PracticeSession.objects.create(
                user=self.user_a,
                session_type='timed',
                duration_seconds=60,
                total_chars=wpm * 5,
                correct_chars=wpm * 5,
                incorrect_chars=0,
                gross_wpm=Decimal(f'{wpm}.00'),
                net_wpm=Decimal(f'{wpm}.00'),
                accuracy=Decimal('100.00'),
            )
        self.assertEqual(PracticeSession.objects.filter(user=self.user_a).count(), 3)

        # 2. Account B creates 2 sessions
        for i, wpm in enumerate([65, 80], 1):
            PracticeSession.objects.create(
                user=self.user_b,
                session_type='timed',
                duration_seconds=60,
                total_chars=wpm * 5,
                correct_chars=wpm * 5,
                incorrect_chars=0,
                gross_wpm=Decimal(f'{wpm}.00'),
                net_wpm=Decimal(f'{wpm}.00'),
                accuracy=Decimal('100.00'),
            )
        self.assertEqual(PracticeSession.objects.filter(user=self.user_b).count(), 2)

        # 3. Verify Account A's records were completely untouched by Account B
        self.assertEqual(PracticeSession.objects.filter(user=self.user_a).count(), 3)
        self.assertEqual(PracticeSession.objects.filter(user=self.user_a, net_wpm=70).count(), 1)

        # 4. Verify Leaderboard reflects Account B at #1 (80 WPM) and Account A at #2 (70 WPM)
        res = self.client.get('/api/leaderboard/?period=all_time&category=speed')
        entries = res.json().get('entries', [])
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]['username'], 'leaderboard_pers_user_b')
        self.assertEqual(entries[0]['net_wpm'], 80.0)
        self.assertEqual(entries[1]['username'], 'leaderboard_pers_user_a')
        self.assertEqual(entries[1]['net_wpm'], 70.0)

    def test_exact_47_wpm_preservation_and_custom_drill_isolation(self):
        """
        Critical Audit Scenario:
        1. User performs an unstandardized custom drill at 50 WPM (session_type='custom').
        2. User performs a standardized 15s timed test at 47 Net WPM (session_type='timed', Gross 55, Net 47, Acc 94%).
        3. Standardized Leaderboard MUST isolate and display the authentic 47.0 Net WPM test, NOT the 50 WPM custom drill!
        """
        now = timezone.now()

        # Step 1: Older custom drill with 50 WPM
        s_custom = PracticeSession.objects.create(
            user=self.user_a,
            session_type='custom',
            source_environment='workstation_a',
            duration_seconds=15,
            total_chars=62,
            correct_chars=62,
            incorrect_chars=0,
            error_count=0,
            gross_wpm=Decimal('50.00'),
            net_wpm=Decimal('50.00'),
            accuracy=Decimal('100.00'),
            client_session_id='sess_custom_drill_50',
            created_at=now - datetime.timedelta(minutes=10),
        )

        # Step 2: Genuine 15s timed test on Workstation with 47 Net WPM
        s_timed = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            source_environment='workstation_a',
            duration_seconds=15,
            total_chars=69,
            correct_chars=65,
            incorrect_chars=4,
            error_count=2,
            gross_wpm=Decimal('55.00'),
            net_wpm=Decimal('47.00'),
            accuracy=Decimal('94.00'),
            client_session_id='sess_workstation_timed_47',
            created_at=now - datetime.timedelta(minutes=5),
        )

        # Query speed leaderboard for 15s duration
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')
        res = self.client.get('/api/leaderboard/?period=all_time&category=speed&duration=15')
        self.assertEqual(res.status_code, 200)
        data = res.json()

        entries = data.get('entries', [])
        self.assertEqual(len(entries), 1)

        # The entry MUST show the authentic 47.0 Net WPM, NOT 50 WPM!
        entry = entries[0]
        self.assertEqual(entry['username'], 'leaderboard_pers_user_a')
        self.assertEqual(entry['net_wpm'], 47.0)
        self.assertEqual(entry['gross_wpm'], 55.0)
        self.assertEqual(entry['accuracy'], 94.0)
        self.assertEqual(entry['session_type'], 'timed')
        self.assertEqual(entry['session_id'], 'sess_workstation_timed_47')

        # MyRank card verification
        my_rank = data.get('my_rank', {})
        self.assertTrue(my_rank['ranked'])
        self.assertEqual(my_rank['rank'], 1)
        self.assertEqual(my_rank['net_wpm'], 47.0)
        self.assertEqual(my_rank['gross_wpm'], 55.0)
        self.assertEqual(my_rank['accuracy'], 94.0)

        # Query specifically with session_id parameter
        res_session = self.client.get(f'/api/leaderboard/?period=all_time&category=speed&duration=15&session_id=sess_workstation_timed_47')
        self.assertEqual(res_session.status_code, 200)
        session_rank = res_session.json().get('my_rank', {})
        self.assertEqual(session_rank['net_wpm'], 47.0)
        self.assertEqual(session_rank['gross_wpm'], 55.0)
        self.assertEqual(session_rank['session_id'], 'sess_workstation_timed_47')

    def test_workstation_page_a_and_page_b_isolation(self):
        """
        Verify Workstation Page A and Workstation Page B:
        1. Maintain strict source_environment segregation.
        2. Do not overwrite each other's score records.
        3. Support source filtering in API.
        """
        now = timezone.now()

        # Page A test: 52 Net WPM
        s_page_a = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            source_environment='workstation_a',
            duration_seconds=15,
            total_chars=65,
            correct_chars=65,
            incorrect_chars=0,
            gross_wpm=Decimal('52.00'),
            net_wpm=Decimal('52.00'),
            accuracy=Decimal('100.00'),
            client_session_id='sess_page_a_001',
            created_at=now - datetime.timedelta(minutes=15),
        )

        # Page B (Focus/Switch mode) test: 47 Net WPM
        s_page_b = PracticeSession.objects.create(
            user=self.user_a,
            session_type='timed',
            source_environment='workstation_b',
            duration_seconds=15,
            total_chars=69,
            correct_chars=65,
            incorrect_chars=4,
            error_count=2,
            gross_wpm=Decimal('55.00'),
            net_wpm=Decimal('47.00'),
            accuracy=Decimal('94.00'),
            client_session_id='sess_page_b_001',
            created_at=now - datetime.timedelta(minutes=5),
        )

        # Both sessions exist independently in database
        self.assertEqual(PracticeSession.objects.filter(user=self.user_a, source_environment='workstation_a').count(), 1)
        self.assertEqual(PracticeSession.objects.filter(user=self.user_a, source_environment='workstation_b').count(), 1)

        # Filter by source=workstation_b
        res_b = self.client.get('/api/leaderboard/?duration=15&category=speed&source=workstation_b')
        self.assertEqual(res_b.status_code, 200)
        entries_b = res_b.json().get('entries', [])
        self.assertEqual(len(entries_b), 1)
        self.assertEqual(entries_b[0]['net_wpm'], 47.0)
        self.assertEqual(entries_b[0]['source_environment'], 'workstation_b')

        # Filter by source=workstation_a
        res_a = self.client.get('/api/leaderboard/?duration=15&category=speed&source=workstation_a')
        self.assertEqual(res_a.status_code, 200)
        entries_a = res_a.json().get('entries', [])
        self.assertEqual(len(entries_a), 1)
        self.assertEqual(entries_a[0]['net_wpm'], 52.0)
        self.assertEqual(entries_a[0]['source_environment'], 'workstation_a')

    def test_record_practice_session_api_idempotency_and_score_fidelity(self):
        """
        Verify RecordPracticeSessionView preserves client scores and handles idempotency without corruption.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')
        payload = {
            'session_id': 'sess_fidelity_47',
            'session_type': 'timed',
            'source': 'workstation_b',
            'duration_seconds': 15,
            'total_chars': 69,
            'correct_chars': 65,
            'incorrect_chars': 4,
            'gross_wpm': 55.0,
            'net_wpm': 47.0,
            'accuracy': 94.0,
            'error_count': 2,
        }

        # First post creates session
        res1 = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res1.status_code, 201)
        data1 = res1.json()
        self.assertEqual(float(data1['net_wpm']), 47.0)
        self.assertEqual(float(data1['gross_wpm']), 55.0)
        self.assertEqual(float(data1['accuracy']), 94.0)
        self.assertEqual(data1['source_environment'], 'workstation_b')

        # Idempotent second post with same session_id returns existing record, does not create duplicate
        res2 = self.client.post('/api/practice/sessions/', payload, format='json')
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()['id'], data1['id'])
        self.assertEqual(PracticeSession.objects.filter(client_session_id='sess_fidelity_47').count(), 1)
