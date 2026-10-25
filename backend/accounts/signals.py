"""
Accounts Signals — Auto-create Profile and Preferences on new User creation.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile, UserPreferences


@receiver(post_save, sender=User)
def create_user_profile_and_preferences(sender, instance, created, **kwargs):
    """Automatically create UserProfile and UserPreferences on User creation."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
        UserPreferences.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save profile when user is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
