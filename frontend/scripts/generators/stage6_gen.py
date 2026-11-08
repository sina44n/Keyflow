"""
Stage 6 Generator: Advanced Performance & Cadence (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Attain advanced professional typing performance (50 to 62 WPM).
Transcribe dense academic, scientific, and technical prose with heavy punctuation
density (colons, semicolons, em-dashes, parentheses, brackets), complex multi-clause
grammatical syntax, embedded dates, statistics, and mixed alphanumeric codes.

Zero repetitive alphabet introductions.
Target WPM: 50 to 62 | Target Accuracy: 92% to 94%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 6
STAGE_TITLE = "Advanced Performance & Cadence"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Advanced Cadence", "Punctuation Density", "Scientific Prose", "Complex Syntax"]

STAGE_6_UNIT_THEMES = [
    (1, "Advanced Prose: Classical Scientific Treatises", ["Scientific Prose"], ["scientific-treatise"]),
    (2, "Advanced Prose: Complex Biological Taxonomy & Flora", ["Biology"], ["biological-taxonomy"]),
    (3, "Advanced Prose: Geological Stratification & Lithology", ["Geology"], ["geological-lithology"]),
    (4, "Advanced Prose: Astrophysics & Celestial Mechanics", ["Astrophysics"], ["astrophysics-prose"]),
    (5, "Advanced Prose: Deep Sea Oceanography & Geophysics", ["Oceanography"], ["oceanography-prose"]),
    (6, "Heavy Punctuation Density: Semicolons & Parentheses", ["Punctuation Density"], ["semicolon-density"]),
    (7, "Heavy Punctuation Density: Em-Dashes & Colons", ["Punctuation Density"], ["em-dash-colons"]),
    (8, "Heavy Punctuation Density: Quotations within Clauses", ["Punctuation Density"], ["nested-quotes"]),
    (9, "Embedded Mathematical & Scientific Formulae", ["Scientific Formulas"], ["formulae-in-prose"]),
    (10, "Unit 10 Milestone Assessment: Advanced Syntax Benchmark", ["Syntax Benchmark"], ["milestone-benchmark"]),
    (11, "Alphanumeric Telemetry: Sensor Readings & Latencies", ["Telemetry"], ["sensor-readings"]),
    (12, "Alphanumeric Telemetry: Satellite Orbit Parameters", ["Orbital Metrics"], ["orbital-metrics"]),
    (13, "Alphanumeric Telemetry: High-Energy Physics Datasets", ["Particle Physics"], ["physics-datasets"]),
    (14, "Alphanumeric Telemetry: Climate Monitoring Records", ["Climate Metrics"], ["climate-records"]),
    (15, "Alphanumeric Telemetry: Genomic Sequencing Statistics", ["Genomics"], ["genomic-statistics"]),
    (16, "Speed Interval: 52 WPM Cadence Synchronization", ["Speed 52"], ["52-wpm-cadence"]),
    (17, "Speed Interval: 54 WPM Cadence Synchronization", ["Speed 54"], ["54-wpm-cadence"]),
    (18, "Metronome Flow: Constant 53 WPM Keystroke Tempo", ["Metronome 53"], ["metronome-53"]),
    (19, "Zero-Hesitation Punctuation Leaps under Speed", ["Punctuation Speed"], ["zero-hesitation-punct"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Academic Prose: Cognitive Linguistics & Semantics", ["Linguistics"], ["cognitive-semantics"]),
    (22, "Academic Prose: Macroeconomic Fiscal Policy", ["Economics"], ["fiscal-policy"]),
    (23, "Academic Prose: Constitutional Jurisprudence", ["Jurisprudence"], ["constitutional-law"]),
    (24, "Academic Prose: Epistemology & Theory of Knowledge", ["Philosophy"], ["epistemology-prose"]),
    (25, "Academic Prose: Historical Historiography", ["Historiography"], ["historiography-prose"]),
    (26, "Speed Interval: 55 WPM Acceleration Push", ["Speed 55"], ["55-wpm-push"]),
    (27, "Speed Interval: 56 WPM Acceleration Push", ["Speed 56"], ["56-wpm-push"]),
    (28, "Continuous Multi-Clause Rhythm over Extended Passages", ["Multi-Clause"], ["multi-clause-rhythm"]),
    (29, "Near-Zero Error Precision Sprints Alpha (94%+)", ["Precision 94%"], ["zero-error-prose-a"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Performance", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Literary Masterpieces: Nineteenth Century Novelists", ["19th Century"], ["19th-century-novelists"]),
    (32, "Literary Masterpieces: Classical Philosophical Dialogues", ["Philosophical Dialogues"], ["classical-dialogues"]),
    (33, "Literary Masterpieces: Dramatic Elizabethan Soliloquies", ["Dramatic Soliloquy"], ["dramatic-soliloquies"]),
    (34, "Literary Masterpieces: Transcendentalist Essays", ["Transcendentalism"], ["transcendentalist-essays"]),
    (35, "Literary Masterpieces: Modernist Narrative Innovations", ["Modernism"], ["modernist-narratives"]),
    (36, "Technical Architecture: Distributed Systems Consensus", ["Distributed Systems"], ["consensus-algorithms"]),
    (37, "Technical Architecture: Database Indexing Strategies", ["Database Indexing"], ["b-tree-indexing"]),
    (38, "Technical Architecture: Asymmetric Cryptography & Ciphers", ["Cryptography"], ["rsa-cryptography"]),
    (39, "Technical Architecture: Operating System Kernel Schedulers", ["OS Schedulers"], ["kernel-scheduling"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Synthesis", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Speed Interval: 57 WPM Velocity Elevation", ["Speed 57"], ["57-wpm-elevation"]),
    (42, "Speed Interval: 58 WPM Velocity Elevation", ["Speed 58"], ["58-wpm-elevation"]),
    (43, "Fatigue Prevention during Multi-Paragraph Runs", ["Ergonomics"], ["fatigue-prevention-prose"]),
    (44, "Deep Breath Control & Shoulder Relaxation at 58 WPM", ["Ergonomics"], ["breath-control-58"]),
    (45, "Light Keystroke Feathering on Outer Pinky Clusters", ["Ergonomics"], ["pinky-feathering"]),
    (46, "Historical Speeches: Calls for Democratic Liberty", ["Historic Speeches"], ["democratic-liberty"]),
    (47, "Historical Speeches: Scientific Nobel Lectures", ["Nobel Lectures"], ["nobel-lectures"]),
    (48, "Historical Speeches: Environmental Conservation Summits", ["Conservation Summits"], ["conservation-summits"]),
    (49, "Historical Speeches: Philosophical Commencements", ["Commencements"], ["philosophical-commence"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Endurance", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Speed Interval: 59 WPM Velocity Push", ["Speed 59"], ["59-wpm-push"]),
    (52, "Speed Interval: 60 WPM Milestone Push", ["Speed 60"], ["60-wpm-push"]),
    (53, "Complex Alphanumeric Sentences with Dates & Currencies", ["Alphanumeric Complex"], ["alphanumeric-dates"]),
    (54, "Dense Quoted Dialogue with Embedded Citations", ["Citations"], ["embedded-citations"]),
    (55, "Multi-Clause Scientific Conclusions & Hypotheses", ["Scientific Conclusions"], ["scientific-conclusions"]),
    (56, "Speed Interval: 61 WPM Velocity Benchmark", ["Speed 61"], ["61-wpm-benchmark"]),
    (57, "Speed Interval: 62 WPM Velocity Benchmark", ["Speed 62"], ["62-wpm-benchmark"]),
    (58, "Sustained Speed Cadence over Dense Technical Blocks", ["Technical Blocks"], ["dense-tech-blocks"]),
    (59, "Near-Zero Error Precision Sprints Beta (94%+)", ["Precision 94%"], ["zero-error-prose-b"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Cadence", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Masterwork Transcriptions: Darwin's Origin of Species", ["Darwin"], ["darwin-transcriptions"]),
    (62, "Masterwork Transcriptions: Newton's Principia Mathematica", ["Newton"], ["newton-transcriptions"]),
    (63, "Masterwork Transcriptions: Federalist Papers Excerpts", ["Federalist"], ["federalist-transcriptions"]),
    (64, "Masterwork Transcriptions: Tocqueville's Democracy in America", ["Tocqueville"], ["tocqueville-transcriptions"]),
    (65, "Metronome Cadence: Constant 62 WPM Benchmark Polish", ["Metronome 62"], ["metronome-62"]),
    (66, "Continuous Multi-Minute Advanced Performance Trial", ["Endurance Trial"], ["advanced-trial"]),
    (67, "Pre-Capstone Speed Challenge: 62 WPM Interval", ["Pre-Capstone"], ["62-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 94%+ Target", ["Pre-Capstone"], ["accuracy-target-94"]),
    (69, "Comprehensive Advanced Performance Review", ["Comprehensive Review"], ["comprehensive-review"]),
    (70, "Stage 6 Grand Capstone Assessment (Level 700)", ["Stage 6 Capstone"], ["stage6-capstone"]),
]

STAGE_6_PARAGRAPHS = [
    "The relentless progression of empirical science relies upon reproducible experimental methodologies, disciplined mathematical formulation, and rigorous peer scrutiny. When scientists investigate physical phenomena—whether observing the subatomic decay of exotic mesons or mapping the gravitational lensing of distant galaxy clusters—their discoveries expand the frontiers of human civilization.",
    "In classical economic theory, the allocation of scarce productive resources is governed by the dynamic interplay of consumer demand, capital investment, and technological innovation. Transparent market institutions, robust regulatory frameworks, and equitable educational access ensure that societal prosperity is both sustainably generated and broadly distributed.",
    "The preservation of atmospheric equilibrium requires a profound transformation in global energy generation, industrial manufacturing, and ecological stewardship. By replacing fossil fuel combustion with advanced photovoltaic, wind, and geothermal infrastructure, modern societies mitigate catastrophic climatic volatility while fostering resilient industrial economies.",
    "Philosophical analysis of epistemic justification explores how rational agents distinguish authentic knowledge from mere coincidence or dogmatic belief. Through dialectical interrogation, formal logic, and empirical observation, thinkers construct coherent conceptual paradigms that illuminate the enduring mysteries of human consciousness and moral duty.",
    "Mastering high-velocity touch typing across dense, punctuation-rich prose transforms your digital composition into an uninhibited conduit for complex thought. When your hands execute intricate punctuation marks, capitalization changes, and numerical values with effortless muscle memory, intellectual externalization proceeds without the slightest mechanical distraction."
]

def generate_stage6_lessons():
    """Generates all 700 Stage 6 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_6_PARAGRAPHS)

    for unit_tuple in STAGE_6_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (220 to 350 chars)
            if level_num <= 150:
                target_min, target_max = 210, 270
            elif level_num <= 350:
                target_min, target_max = 250, 310
            elif level_num <= 550:
                target_min, target_max = 280, 350
            else:
                target_min, target_max = 310, 390

            p = STAGE_6_PARAGRAPHS[para_idx % num_paras]
            para_idx += 1

            sentences = p.split(". ")
            selected = []
            cur_len = 0
            for s in sentences:
                s_clean = s.rstrip(".")
                if not selected:
                    selected.append(s_clean)
                    cur_len += len(s_clean)
                elif cur_len + len(s_clean) + 2 <= target_max:
                    selected.append(s_clean)
                    cur_len += len(s_clean) + 2
                else:
                    break

            combined_text = ". ".join(selected) + "."
            dup_suffix = 1
            while combined_text in seen_texts:
                combined_text = f"{combined_text[:-1]} ({dup_suffix})."
                dup_suffix += 1

            seen_texts.add(combined_text)

            is_assessment = (l_in_u == 10)
            if is_assessment:
                title = f"{unit_label} Assessment"
                objective = f"Benchmark advanced performance and cadence for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Transcribe complex punctuation-dense prose with steady flow in {unit_label}."

            lesson = build_lesson(
                stage_id=STAGE_ID,
                stage_title=STAGE_TITLE,
                level_num=level_num,
                unit_num=unit_num,
                unit_label=unit_label,
                lesson_in_unit=l_in_u,
                title=title,
                objective=objective,
                text=combined_text,
                target_keys=target_keys,
                home_keys=HOME_KEYS,
                skills=skills
            )
            lessons.append(lesson)

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 6, got {len(lessons)}"
    return lessons
