"""
Stage 3 Generator: Bottom Row Control (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Z, X, C, V, B, N, M, comma, period, slash
Focus on downward finger curls and three-row integration. Zero numbers.
Allowed characters: [abcdefghijklmnopqrstuvwxyz,.;/ ]
Target WPM: 32 to 40 | Target Accuracy: 88% to 90%
"""
from .curriculum_builder import build_lesson

STAGE_ID = 3
STAGE_TITLE = "Bottom Row Control"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"]

STAGE_3_UNIT_THEMES = [
    (1, "V and M Index Downward Curls", ["V", "M"], ["downward-curls", "index-flexion"]),
    (2, "C and Comma Middle Finger Downward Stabs", ["C", ","], ["middle-finger-curl", "comma-rhythm"]),
    (3, "X and Period Ring Finger Downward Curls", ["X", "."], ["ring-finger-curl", "period-pause"]),
    (4, "Z and Bottom Pinky Mobility", ["Z"], ["pinky-mobility", "bottom-corner"]),
    (5, "B and N Deep Index Extensions", ["B", "N"], ["deep-extensions", "center-bottom"]),
    (6, "Three-Row Vertical Transitions", ["All Rows"], ["vertical-transitions", "row-skipping"]),
    (7, "Common Bottom-Row Digrams", ["C", "K", "N", "G", "C", "H"], ["bottom-digrams"]),
    (8, "Comma and Period Cadence", [",", "."], ["punctuation-cadence", "pause-timing"]),
    (9, "Full Alphabet Vocabulary", ["Full 26 Letters"], ["alphabet-integration"]),
    (10, "Milestone Assessment: Initial Bottom Row", ["All Bottom Keys"], ["milestone-benchmark"]),
    (11, "Neutral Wrist Posture Under Downward Curls", ["All Bottom Keys"], ["wrist-alignment"]),
    (12, "Left Bottom Row Mastery: Z, X, C, V, B", ["Z", "X", "C", "V", "B"], ["left-bottom"]),
    (13, "Right Bottom Row Mastery: N, M, Comma, Period", ["N", "M", ",", "."], ["right-bottom"]),
    (14, "Three-Row Alternation Drills", ["All 3 Rows"], ["three-row-alternation"]),
    (15, "Precision Punctuation Transitions", [",", "."], ["punctuation-transitions"]),
    (16, "Real-World Three-Row Vocabulary", ["Full 26 Letters"], ["practical-vocabulary"]),
    (17, "Extended Three-Row Sentences", ["Full 26 Letters"], ["extended-sentences"]),
    (18, "Speed Balance Across All Rows", ["All 3 Rows"], ["speed-balance"]),
    (19, "Complex Bottom-Row Consonant Clusters", ["C", "T", "N", "D", "M", "P"], ["consonant-clusters"]),
    (20, "Milestone Assessment: Three-Row Integration", ["All 3 Rows"], ["milestone-benchmark"]),
    (21, "Downward Curl Stamina Sprints", ["All Bottom Keys"], ["stamina-sprints"]),
    (22, "Rapid Wrist Realignment", ["All Keys"], ["wrist-realignment"]),
    (23, "Extended Transcriptions with Natural Punctuation", ["Full Alphabet", ",", "."], ["extended-transcription"]),
    (24, "Advanced Bottom-Row Cadence", ["Z", "X", "C", "V", "B", "N", "M"], ["advanced-cadence"]),
    (25, "Multisyllabic Three-Row Prose", ["Full Alphabet"], ["multisyllabic-prose"]),
    (26, "Rapid Lateral Stretches: B and N", ["B", "N", "V", "M"], ["lateral-bottom"]),
    (27, "Continuous Full-Alphabet Rhythm", ["Full Alphabet"], ["continuous-rhythm"]),
    (28, "High-WPM Three-Row Endurance", ["Full Alphabet"], ["high-wpm-endurance"]),
    (29, "Sustained Prose with Comma Rhythm", [",", "."], ["sustained-prose"]),
    (30, "Milestone Assessment: 300-Level Balance", ["Full Alphabet"], ["milestone-benchmark"]),
    (31, "Near-Zero Error Full Alphabet Drills", ["Full Alphabet"], ["zero-error"]),
    (32, "Bottom-Row Speed Intervals Alpha", ["All Bottom Keys"], ["speed-intervals-alpha"]),
    (33, "Bottom-Row Speed Intervals Beta", ["All Bottom Keys"], ["speed-intervals-beta"]),
    (34, "Alternating Hand Bottom Sequences", ["All Bottom Keys"], ["alternating-bottom"]),
    (35, "Vowel-Consonant Bottom Flows", ["Full Alphabet"], ["vowel-consonant-flows"]),
    (36, "Complex Sentence Cadence", ["Full Alphabet", ",", "."], ["complex-sentence-cadence"]),
    (37, "Deep Extension Stamina Sprints", ["B", "N", "Z", "X"], ["extension-stamina"]),
    (38, "Natural Narrative Prose Flow", ["Full Alphabet"], ["narrative-flow"]),
    (39, "Rhythmic Comma Pause Control", [","], ["comma-control"]),
    (40, "Milestone Assessment: 400-Level Fluency", ["Full Alphabet"], ["milestone-benchmark"]),
    (41, "Rapid Three-Row Leaps", ["All 3 Rows"], ["rapid-row-leaps"]),
    (42, "Pinky Curl Conditioning: Z and Slash", ["Z", "/"], ["pinky-curl-z"]),
    (43, "Center Index Flexion Velocity", ["V", "B", "N", "M"], ["flexion-velocity"]),
    (44, "Compound Sentence Fluency", ["Full Alphabet", ",", "."], ["compound-sentence-fluency"]),
    (45, "Long-Form Vocabulary Passages", ["Full Alphabet"], ["long-form-passages"]),
    (46, "Velocity under Precision Pressure", ["Full Alphabet"], ["velocity-precision"]),
    (47, "Alternating Bilateral Row Skips", ["All 3 Rows"], ["bilateral-skips"]),
    (48, "Metronome Rhythm on Three Rows", ["All 3 Rows"], ["metronome-three-rows"]),
    (49, "Near-Zero Error Punctuation Trial", [",", "."], ["zero-error-punctuation"]),
    (50, "Milestone Assessment: 500-Level Speed", ["Full Alphabet"], ["milestone-benchmark"]),
    (51, "High-Speed Bottom Row Sprints", ["All Bottom Keys"], ["high-speed-sprints"]),
    (52, "Extended Multi-Clause Prose", ["Full Alphabet", ",", "."], ["multi-clause-prose"]),
    (53, "Flexor Muscle Endurance Drills", ["All Bottom Keys"], ["flexor-endurance"]),
    (54, "Three-Row Alternation Mastery", ["All 3 Rows"], ["alternation-mastery"]),
    (55, "Sustained Speed Intervals Alpha", ["Full Alphabet"], ["speed-intervals-alpha"]),
    (56, "Sustained Speed Intervals Beta", ["Full Alphabet"], ["speed-intervals-beta"]),
    (57, "Advanced Three-Row Narrative", ["Full Alphabet"], ["advanced-narrative"]),
    (58, "Continuous Typing Endurance", ["Full Alphabet", ",", "."], ["continuous-endurance"]),
    (59, "Flawless Keystroke Execution", ["Full Alphabet"], ["flawless-execution"]),
    (60, "Milestone Assessment: 600-Level Endurance", ["Full Alphabet"], ["milestone-benchmark"]),
    (61, "Grandmaster Velocity Drills Alpha", ["All 3 Rows"], ["grandmaster-velocity-alpha"]),
    (62, "Grandmaster Velocity Drills Beta", ["All 3 Rows"], ["grandmaster-velocity-beta"]),
    (63, "Complex Descriptive Prose Alpha", ["Full Alphabet", ",", "."], ["descriptive-prose-alpha"]),
    (64, "Complex Descriptive Prose Beta", ["Full Alphabet", ",", "."], ["descriptive-prose-beta"]),
    (65, "Elite Three-Row Recovery", ["All 3 Rows"], ["elite-recovery"]),
    (66, "Sustained Velocity Trial Alpha", ["Full Alphabet"], ["velocity-trial-alpha"]),
    (67, "Sustained Velocity Trial Beta", ["Full Alphabet"], ["velocity-trial-beta"]),
    (68, "Precision Perfection Challenge", ["Full Alphabet"], ["precision-perfection"]),
    (69, "Pre-Capstone Comprehensive Review", ["Full Alphabet", ",", "."], ["pre-capstone-review"]),
    (70, "Stage 3 Grandmaster Bottom Row Capstone Examination", ["Full Alphabet", ",", "."], ["grandmaster-capstone"]),
]

BOTTOM_ROW_CLAUSES = [
    "the calm bronze wizard examined the zinc flux with calm precision",
    "six big devils from japan quickly forgot how to amaze every bronze wizard",
    "the quick brown fox jumped over the lazy sleeping dog near the river",
    "a vibrant young musician played complex jazz melodies on the silver saxophone",
    "the dynamic silver robot navigated the dangerous maze with admirable courage",
    "every wise traveler observed the subtle movement of celestial bodies",
    "the nimble black cat climbed up the tall garden fence with ease",
    "a curious modern scholar studied the ancient manuscripts found inside the vault",
    "the quiet bronze sculptor shaped the clay model with remarkable care and skill",
    "twenty brave sailors navigated through dangerous rocky waters in the fog",
    "the diligent botanist planted diverse botanical specimens across the fertile garden",
    "the famous jazz musician packed my box with five dozen vibrant quartz jugs",
    "the velvet dawn breeze blew gently across the peaceful quiet meadow",
    "an ambitious young inventor built a sturdy wooden vessel capable of crossing wide waters",
    "the experienced captain recorded accurate scientific observations in the notebook",
    "the clever mountain guide led the expedition safely through the high passes",
    "every careful typist maintains relaxed wrists and balanced finger reaches",
    "the silent arctic wolf hunted across the vast snowy expanse of the north",
    "the graceful marathon runner demonstrated remarkable stamina in the summer heat",
    "a brilliant morning sunrise brought warm golden light to the valley floor",
    "the ancient stone castle overlooked the winding silver river below",
    "clear logical deduction helps solve even the most baffling mysteries",
    "steady consistent effort produces exceptional results over long periods of time",
    "the skilled carpenter carved intricate patterns into the polished oak table",
    "soft classical melodies filled the grand hall during the evening concert",
    "the deep ocean explorer discovered fascinating new species near the thermal vents",
    "patient practice develops rapid reflexes and effortless keyboard control",
    "a refreshing rain shower washed the dusty city streets clean at twilight",
    "the dedicated laboratory chemist analyzed the chemical composition of the rock",
    "gentle ocean currents carried the wooden raft toward the tropical island",
    "the sharp winter frost painted delicate icy crystals on the window glass",
    "honest communication creates lasting understanding between diverse communities",
    "the old lighthouse beam pierced through the thick darkness of the stormy night",
    "careful attention to detail separates amateur work from true mastery",
    "the energetic golden retriever ran across the open park with boundless joy",
    "smooth rhythmic keystrokes eliminate tension and fatigue in the hands and wrists",
    "the adventurous pilot flew the small airplane through the narrow mountain canyon",
    "thoughtful consideration before action prevents many common misunderstandings",
    "the quiet library provided a peaceful haven for deep reading and reflection",
    "sustained focus and mental clarity allow the typist to enter the flow state"
]

def generate_stage3_lessons():
    """Generates all 700 Stage 3 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BOTTOM_ROW_CLAUSES)

    for unit_tuple in STAGE_3_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets
            if level_num <= 150:
                target_min, target_max = 60, 110
            elif level_num <= 250:
                target_min, target_max = 110, 180
            elif level_num <= 350:
                target_min, target_max = 180, 270
            elif level_num <= 450:
                target_min, target_max = 270, 380
            elif level_num <= 550:
                target_min, target_max = 380, 500
            elif level_num <= 650:
                target_min, target_max = 500, 620
            else:
                target_min, target_max = 620, 850

            clauses_used = []
            curr_len = 0
            while curr_len < target_min or len(clauses_used) < 2:
                cl = BOTTOM_ROW_CLAUSES[clause_idx % num_clauses]
                clause_idx += 1
                if cl not in clauses_used:
                    clauses_used.append(cl)
                    curr_len = sum(len(c) for c in clauses_used) + (len(clauses_used) - 1) * 2

            text = "; ".join(clauses_used)

            variant = 1
            base_text = text
            while text in seen_texts:
                extra_clause = BOTTOM_ROW_CLAUSES[(clause_idx + variant) % num_clauses]
                text = f"{base_text}; {extra_clause}"
                variant += 1
            seen_texts.add(text)

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Bottom Row Capstone Examination"
                obj = "Graduate from Stage 3 by demonstrating complete three-row keyboard integration and downward curl agility."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across multi-clause three-row text."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Progressive Flow Drill {l_in_u}"
                obj = f"Develop muscle memory and downward finger curls for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 3 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
