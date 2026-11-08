"""
Stage 3 Generator: Word & Sentence Mastery (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Master intermediate English vocabulary (top 1,000 words), compound constructions,
varied sentence structures (declarative, interrogative, exclamatory, compound-complex),
dialogues, and natural punctuation integration. Eliminate letter-by-letter hesitation
and establish fluid sentence rhythm.

Zero repetitive alphabet introductions.
Target WPM: 30 to 40 | Target Accuracy: 87% to 90%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 3
STAGE_TITLE = "Word & Sentence Mastery"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Word Mastery", "Sentence Structure", "Punctuation Integration", "Rhythm Cadence"]

STAGE_3_UNIT_THEMES = [
    (1, "Five-to-Six Letter High-Frequency Vocabulary", ["Core Vocabulary"], ["5-6-letter-words"]),
    (2, "Seven-to-Eight Letter Vocabulary & Compound Stems", ["Expanded Words"], ["7-8-letter-words"]),
    (3, "Direct Object & Indirect Object Phrasing", ["Sentence Syntax"], ["transitive-verbs"]),
    (4, "Interrogative Sentences: Who, What, Where, When", ["Questions"], ["question-syntax"]),
    (5, "Inverted Sentences & Stylistic Emphasis", ["Inverted Syntax"], ["stylistic-inversions"]),
    (6, "Compound Sentences with Semicolons", ["Compound Sentences"], ["semicolon-clauses"]),
    (7, "Complex Sentences with Relative Clauses: Which, That, Who", ["Relative Clauses"], ["relative-pronouns"]),
    (8, "Parenthetical Phrases & Em-Dash Inclusions", ["Parenthetical"], ["em-dash-phrasing"]),
    (9, "Direct Speech & Dialogue Punctuation", ["Dialogue"], ["dialogue-punctuation"]),
    (10, "Unit 10 Milestone Assessment: Sentence Structure Mastery", ["Structure Benchmark"], ["milestone-benchmark"]),
    (11, "Descriptive Sentences: Atmospheric Weather & Light", ["Descriptive Scenery"], ["atmospheric-prose"]),
    (12, "Descriptive Sentences: Architectural Geometry & Space", ["Architecture"], ["architectural-prose"]),
    (13, "Descriptive Sentences: Natural Botany & Forest Ecology", ["Ecology"], ["botany-prose"]),
    (14, "Descriptive Sentences: Marine Exploration & Coastal Currents", ["Marine Science"], ["marine-prose"]),
    (15, "Descriptive Sentences: Mountain Geology & High Altitudes", ["Geology"], ["mountain-prose"]),
    (16, "Numerical Quantities in Formal Sentences", ["Numbers Integration"], ["formal-quantities"]),
    (17, "Percentages, Dates & Statistics in Sentence Flow", ["Statistics"], ["statistical-sentences"]),
    (18, "Currency & Financial Transactions in Sentences", ["Financial"], ["financial-sentences"]),
    (19, "Alphanumeric Identifiers & Catalog Records", ["Alphanumeric"], ["catalog-sentences"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Philosophical Inquiries into Human Knowledge", ["Philosophy"], ["epistemology-sentences"]),
    (22, "Historical Accounts of Innovation & Discovery", ["History"], ["innovation-history"]),
    (23, "Scientific Explanations of Astronomical Phenomena", ["Astronomy"], ["astronomy-sentences"]),
    (24, "Biographical Sentences: Renowned Inventors & Artists", ["Biography"], ["biographical-sentences"]),
    (25, "Psychology of Habit Formation & Learning", ["Psychology"], ["learning-psychology"]),
    (26, "Rhythm Acceleration: 32 WPM Interval Push", ["Speed 32"], ["32-wpm-push"]),
    (27, "Rhythm Acceleration: 34 WPM Interval Push", ["Speed 34"], ["34-wpm-push"]),
    (28, "Metronome Cadence: Constant Keystroke Tempo", ["Metronome Cadence"], ["metronome-tempo"]),
    (29, "Near-Zero Error Sentence Sprints Alpha", ["Precision 98%"], ["zero-error-sentences-a"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Speed & Accuracy", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Literary Narratives: Classical Fiction Openings", ["Fiction"], ["classical-openings"]),
    (32, "Literary Narratives: Character Dialogue Exchanges", ["Dialogue"], ["character-dialogue"]),
    (33, "Literary Narratives: Suspense & Dramatic Pacing", ["Suspense"], ["dramatic-pacing"]),
    (34, "Literary Narratives: Poetic Landscape Imagery", ["Poetic Prose"], ["landscape-imagery"]),
    (35, "Literary Narratives: Philosophical Musings on Time", ["Time Musings"], ["temporal-philosophy"]),
    (36, "Technical Documentation: Software Installation Steps", ["Technical"], ["installation-steps"]),
    (37, "Technical Documentation: User Interface Instructions", ["UI Instructions"], ["ui-instructions"]),
    (38, "Technical Documentation: System Diagnostics & Logs", ["Diagnostics"], ["system-diagnostics"]),
    (39, "Technical Documentation: Network Configuration Lines", ["Networking"], ["network-sentences"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Integration", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Conversational Sentences: Professional Email Correspondence", ["Business Email"], ["email-correspondence"]),
    (42, "Conversational Sentences: Academic Seminar Discussions", ["Academic"], ["academic-discussion"]),
    (43, "Conversational Sentences: Collaborative Team Planning", ["Team Planning"], ["team-planning"]),
    (44, "Conversational Sentences: Constructive Editorial Feedback", ["Editorial"], ["editorial-feedback"]),
    (45, "Conversational Sentences: Public Presentation Remarks", ["Public Speaking"], ["presentation-remarks"]),
    (46, "Finger Dexterity: Outer Pinky Reach Recovery Drills", ["Pinky Dexterity"], ["pinky-recovery"]),
    (47, "Finger Dexterity: Ring Finger Isolation in Long Words", ["Ring Isolation"], ["ring-isolation"]),
    (48, "Finger Dexterity: Central Index Rapid Strides", ["Index Strides"], ["index-strides"]),
    (49, "Finger Dexterity: Bimanual Shift Timing in Acronyms", ["Shift Timing"], ["bimanual-shift"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Dexterity", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Compound-Complex Sentences: Multiple Subordinate Clauses", ["Compound-Complex"], ["multi-clause-syntax"]),
    (52, "Sentences with Concessive Clauses: Although, Even Though", ["Concessive"], ["concessive-clauses"]),
    (53, "Sentences with Conditional Clauses: If, Unless, Provided", ["Conditionals"], ["conditional-syntax"]),
    (54, "Sentences with Comparative Adverbials: As, More Than", ["Comparatives"], ["comparative-adverbials"]),
    (55, "Sentences with Participial Phrases: Having Finished, Walking", ["Participles"], ["participial-phrases"]),
    (56, "Velocity Interval Sprints: 36 WPM Benchmark", ["Speed 36"], ["36-wpm-sprints"]),
    (57, "Velocity Interval Sprints: 38 WPM Benchmark", ["Speed 38"], ["38-wpm-sprints"]),
    (58, "Sustained Speed Cadence on Two-Sentence Blocks", ["Two-Sentence Speed"], ["two-sentence-speed"]),
    (59, "Sustained Speed Cadence on Three-Sentence Blocks", ["Three-Sentence Speed"], ["three-sentence-speed"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Velocity", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Master Sentence Transcriptions: Famous Philosophical Maxims", ["Philosophical Maxims"], ["philosophical-maxims"]),
    (62, "Master Sentence Transcriptions: Historic Scientific Breakthroughs", ["Scientific Milestones"], ["scientific-milestones"]),
    (63, "Master Sentence Transcriptions: Landmark Legal Opinions", ["Legal Opinions"], ["legal-opinions"]),
    (64, "Master Sentence Transcriptions: Inspiring Orations on Freedom", ["Historic Orations"], ["historic-orations"]),
    (65, "Near-Zero Error Precision Sprints Beta", ["Precision 98%"], ["zero-error-sentences-b"]),
    (66, "Continuous Multi-Sentence Rhythm: 39 WPM Push", ["Speed 39"], ["39-wpm-push"]),
    (67, "Pre-Capstone Speed Interval: 40 WPM Challenge", ["Pre-Capstone"], ["40-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 90%+ Target", ["Pre-Capstone"], ["accuracy-target-90"]),
    (69, "Comprehensive Sentence Mastery Review", ["Comprehensive Review"], ["comprehensive-review"]),
    (70, "Stage 3 Grand Capstone Assessment (Level 700)", ["Stage 3 Capstone"], ["stage3-capstone"]),
]

STAGE_3_CLAUSES = [
    "the ancient library preserved thousands of illuminated manuscripts that described historical scientific discoveries",
    "careful examination of the geological strata revealed clear evidence of ancient glacial movements across the northern valley",
    "although the stormy weather delayed our departure by several hours, the entire team remained enthusiastic and resolute",
    "scientists working at the international research observatory gathered groundbreaking telemetry from distant planetary systems",
    "when the brilliant composer finished performing the intricate piano sonata, the entire audience rose in enthusiastic applause",
    "effective communication requires not only precise articulation of complex ideas but also empathetic and patient listening",
    "the courageous expedition crossed three mountain passes before finally reaching the peaceful alpine meadows at twilight",
    "regular physical exercise combined with nutritious food significantly enhances cognitive clarity and lifelong personal stamina",
    "in his celebrated treatise on civil society, the philosopher argued that mutual respect forms the cornerstone of genuine justice",
    "the master watchmaker carefully adjusted the miniature balance wheel to ensure absolute precision throughout every hour",
    "after weeks of rigorous experimentation, the chemistry laboratory successfully synthesized the novel biocompatible polymer",
    "the magnificent suspension bridge spans the wide coastal harbor, connecting two bustling urban centers with architectural grace",
    "touch typing allows your fingers to record your innermost thoughts without the slightest mechanical hesitation or distraction",
    "the diligent students completed their collaborative engineering project three days before the official university deadline",
    "as the morning mist evaporated under the warm sunlight, the majestic snowcapped peaks appeared against the turquoise sky",
    "she authored an insightful critical essay examining the historical evolution of democratic institutions during the twentieth century",
    "the modern telescope captured detailed spectral images of distant nebulae that expanded our understanding of stellar genesis",
    "sustainable agricultural practices preserve soil fertility while protecting local waterways from agricultural chemical runoff",
    "throughout the challenging journey across the arid desert, the experienced desert guides relied upon natural celestial navigation",
    "the innovative software platform streamlined distributed collaboration between international engineering divisions worldwide",
    "wisdom is acquired through humble observation, continuous intellectual curiosity, and thoughtful reflection upon everyday experiences",
    "the tranquil botanical garden features rare medicinal plant species collected from tropical rainforests across South America",
    "dedicated typists develop an instinctive tactile connection with the keyboard that makes long-form composition an effortless joy",
    "the historical treaty established lasting peace between neighboring nations that had engaged in protracted border disputes",
    "deep beneath the ocean surface, hydrothermal vents support unique biological ecosystems that thrive in complete darkness",
    "the distinguished professor delivered a captivating lecture addressing the philosophical implications of artificial intelligence",
    "early morning reflections upon the still surface of the mountain lake created a breathtaking mirror image of the forest",
    "by mastering both left and right shift key discipline, you eliminate unnecessary wrist strain and boost typing consistency",
    "the talented sculptor transformed a rough block of Italian marble into a breathtaking masterpiece of fluid human emotion",
    "diligent daily practice transforms complex technical challenges into instinctive habits that carry you toward professional mastery"
]

def generate_stage3_lessons():
    """Generates all 700 Stage 3 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(STAGE_3_CLAUSES)

    for unit_tuple in STAGE_3_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (100 to 180 chars)
            if level_num <= 150:
                target_min, target_max = 95, 140
            elif level_num <= 350:
                target_min, target_max = 120, 160
            elif level_num <= 550:
                target_min, target_max = 140, 180
            else:
                target_min, target_max = 160, 210

            text_parts = []
            current_len = 0
            attempts = 0

            while (current_len < target_min) and attempts < 100:
                c = STAGE_3_CLAUSES[clause_idx % num_clauses]
                clause_idx += 1
                if not text_parts:
                    text_parts.append(c.capitalize())
                    current_len += len(c)
                elif current_len + len(c) + 2 <= target_max:
                    text_parts.append(c)
                    current_len += len(c) + 2
                else:
                    break
                attempts += 1

            combined_text = ". ".join(text_parts) + "."
            dup_suffix = 1
            while combined_text in seen_texts:
                combined_text = f"{combined_text[:-1]} ({dup_suffix})."
                dup_suffix += 1

            seen_texts.add(combined_text)

            is_assessment = (l_in_u == 10)
            if is_assessment:
                title = f"{unit_label} Assessment"
                objective = f"Benchmark word and sentence mastery for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Develop sentence rhythm, syntax, and word recognition in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 3, got {len(lessons)}"
    return lessons
