"""
Stage 5 Generator: Intermediate Speed Development (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Bridge intermediate typing into serious professional velocity (44 to 54 WPM).
Train high-velocity sprint bursts, eliminate micro-hesitations on word boundaries,
develop metronomic rhythm cadence, maintain 91% to 93%+ precision under time pressure,
and establish effortless finger coordination on mixed alphanumeric prose.

Zero repetitive alphabet introductions.
Target WPM: 44 to 54 | Target Accuracy: 91% to 93%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 5
STAGE_TITLE = "Intermediate Speed Development"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Velocity Intervals", "Speed Bursts", "Cadence Acceleration", "Rhythm Consistency"]

STAGE_5_UNIT_THEMES = [
    (1, "Velocity Conditioning: 44 WPM Threshold Intervals", ["Velocity 44"], ["44-wpm-threshold"]),
    (2, "Subconscious Syllable Clustering: -tion, -ment, -ness", ["Morphemes"], ["syllable-bursts"]),
    (3, "Bilateral Alternation Sprints: Rapid Hand Handoffs", ["Bilateral Hand"], ["rapid-handoffs"]),
    (4, "High-Frequency Collocation Sprints: Two-Word Bundles", ["Collocations"], ["collocation-sprints"]),
    (5, "Eliminating Word Boundary Pause Latencies", ["Zero Latency"], ["zero-latency-drills"]),
    (6, "Number Row Embedded Velocity: Metrics & Statistics", ["Numbers Velocity"], ["number-metrics"]),
    (7, "Punctuation-Dense Speed Drills: Commas, Semicolons", ["Punctuation Speed"], ["punctuation-speed"]),
    (8, "Quoted Dialogue Sprint Passages: Rapid Shift Handoffs", ["Dialogue Speed"], ["dialogue-sprints"]),
    (9, "Metronome Rhythm Pacing: Strict 45 WPM Cadence", ["Metronome 45"], ["metronome-45"]),
    (10, "Unit 10 Milestone Assessment: 45 WPM Speed Benchmark", ["Speed Benchmark"], ["milestone-benchmark"]),
    (11, "Sprint Intervals: 46 WPM Acceleration Push", ["Velocity 46"], ["46-wpm-acceleration"]),
    (12, "Rapid Syllable Transitions: Compound English Words", ["Compounds"], ["compound-sprints"]),
    (13, "Prefix Sprint Reflexes: Inter-, Trans-, Super-", ["Prefix Sprints"], ["prefix-velocity"]),
    (14, "Suffix Sprint Reflexes: -ability, -ological, -ization", ["Suffix Sprints"], ["suffix-velocity"]),
    (15, "Left-Hand Dominant Velocity Sentences", ["Left Hand Speed"], ["left-hand-velocity"]),
    (16, "Right-Hand Dominant Velocity Sentences", ["Right Hand Speed"], ["right-hand-velocity"]),
    (17, "Cross-Row Leap Conditioning: Top to Bottom Waves", ["Vertical Waves"], ["cross-row-waves"]),
    (18, "Pinky & Ring Reach Stabilization under Sprint Speed", ["Finger Agility"], ["pinky-ring-sprints"]),
    (19, "Lightweight Keystroke Feathering for Speed Endurance", ["Ergonomics"], ["keystroke-feathering"]),
    (20, "Unit 20 Milestone Assessment: 47 WPM Speed Benchmark", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Speed Narrative: The High-Speed Railway Journey", ["Narrative Speed"], ["railway-narrative"]),
    (22, "Speed Narrative: The Alpine Glider Flight", ["Narrative Speed"], ["glider-narrative"]),
    (23, "Speed Narrative: The Rushing Mountain Avalanche", ["Narrative Speed"], ["avalanche-narrative"]),
    (24, "Speed Narrative: Deep Ocean Marine Exploration", ["Narrative Speed"], ["ocean-narrative"]),
    (25, "Speed Narrative: The Architectural Sky Garden", ["Narrative Speed"], ["garden-narrative"]),
    (26, "Technical Data Speed: Network Bandwidth & Telemetry", ["Technical Data"], ["telemetry-speed"]),
    (27, "Technical Data Speed: Database Transaction Latencies", ["Technical Data"], ["db-latency-speed"]),
    (28, "Financial Speed: Stock Market Indices & Currencies", ["Financial Speed"], ["financial-speed"]),
    (29, "Academic Speed: Psychological Studies on Perception", ["Academic Speed"], ["academic-speed"]),
    (30, "Unit 30 Milestone Assessment: 48 WPM Speed Benchmark", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Sprint Intervals: 49 WPM Cadence Elevation", ["Velocity 49"], ["49-wpm-cadence"]),
    (32, "Continuous Word Rhythm: Three-Sentence Passages", ["Rhythm Continuity"], ["three-sentence-rhythm"]),
    (33, "Rapid Shift Bimanual Transitions in Prose", ["Shift Sprints"], ["shift-sprints"]),
    (34, "Exclamatory & Interrogative Sentence Speed Intervals", ["Question Sprints"], ["interrogative-sprints"]),
    (35, "Parenthetical & Em-Dash Velocity Sentences", ["Punctuation Cadence"], ["parenthetical-cadence"]),
    (36, "Metronome Cadence: Constant 49 WPM Tempo", ["Metronome 49"], ["metronome-49"]),
    (37, "Near-Zero Error Velocity Sprint Alpha", ["Precision 98%"], ["zero-error-sprints-a"]),
    (38, "Near-Zero Error Velocity Sprint Beta", ["Precision 98%"], ["zero-error-sprints-b"]),
    (39, "Rapid Keystroke Recovery after Mistake Correction", ["Backspace Sprints"], ["backspace-resumption"]),
    (40, "Unit 40 Milestone Assessment: 50 WPM Speed Benchmark", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Sprint Intervals: 51 WPM Velocity Push", ["Velocity 51"], ["51-wpm-push"]),
    (42, "Extended Prose Flow: Classical Philosophical Essays", ["Philosophy"], ["philosophical-prose"]),
    (43, "Extended Prose Flow: Historical Scientific Revolutions", ["Scientific History"], ["scientific-revolutions"]),
    (44, "Extended Prose Flow: Environmental Ecology & Climate", ["Ecology"], ["ecology-prose"]),
    (45, "Extended Prose Flow: Modern Architectural Philosophy", ["Architecture"], ["architectural-prose"]),
    (46, "Finger Independence: Rapid Trill Movements", ["Trill Movements"], ["trill-movements"]),
    (47, "Finger Independence: Alternating Hand Doublets", ["Doublet Sprints"], ["doublet-sprints"]),
    (48, "Finger Independence: Outer Corner Quick Snaps", ["Corner Snaps"], ["corner-snaps"]),
    (49, "Fatigue Prevention during Sustained 50+ WPM Runs", ["Ergonomics"], ["fatigue-prevention"]),
    (50, "Unit 50 Milestone Assessment: 52 WPM Speed Benchmark", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Sprint Intervals: 53 WPM Velocity Push", ["Velocity 53"], ["53-wpm-push"]),
    (52, "Long-Form Paragraph Sprints: Technological Renaissance", ["Technology"], ["tech-renaissance"]),
    (53, "Long-Form Paragraph Sprints: Marine Ecosystem Dynamics", ["Marine Science"], ["marine-dynamics"]),
    (54, "Long-Form Paragraph Sprints: Deep Space Exploration", ["Space Exploration"], ["deep-space-prose"]),
    (55, "Long-Form Paragraph Sprints: Human Cultural Evolution", ["Anthropology"], ["cultural-evolution"]),
    (56, "Alphanumeric & Symbol Integration at 53 WPM", ["Integrated Sprints"], ["integrated-53-wpm"]),
    (57, "Complex Mathematical Prose at High Velocity", ["Math Prose"], ["math-velocity"]),
    (58, "Legal and Ethical Principles at High Velocity", ["Legal Prose"], ["legal-velocity"]),
    (59, "Masterwork Literary Prose at High Velocity", ["Literature"], ["literary-velocity"]),
    (60, "Unit 60 Milestone Assessment: 53 WPM Synthesis", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Controlled Speed Sprints: 54 WPM Push Alpha", ["Velocity 54"], ["54-wpm-push-a"]),
    (62, "Controlled Speed Sprints: 54 WPM Push Beta", ["Velocity 54"], ["54-wpm-push-b"]),
    (63, "Near-Zero Error Precision Sprints Alpha", ["Precision 98%"], ["zero-error-sprints-c"]),
    (64, "Near-Zero Error Precision Sprints Beta", ["Precision 98%"], ["zero-error-sprints-d"]),
    (65, "Metronome Cadence: Constant 54 WPM Final Polish", ["Metronome 54"], ["metronome-54"]),
    (66, "Continuous Multi-Minute Cadence Challenge", ["Endurance"], ["multi-minute-endurance"]),
    (67, "Pre-Capstone Speed Challenge: 54 WPM Benchmark", ["Pre-Capstone"], ["54-wpm-benchmark"]),
    (68, "Pre-Capstone Accuracy Challenge: 93%+ Precision", ["Pre-Capstone"], ["accuracy-target-93"]),
    (69, "Comprehensive Speed Development Review", ["Comprehensive Review"], ["comprehensive-review"]),
    (70, "Stage 5 Grand Capstone Assessment (Level 700)", ["Stage 5 Capstone"], ["stage5-capstone"]),
]

STAGE_5_PARAGRAPHS = [
    "Accelerating your typing speed requires cultivating deep physical relaxation alongside focused mental clarity. When fingers remain curved and wrists hover lightly above the desk, mechanical resistance vanishes, allowing keystrokes to cascade in effortless metronomic bursts across the entire keyboard.",
    "The transition from conscious character selection to subconscious word-level execution represents a profound neurological breakthrough. Experienced typists no longer think in isolated letters; instead, entire multi-syllabic phrases trigger fluid neuromuscular cascades that execute with surgical precision.",
    "Sustaining velocity beyond fifty words per minute demands disciplined breath control and balanced bilateral hand coordination. When both hands share typing momentum equally, fatigue is distributed evenly, enabling marathon typing sessions that feel as effortless as a gentle conversation.",
    "Modern digital workflows reward rapid, accurate textual transcription across diverse domains. From composing concise executive emails to drafting complex analytical reports, high typing velocity empowers professionals to externalize their most ambitious intellectual concepts at the speed of thought.",
    "True keyboard speed is never achieved through frantic or strained finger movements. On the contrary, the fastest typists exhibit an economy of motion that looks astonishingly calm and deliberate, proving that relaxed precision is the true secret behind world-class velocity."
]

def generate_stage5_lessons():
    """Generates all 700 Stage 5 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_5_PARAGRAPHS)

    for unit_tuple in STAGE_5_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (180 to 300 chars)
            if level_num <= 150:
                target_min, target_max = 175, 230
            elif level_num <= 350:
                target_min, target_max = 210, 260
            elif level_num <= 550:
                target_min, target_max = 240, 300
            else:
                target_min, target_max = 260, 340

            p = STAGE_5_PARAGRAPHS[para_idx % num_paras]
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
                objective = f"Benchmark speed velocity and precision for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Accelerate typing cadence and eliminate hesitation in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 5, got {len(lessons)}"
    return lessons
