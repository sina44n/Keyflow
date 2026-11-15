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
        t_a = create_res.json().get('participant_token')

        # Join 3 more typists
        j_b_data = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistB'}, content_type='application/json').json()
        j_b = j_b_data['participant_id']
        t_b = j_b_data.get('participant_token')

        j_c_data = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistC'}, content_type='application/json').json()
        j_c = j_c_data['participant_id']
        t_c = j_c_data.get('participant_token')

        j_d_data = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': 'TypistD'}, content_type='application/json').json()
        j_d = j_d_data['participant_id']
        t_d = j_d_data.get('participant_token')

        # Submissions:
        # Typist A: 100 WPM, 95% Acc, 30s
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': p_a, 'participant_token': t_a, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 95.0,
            'duration_seconds': 30, 'correct_chars': 238, 'incorrect_chars': 12,
        }, content_type='application/json')

        # Typist B: 100 WPM, 98% Acc, 30s -> Beats A on Accuracy
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_b, 'participant_token': t_b, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 98.0,
            'duration_seconds': 30, 'correct_chars': 245, 'incorrect_chars': 5,
        }, content_type='application/json')

        # Typist C: 100 WPM, 98% Acc, 25s -> Beats B on Duration (faster)
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_c, 'participant_token': t_c, 'net_wpm': 100.0, 'gross_wpm': 100.0, 'accuracy': 98.0,
            'duration_seconds': 25, 'correct_chars': 204, 'incorrect_chars': 4,
        }, content_type='application/json')

        # Typist D: 110 WPM, 92% Acc, 30s -> Beats ALL on Net WPM
        self.client.post(f'/api/practice/competitions/{code}/submit/', {
            'participant_id': j_d, 'participant_token': t_d, 'net_wpm': 110.0, 'gross_wpm': 110.0, 'accuracy': 92.0,
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

    def test_17_audit_a_adversarial_all_incorrect_cannot_override_matching_count(self):
        """Audit A Required Adversarial Test:
        Challenge: 'hello', Submitted typed_text: 'xxxxx', Matching: 0.
        Client claims correct_chars=5.
        Server must reject 5 and set correct_chars to 0 independently."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Audit A Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "hello"
        comp.save()

        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'correct_chars': 5,  # Forged client claim
                'incorrect_chars': 0,
                'typed_text': 'xxxxx',  # 0 matching chars with 'hello'
                'gross_wpm': 1.0,
                'net_wpm': 1.0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        # Server must derive matching count independently: 0 correct characters
        self.assertEqual(p_data['correct_chars'], 0)
        self.assertEqual(p_data['incorrect_chars'], 5)
        self.assertEqual(p_data['total_chars'], 5)
        self.assertEqual(float(p_data['accuracy']), 0.0)

    def test_18_audit_a_matching_variations_parity(self):
        """Audit A: Test exact match, partial, longer, shorter, empty, missing typed_text."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Variations Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "hello"
        comp.save()

        # Helper to join a participant and submit
        def run_case(name, typed_text, claimed_correct, claimed_incorrect, duration=60):
            join_res = self.client.post(
                f'/api/practice/competitions/{code}/join/',
                {'display_name': name},
                content_type='application/json',
            )
            join_data = join_res.json()
            pid = join_data['participant_id']
            token = join_data.get('participant_token')
            payload = {
                'participant_id': pid,
                'participant_token': token,
                'duration_seconds': duration,
                'correct_chars': claimed_correct,
                'incorrect_chars': claimed_incorrect,
            }
            if typed_text is not None:
                payload['typed_text'] = typed_text
            res = self.client.post(
                f'/api/practice/competitions/{code}/submit/',
                payload,
                content_type='application/json',
            )
            self.assertEqual(res.status_code, 200)
            return res.json()['participant']

        # 1. Exact match ('hello' vs 'hello')
        p1 = run_case('Exact', 'hello', 5, 0)
        self.assertEqual(p1['correct_chars'], 5)
        self.assertEqual(p1['incorrect_chars'], 0)
        self.assertEqual(p1['total_chars'], 5)
        self.assertEqual(float(p1['accuracy']), 100.0)

        # 2. Partially correct ('helix' vs 'hello' -> 'h','e','l' match (3), 'i','x' err (2))
        p2 = run_case('Partial', 'helix', 10, 0)  # Client forged 10
        self.assertEqual(p2['correct_chars'], 3)
        self.assertEqual(p2['incorrect_chars'], 2)
        self.assertEqual(p2['total_chars'], 5)
        self.assertEqual(float(p2['accuracy']), 60.0)

        # 3. Shorter than challenge ('hel' vs 'hello' -> 3 match, 0 uncorrected)
        p3 = run_case('Shorter', 'hel', 3, 0)
        self.assertEqual(p3['correct_chars'], 3)
        self.assertEqual(p3['incorrect_chars'], 0)
        self.assertEqual(p3['total_chars'], 3)
        self.assertEqual(float(p3['accuracy']), 100.0)

        # 4. Longer than challenge ('hello world' vs 'hello' -> 5 match, 6 uncorrected)
        p4 = run_case('Longer', 'hello world', 5, 0)
        self.assertEqual(p4['correct_chars'], 5)
        self.assertEqual(p4['incorrect_chars'], 6)
        self.assertEqual(p4['total_chars'], 11)
        self.assertEqual(float(p4['accuracy']), 45.45)

        # 5. Empty text ('' vs 'hello' -> 0 match, 0 uncorrected)
        p5 = run_case('Empty', '', 0, 0)
        self.assertEqual(p5['correct_chars'], 0)
        self.assertEqual(p5['incorrect_chars'], 0)
        self.assertEqual(p5['total_chars'], 0)
        self.assertEqual(float(p5['accuracy']), 0.0)

        # 6. Missing typed_text (None) -> follows documented trust policy
        p6 = run_case('Missing', None, 40, 10)
        self.assertEqual(p6['correct_chars'], 40)
        self.assertEqual(p6['incorrect_chars'], 10)
        self.assertEqual(p6['total_chars'], 50)
        self.assertEqual(float(p6['accuracy']), 80.0)

    def test_19_audit_b_forged_incorrect_chars_cannot_inflate_printable_attempts(self):
        """Audit B Required Adversarial Test:
        Challenge: 'hello', Submitted typed_text: 'hi', Client claims correct_chars=2, incorrect_chars=100.
        Server must NOT accept 102 printable attempts; total_chars must bound to len(typed_text)=2.
        Gross WPM must be 0.4 WPM, not 20.2 WPM."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Audit B Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "hello"
        comp.save()

        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'correct_chars': 2,        # Claimed 2 correct
                'incorrect_chars': 100,    # Malicious attempt: 100 fake errors to inflate attempts to 102
                'typed_text': 'hi',        # Only 2 characters actually typed ('h' matches, 'i' mismatch)
                'gross_wpm': 20.2,         # Claimed (102 / 5) / 1.0 = 20.4 WPM
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']

        # Server bounds total_chars to len('hi') = 2 (NOT 102!)
        self.assertEqual(p_data['total_chars'], 2)
        self.assertEqual(p_data['correct_chars'], 1)  # Only 'h' matches 'hello'
        self.assertEqual(p_data['incorrect_chars'], 1) # 'i' does not match 'e'
        # Gross WPM derived from 2 chars in 60s = (2 / 5) / 1.0 = 0.4 WPM
        self.assertEqual(float(p_data['gross_wpm']), 0.4)
        # Net WPM with 1 uncorrected error penalty (1.0 WPM) = max(0, 0.4 - 1.0) = 0.0 WPM
        self.assertEqual(float(p_data['net_wpm']), 0.0)
        # Typed-Position Accuracy = (1 / 2) * 100 = 50.0%
        self.assertEqual(float(p_data['accuracy']), 50.0)

    def test_20_audit_c_physical_duration_upward_rounding_table(self):
        """Audit C: Verify upward rounding (ceil) ensures Gross WPM never exceeds 300 WPM
        for values immediately below, exactly at, and immediately above multiples of 25."""
        import math
        test_cases = [
            (1, 1),
            (24, 1),
            (25, 1),
            (26, 2),  # Crucial test: 26 chars in 1s would be 312 WPM; math.ceil enforces 2s -> 156 WPM
            (49, 2),
            (50, 2),
            (51, 3),
            (99, 4),
            (100, 4),
            (101, 5),
        ]
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Audit C Arena', 'max_participants': 20, 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']

        for total_chars, expected_min_dur in test_cases:
            join_res = self.client.post(
                f'/api/practice/competitions/{code}/join/',
                {'display_name': f'P_{total_chars}'},
                content_type='application/json',
            )
            join_data = join_res.json()
            pid = join_data['participant_id']
            token = join_data.get('participant_token')
            # Client submits duration_seconds=1 for all cases
            submit_res = self.client.post(
                f'/api/practice/competitions/{code}/submit/',
                {
                    'participant_id': pid,
                    'participant_token': token,
                    'duration_seconds': 1,
                    'correct_chars': total_chars,
                    'incorrect_chars': 0,
                },
                content_type='application/json',
            )
            self.assertEqual(submit_res.status_code, 200)
            p_data = submit_res.json()['participant']
            self.assertEqual(p_data['duration_seconds'], expected_min_dur)
            # Computed Gross WPM must NEVER exceed 300.0 WPM
            self.assertLessEqual(float(p_data['gross_wpm']), 300.0)

    def test_21_audit_d_typed_position_accuracy_parity_and_historical_limitation(self):
        """Audit D: Canonical cases for Typed-Position Accuracy vs Full Passage Accuracy
        and demonstration of the historical keystroke accuracy limitation."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Audit D Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "quick brown"  # length 11
        comp.save()

        # Canonical Case: Typed 'quick' (length 5, matching 5) against 'quick brown' (length 11)
        submit_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 60,
                'typed_text': 'quick',
                'correct_chars': 5,
                'incorrect_chars': 0,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res.status_code, 200)
        p_data = submit_res.json()['participant']
        # Typed-Position Accuracy in Competition is 100% (5 matching / 5 typed positions)
        self.assertEqual(float(p_data['accuracy']), 100.0)
        self.assertEqual(p_data['correct_chars'], 5)
        self.assertEqual(p_data['total_chars'], 5)

    def test_22_audit_b_verification_status_distinguishes_verified_vs_unverified(self):
        """Audit B: Verify submission response explicitly distinguishes server_verified
        (when typed_text is provided) from client_reported_unverified (legacy counter fallback)."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Verification Flag Arena', 'max_participants': 10, 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']

        # Player 2 joins while lobby is waiting
        join_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'LegacyPlayer'},
            content_type='application/json',
        )
        pid_2 = join_res.json()['participant_id']
        token_2 = join_res.json().get('participant_token')

        # 1. Verified submission: typed_text supplied
        submit_res_1 = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 30,
                'typed_text': 'Typing with precision',
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(submit_res_1.status_code, 200)
        self.assertEqual(submit_res_1.json().get('verification'), 'server_verified')

        # 2. Unverified submission: typed_text missing (counter fallback)
        submit_res_2 = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_2,
                'participant_token': token_2,
                'duration_seconds': 30,
                'correct_chars': 50,
                'incorrect_chars': 0,
            },
            content_type='application/json',
        )
        self.assertEqual(submit_res_2.status_code, 200)
        self.assertEqual(submit_res_2.json().get('verification'), 'client_reported_unverified')

    def test_23_audit_a_duration_bounding_and_zero_duration_fallback(self):
        """Audit A: Verify duration bounding against short, zero, and boundary inputs."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Duration Audit Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "x" * 200
        comp.save()

        # Helper to join and submit
        def submit_with_dur(display_name, typed_text, dur):
            join = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': display_name}, content_type='application/json')
            join_data = join.json()
            pid = join_data['participant_id']
            token = join_data.get('participant_token')
            return self.client.post(
                f'/api/practice/competitions/{code}/submit/',
                {'participant_id': pid, 'participant_token': token, 'duration_seconds': dur, 'typed_text': typed_text},
                content_type='application/json'
            ).json()['participant']

        # 1. Zero duration -> 0.0 Gross WPM
        p_zero = submit_with_dur('PZero', 'x' * 50, 0)
        self.assertEqual(float(p_zero['gross_wpm']), 0.0)
        self.assertEqual(float(p_zero['net_wpm']), 0.0)

        # 2. Impossible micro duration: 1s for 50 chars -> clamped to 2s (ceil(50/25) = 2)
        p_micro = submit_with_dur('PMicro', 'x' * 50, 1)
        self.assertEqual(p_micro['duration_seconds'], 2)
        self.assertEqual(float(p_micro['gross_wpm']), 300.0)

        # 3. Normal duration: 30s for 50 chars -> 20.0 Gross WPM
        p_norm = submit_with_dur('PNorm', 'x' * 50, 30)
        self.assertEqual(p_norm['duration_seconds'], 30)
        self.assertEqual(float(p_norm['gross_wpm']), 20.0)

    def test_24_audit_d_shared_scenarios_cross_environment_parity(self):
        """Audit D: Validate equivalent scoring inputs across shared scenarios on the backend."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Parity Arena', 'max_participants': 20, 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        comp = Competition.objects.get(code=code)
        comp.challenge_text = "The quick brown fox jumps over the lazy dog today." # length 50
        comp.save()

        def test_scenario(name, typed_text, duration_sec, error_count_claim=0):
            join = self.client.post(f'/api/practice/competitions/{code}/join/', {'display_name': name}, content_type='application/json')
            join_data = join.json()
            pid = join_data['participant_id']
            token = join_data.get('participant_token')
            res = self.client.post(
                f'/api/practice/competitions/{code}/submit/',
                {
                    'participant_id': pid,
                    'participant_token': token,
                    'duration_seconds': duration_sec,
                    'typed_text': typed_text,
                    'error_count': error_count_claim,
                },
                content_type='application/json',
            )
            return res.json()['participant']

        # Scenario 1: Perfect typing (50 chars in 30s)
        p1 = test_scenario('S1_Perfect', comp.challenge_text, 30)
        self.assertEqual(float(p1['gross_wpm']), 20.0)
        self.assertEqual(float(p1['net_wpm']), 20.0)
        self.assertEqual(float(p1['accuracy']), 100.0)

        # Scenario 2: One uncorrected mistake ('The quicX ...' -> 1 uncorrected error)
        one_err_text = "The quicX brown fox jumps over the lazy dog today."
        p2 = test_scenario('S2_OneError', one_err_text, 30)
        # Gross = (50 / 5) / 0.5 = 20.0 WPM
        self.assertEqual(float(p2['gross_wpm']), 20.0)
        # Net = 20.0 - (1 / 0.5) = 18.0 WPM
        self.assertEqual(float(p2['net_wpm']), 18.0)
        # Typed-Position Accuracy = (49 / 50) * 100 = 98.0%
        self.assertEqual(float(p2['accuracy']), 98.0)

        # Scenario 3: Partial passage completion (first 25 chars cleanly in 30s)
        partial_text = comp.challenge_text[:25]
        p3 = test_scenario('S3_Partial', partial_text, 30)
        # Gross = (25 / 5) / 0.5 = 10.0 WPM
        self.assertEqual(float(p3['gross_wpm']), 10.0)
        self.assertEqual(float(p3['net_wpm']), 10.0)
        # Typed-Position Accuracy = 100.0% (protects from 3% bug)
        self.assertEqual(float(p3['accuracy']), 100.0)

        # Scenario 4: Empty session ('' in 30s)
        p4 = test_scenario('S4_Empty', '', 30)
        self.assertEqual(float(p4['gross_wpm']), 0.0)
        self.assertEqual(float(p4['net_wpm']), 0.0)
        self.assertEqual(float(p4['accuracy']), 0.0)

    def test_25_competition_completed_and_cancelled_room_submission_rejection(self):
        """Verify that completed or cancelled competition rooms strictly reject new participant score submissions."""
        # 1. Room already completed
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Closed Room Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        comp = Competition.objects.get(code=code)
        comp.status = 'completed'
        comp.save()

        # Late participant who joined earlier attempts submission to completed room
        part = CompetitionParticipant.objects.create(
            competition=comp,
            user=self.user1,
            display_name='LateTypist',
            status='joined',
        )

        sub_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': part.id,
                'duration_seconds': 30,
                'typed_text': comp.challenge_text,
            },
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertEqual(sub_res.status_code, 400)
        self.assertIn('already completed', sub_res.json()['error'].lower())

        # 2. Room cancelled
        comp.status = 'cancelled'
        comp.save()
        sub_res_cancel = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': part.id,
                'duration_seconds': 30,
                'typed_text': comp.challenge_text,
            },
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertEqual(sub_res_cancel.status_code, 400)
        self.assertIn('already cancelled', sub_res_cancel.json()['error'].lower())

    def test_26_competition_malformed_participant_id_and_idempotent_duplicate_submission(self):
        """Verify malformed participant IDs return 404 rather than 500, and duplicate submissions are idempotent."""
        create_res = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Robustness Arena', 'display_name': 'Host Commander'},
            content_type='application/json',
            **self.host_headers,
        )
        code = create_res.json()['code']
        host_pid = create_res.json()['participant_id']
        comp = Competition.objects.get(code=code)

        # 1. Malformed non-numeric participant ID -> 404 Not Found (not 500 crash)
        bad_id_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': 'malicious-string-id',
                'duration_seconds': 30,
                'typed_text': comp.challenge_text,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(bad_id_res.status_code, 404)

        # 2. First genuine submission -> 200 OK
        first_sub = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'duration_seconds': 30,
                'typed_text': comp.challenge_text,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(first_sub.status_code, 200)
        orig_net = float(first_sub.json()['participant']['net_wpm'])

        # 3. Duplicate submission with forged 300 WPM -> returns 200 idempotent with original scores preserved
        dup_sub = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': host_pid,
                'net_wpm': 300.0,
                'duration_seconds': 5,
                'typed_text': comp.challenge_text,
            },
            content_type='application/json',
            **self.host_headers,
        )
        self.assertEqual(dup_sub.status_code, 200)
        self.assertEqual(float(dup_sub.json()['participant']['net_wpm']), orig_net)
        self.assertEqual(dup_sub.json()['verification'], 'server_verified')

    def test_27_guest_participant_ownership_security_suite(self):
        """Phase 7.7: Comprehensive Guest Participant Ownership Security Suite:
        1. Guest A can submit using Guest A's valid secret token.
        2. Guest B cannot submit using Guest A's public participant ID alone (401).
        3. Guest B cannot submit using Guest A's ID with Guest B's secret token (403).
        4. Guest B cannot submit using an invalid or guessed secret token (403).
        5. Missing guest credentials are rejected (401).
        6. A guest cannot overwrite another guest's result.
        7. Registered-user ownership checks continue working.
        8. Public lobby responses never expose guest secrets or token hashes.
        9. Existing duplicate-submission and completed-room protections remain intact.
        """
        # Step A: Guest A creates competition
        create_res = self.client.post(
            '/api/practice/competitions/',
            {
                'name': 'Guest Ownership Security Arena',
                'challenge_text': 'Secure typing requires participant ownership tokens.',
                'display_name': 'Guest Host A',
            },
            content_type='application/json',
        )
        self.assertEqual(create_res.status_code, 201)
        create_data = create_res.json()
        code = create_data['code']
        pid_a = create_data['participant_id']
        token_a = create_data.get('participant_token')
        self.assertTrue(token_a, 'Guest A must receive a cryptographically secure participant_token upon creation')
        self.assertGreater(len(token_a), 20)

        # Step B: Guest B joins competition
        join_res = self.client.post(
            f'/api/practice/competitions/{code}/join/',
            {'display_name': 'Guest Rival B'},
            content_type='application/json',
        )
        self.assertEqual(join_res.status_code, 201)
        join_data = join_res.json()
        pid_b = join_data['participant_id']
        token_b = join_data.get('participant_token')
        self.assertTrue(token_b, 'Guest B must receive a cryptographically secure participant_token upon joining')
        self.assertNotEqual(token_a, token_b)

        # Requirement 8: Public lobby response NEVER exposes guest secrets or hashes
        detail_res = self.client.get(f'/api/practice/competitions/{code}/')
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.json()
        for p in detail_data['participants']:
            self.assertNotIn('guest_token', p)
            self.assertNotIn('guest_token_hash', p)
            self.assertNotIn('participant_token', p)

        challenge = create_data['challenge_text']

        # Requirement 2 & 5: Guest B cannot submit using Guest A's public ID alone (missing credentials)
        no_token_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_a,
                'duration_seconds': 30,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(no_token_res.status_code, 401)
        self.assertIn('token required', no_token_res.json()['error'].lower())

        # Requirement 4: Guest B cannot submit using an invalid or guessed secret
        fake_token_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_a,
                'participant_token': 'wrong-guessed-token-12345',
                'duration_seconds': 30,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(fake_token_res.status_code, 403)
        self.assertIn('invalid participant token', fake_token_res.json()['error'].lower())

        # Requirement 3 & 6: Guest B cannot submit using Guest A's ID with Guest B's secret
        cross_token_res = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_a,
                'participant_token': token_b,
                'duration_seconds': 30,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(cross_token_res.status_code, 403)
        self.assertIn('invalid participant token', cross_token_res.json()['error'].lower())

        # Verify Guest A is still uncompleted in database
        part_a_db = CompetitionParticipant.objects.get(id=pid_a)
        self.assertEqual(part_a_db.status, 'joined')
        self.assertEqual(float(part_a_db.net_wpm), 0.0)

        # Requirement 1: Guest A CAN submit using Guest A's valid secret
        valid_sub_a = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_a,
                'participant_token': token_a,
                'duration_seconds': 30,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(valid_sub_a.status_code, 200)
        part_a_db.refresh_from_db()
        self.assertEqual(part_a_db.status, 'completed')
        self.assertGreater(float(part_a_db.net_wpm), 0.0)

        # Requirement 9: Duplicate submission with Guest A's token preserves original score
        orig_wpm = float(part_a_db.net_wpm)
        dup_a = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_a,
                'participant_token': token_a,
                'net_wpm': 300.0,
                'duration_seconds': 5,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(dup_a.status_code, 200)
        part_a_db.refresh_from_db()
        self.assertEqual(float(part_a_db.net_wpm), orig_wpm)

        # Guest B submits their genuine result
        valid_sub_b = self.client.post(
            f'/api/practice/competitions/{code}/submit/',
            {
                'participant_id': pid_b,
                'participant_token': token_b,
                'duration_seconds': 35,
                'typed_text': challenge,
            },
            content_type='application/json',
        )
        self.assertEqual(valid_sub_b.status_code, 200)

        # Requirement 7: Registered-user ownership check continues working
        reg_create = self.client.post(
            '/api/practice/competitions/',
            {'name': 'Registered Arena', 'display_name': 'Host Reg'},
            content_type='application/json',
            **self.host_headers,
        )
        reg_code = reg_create.json()['code']
        reg_pid = reg_create.json()['participant_id']

        # Rival user attempts submitting for host -> 403
        rival_attack = self.client.post(
            f'/api/practice/competitions/{reg_code}/submit/',
            {
                'participant_id': reg_pid,
                'duration_seconds': 30,
                'typed_text': 'any text',
            },
            content_type='application/json',
            **self.user1_headers,
        )
        self.assertEqual(rival_attack.status_code, 403)
        self.assertIn('not authorized', rival_attack.json()['error'].lower())
