"""Accounts Serializers — Registration, Auth, Profile, Preferences."""

from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User, UserProfile, UserPreferences


class UserSerializer(serializers.ModelSerializer):
    """Public-safe user representation (used by Knox)."""

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'is_email_verified', 'date_joined']
        read_only_fields = ['id', 'is_email_verified', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer with password confirmation validation."""
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2']

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters.')
        if not value.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError(
                'Username may only contain letters, numbers, hyphens, and underscores.'
            )
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Login by email + password."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile read/write serializer."""

    class Meta:
        model = UserProfile
        fields = ['display_name', 'bio', 'avatar_url', 'timezone', 'updated_at']
        read_only_fields = ['updated_at']


class UserPreferencesSerializer(serializers.ModelSerializer):
    """User preferences serializer — controls theme, goals, sound, language, etc."""

    class Meta:
        model = UserPreferences
        fields = [
            'theme_preset',
            'daily_goal_minutes',
            'preferred_duration',
            'sound_enabled',
            'keyboard_visual_enabled',
            'reduced_motion',
            'language',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class FullUserSerializer(serializers.ModelSerializer):
    """Complete user payload returned after login or /me."""
    profile = UserProfileSerializer(read_only=True)
    preferences = UserPreferencesSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'is_email_verified', 'date_joined', 'profile', 'preferences']
        read_only_fields = fields


class PasswordChangeSerializer(serializers.Serializer):
    """Authenticated password change."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'New passwords do not match.'})
        return data


class EmailVerificationSerializer(serializers.Serializer):
    """Email verification token validation."""
    token = serializers.CharField(max_length=64)

