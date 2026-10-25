"""
Seed Curated Practice Passages Command.
"""
from django.core.management.base import BaseCommand
from practice.models import Passage

PASSAGES_DATA = [
    {
        'title': 'The Flow of Thought',
        'category': 'general',
        'difficulty': 'easy',
        'content': 'Typing is the art of translating thought into text without interruption. When your fingers know their places on the keyboard, words flow naturally onto the screen. Every keystroke becomes effortless and rhythmic.',
    },
    {
        'title': 'Mechanical Harmony',
        'category': 'general',
        'difficulty': 'medium',
        'content': 'A quiet room and a responsive keyboard create an environment where focus deepens. Speed is never the primary goal; precision and steady cadence are what allow true velocity to emerge over sustained practice.',
    },
    {
        'title': 'On Silent Craft',
        'category': 'literature',
        'difficulty': 'medium',
        'content': 'The craftsman does not rush the tool. He lets the chisel follow the grain of the wood, and in time, form reveals itself. In the same way, the typist allows rhythm to guide the fingers rather than anxious hurry.',
    },
    {
        'title': 'Principles of Clean Code',
        'category': 'technology',
        'difficulty': 'hard',
        'content': 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. Programs must be written for people to read, and only incidentally for machines to execute.',
    },
    {
        'title': 'The Speed of Light in Fiber',
        'category': 'science',
        'difficulty': 'hard',
        'content': 'Photons guided through pure silicon glass bounce at glancing angles millions of times each second. Information travels at roughly two hundred thousand kilometers per second, bridging oceans and continents in milliseconds.',
    },
    {
        'title': 'Aristotle on Excellence',
        'category': 'quotes',
        'difficulty': 'easy',
        'content': 'We are what we repeatedly do. Excellence, then, is not an act, but a habit. Consistent daily practice transforms unfamiliar movements into permanent muscle memory.',
    },
    {
        'title': 'The Architecture of Thought',
        'category': 'technology',
        'difficulty': 'expert',
        'content': 'Distributed systems demand resilience in the face of partial failure. Each component operates independently, communicating through asynchronous protocols while maintaining eventual consistency across partition boundaries.',
    },
]


class Command(BaseCommand):
    help = 'Seeds curated practice test passages.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding practice passages...')
        created_count = 0
        for item in PASSAGES_DATA:
            obj, created = Passage.objects.get_or_create(
                title=item['title'],
                defaults={
                    'category': item['category'],
                    'difficulty': item['difficulty'],
                    'content': item['content'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  + Added: {obj.title}")
            else:
                self.stdout.write(f"  = Exists: {obj.title}")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(PASSAGES_DATA)} passages ({created_count} newly created).'))
