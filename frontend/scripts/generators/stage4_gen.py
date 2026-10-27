"""
Stage 4 Generator: Morphemes & Combinations (600 Levels)
Keys: Full lowercase alphabet + prefixes, suffixes, root morphemes, trigrams, multisyllabic sequences.
Zero numbers.
Allowed characters: [abcdefghijklmnopqrstuvwxyz,.;- ]
Progressive lengths from 35 chars (L1) to 750+ chars (L600).
"""
import itertools
from .curriculum_builder import build_lesson

STAGE_ID = 4
STAGE_TITLE = "Morphemes & Combinations"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["th", "he", "in", "er", "an", "re", "tion", "ment", "ness", "able"]

ALLOWED = set("abcdefghijklmnopqrstuvwxyz,.;- ")

SUBJECTS = [
    "the international committee", "an extraordinary demonstration", "systematic scientific investigation",
    "interconnected global communication", "thoughtful philosophical reflection",
    "remarkable technological transformation", "unprecedented economic development",
    "comprehensive environmental conservation", "independent biological research",
    "careful morphological examination", "interdisciplinary academic collaboration",
    "unquestionable institutional credibility", "unpredictable atmospheric fluctuation",
    "extraordinary architectural preservation", "the revolutionary digital transition",
    "meaningful cultural revitalization", "sustainable agricultural development",
    "groundbreaking biochemical experimentation", "responsible administrative leadership",
    "unwavering professional dedication"
]

ACTIONS = [
    "demonstrates remarkable understanding of complex relationships",
    "facilitates constructive transformation across diverse organizations",
    "encourages responsible conservation of endangered natural habitats",
    "contributes significant advancement to modern communication networks",
    "illustrates the fundamental interconnectedness of living ecosystems",
    "demands exceptional dedication and unyielding professional integrity",
    "promotes productive collaboration between independent research teams",
    "establishes substantial credibility through meticulous verification",
    "generates sustainable development opportunities for local communities",
    "reveals fascinating structural patterns beneath cellular membranes",
    "transforms theoretical principles into practical technological applications",
    "enhances interpersonal communication through sympathetic understanding",
    "accelerates meaningful progress toward equitable global participation",
    "strengthens institutional resilience against unpredictable economic shocks",
    "cultivates intellectual curiosity through rigorous scientific inquiry",
    "validates essential mathematical models using experimental observations",
    "articulates clear definitions for difficult morphological phenomena",
    "synthesizes diverse historical perspectives into coherent analytical narratives",
    "champions compassionate representation for underrepresented communities",
    "sustains remarkable momentum throughout challenging long term projects"
]

BASE_CLAUSES = []
for s in SUBJECTS:
    for a in ACTIONS:
        cl = f"{s} {a}"
        if all(c in ALLOWED for c in cl):
            BASE_CLAUSES.append(cl)

UNIT_THEMES = [
    ("High-Frequency Digrams", ["th", "he", "in", "er", "an"], ["digram-flow", "motor-chunking"]),
    ("Essential Trigrams", ["the", "and", "ing", "ion", "ent"], ["trigram-speed", "chunk-formation"]),
    ("Active Suffixes", ["-ing", "-ed", "-es", "-ly", "-er"], ["active-suffixes", "ending-rhythm"]),
    ("Abstract Suffixes", ["-tion", "-sion", "-ment", "-ness"], ["abstract-suffixes", "multisyllabic-flow"]),
    ("Descriptive Suffixes", ["-able", "-ible", "-ous", "-ful"], ["descriptive-suffixes", "syllable-balance"]),
    ("Common Prefixes", ["re-", "un-", "in-", "dis-", "en-"], ["prefix-initiation", "morpheme-starts"]),
    ("Advanced Prefixes", ["pre-", "pro-", "sub-", "trans-", "inter-"], ["advanced-prefixes", "rapid-starts"]),
    ("Greek Roots", ["bio", "geo", "chron", "graph", "tele"], ["greek-roots", "etymological-chunks"]),
    ("Latin Roots", ["tract", "struct", "port", "spect", "dict"], ["latin-roots", "root-recognition"]),
    ("Morphological Transformations", ["Base", "Derived", "Complex"], ["morphological-shift", "word-families"]),
    ("Syllabic Rhythm and Stress Patterns", ["Rhythm", "Cadence"], ["syllabic-stress", "cadence-rhythm"]),
    ("Compound Word Formations", ["Compound", "Words"], ["compound-words", "seamless-joint"]),
    ("Multisyllabic Academic Vocabulary", ["Academic", "Terminology"], ["academic-vocabulary", "intellectual-flow"]),
    ("Prefix Root Suffix Triple Chunks", ["Tri-Morpheme"], ["triple-chunks", "compound-chunking"]),
    ("Morphemic Chunking at Velocity", ["Velocity", "Chunking"], ["speed-chunking", "high-tempo"]),
    ("Extended Prose with Dense Morphemes", ["Dense", "Morphemes"], ["dense-prose", "passage-stamina"]),
    ("Scientific and Analytical Word Families", ["Analytical", "Science"], ["scientific-terms", "precision-morphemes"]),
    ("Dual-Morpheme Speed Drills", ["Dual-Morpheme"], ["speed-drills", "rapid-bursts"]),
    ("Complex Morphological Sentences", ["Complex", "Syntax"], ["complex-syntax", "structural-flow"]),
    ("Milestone Morpheme Mastery Assessment", ["Comprehensive Morphemes"], ["mid-assessment", "morpheme-benchmark"]),
    ("Rapid Morphological Processing", ["Processing", "Speed"], ["rapid-processing", "cognitive-fluidity"]),
    ("Advanced Linguistic Transcriptions", ["Linguistics"], ["advanced-transcription", "language-mastery"]),
    ("Compound Complex Sentence Structures", ["Complex", "Clauses"], ["compound-complex", "clause-cadence"]),
    ("Expository Texts with High Morpheme Density", ["Expository"], ["expository-texts", "dense-lexicon"]),
    ("Rapid-Fire Trigram & Quadgram Flow", ["Trigrams", "Quadgrams"], ["rapid-fire-chunks", "subconscious-typing"]),
    ("Professional Technical Word Stems", ["Technical", "Stems"], ["technical-stems", "workplace-fluency"]),
    ("High-Speed Morphological Endurance", ["Endurance", "Speed"], ["high-speed-endurance", "muscle-memory"]),
    ("Academic Abstract Paragraphs", ["Abstracts"], ["academic-abstracts", "scholarly-prose"]),
    ("Flawless Lexical Transcriptions", ["Flawless", "Lexicon"], ["flawless-lexicon", "precision-mastery"]),
    ("Stage 4 Grandmaster Capstone", ["All Morphemes"], ["grandmaster-capstone", "stage-graduation"]),
]

def generate_stage4_lessons():
    """Generates 600 unique, progressively longer Stage 4 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 35, 75
            elif level_num <= 100:
                target_min, target_max = 75, 130
            elif level_num <= 200:
                target_min, target_max = 130, 210
            elif level_num <= 300:
                target_min, target_max = 210, 310
            elif level_num <= 400:
                target_min, target_max = 310, 430
            elif level_num <= 500:
                target_min, target_max = 430, 560
            elif level_num <= 580:
                target_min, target_max = 560, 690
            else:
                target_min, target_max = 690, 950
            
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
                    raise ValueError(f"Illegal character '{ch}' in Stage 4 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if is_assessment:
                title = f"Unit {unit_idx} Morpheme Assessment Benchmark"
                objective = f"Validate recognition and fluid motor firing of common letter chunks across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Condition motor memory to execute frequent morphemes and letter combinations ({', '.join(target_keys)}) as single neurological strokes."
            
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
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 4, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 4, got {len(seen_texts)}"
    return lessons
