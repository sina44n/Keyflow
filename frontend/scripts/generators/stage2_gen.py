"""
Stage 2 Generator: Top Row Control (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Q, W, E, R, T, Y, U, I, O, P combined with Home Row
Allowed characters: [abcdefghijklmnopqrstuvwxyz; ] (no numbers or symbols)
Target WPM: 25 to 34 | Target Accuracy: 85% to 88%
"""
from .curriculum_builder import build_lesson

STAGE_ID = 2
STAGE_TITLE = "Top Row Control"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]

# 70 Unit Themes for Stage 2
STAGE_2_UNIT_THEMES = [
    (1, "E and I Upward Diagonal Reaches", ["E", "I"], ["upward-reaches", "middle-extension"]),
    (2, "Middle Finger Top-Row Recovery", ["E", "I", "D", "K"], ["recovery-reflex", "vertical-motion"]),
    (3, "First Top-Row Words with E and I", ["E", "I"], ["real-words", "top-row-vocabulary"]),
    (4, "High-Frequency E-I Digrams", ["E", "I", "S", "D"], ["digram-flow", "syllable-rhythm"]),
    (5, "R and U Index Finger Extensions", ["R", "U"], ["index-extensions", "inward-upward"]),
    (6, "Alternating Index Handoffs: F-R and J-U", ["R", "U", "F", "J"], ["index-handoffs", "vertical-stride"]),
    (7, "Core Words Featuring R and U", ["R", "U"], ["word-building", "r-u-words"]),
    (8, "Four-Finger Top-Row Integration", ["E", "I", "R", "U"], ["four-finger-top", "quad-balance"]),
    (9, "T and Y Lateral Top Reaches", ["T", "Y"], ["lateral-top", "reach-recovery"]),
    (10, "Milestone Assessment: Central Top Cluster", ["E", "I", "R", "U", "T", "Y"], ["milestone-benchmark"]),
    (11, "T-Reach Conditioning: F to T", ["T", "F"], ["t-reach", "index-stretch"]),
    (12, "Y-Reach Conditioning: J to Y", ["Y", "J"], ["y-reach", "index-stretch"]),
    (13, "Center Top Lateral Alternation", ["T", "Y"], ["lateral-alternation"]),
    (14, "Words Featuring T and Y", ["T", "Y"], ["t-y-vocabulary"]),
    (15, "Six-Key Central Top Fluency", ["E", "I", "R", "U", "T", "Y"], ["central-fluency"]),
    (16, "W and O Ring Finger Extensions", ["W", "O"], ["ring-extensions", "lateral-ring"]),
    (17, "Ring Finger Recovery: S to W and L to O", ["W", "O", "S", "L"], ["ring-recovery"]),
    (18, "Common Words with W and O", ["W", "O"], ["w-o-words"]),
    (19, "Eight-Key Top Row Coordination", ["E", "I", "R", "U", "T", "Y", "W", "O"], ["eight-key-top"]),
    (20, "Milestone Assessment: Eight Top Keys", ["All Top Keys"], ["milestone-benchmark"]),
    (21, "Q and P Outer Pinky Reaches", ["Q", "P"], ["pinky-top", "corner-reaches"]),
    (22, "Left Pinky Reach: A to Q", ["Q", "A"], ["a-q-reach", "pinky-extension"]),
    (23, "Right Pinky Reach: Semicolon to P", ["P", ";"], ["semicolon-p-reach"]),
    (24, "Complete Ten-Key Top Row Integration", ["Full Top Row"], ["ten-key-top-row"]),
    (25, "All Ten Top Keys Alternating Waves", ["Full Top Row"], ["top-row-waves"]),
    (26, "Words with P and Q", ["P", "Q"], ["p-q-words"]),
    (27, "Two-Row Alternation Cadence", ["Top Row", "Home Row"], ["row-alternation"]),
    (28, "Top-to-Home Keystroke Symmetry", ["Top Row", "Home Row"], ["keystroke-symmetry"]),
    (29, "Speed Sprints on Familiar Top Words", ["Top Row", "Home Row"], ["speed-sprints"]),
    (30, "Milestone Assessment: Complete Top Row", ["Full Top Row"], ["milestone-benchmark"]),
    (31, "High-Frequency English Digrams: er, re, in, on", ["E", "R", "I", "N", "O"], ["digrams-er-re"]),
    (32, "Top-to-Home Rapid Leaps", ["Top Row", "Home Row"], ["rapid-leaps"]),
    (33, "Syllable Morphemes: pro, pre, out, ter", ["P", "R", "O", "T", "E"], ["syllables"]),
    (34, "Left-Hand Top Row Dominance", ["Q", "W", "E", "R", "T"], ["left-hand-top"]),
    (35, "Right-Hand Top Row Dominance", ["Y", "U", "I", "O", "P"], ["right-hand-top"]),
    (36, "Continuous Multi-Word Top Flow", ["Top Row", "Home Row"], ["multi-word-flow"]),
    (37, "Fluid Word Connections", ["Top Row", "Home Row"], ["word-connections"]),
    (38, "Top Row Consonant Stems", ["P", "R", "T", "W"], ["consonant-stems"]),
    (39, "Rhythmic Cadence on Short Sentences", ["Top Row", "Home Row"], ["rhythmic-cadence"]),
    (40, "Milestone Assessment: 400-Level Balance", ["Top Row", "Home Row"], ["milestone-benchmark"]),
    (41, "Extended Vocabulary Flow", ["Top Row", "Home Row"], ["extended-vocabulary"]),
    (42, "Speed Building: Common English Stems", ["Top Row", "Home Row"], ["common-stems"]),
    (43, "Two-Row Complex Sentence Construction", ["Top Row", "Home Row"], ["complex-sentences"]),
    (44, "Upward Extension Stamina", ["Top Row"], ["extension-stamina"]),
    (45, "Alternating Hand Top Combinations", ["Top Row"], ["alternating-hand-top"]),
    (46, "Top Row Doublet Precision", ["E", "O", "T", "P"], ["top-doublets"]),
    (47, "Rapid Lateral Finger Recovery", ["T", "Y", "Q", "P"], ["lateral-recovery"]),
    (48, "Metronome Flow on Top Row Sentences", ["Top Row", "Home Row"], ["metronome-flow"]),
    (49, "Near-Zero Error Top Row Challenge", ["Top Row", "Home Row"], ["zero-error-challenge"]),
    (50, "Milestone Assessment: 500-Level Speed", ["Top Row", "Home Row"], ["milestone-benchmark"]),
    (51, "Velocity Burst on Common Top Words", ["Top Row", "Home Row"], ["velocity-burst"]),
    (52, "Long-Form Sentence Flow", ["Top Row", "Home Row"], ["long-form-sentences"]),
    (53, "Advanced Hand-to-Hand Handoffs", ["Top Row", "Home Row"], ["advanced-handoffs"]),
    (54, "Finger Independence under Velocity", ["Top Row"], ["finger-independence"]),
    (55, "Compound Sentence Fluency", ["Top Row", "Home Row"], ["compound-fluency"]),
    (56, "Top Row Cadence Drills Alpha", ["Top Row"], ["cadence-alpha"]),
    (57, "Top Row Cadence Drills Beta", ["Top Row"], ["cadence-beta"]),
    (58, "Sustained Speed Intervals", ["Top Row", "Home Row"], ["speed-intervals"]),
    (59, "Extended Prose Flow", ["Top Row", "Home Row"], ["extended-prose"]),
    (60, "Milestone Assessment: 600-Level Endurance", ["Top Row", "Home Row"], ["milestone-benchmark"]),
    (61, "Grandmaster Top Row Sprints", ["Top Row", "Home Row"], ["grandmaster-sprints"]),
    (62, "High-Velocity Vertical Strides", ["Top Row", "Home Row"], ["vertical-strides"]),
    (63, "Complex Paragraph Transcription Alpha", ["Top Row", "Home Row"], ["paragraph-alpha"]),
    (64, "Complex Paragraph Transcription Beta", ["Top Row", "Home Row"], ["paragraph-beta"]),
    (65, "Elite Ergonomic Recovery", ["Top Row", "Home Row"], ["ergonomic-recovery"]),
    (66, "Sustained Velocity Trial Alpha", ["Top Row", "Home Row"], ["velocity-alpha"]),
    (67, "Sustained Velocity Trial Beta", ["Top Row", "Home Row"], ["velocity-beta"]),
    (68, "Precision Perfection Challenge", ["Top Row", "Home Row"], ["precision-perfection"]),
    (69, "Pre-Capstone Comprehensive Review", ["Top Row", "Home Row"], ["pre-capstone-review"]),
    (70, "Stage 2 Grandmaster Top Row Capstone Examination", ["All Top and Home Keys"], ["grandmaster-capstone"]),
]

TOP_ROW_CLAUSES = [
    "we write clear letters to our friends",
    "the sweet water drops fall upon the quiet flowers",
    "our team will report the great story to the city",
    "the wild horses run free across the open fields",
    "bright stars shine softly in the deep night sky",
    "she read the entire poem with deep passion and pride",
    "the clever worker quickly repaired the broken clock",
    "gentle ocean waves roll up along the sandy shore",
    "fresh morning light poured into the peaceful quiet room",
    "they walked together through the green forest trail",
    "the swift rider sped past the old wooden bridge",
    "the painter showed great skill with oil colors",
    "our teacher spoke with warmth and clear wisdom",
    "cool wind whispered through the tall pine trees",
    "the little boat sailed smoothly across the blue lake",
    "a bright yellow bird sang high in the fruit tree",
    "honest words create lasting trust between good people",
    "the young explorer mapped every trail on the mountain",
    "careful practice builds speed and steady typing flow",
    "they listened closely to the sound of flowing water",
    "quiet hours of study lead to true understanding",
    "the silver watch ticked with steady rhythmic beats",
    "we gathered wild berries along the sunny hillside",
    "the stone bridge stood firm against the rushing river",
    "deep roots help the grand tree stand through winter storms",
    "clear thought leads to simple and effective actions",
    "the eager puppy ran across the green garden grass",
    "bright firelight warmed our hands in the cold cottage",
    "a gentle smile can brighten the darkest winter afternoon",
    "each new day brings fresh hope and new opportunities",
    "the brave sailor held the wheel against the rough sea",
    "kind deeds echo far beyond the moment they happen",
    "the mountain air felt crisp and cool at dawn",
    "early morning mist covered the quiet village roofs",
    "the wise old farmer predicted rain before nightfall",
    "bright autumn leaves fell softly to the damp ground",
    "steady rhythmic keystrokes build lasting muscle memory",
    "the little kitten slept soundly on the wool blanket",
    "a single true word carries more weight than ten false ones",
    "the golden sunset colored the clouds with rich amber light"
]

def generate_stage2_lessons():
    """Generates all 700 Stage 2 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(TOP_ROW_CLAUSES)

    for unit_tuple in STAGE_2_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets
            if level_num <= 150:
                target_min, target_max = 50, 100
            elif level_num <= 250:
                target_min, target_max = 100, 170
            elif level_num <= 350:
                target_min, target_max = 170, 260
            elif level_num <= 450:
                target_min, target_max = 260, 360
            elif level_num <= 550:
                target_min, target_max = 360, 480
            elif level_num <= 650:
                target_min, target_max = 480, 600
            else:
                target_min, target_max = 600, 800

            clauses_used = []
            curr_len = 0
            while curr_len < target_min or len(clauses_used) < 2:
                cl = TOP_ROW_CLAUSES[clause_idx % num_clauses]
                clause_idx += 1
                if cl not in clauses_used:
                    clauses_used.append(cl)
                    curr_len = sum(len(c) for c in clauses_used) + (len(clauses_used) - 1) * 2

            text = "; ".join(clauses_used)

            variant = 1
            base_text = text
            while text in seen_texts:
                extra_clause = TOP_ROW_CLAUSES[(clause_idx + variant) % num_clauses]
                text = f"{base_text}; {extra_clause}"
                variant += 1
            seen_texts.add(text)

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Top Row Capstone Examination"
                obj = "Graduate from Stage 2 by demonstrating complete top row fluidity and relaxed vertical recovery."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across multi-clause text."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Progressive Flow Drill {l_in_u}"
                obj = f"Develop muscle memory and upward finger reaches for {', '.join(target_keys)}."

            lesson = build_lesson(
                stage_id=STAGE_ID,
                stage_title=STAGE_TITLE,
                level_num=level_num,
                unit_num=unit_num,
                unit_label=unit_label,
                lesson_in_unit=l_in_u,
                title=title,
                objective=obj,
                text=text,
                target_keys=target_keys,
                home_keys=HOME_KEYS,
                skills=skills
            )
            lessons.append(lesson)

    assert len(lessons) == 700, f"Stage 2 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
