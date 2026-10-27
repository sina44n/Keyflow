"""
Seed Curriculum Command
Populates the 7-Stage Neuromuscular Academy levels and lessons.
Clean, authentic progressive text without repetitive character spam.
"""
from django.core.management.base import BaseCommand
from lessons.models import Level, Lesson

STAGES_DATA = [
    {
        'level_number': 1,
        'title': 'Home Row Foundations',
        'description': 'Master tactile anchor keys (A S D F J K L ;) and develop natural index-finger homing.',
        'exercise_content': 'a lad ask dad for a salad as all lads fall as a flask falls',
        'target_keys': 'A,S,D,F,J,K,L,;',
        'target_wpm': 20,
        'target_accuracy': 92,
        'estimated_seconds': 60,
        'difficulty': 'beginner',
        'objective': 'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J.',
    },
    {
        'level_number': 2,
        'title': 'Home-Row Mastery & Fluency',
        'description': 'Finger independence, bilateral coordination, and fluid word formation.',
        'exercise_content': 'a glad lad asked dad for a salad and all lads shall fall as a flask falls safely',
        'target_keys': 'A,S,D,F,J,K,L,;',
        'target_wpm': 25,
        'target_accuracy': 94,
        'estimated_seconds': 65,
        'difficulty': 'beginner',
        'objective': 'Strengthen finger independence, home-row accuracy, rhythm, and word formation.',
    },
    {
        'level_number': 3,
        'title': 'Top Row Control',
        'description': 'Extend fingers upward to master Q, W, E, R, T, Y, U, I, O, P with home-row recovery.',
        'exercise_content': 'we write clear letters to our friends as the sweet water drops fall upon the quiet flowers',
        'target_keys': 'Q,W,E,R,T,Y,U,I,O,P',
        'target_wpm': 30,
        'target_accuracy': 94,
        'estimated_seconds': 65,
        'difficulty': 'intermediate',
        'objective': 'Train fingers to stretch upward into the top row cleanly and recover home-row posture without hesitation.',
    },
    {
        'level_number': 4,
        'title': 'Bottom Row Control',
        'description': 'Downward finger reach discipline covering Z, X, C, V, B, N, M with neutral wrists.',
        'exercise_content': 'six big devils from japan quickly forgot how to amaze every bronze wizard with great dexterity',
        'target_keys': 'Z,X,C,V,B,N,M',
        'target_wpm': 35,
        'target_accuracy': 95,
        'estimated_seconds': 70,
        'difficulty': 'intermediate',
        'objective': 'Develop accurate downward reaches and integrate the full 26-letter alphabet.',
    },
    {
        'level_number': 5,
        'title': 'Numbers, Capitalization & Punctuation',
        'description': 'Real-world numbers, opposite-hand Shift discipline, commas, periods, and syntax.',
        'exercise_content': 'In 2026, over 85% of modern work relies on keyboard skill. Focus on accuracy first, and speed will follow naturally!',
        'target_keys': '0-9,Shift,.,,,?,!',
        'target_wpm': 40,
        'target_accuracy': 95,
        'estimated_seconds': 75,
        'difficulty': 'advanced',
        'objective': 'Extend touch typing beyond lowercase letters to numbers, Shift coordination, and punctuation.',
    },
    {
        'level_number': 6,
        'title': 'Advanced Fluency & Real-World Typing',
        'description': 'Multi-clause sentence flow, professional prose, paragraphs, and graduation trial.',
        'exercise_content': 'Mastery of the keyboard is the silent art of turning thought into expression without hesitation. From the humble home row to complex prose, your fingers now move with instinct, speed, and grace. Congratulations on graduating the KEYFLOW Academy!',
        'target_keys': 'Full Keyboard',
        'target_wpm': 55,
        'target_accuracy': 97,
        'estimated_seconds': 90,
        'difficulty': 'expert',
        'objective': 'Develop consistent, accurate, practical typing fluency across complex sentences and paragraphs.',
    },
    {
        'level_number': 7,
        'title': 'Precision & Speed Endurance',
        'description': 'Velocity sprints, extreme precision, and sustained blind-typing mastery.',
        'exercise_content': 'You have conquered the complete spectrum of touch typing. Speed, rhythm, and accuracy are now your second nature.',
        'target_keys': 'Mastery Tier',
        'target_wpm': 60,
        'target_accuracy': 97,
        'estimated_seconds': 90,
        'difficulty': 'expert',
        'objective': 'Achieve complete neuromuscular flow: sustain 60+ WPM with 97%+ precision across challenging trials.',
    },
]


class Command(BaseCommand):
    help = 'Seeds the 7-Stage Neuromuscular Academy curriculum levels and lessons.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all-4200',
            action='store_true',
            help='Seed all 4,200 individual curriculum lessons (7 stages x 600) into database.'
        )
        parser.add_argument(
            '--all-600',
            action='store_true',
            help='Seed all 600 Stage 1 lessons into database.'
        )

    def handle(self, *args, **options):
        seed_4200 = options.get('all_4200', False)
        seed_600 = options.get('all_600', False)
        self.stdout.write('Seeding 7-Stage Neuromuscular Academy curriculum...')
        for data in STAGES_DATA:
            lvl_num = data['level_number']
            level, _ = Level.objects.update_or_create(
                level_number=lvl_num,
                defaults={
                    'title': data['title'],
                    'description': data['description'],
                    'order': lvl_num,
                }
            )

            Lesson.objects.update_or_create(
                level=level,
                title=f'Stage {lvl_num}: {data["title"]}',
                defaults={
                    'objective': data['objective'],
                    'description': data['description'],
                    'exercise_content': data['exercise_content'],
                    'target_keys': data['target_keys'],
                    'target_wpm': data['target_wpm'],
                    'target_accuracy': data['target_accuracy'],
                    'estimated_seconds': data['estimated_seconds'],
                    'difficulty': data['difficulty'],
                    'order': 1,
                    'is_published': True,
                }
            )
            self.stdout.write(f'  [OK] Level {lvl_num}: {data["title"]}')

        if seed_4200 or seed_600:
            import json, os, re
            curriculum_dir = os.path.join(
                os.path.dirname(__file__),
                '..', '..', '..', '..', 'frontend', 'src', 'data', 'curriculum'
            )
            stages_to_seed = range(1, 8) if seed_4200 else [1]
            total_seeded = 0

            for stage_num in stages_to_seed:
                stage_file = os.path.join(curriculum_dir, f'stage{stage_num}Data.js')
                if not os.path.exists(stage_file):
                    self.stdout.write(self.style.WARNING(f'File not found: {stage_file}'))
                    continue

                with open(stage_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                match = re.search(rf'STAGE_{stage_num}_LESSONS\s*=\s*(\[.*\]);', content, re.DOTALL)
                if not match:
                    self.stdout.write(self.style.WARNING(f'Could not parse STAGE_{stage_num}_LESSONS from {stage_file}'))
                    continue

                lessons_json = json.loads(match.group(1))
                stage_obj = Level.objects.get(level_number=stage_num)
                self.stdout.write(f'Seeding {len(lessons_json)} lessons for Stage {stage_num}: {stage_obj.title}...')

                for l in lessons_json:
                    Lesson.objects.update_or_create(
                        slug=l['id'],
                        defaults={
                            'level': stage_obj,
                            'title': l['title'],
                            'objective': l['objective'],
                            'exercise_content': l['exerciseText'],
                            'target_keys': ','.join(l['targetKeys']) if isinstance(l['targetKeys'], list) else str(l['targetKeys']),
                            'target_wpm': l['targetWpm'],
                            'target_accuracy': l['targetAccuracy'],
                            'estimated_seconds': l['estimatedSeconds'],
                            'difficulty': l['difficulty'],
                            'order': l['lessonInUnit'],
                            'is_published': True,
                        }
                    )
                    total_seeded += 1

            self.stdout.write(self.style.SUCCESS(f'Successfully seeded {total_seeded} individual lessons.'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded all 7 Academy levels and lessons.'))

