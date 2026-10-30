"""Multiplayer Racing Room & Real-Time Synchronization Tests."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from games.models import MultiplayerRoom, RoomParticipant


class MultiplayerRacingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_room_and_assign_host_lane_0(self):
        url = reverse('racing_rooms_list_create')
        payload = {
            'displayName': 'SpeedDemon',
            'roomName': 'Midnight Grand Prix',
            'track': 'neon-city',
            'tier': 2,
            'targetDistance': 1200,
            'vehicleId': 'cyber-phantom',
            'color': '#06B6D4',
            'nitroStyle': 'electric',
            'wheelFinish': 'gold',
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('room', res.data)
        self.assertIn('participant', res.data)

        room_code = res.data['room']['code']
        self.assertTrue(room_code.startswith('ROOM-'))
        self.assertEqual(res.data['room']['status'], 'waiting')
        self.assertEqual(res.data['participant']['lane'], 0)
        self.assertEqual(res.data['participant']['display_name'], 'SpeedDemon')
        self.assertEqual(res.data['participant']['vehicle_id'], 'cyber-phantom')

    def test_join_room_and_assign_next_lane(self):
        # Create room first
        create_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'Player1',
        }, format='json')
        room_code = create_res.data['room']['code']

        # Player 2 joins
        join_url = reverse('racing_room_join', kwargs={'code': room_code})
        join_res = self.client.post(join_url, {
            'displayName': 'Player2',
            'vehicleId': 'viper-venom',
            'guestId': 'guest_p2_123',
        }, format='json')

        self.assertEqual(join_res.status_code, status.HTTP_200_OK)
        self.assertEqual(join_res.data['participant']['lane'], 1)
        self.assertEqual(join_res.data['participant']['display_name'], 'Player2')

        # Player 3 joins
        join_res3 = self.client.post(join_url, {
            'displayName': 'Player3',
            'vehicleId': 'shadow-specter',
            'guestId': 'guest_p3_456',
        }, format='json')
        self.assertEqual(join_res3.data['participant']['lane'], 2)

    def test_room_full_rejection(self):
        # Create room
        create_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'Player1',
        }, format='json')
        room_code = create_res.data['room']['code']
        join_url = reverse('racing_room_join', kwargs={'code': room_code})

        # Fill room to max 4
        self.client.post(join_url, {'displayName': 'P2', 'guestId': 'g2'}, format='json')
        self.client.post(join_url, {'displayName': 'P3', 'guestId': 'g3'}, format='json')
        self.client.post(join_url, {'displayName': 'P4', 'guestId': 'g4'}, format='json')

        # 5th player attempts to join
        res5 = self.client.post(join_url, {'displayName': 'P5', 'guestId': 'g5'}, format='json')
        self.assertEqual(res5.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('full', res5.data['error'].lower())

    def test_ready_and_countdown_transition(self):
        create_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'Host',
        }, format='json')
        room_code = create_res.data['room']['code']
        p1_id = create_res.data['participant']['id']

        # Join second player
        join_res = self.client.post(reverse('racing_room_join', kwargs={'code': room_code}), {
            'displayName': 'Racer2',
            'guestId': 'g2',
        }, format='json')
        p2_id = join_res.data['participant']['id']

        # Player 2 readies up
        ready_url = reverse('racing_room_ready', kwargs={'code': room_code})
        res = self.client.post(ready_url, {'participantId': p2_id, 'ready': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Host was already ready, so now all ready -> countdown
        self.assertEqual(res.data['room']['status'], 'countdown')
        self.assertIsNotNone(res.data['room']['countdown_started_at'])

    def test_live_telemetry_sync(self):
        create_res = self.client.post(reverse('racing_rooms_list_create'), {
            'displayName': 'RacerAlpha',
        }, format='json')
        room_code = create_res.data['room']['code']
        p_id = create_res.data['participant']['id']

        sync_url = reverse('racing_room_sync', kwargs={'code': room_code})
        sync_res = self.client.post(sync_url, {
            'participantId': p_id,
            'distance': 450.5,
            'speed': 32.4,
            'wpm': 94,
            'accuracy': 98.5,
            'placement': 1,
        }, format='json')

        self.assertEqual(sync_res.status_code, status.HTTP_200_OK)
        participant_data = next(p for p in sync_res.data['participants'] if p['id'] == p_id)
        self.assertEqual(participant_data['distance'], 450.5)
        self.assertEqual(participant_data['wpm'], 94)

