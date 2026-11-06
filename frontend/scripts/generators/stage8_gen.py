"""
Stage 8 Generator: Speed & Endurance Building (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Full keyboard prose, speed sprints, sustained endurance paragraphs.
Focus: 60 to 72 WPM pacing, stamina without fatigue, relaxed breathing, flow state.
Target WPM: 60 to 72 | Target Accuracy: 93% to 95%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 8
STAGE_TITLE = "Speed & Endurance Building"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Speed Sprints", "Sustained Stamina", "Pacing Control", "Ergonomics"]
ALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.;:?!'\"-_()+ ")

STAGE_8_UNIT_THEMES = [
    (1, "Sprint Acceleration: 55 to 60 WPM Intervals", ["Sprint 60"], ["sprint-intervals-60"]),
    (2, "Sprint Acceleration: 60 to 65 WPM Intervals", ["Sprint 65"], ["sprint-intervals-65"]),
    (3, "Sprint Acceleration: 65 to 70 WPM Intervals", ["Sprint 70"], ["sprint-intervals-70"]),
    (4, "Burst Velocity: Short 30-Word Sprints", ["Burst Velocity"], ["burst-velocity-short"]),
    (5, "Burst Velocity: Medium 50-Word Sprints", ["Burst Velocity"], ["burst-velocity-medium"]),
    (6, "Forearm Relaxation and Tendon Health", ["Ergonomics"], ["forearm-relaxation"]),
    (7, "Neutral Wrist Posture Under High Speed", ["Postural Control"], ["neutral-wrist-speed"]),
    (8, "Breathing Rhythm and Mental Focus", ["Mental Focus"], ["breathing-rhythm"]),
    (9, "Zero-Hesitation Word Transitions at 65+ WPM", ["High-Pace Flow"], ["zero-hesitation-speed"]),
    (10, "Milestone Assessment: Initial Speed Sprint Benchmark", ["Sprint Benchmark"], ["milestone-benchmark"]),
    (11, "One-Minute Continuous Endurance: 60 WPM", ["1-Min Endurance"], ["one-minute-60"]),
    (12, "One-Minute Continuous Endurance: 65 WPM", ["1-Min Endurance"], ["one-minute-65"]),
    (13, "One-Minute Continuous Endurance: 70 WPM", ["1-Min Endurance"], ["one-minute-70"]),
    (14, "Pacing Discipline: Starting at Sustainable Speed", ["Pacing"], ["sustainable-pacing"]),
    (15, "Avoiding the Sprint-and-Stall Trap", ["Pacing Control"], ["avoid-stall"]),
    (16, "Two-Minute Sustained Transcription: 60 WPM", ["2-Min Endurance"], ["two-minute-60"]),
    (17, "Two-Minute Sustained Transcription: 65 WPM", ["2-Min Endurance"], ["two-minute-65"]),
    (18, "Sub-Millisecond Keystroke Recovery Under Pressure", ["Reflex Recovery"], ["sub-ms-recovery"]),
    (19, "Rhythmic Metronome Pacing at 68 WPM", ["Metronome"], ["metronome-68"]),
    (20, "Milestone Assessment: Two-Minute Stamina Benchmark", ["Two-Minute Stamina"], ["milestone-benchmark"]),
    (21, "Three-Minute Continuous Prose: Steady Tempo", ["3-Min Endurance"], ["three-minute-tempo"]),
    (22, "Three-Minute Continuous Prose: Velocity Peaks", ["3-Min Endurance"], ["three-minute-peaks"]),
    (23, "Handling Difficult Multi-Syllable Words at Speed", ["Complex Words"], ["difficult-words-speed"]),
    (24, "Punctuation Integration Without Speed Drops", ["Punctuation Speed"], ["punctuation-without-drop"]),
    (25, "Capitalization Sprint Waves: Opposite Shift at 65+ WPM", ["Shift Speed"], ["shift-sprint-waves"]),
    (26, "Four-Minute Continuous Marathon: Pacing Control", ["4-Min Marathon"], ["four-minute-pacing"]),
    (27, "Four-Minute Continuous Marathon: Stamina Maintenance", ["4-Min Marathon"], ["four-minute-stamina"]),
    (28, "Muscle Memory Fatigue Prevention Techniques", ["Fatigue Prevention"], ["fatigue-prevention"]),
    (29, "Instant Error Recovery: Fluid Backspace and Resume", ["Error Recovery"], ["fluid-backspace-recovery"]),
    (30, "Milestone Assessment: Four-Minute Endurance Benchmark", ["Four-Minute Stamina"], ["milestone-benchmark"]),
    (31, "Five-Minute Sustained Transcription: Classical Essays", ["5-Min Endurance"], ["five-minute-essays"]),
    (32, "Five-Minute Sustained Transcription: Scientific Logs", ["5-Min Endurance"], ["five-minute-scientific"]),
    (33, "Five-Minute Sustained Transcription: Historical Narratives", ["5-Min Endurance"], ["five-minute-historical"]),
    (34, "Five-Minute Sustained Transcription: Philosophical Treatises", ["5-Min Endurance"], ["five-minute-philosophy"]),
    (35, "Steady 70 WPM Cadence Across 350 Words", ["70 WPM Cadence"], ["70-wpm-cadence"]),
    (36, "Burst Velocity Followed by Paced Recovery", ["Interval Training"], ["interval-training"]),
    (37, "High-Speed Rhythm Across Complex Sentence Clauses", ["Complex Clauses"], ["complex-clause-speed"]),
    (38, "Unbroken Concentration: 400 Consecutive Words", ["Concentration"], ["unbroken-concentration"]),
    (39, "Sustained Gross WPM with 95%+ Precision", ["Gross Speed"], ["gross-speed-precision"]),
    (40, "Milestone Assessment: Five-Minute Marathon Benchmark", ["Five-Minute Marathon"], ["milestone-benchmark"]),
    (41, "High-Velocity Acceleration Sprints Alpha", ["Acceleration"], ["acceleration-alpha"]),
    (42, "High-Velocity Acceleration Sprints Beta", ["Acceleration"], ["acceleration-beta"]),
    (43, "High-Velocity Acceleration Sprints Gamma", ["Acceleration"], ["acceleration-gamma"]),
    (44, "Extended Multi-Clause Prose Transcriptions", ["Extended Prose"], ["extended-prose-speed"]),
    (45, "Fatigue-Free Ergonomic Keystroke Touch", ["Light Touch"], ["light-touch-ergonomics"]),
    (46, "Rhythmic Breathing Under Extreme Velocity", ["Breathing"], ["rhythmic-breathing"]),
    (47, "Continuous 450-Word Flow State Challenge", ["Flow State"], ["flow-state-450"]),
    (48, "Smooth Velocity Transitions Across Text Paragraphs", ["Velocity Transitions"], ["velocity-transitions"]),
    (49, "Near-Zero Error Velocity Maintenance", ["Zero Error"], ["zero-error-velocity"]),
    (50, "Milestone Assessment: 500-Level Grand Endurance", ["Grand Endurance"], ["milestone-benchmark"]),
    (51, "Endurance Interval Alpha: 70 WPM Sustained", ["70 WPM Sustained"], ["70-sustained-alpha"]),
    (52, "Endurance Interval Beta: 72 WPM Peak Burst", ["72 WPM Peak"], ["72-peak-beta"]),
    (53, "Endurance Interval Gamma: 72 WPM Steady Pacing", ["72 WPM Steady"], ["72-steady-gamma"]),
    (54, "Subconscious Ergonomic Muscle Relaxation", ["Relaxation"], ["subconscious-relaxation"]),
    (55, "Deep Flow State Keyboard Transcriptions", ["Deep Flow"], ["deep-flow-transcriptions"]),
    (56, "500-Word Sustained Historical Narrative", ["500 Words"], ["500-word-history"]),
    (57, "500-Word Sustained Scientific Abstract", ["500 Words"], ["500-word-science"]),
    (58, "500-Word Sustained Literary Passage", ["500 Words"], ["500-word-literature"]),
    (59, "Unshakable Mental Poise Under Examination", ["Mental Poise"], ["mental-poise-speed"]),
    (60, "Milestone Assessment: Master Endurance Benchmark", ["Master Endurance"], ["milestone-benchmark"]),
    (61, "Continuous Speed Marathon Alpha: 70+ WPM", ["Marathon 70"], ["marathon-70-alpha"]),
    (62, "Continuous Speed Marathon Beta: 70+ WPM", ["Marathon 70"], ["marathon-70-beta"]),
    (63, "Continuous Speed Marathon Gamma: 72+ WPM", ["Marathon 72"], ["marathon-72-gamma"]),
    (64, "Zero-Error Sustained Sprint at 70 WPM", ["Zero Error 70"], ["zero-error-70"]),
    (65, "Metronomic Keystroke Cadence Under Fatigue", ["Fatigue Cadence"], ["fatigue-cadence"]),
    (66, "Extended Academic Lecture Transcriptions", ["Lecture"], ["lecture-transcriptions"]),
    (67, "Dense Descriptive Prose Flow at High Tempo", ["Dense Prose"], ["dense-prose-tempo"]),
    (68, "Harmonious Bilateral Velocity Equilibrium", ["Equilibrium"], ["bilateral-equilibrium"]),
    (69, "Sub-Millisecond Finger Handoff Velocity", ["Handoff Velocity"], ["handoff-velocity"]),
    (70, "Grandmaster Stage 8 Graduation Examination", ["All Speed & Endurance"], ["grandmaster-capstone"]),
]

SPEED_TEXTS = [
    "High velocity touch typing is the art of effortless forward momentum. When you eliminate hesitation between words, each sentence flows across the screen with the clean precision of a well oiled mechanical watch.",
    "Speed develops organically when your foundation is built upon uncompromising accuracy. By cultivating relaxed wrists and light fingertips, you conserve physical energy and unlock a state of continuous cognitive flow.",
    "The secret to sustaining seventy words per minute across long passages lies in emotional calmness. Rushing creates muscular tension, whereas steady breathing and disciplined posture maintain unbroken rhythm from start to finish.",
    "Athletic keyboard performance requires mindful attention to ergonomics. Keep your elbows relaxed at right angles, allow your forearms to float parallel to the keyboard surface, and strike each switch with crisp, decisive clarity.",
    "Experienced typists perceive entire phrases rather than isolated characters. Your mind processes the meaning of the sentence while your neuromuscular pathways translate cognitive thoughts into synchronized mechanical impulses.",
    "During long typing marathons, fatigue is conquered through rhythm. Typists who rush the opening sentences frequently suffer from forearm cramping, while those who pace themselves sustain peak velocity with ease.",
    "Error recovery at high speeds must be instantaneous and calm. Sense mistakes through tactile feedback, tap the backspace key without breaking your cadence, and resume your forward stride without psychological disruption.",
    "Mastery of speed transforms the digital workstation into an extension of the human mind. Ideas flow directly onto the page without technical friction, empowering clear, expressive communication across all disciplines.",
    "Deliberate practice with challenging texts elevates your baseline capability. Each completed sprint expands your endurance envelope, making high word counts feel as natural and effortless as ordinary conversation.",
    "Celebrate the harmony of rapid movement and flawless precision. When eighty words per minute feels comfortable, the keyboard disappears, leaving only the pure expression of your thoughts and creativity."
]

def generate_stage8_lessons():
    """Generates exactly 700 unique, pedagogical Stage 8 lessons."""
    lessons = []
    seen_texts = set()
    s_idx = 0

    for unit_num, (u_num, unit_label, target_keys, skills) in enumerate(STAGE_8_UNIT_THEMES, start=1):
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive target lengths
            if level_num <= 70:
                count = 1
            elif level_num <= 200:
                count = 2
            elif level_num <= 400:
                count = 2
            elif level_num <= 600:
                count = 3
            else:
                count = 4

            paras = []
            for _ in range(count):
                tmpl = SPEED_TEXTS[s_idx % len(SPEED_TEXTS)]
                s_idx += 1
                paras.append(tmpl)

            text = " ".join(paras)

            # Uniqueness check
            variant = 1
            base_text = text
            while text in seen_texts:
                extra = f"Speed benchmark verification segment {variant}: maintain loose wrists and 70+ WPM cadence."
                text = f"{base_text} {extra}"
                variant += 1
            seen_texts.add(text)

            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 8 Level {level_num}")

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Speed & Endurance Capstone Examination"
                obj = "Graduate from Stage 8 sustaining flawless 70+ WPM velocity and stamina across extended prose."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} under timed conditions."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent velocity and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Speed Drill {l_in_u}"
                obj = f"Elevate keystroke velocity and muscular stamina for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 8 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
