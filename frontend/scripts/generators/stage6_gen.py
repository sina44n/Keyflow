"""
Stage 6 Generator: Sentence Rhythm & Shift Discipline (600 Levels)
Keys: Full alphabet (lowercase and uppercase) + Shift coordination + Punctuation (. , ' ? ! ; : " - ( ))
Zero numbers.
Allowed characters: [abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;:'"-?!() ]
Progressive lengths from 45 chars (L1) to 850+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 6
STAGE_TITLE = "Sentence Rhythm & Shift Discipline"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Shift-L", "Shift-R", ".", ",", "'", "?", "!", ";", ":", '"', "-"]

ALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;:'\"-?!() ")

SPEAKERS = [
    "Dr. Watson", "Professor Higgins", "Eleanor", "Marcus", "Beatrice", "Socrates",
    "Sherlock Holmes", "Captain Wentworth", "Catherine", "Sir Isaac Newton", "Lady Margaret",
    "Master Evelyn", "Diana", "General Montgomery", "Jane Austen", "Albert Einstein",
    "Lord Ronald", "Leonardo da Vinci", "Queen Margaret", "Julian"
]

SPEECHES = [
    'observed the ancient stars: "Truth never damages a cause that is just."',
    'declared with firm conviction: "No compromise on fundamental freedom is acceptable."',
    'paused, adjusted his spectacles, and remarked: "Precision defines true greatness."',
    'exclaimed with genuine delight: "What extraordinary beauty illuminated the morning horizon!"',
    'whispered quietly in the hall: "Do not hesitate when opportunity presents itself."',
    'inquired with great curiosity: "Is this the direct road to Edinburgh Castle?"',
    'recalled the timeless wisdom: "To thine own self be true throughout life."',
    'gazed across the stormy sea: "We shall bring our brave crew safely home."',
    'smiled warmly at his friend: "Have you completed your philosophical manuscript yet?"',
    'asserted with unyielding faith: "All human beings are endowed with equal dignity."',
    'noted with quiet humor: "Knowledge without wisdom resembles a ship without a rudder."',
    'questioned the gathering: "Why should courageous hearts fear the mysterious unknown?"',
    'reflected with profound humility: "I have been merely playing with pebbles on the seashore."',
    'instructed the apprentices: "Never force a delicate mechanism beyond its balance."',
    'wondered aloud in the vault: "Could this rare manuscript truly date back to Alexandria?"',
    'urged the regiment forward: "Steadfast resolve guarantees our ultimate victory."',
    'worked tirelessly in the laboratory: "Every discovery opens a new universe of wonder."',
    'asked the seasoned navigator: "Shall we commence our voyage as dawn breaks?"',
    'reminded the assembly: "The only thing we have to fear is fear itself."',
    'observed the quiet valley: "Nature heals the weary mind with gentle silence."'
]

BASE_CLAUSES = []
for s in SPEAKERS:
    for sp in SPEECHES:
        cl = f"{s} {sp}"
        if all(c in ALLOWED for c in cl):
            BASE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("Left Shift for Right-Hand Capitals", ["Shift-L", "J", "K", "L", "U", "I", "O", "P"], ["left-shift", "opposite-hand-rule"]),
    ("Right Shift for Left-Hand Capitals", ["Shift-R", "A", "S", "D", "F", "Q", "W", "E"], ["right-shift", "opposite-hand-rule"]),
    ("Standard Sentence Closures", [".", "?", "!"], ["sentence-closure", "terminal-punctuation"]),
    ("Natural Contractions and Apostrophes", ["'"], ["apostrophe-coordination", "contractions"]),
    ("Semicolon and Colon Architecture", [";", ":"], ["semicolon-cadence", "colon-discipline"]),
    ("Dialogue and Direct Quotation Marks", ['"'], ["quotation-marks", "dialogue-flow"]),
    ("Parentheticals, Hyphens, and Commas", ["(", ")", "-", ","], ["parenthetical-cadence", "hyphen-flow"]),
    ("Alternating Opposite-Shift Drills", ["Shift-L", "Shift-R"], ["bilateral-shift", "shift-alternation"]),
    ("Compound and Complex Sentences", ["Syntax"], ["complex-syntax", "clause-cadence"]),
    ("Formal Prose with Varied Capitalization", ["Proper Nouns"], ["proper-nouns", "formal-prose"]),
    ("Dialogue Exchange Between Characters", ["Dialogue"], ["dialogue-exchange", "quote-pacing"]),
    ("Historical and Narrative Capitalization", ["History"], ["historical-prose", "capital-frequency"]),
    ("Multi-Clause Rhythm with Serial Commas", [","], ["serial-commas", "clause-pacing"]),
    ("Direct and Indirect Speech Formats", ['"', "'"], ["speech-formats", "quotation-flow"]),
    ("Rapid Shift Coordination Across Words", ["Capitals"], ["rapid-shift", "capital-bursts"]),
    ("Extended Literary Dialogue Passages", ["Literature"], ["extended-dialogue", "novel-prose"]),
    ("Formal Academic Transcriptions", ["Academic"], ["academic-tone", "scholarly-syntax"]),
    ("Dual-Hand Shift Discipline Under Speed", ["Opposite Shift"], ["shift-discipline", "velocity-shift"]),
    ("Complex Mixed Punctuation Sprints", ["Mixed Punctuation"], ["punctuation-sprints", "agility-drills"]),
    ("Milestone Sentence Rhythm Assessment", ["Comprehensive Shift"], ["mid-assessment", "shift-benchmark"]),
    ("Editorial Prose with Parentheses & Quotes", ["Editorial"], ["editorial-prose", "parenthetical-flow"]),
    ("Rapid Proper Noun Capitalization", ["Proper Nouns"], ["proper-noun-bursts", "instant-capitalization"]),
    ("Narrative Fiction with Rich Dialogue", ["Fiction"], ["narrative-fiction", "expressive-pacing"]),
    ("Philosophical Treatises and Expositions", ["Philosophy"], ["philosophical-prose", "profound-cadence"]),
    ("Rapid-Fire Punctuation Clusters", ["Clusters"], ["punctuation-clusters", "rapid-accuracy"]),
    ("Advanced Opposite Shift Fluidity", ["Fluid Shift"], ["shift-fluidity", "frictionless-capitals"]),
    ("High-WPM Literary Transcriptions", ["High-WPM"], ["high-wpm-literature", "classic-cadence"]),
    ("Sustained Multi-Paragraph Sentence Masterwork", ["Masterwork"], ["multi-paragraph", "epic-cadence"]),
    ("Flawless Shift and Punctuation Precision", ["Flawless"], ["flawless-precision", "zero-error-shift"]),
    ("Stage 6 Grandmaster Capstone", ["All Shift Skills"], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage6_lessons():
    """Generates 600 unique, progressively longer Stage 6 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 45, 85
            elif level_num <= 100:
                target_min, target_max = 85, 150
            elif level_num <= 200:
                target_min, target_max = 150, 250
            elif level_num <= 300:
                target_min, target_max = 250, 360
            elif level_num <= 400:
                target_min, target_max = 360, 500
            elif level_num <= 500:
                target_min, target_max = 500, 650
            elif level_num <= 580:
                target_min, target_max = 650, 780
            else:
                target_min, target_max = 780, 1050
            
            assembled = []
            curr_len = 0
            attempts = 0
            
            while curr_len < target_min or " ".join(assembled) in seen_texts:
                cl = BASE_CLAUSES[(clause_idx + attempts) % num_clauses]
                assembled.append(cl)
                curr_len = sum(len(c) + 1 for c in assembled)
                attempts += 1
                if curr_len > target_max and len(assembled) > 1:
                    break
            
            clause_idx = (clause_idx + len(assembled)) % num_clauses
            text = " ".join(assembled)
            
            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 6 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Shift Rhythm Assessment Benchmark"
                objective = f"Validate strict two-handed opposite Shift coordination and natural punctuation cadence across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Master opposite-hand Shift execution and rhythmic punctuation timing without dropping keystroke velocity."
            
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
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 6, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 6, got {len(seen_texts)}"
    return lessons
