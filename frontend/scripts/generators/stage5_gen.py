"""
Stage 5 Generator: Word Flow & Cadence (600 Levels)
Keys: Full lowercase alphabet, natural English words, smooth transitions, metronome cadence. Zero numbers.
Allowed characters: [abcdefghijklmnopqrstuvwxyz,.;- ]
Progressive lengths from 40 chars (L1) to 800+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 5
STAGE_TITLE = "Word Flow & Cadence"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Word Cadence", "Space Timing", "Metronome Rhythm", "Fluidity"]

ALLOWED = set("abcdefghijklmnopqrstuvwxyz,.;- ")

SUBJECTS = [
    "the gentle evening tide", "a steady rhythmic cadence", "the experienced artisan",
    "clear morning sunlight", "an ancient stone walkway", "the patient master craftsperson",
    "a deep melodic rhythm", "the quiet forest stream", "every seasoned marathoner",
    "the calm library courtyard", "a balanced and steady tempo", "the natural acoustic echo",
    "each thoughtful sentence", "the timeless literary passage", "a focused and relaxed typist",
    "the harmonic musical phrase", "every quiet summer dawn", "a smooth seamless transition",
    "the dedicated visual artist", "an elegant poetic narrative"
]

ACTIONS = [
    "flows smoothly across the wide tranquil harbor",
    "maintains an effortless pace without any pause or hesitation",
    "shapes fine materials with quiet confidence and disciplined care",
    "warms the weathered cobblestones outside the busy village bakery",
    "winds gently along the rolling green hillside toward the sea",
    "creates lasting beauty through steady and deliberate motions",
    "resonates throughout the silent auditorium with profound clarity",
    "glides quietly beneath the low hanging branches of the weeping willows",
    "maintains a steady breathing pattern over long and winding distances",
    "provides a peaceful sanctuary for contemplative reading and study",
    "eliminates unnecessary tension from the fingers and wrists",
    "bounces cleanly off the polished wooden panels of the hall",
    "carries the listener forward on an uninterrupted stream of thought",
    "captures the essence of human experience with timeless elegance",
    "strikes each key with gentle precision and consistent metronome timing",
    "resolves gracefully into a peaceful and satisfying final cadence",
    "awakens the sleeping valley with golden rays of gentle warmth",
    "bridges adjacent words together without introducing any delayed pauses",
    "blends vibrant shades of color across the textured canvas surface",
    "unfolds with natural rhythm and captivating emotional depth"
]

BASE_CLAUSES = []
for s in SUBJECTS:
    for a in ACTIONS:
        cl = f"{s} {a}"
        if all(c in ALLOWED for c in cl):
            BASE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("High-Frequency Monosyllabic Cadence", ["Monosyllabic"], ["monosyllabic-cadence", "rhythm-control"]),
    ("Alternating Word Length Cadence", ["Varied Lengths"], ["length-alternation", "syllable-flow"]),
    ("Natural Collocations & Phrasal Verbs", ["Collocations"], ["phrasal-cadence", "natural-flow"]),
    ("Spacebar Transition Synchronization", ["Spacebar"], ["spacebar-sync", "thumb-economy"]),
    ("Short to Medium Word Flow", ["2 to 5 Letters"], ["word-streams", "balanced-pacing"]),
    ("Metronome Typing Tempo", ["Metronome"], ["metronome-tempo", "steady-keystrokes"]),
    ("Conversational English Flow", ["Conversational"], ["conversational-flow", "uninterrupted-rhythm"]),
    ("Balanced Bilateral Word Pairs", ["Bilateral"], ["bilateral-pairs", "two-hand-balance"]),
    ("Rhythm Across Consonant Blends", ["Blends"], ["blend-transitions", "smooth-articulation"]),
    ("Smooth Velocity Regulation", ["Velocity"], ["speed-regulation", "momentum-maintenance"]),
    ("Natural Prose Flow Alpha", ["Prose Flow"], ["natural-prose", "literary-flow"]),
    ("Eliminating Inter-Word Hesitation", ["Zero Pause"], ["hesitation-removal", "fluid-bridges"]),
    ("Sustained Multi-Sentence Cadence", ["Multi-Sentence"], ["sentence-cadence", "extended-rhythm"]),
    ("Varied Sentence Length Cadence", ["Dynamic Syntax"], ["dynamic-syntax", "breath-pacing"]),
    ("Narrative Cadence with Natural Breaks", ["Narrative"], ["narrative-flow", "clause-balance"]),
    ("Extended Fluent Passages", ["Extended Fluency"], ["extended-fluency", "passage-stamina"]),
    ("Speed Uniformity Under Fatigue", ["Uniform Speed"], ["fatigue-resistance", "uniform-timing"]),
    ("Dual-Hand Cadence Balance", ["Dual-Hand"], ["cadence-balance", "bilateral-symmetry"]),
    ("High-Tempo Continuous Word Streams", ["High-Tempo"], ["word-streams", "velocity-flow"]),
    ("Milestone Cadence & Flow Assessment", ["Comprehensive Flow"], ["mid-assessment", "cadence-benchmark"]),
    ("Neurological Cadence Synchronization", ["Neurological"], ["neural-sync", "subconscious-pacing"]),
    ("Natural Literature Flow", ["Literature"], ["literature-cadence", "artistic-prose"]),
    ("Rhythmic Paragraph Transitions", ["Paragraphs"], ["paragraph-transitions", "block-rhythm"]),
    ("Complex Prose Tempo Regulation", ["Tempo Control"], ["complex-tempo", "deliberate-speed"]),
    ("Rapid-Fire Word Stream Sprints", ["Word Sprints"], ["stream-sprints", "burst-cadence"]),
    ("Sustained Multi-Paragraph Flow", ["Multi-Paragraph"], ["sustained-flow", "marathon-cadence"]),
    ("High-WPM Cadence Endurance", ["High-WPM"], ["wpm-endurance", "continuous-velocity"]),
    ("Dynamic Acceleration and Deceleration", ["Dynamic Tempo"], ["dynamic-tempo", "speed-control"]),
    ("Zero-Hesitation Fluency Marathon", ["Fluency Marathon"], ["fluency-marathon", "effortless-mastery"]),
    ("Stage 5 Grandmaster Capstone", ["All Cadence Skills"], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage5_lessons():
    """Generates 600 unique, progressively longer Stage 5 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 40, 80
            elif level_num <= 100:
                target_min, target_max = 80, 145
            elif level_num <= 200:
                target_min, target_max = 145, 235
            elif level_num <= 300:
                target_min, target_max = 235, 345
            elif level_num <= 400:
                target_min, target_max = 345, 480
            elif level_num <= 500:
                target_min, target_max = 480, 620
            elif level_num <= 580:
                target_min, target_max = 620, 750
            else:
                target_min, target_max = 750, 1000
            
            assembled = []
            curr_len = 0
            attempts = 0
            
            while curr_len < target_min or ". ".join(assembled) + "." in seen_texts:
                cl = BASE_CLAUSES[(clause_idx + attempts) % num_clauses]
                assembled.append(cl)
                curr_len = sum(len(c) + 2 for c in assembled)
                attempts += 1
                if curr_len > target_max and len(assembled) > 1:
                    break
            
            clause_idx = (clause_idx + len(assembled)) % num_clauses
            text = ". ".join(assembled) + "."
            
            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 5 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Cadence Assessment Benchmark"
                objective = f"Demonstrate steady metronome typing speed and uninterrupted word flow across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Eliminate inter-word pause delays and maintain a continuous rhythmic typing flow."
            
            lesson = build_lesson(
                stage_id=STAGE_ID,
                stage_title=STAGE_TITLE,
                level_num=level_num,
                unit_num=unit_idx,
                unit_label=unit_label,
                lesson_in_unit=lesson_in_unit,
                title=title,
                objective=objective,
                text=text,
                target_keys=target_keys,
                home_keys=HOME_KEYS,
                skills=skills,
            )
            lessons.append(lesson)
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 5, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 5, got {len(seen_texts)}"
    return lessons
