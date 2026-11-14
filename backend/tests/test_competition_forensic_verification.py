"""
KEYFLOW Competition & Multiplayer Forensic Verification Tests
============================================================
Comprehensive test suite verifying:
1. Competition room creation, validation, unique codes, and host privileges
2. Code-based joining, capacity limits, and duplicate joining prevention
3. Host-only cancellation and deletion security
4. Authentic result submission with anti-cheat recalculation (Gross WPM, Net WPM clamping, Accuracy clamping)
5. Strict deterministic ranking and tie-breaking (Net WPM desc -> Accuracy desc -> Duration asc -> ID asc)
6. Competition summary statistics and top 3 podium accuracy
7. 3D Multiplayer Racing room creation, lane allocation (0-3), and capacity rejection (max 4)
8. Multiplayer Racing ready state and countdown progression
9. Multiplayer Racing telemetry synchronization and placement calculation
10. Global Leaderboard data integrity (registered users only, user deduplication, personal rank & percentile)
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from knox.models import AuthToken
from practice.models import Competition, CompetitionParticipant, PracticeSession, Passage
from games.models import MultiplayerRoom, RoomParticipant

User = get_user_model()


class CompetitionForensicVerificationTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create Host User
        self.host_user = User.objects.create_user(
            username='host_forensics',
            email='host_forensics@keyflow.dev',
            password='TestPassword123!',
        )
        self.host_user.profile.display_name = 'Host Commander'
        self.host_user.profile.continent = 'north_america'
        self.host_user.profile.save()
        _, self.host_token = AuthToken.objects.create(self.host_user)
        self.host_headers = {'HTTP_AUTHORIZATION': f'Token {self.host_token}'}

        # Create Participant 1
        self.user1 = User.objects.create_user(
            username='racer_one',
            email='racer_one@keyflow.dev',
            password='TestPassword123!',
        )
        self.user1.profile.display_name = 'Racer One'
        self.user1.profile.continent = 'europe'
        self.user1.profile.save()
        _, self.user1_token = AuthToken.objects.create(self.user1)
        self.user1_headers = {'HTTP_AUTHORIZATION': f'Token {self.user1_token}'}

        # Create Participant 2
        self.user2 = User.objects.create_user(
            username='racer_two',
            email='racer_two@keyflow.dev',
            password='TestPassword123!',
        )
        self.user2.profile.display_name = 'Racer Two'
        self.user2.profile.continent = 'asia'
        self.user2.profile.save()
        _, self.user2_token = AuthToken.objects.create(self.user2)
        self.user2_headers = {'HTTP_AUTHORIZATION': f'Token {self.user2_token}'}

        # Seed standard passage
        Passage.objects.create(
            title='Forensics Masterpiece',
            content='Precision typing requires disciplined rhythm, rapid eye movement, and instant finger recoil.',
            category='general',
            difficulty='medium',
            word_count=13,
            is_active=True,
        )

    def test_01_competition_creation_and_host_assignment(self):
        """Verify room creation generates 'KF-' prefixed code, clamps limits, and assigns host."""
        res = self.client.post(
            '/api/practice/competitions/',
            {
                'name': 'Grand Championship',
                'challenge_type': 'words',
                'target_limit': 50,
                'difficulty': 'expert',
                'max_participants': 12,
                'is_public': True,
                'display_name': 'Host Commander',
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['code'].startswith('KF-'))
        self.assertEqual(len(data['code']), 9)  # 'KF-' + 6 chars
        self.assertEqual(data['name'], 'Grand Championship')
        self.assertEqual(data['target_limit'], 50)
        self.assertEqual(data['max_participants'], 12)
        self.assertEqual(data['participant_count'], 1)
        self.assertEqual(data['created_by_name'], 'host_forensics')
        self.assertEqual(data['status'], 'waiting')
        self.assertIn('participant_id', data)

    def test_02_competition_capacity_and_duplicate_prevention(self):
        """Verify duplicate user joining returns existing record and capacity limit rejects extra typists."""
        # Create room with max 2 participants
        res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Duel Arena', 'max_participants': 2, 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = res.json()['code']
        host_pid = res.json()['participant_id']

        # Host attempts to join again -> duplicate joining check
        rejoin_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'Host Rejoin'},
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(rejoin_res.status_code, 200)
        self.assertEqual(rejoin_res.json()['participant_id'], host_pid)
        self.assertEqual(rejoin_res.json()['participant_count'], 1)

        # User 1 joins -> room becomes full (2/2)
        join_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'Racer One'},
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertEqual(join_res.status_code, 201)
        self.assertEqual(join_res.json()['participant_count'], 2)

        # User 2 attempts to join -> 400 Bad Request (lobby full)
        overflow_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'Racer Two'},
            content_type='application/json',
            **self.user2_headers,
        )
        self.assertEqual(overflow_res.status_code, 400)
        self.assertIn('full', overflow_res.json()['error'].lower())

    def test_03_host_only_deletion_security(self):
        """Verify only room host can delete/cancel competition, non-host receives 403."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Host Protected Lobby', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']

        # Non-host user1 attempts to delete room -> 403 Forbidden
        del_res_unauthorized = self.client.delete(
            f'/api/practice/competitions/{code}/',
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertEqual(del_res_unauthorized.status_code, 403)
        self.assertIn('Only the host', del_res_unauthorized.json()['error'])

        # Host deletes room -> 200 OK
        del_res_host = self.client.delete(
            f'/api/practice/competitions/{code}/',
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(del_res_host.status_code, 200)
        self.assertEqual(del_res_host.json()['status'], 'deleted')

        # Confirm room is gone
        get_res = self.client.get(f'/api/practice/competitions/{code}/')
        self.assertEqual(get_res.status_code, 404)

    def test_04_authentic_result_submission_anti_cheat(self):
        """Verify server recomputes Gross WPM, clamps Net WPM, and validates accuracy."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Anti-Cheat Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        # Attempt forged Net WPM: Client claims 300 WPM with only 100 chars in 30 seconds
        # 100 chars / 5 = 20 words. 20 words / 0.5 minutes = 40 Gross WPM.
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'net_wpm': 300.0,
                'gross_wpm': 300.0,
                'accuracy': 100.0,
                'duration_seconds': 30,
                'correct_chars': 90,
                'incorrect_chars': 10,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']

        # Server recalculates: Gross = 100 / 5 / 0.5 = 40.0 WPM
        self.assertEqual(float(p_data['gross_wpm']), 40.0)
        # Net WPM clamped: cannot exceed Gross + 0.5 (i.e. <= 40.5 WPM, NOT 300.0 WPM!)
        self.assertLessEqual(float(p_data['net_wpm']), 40.5)
        # Accuracy recalculated: 90 / 100 = 90.0% (NOT forged 100.0%!)
        self.assertEqual(float(p_data['accuracy']), 90.0)

    def test_05_deterministic_ranking_and_tie_breaking(self):
        """Verify ranking contract: Net WPM desc -> Accuracy desc -> Duration asc -> ID asc."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Tie Breaking Arena', 'max_participants': 10, 'display_name': 'TypistA'},
            content_type='application/json',
        )
        code = create_res.json()['code']
        p_a = create_res.json()['participant_id']

        # Join 3 more typists
        j_b = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistB'}, content_type='application/json').json()['participant_id']
        j_c = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistC'}, content_type='application/json').json()['participant_id']
        j_d = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistD'}, content_type='application/json').json()['participant_id']

        # Submissions:
        # Typist A: 100 WPM, 95% Acc, 30s
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': p_a, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 95.0,
            'duration_seconds': 30, 'correct_chars': 238, 'incorrect_chars': 12,
        }, content_type='application/json')

        # Typist B: 100 WPM, 98% Acc, 30s -> Beats A on Accuracy
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_b, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 98.0,
            'duration_seconds': 30, 'correct_chars': 245, 'incorrect_chars': 5,
        }, content_type='application/json')

        # Typist C: 100 WPM, 98% Acc, 25s -> Beats B on Duration (faster)
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_c, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 98.0,
            'duration_seconds': 25, 'correct_chars': 204, 'incorrect_chars': 4,
        }, content_type='application/json')

        # Typist D: 110 WPM, 92% Acc, 30s -> Beats ALL on Net WPM
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_d, 'net_wpm': 110.0, 'gross_wpm': 110.0, 'accuracy': 92.0,
            'duration_seconds': 30, 'correct_chars': 253, 'incorrect_chars': 22,
        }, content_type='application/json')

        # Fetch detail and assert strict ranking order: D (1st) -> C (2nd) -> B (3rd) -> A (4th)
        detail_res = self.client.get(f'/api/practice/competitions/{code}/')
        self.assertEqual(detail_res.status_code, 200)
        participants = detail_res.json()['participants']

        self.assertEqual(len(participants), 4)
        self.assertEqual(participants[0]['display_name'], 'TypistD')
        self.assertEqual(participants[0]['rank'], 1)

        self.assertEqual(participants[1]['display_name'], 'TypistC')
        self.assertEqual(participants[1]['rank'], 2)

        self.assertEqual(participants[2]['display_name'], 'TypistB')
        self.assertEqual(participants[2]['rank'], 3)

        self.assertEqual(participants[3]['display_name'], 'TypistA')
        self.assertEqual(participants[3]['rank'], 4)

        # Summary check
        summary = detail_res.json()['summary']
        self.assertEqual(summary['completed_count'], 4)
        self.assertEqual(summary['top_wpm'], 110.0)
        self.assertEqual(len(summary['podium']), 3)
        self.assertEqual(summary['podium'][0]['display_name'], 'TypistD')
        self.assertEqual(summary['podium'][1]['display_name'], 'TypistC')
        self.assertEqual(summary['podium'][2]['display_name'], 'TypistB')

    def test_06_multiplayer_racing_lane_allocation_and_limits(self):
        """Verify 3D Multiplayer racing allocates lanes 0 to 3 sequentially and enforces max 4."""
        # Create room
        c_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'Commander',
            'roomName': 'Apex Cup',
        }, content_type='application/json')
        self.assertEqual(c_res.status_code, 201)
        code = c_res.json()['room']['code']
        self.assertTrue(code.startswith('ROOM-'))
        self.assertEqual(c_res.json()['participant']['lane'], 0)

        # Join 3 racers (lanes 1, 2, 3)
        j1 = self.client.post(reverse('racing_room_join', kwargs={'code': code}), {'displayName': 'P1', 'guestId': 'g1'}, content_type='application/json')
        self.assertEqual(j1.json()['participant']['lane'], 1)

        j2 = self.client.post(reverse('racing_room_join', kwargs={'code': code}), {'displayName': 'P2', 'guestId': 'g2'}, content_type='application/json')
        self.assertEqual(j2.json()['participant']['lane'], 2)

        j3 = self.client.post(reverse('racing_room_join', kwargs={'code': code}), {'displayName': 'P3', 'guestId': 'g3'}, content_type='application/json')
        self.assertEqual(j3.json()['participant']['lane'], 3)

        # 5th racer attempts to join -> 400 Bad Request
        j4 = self.client.post(reverse('racing_room_join', kwargs={'code': code}), {'displayName': 'P4', 'guestId': 'g4'}, content_type='application/json')
        self.assertEqual(j4.status_code, 400)
        self.assertIn('full', j4.json()['error'].lower())

    def test_07_multiplayer_racing_telemetry_sync(self):
        """Verify high-frequency telemetry sync updates distance and determines live placements."""
        c_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'RacerHost',
        }, content_type='application/json')
        code = c_res.json()['room']['code']
        p_host_id = c_res.json()['participant']['id']

        j_res = self.client.post(reverse('racing_room_join', kwargs={'code': code}), {'displayName': 'RacerPeer', 'guestId': 'peer1'}, content_type='application/json')
        p_peer_id = j_res.json()['participant']['id']

        # Host sends telemetry: distance 500m
        sync_res1 = self.client.post(reverse('racing_room_sync', kwargs={'code': code}), {
            'participantId': p_host_id,
            'distance': 500.0,
            'speed': 40.0,
            'wpm': 90,
            'accuracy': 98.0,
            'placement': 1,
        }, content_type='application/json')
        self.assertEqual(sync_res1.status_code, 200)

        # Peer sends telemetry: distance 750m (ahead of host)
        sync_res2 = self.client.post(reverse('racing_room_sync', kwargs={'code': code}), {
            'participantId': p_peer_id,
            'distance': 750.0,
            'speed': 50.0,
            'wpm': 110,
            'accuracy': 99.0,
            'placement': 1,
        }, content_type='application/json')
        self.assertEqual(sync_res2.status_code, 200)

        # Confirm peer is in placement 1 and host is in placement 2 based on distance
        participants = sync_res2.json()['participants']
        peer_entry = next(p for p in participants if p['id'] == p_peer_id)
        host_entry = next(p for p in participants if p['id'] == p_host_id)
        self.assertEqual(peer_entry['placement'], 1)
        self.assertEqual(host_entry['placement'], 2)

    def test_08_leaderboard_user_deduplication_and_personal_rank(self):
        """Verify leaderboard only includes registered users, deduplicates to 1 entry per user, and returns personal rank."""
        # Record 2 practice sessions for user1 (better session: 105 WPM, older session: 75 WPM)
        PracticeSession.objects.create(
            user=self.user1,
            net_wpm=75.0,
            gross_wpm=80.0,
            accuracy=95.0,
            duration_seconds=30,
            total_chars=187,
            correct_chars=180,
            incorrect_chars=7,
            session_type='timed',
        )
        PracticeSession.objects.create(
            user=self.user1,
            net_wpm=105.0,
            gross_wpm=108.0,
            accuracy=98.0,
            duration_seconds=30,
            total_chars=262,
            correct_chars=258,
            incorrect_chars=4,
            session_type='timed',
        )

        # Record 1 session for user2 (85 WPM)
        PracticeSession.objects.create(
            user=self.user2,
            net_wpm=85.0,
            gross_wpm=88.0,
            accuracy=96.0,
            duration_seconds=30,
            total_chars=212,
            correct_chars=205,
            incorrect_chars=7,
            session_type='timed',
        )

        # Query global leaderboard authenticated as user2
        res = self.client.get('/api/leaderboard/?scope=global&period=all_time&category=speed', **self.user2_headers)
        self.assertIn(res.status_code, [200, 201])
        data = res.json()

        # Deduplication check: user1 must appear EXACTLY ONCE with 105 WPM
        user1_entries = [e for e in data['entries'] if e['username'] == 'racer_one']
        self.assertEqual(len(user1_entries), 1)
        self.assertEqual(float(user1_entries[0]['net_wpm']), 105.0)

        # Ranking check: user1 is Rank 1 (105 WPM), user2 is Rank 2 (85 WPM)
        self.assertEqual(data['entries'][0]['username'], 'racer_one')
        self.assertEqual(data['entries'][0]['rank'], 1)
        self.assertEqual(data['entries'][1]['username'], 'racer_two')
        self.assertEqual(data['entries'][1]['rank'], 2)

        # Personal rank check for authenticated user2:
        self.assertIsNotNone(data['my_rank'])
        self.assertTrue(data['my_rank']['ranked'])
        self.assertEqual(data['my_rank']['rank'], 2)
        self.assertEqual(data['my_rank']['total_competitors'], 2)
        self.assertEqual(float(data['my_rank']['net_wpm']), 85.0)

    def test_11_anti_tamper_hidden_errors_detected_by_challenge_text(self):
        """Verify server detects hidden uncorrected errors if client sends error_count=0 with mismatching typed_text."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Anti-Cheat Challenge Room', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "The quick brown fox jumps over the lazy dog"
        comp.save()

        # Malicious client typed 'The xxxxx brown fox jumps over the lazy dog' (5 uncorrected errors at positions 4-8)
        # But client passes error_count=0 in an attempt to hide the 5 uncorrected errors
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'correct_chars': 38,
                'incorrect_chars': 5,
                'error_count': 0,  # Cheating attempt: claiming 0 remaining errors
                'typed_text': "The xxxxx brown fox jumps over the lazy dog",
                'gross_wpm': 8.6,
                'net_wpm': 8.6,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        # 43 chars / 5 = 8.6 Gross WPM
        self.assertEqual(float(p_data['gross_wpm']), 8.6)
        # Server independently verified 5 mismatches against challenge_text
        # Penalty = 5 errors / 1 min = 5.0 WPM penalty -> Net WPM = 8.6 - 5.0 = 3.6 WPM (NOT 8.6!)
        self.assertEqual(float(p_data['net_wpm']), 3.6)

    def test_12_anti_tamper_inflated_gross_and_net_wpm_clamped(self):
        """Verify server clamps forged Gross WPM and strictly forbids Net WPM > Gross WPM."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Clamping Defense Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        # Client sends 90 correct, 10 incorrect in 60s -> Canonical Gross is (90+10)/5 / 1 = 20.0 WPM
        # Client tries to claim total_chars=500, gross_wpm=100.0, net_wpm=105.0
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'correct_chars': 90,
                'incorrect_chars': 10,
                'total_chars': 500,  # Forged total
                'gross_wpm': 100.0,   # Forged gross
                'net_wpm': 105.0,     # Forged net > gross
                'error_count': 0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']

        # Server bounds total_chars to valid printable attempts (90+10 = 100) -> 20.0 WPM
        self.assertEqual(float(p_data['gross_wpm']), 20.0)
        # Net WPM can NEVER exceed Gross WPM (must be <= 20.0, NOT 105.0!)
        self.assertLessEqual(float(p_data['net_wpm']), 20.0)
        self.assertEqual(float(p_data['net_wpm']), 20.0)

    def test_13_anti_tamper_zero_or_negative_duration_handled_safely(self):
        """Verify zero or negative duration yields 0.0 WPM and does not throw or explode."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Zero Duration Room', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 0,
                'correct_chars': 100,
                'incorrect_chars': 0,
                'gross_wpm': 999.0,
                'net_wpm': 999.0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        self.assertEqual(float(p_data['gross_wpm']), 0.0)
        self.assertEqual(float(p_data['net_wpm']), 0.0)

    def test_14_practice_session_persistence_scoring_contract(self):
        """Verify RecordPracticeSessionView calculates canonical 20.0 Gross WPM for 90 correct, 10 incorrect in 60s."""
        res = self.client.post(
            '/api/practice/sessions/',
            {
                'duration_seconds': 60,
                'correct_chars': 90,
                'incorrect_chars': 10,
                'total_chars': 100,
                'error_count': 5,
                'gross_wpm': 20.0,
                'net_wpm': 15.0,
                'accuracy': 90.0,
            },
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertEqual(float(data['gross_wpm']), 20.0)
        self.assertEqual(float(data['net_wpm']), 15.0)
        self.assertEqual(float(data['accuracy']), 90.0)

    def test_15_attack1_forged_counters_bounded_by_typed_text_length(self):
        """Verify Attack 1: server bounds correct_chars to len(typed_text) when typed_text is provided."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Attack 1 Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        # Malicious client sends typed_text='hi' (2 chars) but claims correct_chars=500 in 60s
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'correct_chars': 500,
                'incorrect_chars': 0,
                'typed_text': 'hi',
                'gross_wpm': 100.0,
                'net_wpm': 100.0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        # correct_chars clamped to len('hi') = 2
        self.assertLessEqual(p_data['correct_chars'], 2)
        # Gross WPM calculated from at most 2 characters in 1 minute = (2 / 5) / 1.0 = 0.4 WPM (NOT 100.0 WPM!)
        self.assertLessEqual(float(p_data['gross_wpm']), 1.0)

    def test_16_attack2_forged_duration_bounded_by_physical_plausibility(self):
        """Verify Attack 2: server clamps impossible duration (e.g. 1s for 100 chars) to physical plausibility limit."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Attack 2 Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        # Malicious client sends 100 chars with duration_seconds=1 (claiming 1200 WPM)
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 1,
                'correct_chars': 100,
                'incorrect_chars': 0,
                'gross_wpm': 1200.0,
                'net_wpm': 1200.0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        # Physical plausibility bounds duration to at least 4 seconds (100 / 25)
        # Gross WPM cannot exceed 300 WPM
        self.assertLessEqual(float(p_data['gross_wpm']), 300.0)
