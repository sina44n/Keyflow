"""
Stage 3 Generator: Bottom Row Control (600 Levels)
Keys: Full lowercase alphabet (A-Z) + comma (,) + period (.) + semicolon (;) + Spacebar
Focus on downward finger curls (Z, X, C, V, B, N, M). Zero numbers.
Allowed characters: [abcdefghijklmnopqrstuvwxyz,.; ]
Progressive lengths from 30 chars (L1) to 680+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 3
STAGE_TITLE = "Bottom Row Control"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Z", "X", "C", "V", "B", "N", "M", ",", "."]

ALLOWED = set("abcdefghijklmnopqrstuvwxyz,.; ")

SUBJECTS = [
    "the calm bronze wizard", "six big devils from japan", "the quick brown fox",
    "the brave civic leader", "a vibrant young musician", "the dynamic silver robot",
    "every wise traveler", "the nimble black cat", "a curious modern scholar",
    "the quiet bronze sculptor", "twenty brave sailors", "the diligent botanist",
    "the famous jazz musician", "the velvet dawn breeze", "an ambitious young inventor",
    "the experienced captain", "the clever mountain guide", "every careful typist",
    "the silent arctic wolf", "the graceful marathon runner"
]

ACTIONS = [
    "quickly jumped over the lazy sleeping dog",
    "examined the zinc flux with calm precision",
    "packed my box with five dozen vibrant quartz jugs",
    "discovered a mysterious cavern beneath the frozen lake",
    "played complex jazz melodies on the silver saxophone",
    "navigated the dangerous maze with admirable courage",
    "observed the subtle movement of celestial bodies",
    "measured the exact velocity of the vibrating pendulum",
    "painted vibrant landscapes using rich oil colors",
    "studied the ancient manuscripts found inside the vault",
    "solved the puzzling mystery with sharp logical deduction",
    "repaired the intricate clockwork mechanism with small tools",
    "traveled through vibrant market towns along the river bank",
    "planted diverse botanical specimens across the fertile garden",
    "analyzed the chemical composition of the volcanic rock",
    "composed a graceful symphony inspired by the ocean waves",
    "built a sturdy wooden vessel capable of crossing wide waters",
    "uncovered valuable historical artifacts beneath the dry sand",
    "demonstrated remarkable balance while crossing the narrow bridge",
    "recorded accurate scientific observations in the notebook"
]

BASE_CLAUSES = []
for s in SUBJECTS:
    for a in ACTIONS:
        cl = f"{s} {a}"
        if all(c in ALLOWED for c in cl):
            BASE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("V and M Index Downward Curls", ["V", "M"], ["downward-curls", "index-flexion"]),
    ("C and Comma Middle Finger Downward Stabs", ["C", ","], ["middle-finger-curl", "comma-rhythm"]),
    ("X and Period Ring Finger Downward Curls", ["X", "."], ["ring-finger-curl", "period-pause"]),
    ("Z and Bottom Pinky Mobility", ["Z"], ["pinky-mobility", "bottom-corner"]),
    ("B and N Deep Index Extensions", ["B", "N"], ["deep-extensions", "center-bottom"]),
    ("Three-Row Vertical Transitions", ["All Rows"], ["vertical-transitions", "row-skipping"]),
    ("Common Bottom-Row Digrams", ["C", "K", "N", "G", "C", "H"], ["bottom-digrams", "consonant-curls"]),
    ("Comma and Period Cadence", [",", "."], ["punctuation-cadence", "pause-timing"]),
    ("Full Alphabet Vocabulary", ["Full 26 Letters"], ["alphabet-integration", "full-lexicon"]),
    ("Neutral Wrist Posture Under Downward Curls", ["All Bottom Keys"], ["wrist-alignment", "posture-control"]),
    ("Left Bottom Row Mastery", ["Z", "X", "C", "V", "B"], ["left-bottom", "hand-isolation"]),
    ("Right Bottom Row Mastery", ["N", "M", ",", "."], ["right-bottom", "hand-isolation"]),
    ("Three-Row Alternation Drills", ["All 3 Rows"], ["three-row-alternation", "rhythmic-flow"]),
    ("Precision Punctuation Transitions", [",", "."], ["punctuation-transitions", "smooth-stops"]),
    ("Real-World Three-Row Vocabulary", ["Full 26 Letters"], ["practical-vocabulary", "word-flow"]),
    ("Extended Three-Row Sentences", ["Full 26 Letters"], ["extended-sentences", "syntax-flow"]),
    ("Speed Balance Across All Rows", ["All 3 Rows"], ["speed-balance", "velocity-equilibrium"]),
    ("Complex Bottom-Row Consonant Clusters", ["C", "T", "N", "D", "M", "P"], ["consonant-clusters", "cluster-agility"]),
    ("Downward Curl Stamina Sprints", ["All Bottom Keys"], ["stamina-sprints", "flexor-endurance"]),
    ("Milestone Three-Row Assessment", ["All 3 Rows"], ["mid-assessment", "three-row-benchmark"]),
    ("Rapid Wrist Realignment", ["All Keys"], ["wrist-realignment", "ergonomic-reset"]),
    ("Extended Transcriptions with Natural Punctuation", ["Full Alphabet", ",", "."], ["extended-transcription", "prose-rhythm"]),
    ("Advanced Bottom-Row Cadence", ["Z", "X", "C", "V", "B", "N", "M"], ["advanced-cadence", "curl-fluidity"]),
    ("Multisyllabic Three-Row Prose", ["Full Alphabet"], ["multisyllabic-prose", "passage-flow"]),
    ("Rapid Lateral Stretches", ["B", "N", "V", "M"], ["lateral-bottom", "stretch-recovery"]),
    ("Continuous Full-Alphabet Rhythm", ["Full Alphabet"], ["continuous-rhythm", "effortless-typing"]),
    ("High-WPM Three-Row Endurance", ["Full Alphabet"], ["high-wpm-endurance", "muscle-stamina"]),
    ("Sustained Prose with Comma and Period Rhythm", [",", "."], ["sustained-prose", "pause-mastery"]),
    ("Near-Zero Error Full Alphabet Transcriptions", ["Full Alphabet"], ["zero-error", "precision-mastery"]),
    ("Stage 3 Grandmaster Capstone", ["Full Alphabet", ",", "."], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage3_lessons():
    """Generates 600 unique, progressively longer Stage 3 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 30, 65
            elif level_num <= 100:
                target_min, target_max = 65, 115
            elif level_num <= 200:
                target_min, target_max = 115, 190
            elif level_num <= 300:
                target_min, target_max = 190, 275
            elif level_num <= 400:
                target_min, target_max = 275, 385
            elif level_num <= 500:
                target_min, target_max = 385, 510
            elif level_num <= 580:
                target_min, target_max = 510, 630
            else:
                target_min, target_max = 630, 880
            
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
            
            # Strict validation
            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 3 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Bottom Row Assessment Benchmark"
                objective = f"Validate downward finger curls and full alphabet coordination across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Develop accurate downward reach discipline targeting {', '.join(target_keys)}."
            
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
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 3, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 3, got {len(seen_texts)}"
    return lessons
