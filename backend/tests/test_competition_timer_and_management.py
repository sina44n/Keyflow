"""
Unit tests for KEYFLOW Competition Timer Modes, Lobby Management (Edit/Delete), and Persistence.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from practice.models import Competition, CompetitionParticipant

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def host_user(db):
    return User.objects.create_user(
        username='competition_host',
        email='host@keyflow.local',
        password='HostPassword123!',
    )

@pytest.fixture
def rival_user(db):
    return User.objects.create_user(
        username='competition_rival',
        email='rival@keyflow.local',
        password='RivalPassword123!',
    )

@pytest.mark.django_db
class TestCompetitionTimerAndManagement:

    def test_create_room_with_optional_timer(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        # 1. Create with 60 seconds timer
        payload = {
            'name': 'Speed Finals 60s',
            'challenge_type': 'words',
            'target_limit': 50,
            'max_participants': 8,
            'time_limit_seconds': 60,
            'display_name': 'Host Pro',
        }
        res = api_client.post('/api/practice/competitions/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.data
        assert data['competition_mode'] == 'timed'
        assert data['time_limit_seconds'] == 60
        assert data['is_timed'] is True

        code = data['code']
        comp = Competition.objects.get(code=code)
        assert comp.competition_mode == 'timed'
        assert comp.time_limit_seconds == 60
        assert comp.started_at is None
        assert comp.ended_at is None

    def test_create_room_unlimited_text_completion(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        # Without timer
        payload = {
            'name': 'Marathon Sprint',
            'challenge_type': 'words',
            'target_limit': 100,
            'max_participants': 10,
            'time_limit_seconds': None,
            'display_name': 'Host Pro',
        }
        res = api_client.post('/api/practice/competitions/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        data = res.data
        assert data['competition_mode'] == 'text_completion'
        assert data['time_limit_seconds'] is None
        assert data['is_timed'] is False

    def test_host_can_edit_waiting_competition(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        create_res = api_client.post('/api/practice/competitions/', {
            'name': 'Initial Room Name',
            'challenge_type': 'words',
            'target_limit': 25,
            'max_participants': 5,
        }, format='json')
        code = create_res.data['code']

        # Edit room properties
        patch_res = api_client.patch(f'/api/practice/competitions/{code}/', {
            'name': 'Updated Room Name',
            'target_limit': 50,
            'max_participants': 12,
            'time_limit_seconds': 30,
            'challenge_text': 'Updated custom challenge text for test.',
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK
        updated_data = patch_res.data
        assert updated_data['name'] == 'Updated Room Name'
        assert updated_data['target_limit'] == 50
        assert updated_data['max_participants'] == 12
        assert updated_data['time_limit_seconds'] == 30
        assert updated_data['competition_mode'] == 'timed'
        assert updated_data['challenge_text'] == 'Updated custom challenge text for test.'

    def test_non_host_cannot_edit_or_delete_competition(self, api_client, host_user, rival_user):
        api_client.force_authenticate(user=host_user)
        create_res = api_client.post('/api/practice/competitions/', {
            'name': 'Secure Host Room',
        }, format='json')
        code = create_res.data['code']

        # Rival attempts to edit
        api_client.force_authenticate(user=rival_user)
        patch_res = api_client.patch(f'/api/practice/competitions/{code}/', {
            'name': 'Hacked Room Name',
        }, format='json')
        assert patch_res.status_code == status.HTTP_403_FORBIDDEN

        # Rival attempts to delete
        delete_res = api_client.delete(f'/api/practice/competitions/{code}/')
        assert delete_res.status_code == status.HTTP_403_FORBIDDEN

        # Room still exists
        assert Competition.objects.filter(code=code).exists()

    def test_cannot_edit_started_or_completed_competition(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        create_res = api_client.post('/api/practice/competitions/', {
            'name': 'Room to Start',
        }, format='json')
        code = create_res.data['code']

        # Start competition
        start_res = api_client.post(f'/api/practice/competitions/{code}/start/')
        assert start_res.status_code == status.HTTP_200_OK
        assert start_res.data['status'] == 'active'

        # Attempt to edit active room
        patch_res = api_client.patch(f'/api/practice/competitions/{code}/', {
            'name': 'Mid-game Change',
        }, format='json')
        assert patch_res.status_code == status.HTTP_400_BAD_REQUEST

    def test_synchronized_server_timing_lifecycle(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        create_res = api_client.post('/api/practice/competitions/', {
            'name': 'Synchronized 15s Trial',
            'time_limit_seconds': 15,
        }, format='json')
        code = create_res.data['code']

        # Start room
        start_res = api_client.post(f'/api/practice/competitions/{code}/start/')
        assert start_res.status_code == status.HTTP_200_OK
        data = start_res.data
        assert data['status'] == 'active'
        assert data['started_at'] is not None
        assert data['ended_at'] is not None
        assert data['time_remaining_seconds'] is not None
        assert data['time_remaining_seconds'] <= 15
        assert data['time_remaining_seconds'] >= 14

    def test_host_can_delete_waiting_competition(self, api_client, host_user):
        api_client.force_authenticate(user=host_user)
        create_res = api_client.post('/api/practice/competitions/', {
            'name': 'Room to Delete',
        }, format='json')
        code = create_res.data['code']
        assert Competition.objects.filter(code=code).exists()

        delete_res = api_client.delete(f'/api/practice/competitions/{code}/')
        assert delete_res.status_code == status.HTTP_200_OK
        assert not Competition.objects.filter(code=code).exists()
