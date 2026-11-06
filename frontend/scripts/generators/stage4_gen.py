"""
Stage 4 Generator: Full Alphabet Mastery & Cross-Row Transitions (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Full 26 lowercase alphabet [a-z], comma, period, hyphen, semicolon, space.
Zero numbers, zero uppercase (Shift not introduced until Stage 6).
Target WPM: 38 to 46 | Target Accuracy: 90% to 92%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 4
STAGE_TITLE = "Full Alphabet Mastery & Cross-Row Transitions"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Full Alphabet", "Cross-Row", "Bilateral Balance", "Digrams"]
ALLOWED = set("abcdefghijklmnopqrstuvwxyz,.;- ")

# 70 Units for Stage 4
STAGE_4_UNIT_THEMES = [
    (1, "Cross-Row Consonant Blends (B, N, X, Z, Q)", ["B", "N", "X", "Z", "Q"], ["cross-row-blends"]),
    (2, "Bilateral Alternating Hand Flow", ["Alternating Hands"], ["bilateral-flow"]),
    (3, "High-Frequency English Digram: TH and HE", ["th", "he"], ["th-he-digrams"]),
    (4, "High-Frequency English Digram: IN and ER", ["in", "er"], ["in-er-digrams"]),
    (5, "High-Frequency English Digram: AN and RE", ["an", "re"], ["an-re-digrams"]),
    (6, "High-Frequency English Digram: ON and AT", ["on", "at"], ["on-at-digrams"]),
    (7, "High-Frequency English Digram: EN and ND", ["en", "nd"], ["en-nd-digrams"]),
    (8, "High-Frequency English Digram: TI and ES", ["ti", "es"], ["ti-es-digrams"]),
    (9, "High-Frequency English Digram: OR and TE", ["or", "te"], ["or-te-digrams"]),
    (10, "Milestone Assessment: Primary Digram Flow", ["All Digrams"], ["milestone-benchmark"]),
    (11, "Common Trigram: THE and AND", ["the", "and"], ["the-and-trigrams"]),
    (12, "Common Trigram: ING and ION", ["ing", "ion"], ["ing-ion-trigrams"]),
    (13, "Common Trigram: TIO and ENT", ["tio", "ent"], ["tio-ent-trigrams"]),
    (14, "Common Trigram: FOR and HER", ["for", "her"], ["for-her-trigrams"]),
    (15, "Common Trigram: TER and HAT", ["ter", "hat"], ["ter-hat-trigrams"]),
    (16, "Common Trigram: THA and ERE", ["tha", "ere"], ["tha-ere-trigrams"]),
    (17, "Common Trigram: ATE and HIS", ["ate", "his"], ["ate-his-trigrams"]),
    (18, "Common Trigram: CON and RES", ["con", "res"], ["con-res-trigrams"]),
    (19, "Common Trigram: VER and ALL", ["ver", "all"], ["ver-all-trigrams"]),
    (20, "Milestone Assessment: Trigram Motor Memory", ["All Trigrams"], ["milestone-benchmark"]),
    (21, "Common Prefix: UN- and RE-", ["un-", "re-"], ["prefix-un-re"]),
    (22, "Common Prefix: IN- and DIS-", ["in-", "dis-"], ["prefix-in-dis"]),
    (23, "Common Prefix: PRE- and PRO-", ["pre-", "pro-"], ["prefix-pre-pro"]),
    (24, "Common Prefix: MIS- and NON-", ["mis-", "non-"], ["prefix-mis-non"]),
    (25, "Common Prefix: SUB- and TRANS-", ["sub-", "trans-"], ["prefix-sub-trans"]),
    (26, "Common Prefix: INTER- and OVER-", ["inter-", "over-"], ["prefix-inter-over"]),
    (27, "Common Suffix: -ING and -ED", ["-ing", "-ed"], ["suffix-ing-ed"]),
    (28, "Common Suffix: -LY and -FUL", ["-ly", "-ful"], ["suffix-ly-ful"]),
    (29, "Common Suffix: -TION and -SION", ["-tion", "-sion"], ["suffix-tion-sion"]),
    (30, "Milestone Assessment: Morphological Affixes", ["Affixes"], ["milestone-benchmark"]),
    (31, "Common Suffix: -ABLE and -IBLE", ["-able", "-ible"], ["suffix-able-ible"]),
    (32, "Common Suffix: -MENT and -NESS", ["-ment", "-ness"], ["suffix-ment-ness"]),
    (33, "Common Suffix: -LESS and -SHIP", ["-less", "-ship"], ["suffix-less-ship"]),
    (34, "Common Suffix: -IZE and -IST", ["-ize", "-ist"], ["suffix-ize-ist"]),
    (35, "Root Morphemes: STRUCT and FORM", ["struct", "form"], ["roots-struct-form"]),
    (36, "Root Morphemes: PORT and TRACT", ["port", "tract"], ["roots-port-tract"]),
    (37, "Root Morphemes: SPECT and DICT", ["spect", "dict"], ["roots-spect-dict"]),
    (38, "Root Morphemes: GRAPH and PHON", ["graph", "phon"], ["roots-graph-phon"]),
    (39, "Root Morphemes: BIO and LOGY", ["bio", "logy"], ["roots-bio-logy"]),
    (40, "Milestone Assessment: Latin and Greek Roots", ["Roots"], ["milestone-benchmark"]),
    (41, "Cross-Row Vowel Harmonies", ["Vowels"], ["vowel-harmonies"]),
    (42, "Opposite Hand Alternating Syllables", ["Alternation"], ["alternating-syllables"]),
    (43, "Left Hand Dominant Consonant Clusters", ["Left Hand"], ["left-hand-clusters"]),
    (44, "Right Hand Dominant Consonant Clusters", ["Right Hand"], ["right-hand-clusters"]),
    (45, "Double Letter Muscle Reflexes", ["Doubles"], ["double-letters"]),
    (46, "Hyphenated Compound Word Flow", ["Hyphens"], ["hyphenated-words"]),
    (47, "Semicolon Clause Balance", ["Semicolons"], ["semicolon-clauses"]),
    (48, "Multisyllabic Word Stride", ["Multisyllabic"], ["word-stride"]),
    (49, "Rapid Cross-Row Leaping Practice", ["Row Leaps"], ["rapid-leaps"]),
    (50, "Milestone Assessment: 500-Level Fluency", ["Full Alphabet"], ["milestone-benchmark"]),
    (51, "Expository Nature Prose", ["Full Alphabet"], ["nature-prose"]),
    (52, "Scientific Observation Prose", ["Full Alphabet"], ["science-prose"]),
    (53, "Historical Narrative Cadence", ["Full Alphabet"], ["history-prose"]),
    (54, "Philosophical Reflection Flow", ["Full Alphabet"], ["philosophy-prose"]),
    (55, "Architectural Description Flow", ["Full Alphabet"], ["architecture-prose"]),
    (56, "Geographical Exploration Sentences", ["Full Alphabet"], ["geography-prose"]),
    (57, "Literary Analysis Sentences", ["Full Alphabet"], ["literary-prose"]),
    (58, "Technological Transformation Prose", ["Full Alphabet"], ["technology-prose"]),
    (59, "Biological Ecosystem Sentences", ["Full Alphabet"], ["ecosystem-prose"]),
    (60, "Milestone Assessment: Thematic Expository Prose", ["Full Alphabet"], ["milestone-benchmark"]),
    (61, "Continuous Paragraph Stamina Alpha", ["Full Alphabet"], ["stamina-alpha"]),
    (62, "Continuous Paragraph Stamina Beta", ["Full Alphabet"], ["stamina-beta"]),
    (63, "Continuous Paragraph Stamina Gamma", ["Full Alphabet"], ["stamina-gamma"]),
    (64, "Near-Zero Error Speed Sprints", ["Full Alphabet"], ["zero-error-speed"]),
    (65, "Subconscious Keystroke Automation", ["Full Alphabet"], ["subconscious-automation"]),
    (66, "Bilateral Rhythm Metronome Drills", ["Full Alphabet"], ["rhythm-metronome"]),
    (67, "High-Density Vocabulary Sprints", ["Full Alphabet"], ["dense-vocabulary"]),
    (68, "Extended Clause Coordination", ["Full Alphabet"], ["clause-coordination"]),
    (69, "Sub-Millisecond Keystroke Recovery", ["Full Alphabet"], ["keystroke-recovery"]),
    (70, "Grandmaster Stage 4 Graduation Examination", ["Full Alphabet"], ["grandmaster-capstone"]),
]

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
    "strengthens foundational knowledge across interconnected disciplines"
]

OUTCOMES = [
    "while fostering lasting harmony among participating members",
    "which establishes reliable precedents for subsequent generations",
    "thereby ensuring sustainable prosperity throughout the region",
    "which naturally inspires greater curiosity among diligent students",
    "while maintaining perfect fidelity to established empirical standards",
    "thereby providing invaluable insights for future investigations",
    "which significantly elevates overall performance metrics over time",
    "while eliminating unnecessary obstacles from standard operational workflows",
    "thereby cultivating widespread appreciation for nuanced intellectual achievements",
    "which ultimately yields profound discoveries across multiple related domains",
    "while reinforcing mutual trust between community representatives",
    "thereby providing robust architectural frameworks for future expansions",
    "which demonstrates extraordinary resilience during demanding circumstances",
    "while encouraging authentic engagement with foundational learning concepts",
    "thereby establishing an enduring legacy of excellence and wisdom",
    "which guarantees complete alignment with universal educational values",
    "while nurturing imaginative problem solving in challenging situations",
    "thereby transforming abstract theories into tangible real world benefits",
    "which consistently inspires deeper dedication to thoughtful craftsmanship",
    "while ensuring harmonious coexistence within fragile ecological balances"
]

def generate_stage4_lessons():
    """Generates exactly 700 unique, pedagogical Stage 4 lessons."""
    lessons = []
    seen_texts = set()

    for unit_num, (u_num, unit_label, target_keys, skills) in enumerate(STAGE_4_UNIT_THEMES, start=1):
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive target lengths
            if level_num <= 70:
                clauses_count = 1
            elif level_num <= 200:
                clauses_count = 2
            elif level_num <= 400:
                clauses_count = 3
            elif level_num <= 600:
                clauses_count = 4
            else:
                clauses_count = 5

            clauses = []
            for c_i in range(clauses_count):
                step = level_num * 10 + c_i
                subj = SUBJECTS[(step * 7 + c_i) % len(SUBJECTS)]
                act = ACTIONS[(step * 11 + 3 + c_i) % len(ACTIONS)]
                out = OUTCOMES[(step * 13 + 5 + c_i) % len(OUTCOMES)]
                sentence = f"{subj} {act} {out}"
                clauses.append(sentence)

            text = ". ".join(clauses) + "."

            # Uniqueness check
            variant = 1
            base_text = text
            while text in seen_texts:
                extra_act = ACTIONS[(level_num + variant) % len(ACTIONS)]
                extra_out = OUTCOMES[(level_num + variant * 3) % len(OUTCOMES)]
                text = f"{base_text[:-1]} and {extra_act} {extra_out}."
                variant += 1
            seen_texts.add(text)

            # Verification of allowed keys
            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 4 Level {level_num}")

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Full Alphabet Capstone Examination"
                obj = "Graduate from Stage 4 with effortless cross-row transitions and zero error hesitation."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across complex prose."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Flow Drill {l_in_u}"
                obj = f"Develop fluid cross-row transitions and cadence for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 4 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
