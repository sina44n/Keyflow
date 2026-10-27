"""
Stage 2 Generator: Top Row Control (600 Levels)
Keys: Top Row (Q, W, E, R, T, Y, U, I, O, P) + Home Row (A, S, D, F, G, H, J, K, L, ;)
Zero bottom row characters (no z, x, c, v, b, n, m), zero numbers.
Allowed characters: [qwertyuiopasdfghjkl; ]
Progressive lengths from 30 chars (L1) to 650+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 2
STAGE_TITLE = "Top Row Control"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]

ALLOWED = set("qwertyuiopasdfghjkl; ")

SUBJECTS = [
    "the great leaders", "we", "they", "the proud youth", "she", "the wise speaker",
    "the quiet riders", "the swift horse", "the wild deer", "tall trees", "sweet flowers",
    "pure water drops", "soft air", "the pale light", "the wise elder",
    "free spirits", "the true friends", "all riders", "the old speaker", "the proud guide"
]

ACTIONS = [
    "write sweet letters to quiet leaders",
    "seek truth with steady steps",
    "wait past the wide gates of the fort",
    "spoke with great power to the youth",
    "walk through the high grass with pride",
    "fall past the petals of the sweet flower",
    "glow with soft light past the deep water",
    "look toward a great future with hope",
    "rest under the quiet stars after the storm",
    "gallop past the great gate with speed",
    "warm the dark earth as the heat rises",
    "grow tall past the quiet water path",
    "leap through the trees with great speed",
    "hold deep weight for the proud youth",
    "rise through the trial with steady will",
    "keep their eyes upon the high goal",
    "read the old paper with great delight",
    "flow past the quiet trail to the sea",
    "yield great results after steady work",
    "write words of truth for the future"
]

# Build verified clauses
BASE_CLAUSES = []
for s in SUBJECTS:
    for a in ACTIONS:
        cl = f"{s} {a}"
        if set(cl.lower()).issubset(ALLOWED):
            BASE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("E and I Diagonal Reaches", ["E", "I"], ["diagonal-reaches", "middle-finger-top"]),
    ("R and U Index Upward Stretches", ["R", "U"], ["index-stretches", "upward-recovery"]),
    ("W and O Ring Finger Precision", ["W", "O"], ["ring-precision", "top-row-reach"]),
    ("Q and P Pinky Corner Reaches", ["Q", "P"], ["pinky-corner", "outer-reaches"]),
    ("T and Y Center Upper Reaches", ["T", "Y"], ["center-upper", "index-extension"]),
    ("Home-to-Top Upward Leaps", ["E", "R", "T", "U", "I", "O"], ["upward-leaps", "finger-elevation"]),
    ("Top-to-Home Downward Recovery", ["E", "D", "R", "F", "U", "J", "I", "K"], ["downward-recovery", "anchor-return"]),
    ("Common Top-Row Digrams", ["E", "R", "T", "O", "U"], ["digram-reaches", "vowel-flow"]),
    ("High-Frequency Top-Row Vocabulary", ["W", "R", "I", "T", "E"], ["vocabulary-flow", "top-words"]),
    ("Alternating Row Rhythm", ["All Top Keys"], ["row-alternation", "smooth-cadence"]),
    ("Left-Hand Top-Row Coordination", ["Q", "W", "E", "R", "T"], ["left-hand-top", "hand-isolation"]),
    ("Right-Hand Top-Row Coordination", ["Y", "U", "I", "O", "P"], ["right-hand-top", "hand-isolation"]),
    ("Top-Row Suffix Foundations", ["E", "R", "S", "T"], ["suffix-patterns", "top-endings"]),
    ("Diagonal Cross-Hand Flow", ["E", "U", "R", "I", "W", "O"], ["cross-hand", "bilateral-flow"]),
    ("Fluent Word Transitions", ["All Top Keys"], ["word-transitions", "cadence-control"]),
    ("Extended Top-Row Prose", ["All Top Keys"], ["extended-prose", "passage-flow"]),
    ("Speed Control on Upward Stretches", ["E", "R", "T", "I", "O", "P"], ["speed-control", "reach-velocity"]),
    ("Dual-Row Cadence Intervals", ["All Top Keys"], ["cadence-intervals", "rhythm-intervals"]),
    ("Top-Row Velocity Bursts", ["E", "R", "I", "O"], ["velocity-bursts", "burst-typing"]),
    ("Milestone Dual-Row Assessment", ["All Top Keys"], ["mid-assessment", "dual-row-benchmark"]),
    ("Complex Reaches with Pinky P & Q", ["P", "Q", "A", ";"], ["pinky-articulation", "corner-keys"]),
    ("Multisyllabic Top-Row Vocabulary", ["All Top Keys"], ["multisyllabic-words", "top-vocabulary"]),
    ("Consecutive Diagonal Glides", ["W", "E", "R", "T", "Y", "U", "I", "O"], ["diagonal-glides", "fluid-reaches"]),
    ("Sustained Top-Row Paragraphs", ["All Top Keys"], ["sustained-paragraphs", "endurance"]),
    ("Rapid Letter Alterations", ["All Top Keys"], ["rapid-alterations", "neuromuscular-agility"]),
    ("Advanced Two-Row Integration", ["All Top Keys"], ["two-row-mastery", "integrated-control"]),
    ("High-WPM Dual-Row Transcriptions", ["All Top Keys"], ["high-wpm-transcription", "velocity-flow"]),
    ("Zero-Hesitation Reach Endurance", ["All Top Keys"], ["zero-hesitation", "muscle-endurance"]),
    ("Accuracy Polish Across Top & Home", ["All Top Keys"], ["accuracy-polish", "precision-mastery"]),
    ("Stage 2 Grandmaster Capstone", ["All Top Keys"], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage2_lessons():
    """Generates 600 unique, progressively longer Stage 2 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 30, 60
            elif level_num <= 100:
                target_min, target_max = 60, 105
            elif level_num <= 200:
                target_min, target_max = 105, 175
            elif level_num <= 300:
                target_min, target_max = 175, 260
            elif level_num <= 400:
                target_min, target_max = 260, 360
            elif level_num <= 500:
                target_min, target_max = 360, 480
            elif level_num <= 580:
                target_min, target_max = 480, 600
            else:
                target_min, target_max = 600, 850
            
            assembled = []
            curr_len = 0
            attempts = 0
            
            while curr_len < target_min or "; ".join(assembled) in seen_texts:
                cl = BASE_CLAUSES[(clause_idx + attempts) % num_clauses]
                assembled.append(cl)
                curr_len = sum(len(c) + 2 for c in assembled)
                attempts += 1
                if curr_len > target_max and len(assembled) > 1:
                    break
            
            clause_idx = (clause_idx + len(assembled)) % num_clauses
            text = "; ".join(assembled)
            
            # Strict validation
            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 2 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Top Row Assessment Benchmark"
                objective = f"Validate smooth upward reaches and home-row recovery across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Develop tactile memory for upward diagonal reaches targeting {', '.join(target_keys)}."
            
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
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 2, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 2, got {len(seen_texts)}"
    return lessons
