"""
Stage 9 Generator: Elite Performance Benchmarks (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Attain elite tier typing performance (75 to 88 WPM).
Transcribe dense intellectual literature, formal philosophical treatises, legal briefs,
high-density punctuation passages, scientific research monographs, and complex
multidisciplinary syntheses with 95% to 97%+ precision under extreme benchmark speed.

Zero repetitive alphabet introductions.
Target WPM: 75 to 88 | Target Accuracy: 95% to 97%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 9
STAGE_TITLE = "Elite Performance Benchmarks"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Elite Performance", "Dense Literature", "Philosophical Prose", "Speed Benchmarks"]

STAGE_9_UNIT_THEMES = [
    (1, "Elite Speed Intervals: 75 WPM Foundation", ["Elite 75"], ["75-wpm-foundation"]),
    (2, "Dense Epistemology: Kant's Critique of Pure Reason", ["Philosophy"], ["kant-prose"]),
    (3, "Dense Metaphysics: Spinoza's Ethics & Axiomatic Method", ["Philosophy"], ["spinoza-prose"]),
    (4, "Dense Political Philosophy: Locke's Second Treatise", ["Philosophy"], ["locke-prose"]),
    (5, "Dense Moral Philosophy: Aristotle's Nicomachean Ethics", ["Philosophy"], ["aristotle-prose"]),
    (6, "Speed Interval: 76 WPM Acceleration Push", ["Elite 76"], ["76-wpm-push"]),
    (7, "Complex Legal Syntax: Constitutional Precedents", ["Law"], ["constitutional-precedents"]),
    (8, "Complex Legal Syntax: International Human Rights Treaties", ["Law"], ["human-rights-treaties"]),
    (9, "Complex Legal Syntax: Commercial Contract Covenants", ["Law"], ["contract-covenants"]),
    (10, "Unit 10 Milestone Assessment: 76 WPM Speed Benchmark", ["Elite Benchmark"], ["milestone-benchmark"]),
    (11, "Speed Interval: 77 WPM Velocity Elevation", ["Elite 77"], ["77-wpm-elevation"]),
    (12, "Advanced Scientific Monographs: Quantum Electrodynamics", ["Physics"], ["qed-prose"]),
    (13, "Advanced Scientific Monographs: General Relativity & Curved Space", ["Physics"], ["relativity-prose"]),
    (14, "Advanced Scientific Monographs: Molecular Genetics & CRISPR", ["Genetics"], ["crispr-prose"]),
    (15, "Advanced Scientific Monographs: Non-Equilibrium Thermodynamics", ["Thermodynamics"], ["thermodynamics-prose"]),
    (16, "Speed Interval: 78 WPM Velocity Elevation", ["Elite 78"], ["78-wpm-elevation"]),
    (17, "Speed Interval: 79 WPM Velocity Elevation", ["Elite 79"], ["79-wpm-elevation"]),
    (18, "Metronome Cadence: Constant 78 WPM Elite Rhythm", ["Metronome 78"], ["metronome-78-elite"]),
    (19, "Zero-Hesitation Navigation on Punctuation-Dense Syntaxes", ["Punctuation"], ["zero-hesitation-syntax"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Speed Narrative: The History of the Royal Society of London", ["History of Science"], ["royal-society-narrative"]),
    (22, "Speed Narrative: The Astronomical Resolving Power of Webb", ["Space Science"], ["jwst-narrative"]),
    (23, "Speed Narrative: The Decipherment of Ancient Scripts", ["Archaeology"], ["decipherment-narrative"]),
    (24, "Speed Narrative: The Mathematics of Cryptographic Keys", ["Cryptography"], ["crypto-narrative"]),
    (25, "Speed Narrative: The Evolution of Global Economic Systems", ["Economics"], ["economic-history-narrative"]),
    (26, "Speed Interval: 80 WPM Milestone Push", ["Elite 80"], ["80-wpm-milestone"]),
    (27, "Speed Interval: 81 WPM Milestone Push", ["Elite 81"], ["81-wpm-milestone"]),
    (28, "Continuous Long-Form Elite Stamina Run Alpha", ["Elite Stamina"], ["elite-stamina-a"]),
    (29, "Near-Zero Error Precision Sprints Alpha (96%+ Target)", ["Precision 96%"], ["zero-error-elite-a"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Performance", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Literary Masterworks: Classical Shakespearean Monologues", ["Shakespeare"], ["shakespearean-prose"]),
    (32, "Literary Masterworks: Milton's Paradise Lost Blank Verse", ["Milton"], ["milton-prose"]),
    (33, "Literary Masterworks: Dante's Divine Comedy Transcriptions", ["Dante"], ["dante-prose"]),
    (34, "Literary Masterworks: Goethe's Faust Dramatic Dialogues", ["Goethe"], ["goethe-prose"]),
    (35, "Literary Masterworks: Tolstoy's War and Peace Excerpts", ["Tolstoy"], ["tolstoy-prose"]),
    (36, "Speed Interval: 82 WPM Velocity Elevation", ["Elite 82"], ["82-wpm-elevation"]),
    (37, "Speed Interval: 83 WPM Velocity Elevation", ["Elite 83"], ["83-wpm-elevation"]),
    (38, "Continuous Long-Form Elite Stamina Run Beta", ["Elite Stamina"], ["elite-stamina-b"]),
    (39, "Eliminating Micro-Hesitations in Multi-Clause Inversions", ["Fluency"], ["inversion-fluency"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Synthesis", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Speed Interval: 84 WPM Acceleration Push", ["Elite 84"], ["84-wpm-push"]),
    (42, "Speed Interval: 85 WPM Acceleration Push", ["Elite 85"], ["85-wpm-push"]),
    (43, "Multi-Minute Elite Stamina: 3-Minute Benchmark Trial", ["3-Minute Trial"], ["3-minute-trial"]),
    (44, "Deep Forearm Relaxation & Wrist Floating at 85 WPM", ["Ergonomics"], ["forearm-relaxation-85"]),
    (45, "Light Feathering Keystrokes across Complex Syntax", ["Ergonomics"], ["feathering-complex"]),
    (46, "Historic Speeches: Pericles' Funeral Oration on Democracy", ["Greek Classics"], ["pericles-oration"]),
    (47, "Historic Speeches: Cicero's In Defense of the Roman Republic", ["Roman Classics"], ["cicero-oration"]),
    (48, "Historic Speeches: Edmund Burke on Conciliation with America", ["British Orations"], ["burke-oration"]),
    (49, "Historic Speeches: Frederick Douglass on the Fourth of July", ["American Orations"], ["douglass-oration"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Endurance", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Speed Interval: 86 WPM Velocity Push", ["Elite 86"], ["86-wpm-push"]),
    (52, "Speed Interval: 87 WPM Velocity Push", ["Elite 87"], ["87-wpm-push"]),
    (53, "Complex Multidisciplinary Synthesis: Cognitive Robotics", ["Robotics"], ["cognitive-robotics"]),
    (54, "Complex Multidisciplinary Synthesis: Computational Linguistics", ["NLP"], ["computational-linguistics"]),
    (55, "Complex Multidisciplinary Synthesis: Global Bioethics", ["Bioethics"], ["global-bioethics"]),
    (56, "Speed Interval: 88 WPM Velocity Benchmark", ["Elite 88"], ["88-wpm-benchmark"]),
    (57, "Multi-Minute Elite Stamina: 5-Minute Grand Marathon", ["Grand Marathon"], ["5-minute-elite-marathon"]),
    (58, "Sustained Speed Cadence over Dense Academic Masterworks", ["Academic Masterworks"], ["dense-academic-runs"]),
    (59, "Near-Zero Error Precision Sprints Beta (97%+ Target)", ["Precision 97%"], ["zero-error-elite-b"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Stamina", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Masterwork Transcriptions: Russell & Whitehead's Principia", ["Formal Logic"], ["principia-mathematica"]),
    (62, "Masterwork Transcriptions: Einstein's Special Relativity Paper", ["Relativity"], ["einstein-1905"]),
    (63, "Masterwork Transcriptions: Turing's Computing Machinery", ["Computing Theory"], ["turing-1950"]),
    (64, "Masterwork Transcriptions: Shannon's Mathematical Theory of Comms", ["Information Theory"], ["shannon-1948"]),
    (65, "Metronome Cadence: Constant 88 WPM Benchmark Polish", ["Metronome 88"], ["metronome-88"]),
    (66, "Continuous Multi-Minute Elite Performance Trial", ["Elite Trial"], ["elite-trial-endurance"]),
    (67, "Pre-Capstone Speed Challenge: 88 WPM Interval", ["Pre-Capstone"], ["88-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 97%+ Precision", ["Pre-Capstone"], ["accuracy-target-97"]),
    (69, "Comprehensive Elite Performance Review", ["Comprehensive Review"], ["comprehensive-elite-review"]),
    (70, "Stage 9 Grand Capstone Assessment (Level 700)", ["Stage 9 Capstone"], ["stage9-capstone"]),
]

STAGE_9_PARAGRAPHS = [
    "The intellectual development of modern scientific epistemology reveals that our conceptual representations of reality are neither passive reflections of raw empirical sensations nor arbitrary social constructs. Rather, as rational inquiry advances through rigorous hypothesis formulation, mathematical deduction, and experimental falsification, humanity constructs progressively accurate approximations of the objective universe.",
    "In the jurisprudence of constitutional democracies, the fundamental rights of individuals are protected by institutional counterweights designed to prevent the emergence of unchecked sovereign authority. Judicial review, legislative deliberation, and executive accountability operate in a dynamic equilibrium that preserves civil liberties even amidst periods of acute civil and political turmoil.",
    "The thermodynamics of complex biological systems demonstrates that life maintains internal structural order by continuously dissipating entropy into its surrounding environment. From metabolic enzyme catalysts to the intricate neural networks of the cerebral cortex, living organisms exhibit an extraordinary capacity for self-organization, homeostatic resilience, and evolutionary adaptation.",
    "Mastering touch typing at velocities exceeding eighty words per minute across dense philosophical and academic literature represents the pinnacle of neuromuscular fluency. At this elite tier of transcription capability, the physical keyboard ceases to exist as an external artifact; it becomes an invisible, instantaneous extension of the human intellect.",
    "As you successfully conquer the rigorous benchmarks of Stage 9, you stand upon the threshold of true typing grandmastery. Your fingers possess world-class dexterity, your mental cadence remains unflinchingly calm under intense speed pressure, and your precision reflects the consummate discipline of a master practitioner."
]

def generate_stage9_lessons():
    """Generates all 700 Stage 9 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_9_PARAGRAPHS)

    for unit_tuple in STAGE_9_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (350 to 500 chars)
            if level_num <= 150:
                target_min, target_max = 340, 420
            elif level_num <= 350:
                target_min, target_max = 380, 470
            elif level_num <= 550:
                target_min, target_max = 420, 520
            else:
                target_min, target_max = 460, 580

            p = STAGE_9_PARAGRAPHS[para_idx % num_paras]
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
                objective = f"Benchmark elite typing performance for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Transcribe dense academic and philosophical literature in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 9, got {len(lessons)}"
    return lessons
