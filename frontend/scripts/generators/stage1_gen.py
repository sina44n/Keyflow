"""
Stage 1 Generator: Home Row Foundations (600 Levels)
Keys: A, S, D, F, G, H, J, K, L, ; and Spacebar
All 600 lessons strictly use home row characters: [asdfghjkl; ]
Progressive lengths from 30 chars (L1) to 600+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 1
STAGE_TITLE = "Home Row Foundations"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "Space"]

SUBJECTS = [
    "a lad", "all lads", "dad", "a glad lad", "a sad lad", "all dads",
    "a glad dad", "a sad dad", "a shah", "all shahs", "a gala lad", "all glass flasks",
    "a flash", "a sash", "a flag", "a glass flask"
]

VERBS = [
    "had a flask", "had a salad", "had a glass flask", "had a gala", "had a flash",
    "had a sash", "had a flag", "had half a salad", "had salads", "had flasks",
    "has a salad", "has a glass flask", "has a flag", "has a flask", "has salads",
    "falls as a flag falls", "falls as a flask falls", "shall fall",
    "shall ask dad", "shall ask a lad", "shall ask all lads", "asks dad", "asks a lad",
    "asks all lads", "asks a glad lad", "asks a sad lad", "asks a glad dad",
    "had a dash", "had a gala hall", "has a dash", "has a sash", "shall dash"
]

# Generate verified pure clauses
PURE_CLAUSES = []
ALLOWED_CHARS = set("asdfghjkl; ")
for s in SUBJECTS:
    for v in VERBS:
        cl = f"{s} {v}"
        if all(c in ALLOWED_CHARS for c in cl):
            PURE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("Tactile Anchors & Bump Detection", ["F", "J"], ["tactile-bumps", "index-rest", "anchors"]),
    ("Left-Hand Home Row Foundations", ["A", "S", "D", "F"], ["left-hand-drill", "anchor-keys"]),
    ("Right-Hand Home Row Foundations", ["J", "K", "L", ";"], ["right-hand-drill", "semicolon-rest"]),
    ("Center Stretch Keys G and H", ["G", "H"], ["lateral-stretch", "index-reach"]),
    ("Alternating Bilateral Digrams", ["A", "S", "J", "K"], ["bilateral-rhythm", "digram-flow"]),
    ("Home Row Consonant Clusters", ["S", "H", "F", "L"], ["consonant-clusters", "cluster-speed"]),
    ("Common Anchor Word Cadence", ["A", "D", "F", "L"], ["word-cadence", "rhythm-tempo"]),
    ("Semicolon Rhythm & Pinky Retraction", [";", "L", "A"], ["pinky-articulation", "semicolon-discipline"]),
    ("Alternating Hand Metronome Cadence", ["F", "J", "D", "K"], ["metronome-tempo", "fluid-strikes"]),
    ("Home Row Phrase Construction", ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["phrase-construction", "natural-flow"]),
    ("Dual-Hand Alternation Drills", ["D", "K", "S", "L"], ["dual-hand-balance", "bilateral-cadence"]),
    ("High-Frequency Home Row Collocations", ["A", "L", "D", "S"], ["collocations", "word-pairs"]),
    ("Extended Bilateral Cadence", ["F", "G", "H", "J"], ["extended-cadence", "stamina-rhythm"]),
    ("Left-Hand Dominant Balance", ["A", "S", "D", "F", "G"], ["left-hand-stamina", "finger-isolation"]),
    ("Right-Hand Dominant Balance", ["H", "J", "K", "L", ";"], ["right-hand-stamina", "pinky-control"]),
    ("Continuous Multi-Word Flow", ["A", "S", "D", "F", "J", "K", "L"], ["continuous-flow", "flow-state"]),
    ("Home Row Speed Intervals", ["D", "F", "J", "K"], ["speed-intervals", "velocity-burst"]),
    ("Semicolon Complex Phrasing", [";", "A", "L"], ["complex-phrasing", "pause-cadence"]),
    ("Home Row Stamina Sprint Alpha", ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["stamina-sprint", "endurance"]),
    ("Mid-Stage Home Row Assessment", ["All Home Row Keys"], ["mid-assessment", "comprehensive-benchmark"]),
    ("Complex Pattern Recovery", ["A", "G", "H", ";"], ["pattern-recovery", "error-prevention"]),
    ("Rapid Alternation Cycles", ["F", "J", "S", "L"], ["rapid-cycles", "neurological-sync"]),
    ("Extended Home Row Prose", ["All Home Row Keys"], ["extended-prose", "paragraph-flow"]),
    ("Weak-Finger Pinky Reinforcement", ["A", ";"], ["pinky-reinforcement", "finger-strength"]),
    ("Rapid-Fire Word Sequences", ["A", "S", "D", "F", "J", "K", "L"], ["rapid-fire", "zero-hesitation"]),
    ("Advanced Home Row Fluidity", ["All Home Row Keys"], ["advanced-fluidity", "cadence-control"]),
    ("High-Velocity Cadence Sprints", ["F", "J", "D", "K"], ["high-velocity", "speed-cadence"]),
    ("Sustained Home Row Endurance", ["All Home Row Keys"], ["sustained-endurance", "muscle-memory"]),
    ("Near-Zero Error Accuracy Drills", ["All Home Row Keys"], ["flawless-accuracy", "precision-mastery"]),
    ("Stage 1 Grandmaster Capstone", ["All Home Row Keys"], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage1_lessons():
    """Generates 600 unique, progressively longer Stage 1 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(PURE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 28, 55
            elif level_num <= 100:
                target_min, target_max = 55, 95
            elif level_num <= 200:
                target_min, target_max = 95, 160
            elif level_num <= 300:
                target_min, target_max = 160, 240
            elif level_num <= 400:
                target_min, target_max = 240, 340
            elif level_num <= 500:
                target_min, target_max = 340, 460
            elif level_num <= 580:
                target_min, target_max = 460, 580
            else:
                target_min, target_max = 580, 800
            
            assembled = []
            curr_len = 0
            attempts = 0
            
            while curr_len < target_min or "; ".join(assembled) in seen_texts:
                cl = PURE_CLAUSES[(clause_idx + attempts) % num_clauses]
                assembled.append(cl)
                curr_len = sum(len(c) + 2 for c in assembled)
                attempts += 1
                if curr_len > target_max and len(assembled) > 1:
                    break
            
            clause_idx = (clause_idx + len(assembled)) % num_clauses
            text = "; ".join(assembled)
            
            # Strict validation
            for ch in text:
                if ch not in ALLOWED_CHARS:
                    raise ValueError(f"Illegal character '{ch}' in Stage 1 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Home Row Assessment Benchmark"
                objective = f"Validate home-row tactile fluidity, rhythm, and accuracy across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Develop muscle memory and relaxed stroke cadence for {', '.join(target_keys)}."
            
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
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 1, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 1, got {len(seen_texts)}"
    return lessons
