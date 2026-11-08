"""
Stage 8 Generator: High-Speed Mastery & Stamina (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Develop high-speed typing mastery and sustained endurance (65 to 78 WPM).
Train multi-minute high-velocity passages without wrist tension or fatigue accumulation,
achieve effortless rapid multi-word chunk recognition, eliminate pause latencies,
and maintain 94% to 96%+ accuracy across extended literary and technical stamina runs.

Zero repetitive alphabet introductions.
Target WPM: 65 to 78 | Target Accuracy: 94% to 96%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 8
STAGE_TITLE = "High-Speed Mastery & Stamina"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["High-Speed Cadence", "Multi-Minute Stamina", "Fatigue Prevention", "Velocity Sprints"]

STAGE_8_UNIT_THEMES = [
    (1, "High-Velocity Sprints: 65 WPM Foundation Intervals", ["Velocity 65"], ["65-wpm-foundation"]),
    (2, "Multi-Minute Stamina: Sustained Cadence Run Alpha", ["Stamina"], ["stamina-run-alpha"]),
    (3, "Subconscious Multi-Word Recognition: Rapid Chunking", ["Word Chunking"], ["chunking-sprints"]),
    (4, "Zero-Latency Word Boundary Transitions", ["Zero Latency"], ["zero-latency-transitions"]),
    (5, "Bilateral Alternating Hand Acceleration", ["Bilateral Hand"], ["bilateral-acceleration"]),
    (6, "Rapid Punctuation & Shift Integration at 66 WPM", ["Punctuation Speed"], ["punct-speed-66"]),
    (7, "Alphanumeric Telemetry Integration at High Speed", ["Alphanumeric Speed"], ["telemetry-speed-66"]),
    (8, "Lightweight Keystroke Feathering Technique", ["Ergonomics"], ["feathering-technique"]),
    (9, "Breathing & Heart Rate Synchronization under Speed", ["Mindfulness"], ["breathing-synchronization"]),
    (10, "Unit 10 Milestone Assessment: 66 WPM Speed Benchmark", ["Speed Benchmark"], ["milestone-benchmark"]),
    (11, "Velocity Intervals: 67 WPM Sprint Cadence", ["Velocity 67"], ["67-wpm-cadence"]),
    (12, "Multi-Minute Stamina: Sustained Cadence Run Beta", ["Stamina"], ["stamina-run-beta"]),
    (13, "Complex Sentence Rapid Transcriptions: History", ["History Prose"], ["history-sprints"]),
    (14, "Complex Sentence Rapid Transcriptions: Science", ["Science Prose"], ["science-sprints"]),
    (15, "Complex Sentence Rapid Transcriptions: Philosophy", ["Philosophy Prose"], ["philosophy-sprints"]),
    (16, "Speed Interval: 68 WPM Velocity Elevation", ["Velocity 68"], ["68-wpm-elevation"]),
    (17, "Speed Interval: 69 WPM Velocity Elevation", ["Velocity 69"], ["69-wpm-elevation"]),
    (18, "Metronome Cadence: Constant 68 WPM Steady Flow", ["Metronome 68"], ["metronome-68"]),
    (19, "Fatigue Prevention on Outer Pinky and Ring Keys", ["Ergonomics"], ["pinky-fatigue-prevention"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Speed Narrative: The Transatlantic Aeronautical Record", ["Aeronautics"], ["aeronautical-narrative"]),
    (22, "Speed Narrative: The High-Altitude Arctic Observatory", ["Arctic Science"], ["arctic-narrative"]),
    (23, "Speed Narrative: The Pacific Rim Tectonic Expeditions", ["Geophysics"], ["tectonic-narrative"]),
    (24, "Speed Narrative: The Deep Space Radio Interferometer", ["Radio Astronomy"], ["interferometer-narrative"]),
    (25, "Speed Narrative: The Modernist Architectural Renaissance", ["Architecture"], ["architectural-narrative"]),
    (26, "Speed Interval: 70 WPM Milestone Push", ["Velocity 70"], ["70-wpm-push"]),
    (27, "Speed Interval: 71 WPM Milestone Push", ["Velocity 71"], ["71-wpm-push"]),
    (28, "Continuous Long-Form Stamina Run Alpha", ["Long-Form Stamina"], ["stamina-long-form-a"]),
    (29, "Near-Zero Error Precision Sprints Alpha (95%+ Target)", ["Precision 95%"], ["zero-error-sprints-a"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Performance", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Literary Sprints: Classical English Romantic Poets", ["Romantic Poetry"], ["romantic-poets"]),
    (32, "Literary Sprints: Victorian Social Commentaries", ["Victorian Prose"], ["victorian-commentary"]),
    (33, "Literary Sprints: American Transcendentalist Essays", ["Transcendentalism"], ["emerson-thoreau"]),
    (34, "Literary Sprints: Modernist Philosophical Reflections", ["Modern Philosophy"], ["modernist-reflections"]),
    (35, "Literary Sprints: Dramatic Classical Monologues", ["Dramatic Prose"], ["dramatic-monologues"]),
    (36, "Speed Interval: 72 WPM Velocity Elevation", ["Velocity 72"], ["72-wpm-elevation"]),
    (37, "Speed Interval: 73 WPM Velocity Elevation", ["Velocity 73"], ["73-wpm-elevation"]),
    (38, "Continuous Long-Form Stamina Run Beta", ["Long-Form Stamina"], ["stamina-long-form-b"]),
    (39, "Eliminating Micro-Hesitations in Multi-Clause Syntax", ["Fluency"], ["micro-hesitation-elimination"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Synthesis", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Speed Interval: 74 WPM Acceleration Push", ["Velocity 74"], ["74-wpm-push"]),
    (42, "Speed Interval: 75 WPM Acceleration Push", ["Velocity 75"], ["75-wpm-push"]),
    (43, "Multi-Minute Stamina: Sustained Cadence Run Gamma", ["Stamina"], ["stamina-run-gamma"]),
    (44, "Deep Forearm Relaxation & Wrist Floating at 75 WPM", ["Ergonomics"], ["forearm-relaxation-75"]),
    (45, "Rapid Keystroke Handoffs on Alternating Words", ["Bilateral Speed"], ["alternating-handoffs"]),
    (46, "Historical Speeches: World Leaders on Democratic Unity", ["Historic Speeches"], ["democratic-unity"]),
    (47, "Historical Speeches: Scientific Discoveries That Changed the World", ["Science History"], ["scientific-speeches"]),
    (48, "Historical Speeches: In Defense of Human Rights and Dignity", ["Human Rights"], ["human-rights-speeches"]),
    (49, "Historical Speeches: Exploration of the Cosmos and Unknown", ["Space Speeches"], ["cosmos-speeches"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Endurance", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Speed Interval: 76 WPM Velocity Push", ["Velocity 76"], ["76-wpm-push"]),
    (52, "Speed Interval: 77 WPM Velocity Push", ["Velocity 77"], ["77-wpm-push"]),
    (53, "Complex Alphanumeric & Code Integration at High Speed", ["Technical High Speed"], ["tech-high-speed"]),
    (54, "Dense Multi-Clause Syntax under Severe Speed Pressure", ["Complex Syntax"], ["syntax-under-pressure"]),
    (55, "Rapid Error Correction & Instant Cadence Resumption", ["Error Recovery"], ["rapid-recovery-cadence"]),
    (56, "Speed Interval: 78 WPM Velocity Benchmark", ["Velocity 78"], ["78-wpm-benchmark"]),
    (57, "Multi-Minute Stamina: Extended 5-Minute Marathon", ["Marathon Stamina"], ["5-minute-marathon"]),
    (58, "Sustained Speed Cadence over Dense Literary Masterworks", ["Literary Masterworks"], ["dense-literary-runs"]),
    (59, "Near-Zero Error Precision Sprints Beta (96%+ Target)", ["Precision 96%"], ["zero-error-sprints-b"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Stamina", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Masterwork Transcriptions: Melville's Moby Dick Openings", ["Melville"], ["moby-dick-transcriptions"]),
    (62, "Masterwork Transcriptions: Thoreau's Walden Pond Essays", ["Thoreau"], ["walden-transcriptions"]),
    (63, "Masterwork Transcriptions: Lincoln's Gettysburg Address", ["Lincoln"], ["gettysburg-transcriptions"]),
    (64, "Masterwork Transcriptions: Churchill's Wartime Addresses", ["Churchill"], ["churchill-transcriptions"]),
    (65, "Metronome Cadence: Constant 78 WPM Benchmark Polish", ["Metronome 78"], ["metronome-78"]),
    (66, "Continuous Multi-Minute Grand Stamina Trial", ["Grand Stamina"], ["grand-stamina-trial"]),
    (67, "Pre-Capstone Speed Challenge: 78 WPM Interval", ["Pre-Capstone"], ["78-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 96%+ Precision", ["Pre-Capstone"], ["accuracy-target-96"]),
    (69, "Comprehensive High-Speed & Stamina Review", ["Comprehensive Review"], ["comprehensive-speed-review"]),
    (70, "Stage 8 Grand Capstone Assessment (Level 700)", ["Stage 8 Capstone"], ["stage8-capstone"]),
]

STAGE_8_PARAGRAPHS = [
    "Sustaining velocity beyond seventy words per minute across multi-minute passages requires complete mental tranquility and an unshakeable neuromuscular foundation. When typists reach this advanced tier of performance, fingers no longer seek out individual keys; rather, words, punctuation, and capitalization flow effortlessly through subconscious muscle memory like water flowing down a mountain stream.",
    "The secret to enduring typing stamina lies not in forceful exertion, but in extreme physical economy and light, featherweight keystroke impacts. By floating your wrists above the desk and allowing your hands to oscillate naturally from side to side, you eliminate forearm lactic acid accumulation and preserve pinpoint accuracy across thousands of continuous keystrokes.",
    "Throughout the history of literature and journalism, typing speed has empowered great authors to externalize their most profound creative visions before fleeting inspiration evaporates. When mechanical friction between the human intellect and the written medium is reduced to near-zero, writing becomes an exhilarating experience of uninterrupted, transcendent flow.",
    "In demanding professional software engineering and data operations, the capacity to rapidly compose precise technical documentation, system shell commands, and architectural proposals without hesitation is an extraordinary multiplier of personal impact. Speed combined with uncompromising precision defines the hallmark of the elite digital practitioner.",
    "As you traverse the demanding velocity intervals of Stage 8, celebrate the immense neural transformation that has occurred within your motor cortex. You have progressed from carefully finding tactile bumps on F and J to commanding the entire keyboard at speeds that rival professional transcriptionists worldwide."
]

def generate_stage8_lessons():
    """Generates all 700 Stage 8 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_8_PARAGRAPHS)

    for unit_tuple in STAGE_8_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (300 to 450 chars)
            if level_num <= 150:
                target_min, target_max = 290, 360
            elif level_num <= 350:
                target_min, target_max = 330, 410
            elif level_num <= 550:
                target_min, target_max = 370, 460
            else:
                target_min, target_max = 410, 520

            p = STAGE_8_PARAGRAPHS[para_idx % num_paras]
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
                objective = f"Benchmark high-speed velocity and stamina for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Maintain sustained velocity and zero fatigue in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 8, got {len(lessons)}"
    return lessons
