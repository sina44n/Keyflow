"""
Seed Curriculum Command
Populates the 7-Stage Neuromuscular Academy levels and lessons.
"""
from django.core.management.base import BaseCommand
from lessons.models import Level, Lesson

STAGES_DATA = [
    {
        'level_number': 1,
        'title': 'Home Row Foundations',
        'description': 'Master the tactile anchor keys (A S D F J K L ;) and develop natural neuromuscular index-finger homing.',
        'exercise_content': 'fff jjj ddd kkk sss lll aaa ;;; fj dk sl a; asdf jkl; ff jj dd kk ss ll aa ;; fjdksla; asdfjkl; sad fad lad ask fall lass flask alfa flakes',
        'target_keys': 'A,S,D,F,J,K,L,;',
        'target_wpm': 20,
        'target_accuracy': 95,
        'estimated_seconds': 75,
        'difficulty': 'beginner',
        'objective': 'Develop subconscious homing instincts on F and J without visually looking at the physical keycaps.',
    },
    {
        'level_number': 2,
        'title': 'Top Row Control',
        'description': 'Extend finger arcs upward to master E, I, O, P, Q, W, T, and Y while maintaining home-row anchoring.',
        'exercise_content': 'ee ii oo pp qq ww tt yy quiet power tower write poetry tree equip trip report tweet wire queue reply wire write query pepper troop power route',
        'target_keys': 'E,I,O,P,Q,W,T,Y',
        'target_wpm': 28,
        'target_accuracy': 95,
        'estimated_seconds': 85,
        'difficulty': 'beginner',
        'objective': 'Train neuromuscular muscle memory to extend fingers up and return cleanly to home positions.',
    },
    {
        'level_number': 3,
        'title': 'Bottom Row Control',
        'description': 'Downward finger reach discipline covering B, N, M, V, C, X, and Z with minimal wrist movement.',
        'exercise_content': 'bb nn mm vv cc xx zz zinc basic cabin voice mixer zebra civic novel vacuum vanish calm comb back bacon zoom move nexus venom blaze matrix',
        'target_keys': 'B,N,M,V,C,X,Z',
        'target_wpm': 34,
        'target_accuracy': 95,
        'estimated_seconds': 90,
        'difficulty': 'intermediate',
        'objective': 'Condition precision downward reflex arcs without curling the wrists or losing neutral posture.',
    },
    {
        'level_number': 4,
        'title': 'Common Letter Combinations',
        'description': 'High-frequency English bigrams and trigrams (th, he, in, er, an, re, on, at, en, nd, st, or).',
        'exercise_content': 'the that there them then they their other another think thank stand still state start store order form from front first thing great sound',
        'target_keys': 'th,he,in,er,an,re,on,at',
        'target_wpm': 42,
        'target_accuracy': 96,
        'estimated_seconds': 100,
        'difficulty': 'intermediate',
        'objective': 'Synthesize individual strokes into fluent neuromuscular chunking of common letter n-grams.',
    },
    {
        'level_number': 5,
        'title': 'Word Flow & Cadence',
        'description': 'Complete fluent words with smooth inter-keystroke timing, eliminating cognitive hesitations.',
        'exercise_content': 'flow build crisp light stone clear drift spark craft rhythm pulse speed drift rapid track stream balance surge focus exact drive glide',
        'target_keys': 'flow,cadence,rhythm',
        'target_wpm': 50,
        'target_accuracy': 96,
        'estimated_seconds': 110,
        'difficulty': 'intermediate',
        'objective': 'Eliminate stroke stutter and achieve consistent millisecond cadence between keystrokes.',
    },
    {
        'level_number': 6,
        'title': 'Sentence Rhythm & Shift Discipline',
        'description': 'Real-world sentence syntax, opposite-hand Shift keying, commas, periods, quotes, and punctuation.',
        'exercise_content': 'Precision typing is a craft: focus, breathe, and trust your fingers. When rhythm replaces visual tracking, true speed emerges effortlessly.',
        'target_keys': 'Shift,.,:,!,-',
        'target_wpm': 55,
        'target_accuracy': 97,
        'estimated_seconds': 120,
        'difficulty': 'advanced',
        'objective': 'Master opposite-hand Shift activation and maintain sustained velocity across punctuated syntax.',
    },
    {
        'level_number': 7,
        'title': 'Precision & Speed Endurance',
        'description': 'The ultimate graduation trial: high-velocity technical prose under stringent accuracy and speed gates.',
        'exercise_content': 'True mastery of the keyboard transcends mere finger velocity. It is the silent synchronization of cognition and mechanical execution, where thoughts flow onto the screen without conscious latency or friction.',
        'target_keys': 'All 47 Keys',
        'target_wpm': 60,
        'target_accuracy': 98,
        'estimated_seconds': 140,
        'difficulty': 'expert',
        'objective': 'Demonstrate neuromuscular typing mastery under high cognitive load and elite speed requirements.',
    },
]


class Command(BaseCommand):
    help = 'Seeds the 7-Stage Neuromuscular Academy curriculum levels and lessons.'

    def handle(self, *args, **options):
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded all 7 Academy levels and lessons.'))
