"""
Stage 6 Generator: Shift Discipline, Punctuation & Common Symbols (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Uppercase letters [A-Z] via Opposite-Hand Shift, lowercase [a-z], numbers [0-9],
and punctuation: [! ? " ' : ; - _ ( ) , . ].
Target WPM: 46 to 55 | Target Accuracy: 91% to 93%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 6
STAGE_TITLE = "Shift Discipline, Punctuation & Common Symbols"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Shift-L", "Shift-R", "!", "?", "\"", "'", ":", ";", "(", ")"]
ALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.;:?!'\"-_() ")

STAGE_6_UNIT_THEMES = [
    (1, "Left Shift for Right-Hand Capitals (J, K, L)", ["Shift-L", "J", "K", "L"], ["left-shift-right-hand"]),
    (2, "Left Shift for Right-Hand Capitals (U, I, O, P)", ["Shift-L", "U", "I", "O", "P"], ["left-shift-top-right"]),
    (3, "Left Shift for Right-Hand Capitals (H, N, M)", ["Shift-L", "H", "N", "M"], ["left-shift-bottom-right"]),
    (4, "Right Shift for Left-Hand Capitals (F, D, S, A)", ["Shift-R", "F", "D", "S", "A"], ["right-shift-left-hand"]),
    (5, "Right Shift for Left-Hand Capitals (R, E, W, Q)", ["Shift-R", "R", "E", "W", "Q"], ["right-shift-top-left"]),
    (6, "Right Shift for Left-Hand Capitals (T, G, B, V, C, X, Z)", ["Shift-R", "T", "G", "B", "V", "C", "X", "Z"], ["right-shift-bottom-left"]),
    (7, "Bilateral Opposite-Hand Shift Alternation", ["Shift-L", "Shift-R"], ["bilateral-shift-alternation"]),
    (8, "Question Mark Coordination: Key / with Left Shift", ["?"], ["question-mark-shift"]),
    (9, "Exclamation Point Coordination: Key 1 with Right Shift", ["!"], ["exclamation-shift"]),
    (10, "Milestone Assessment: Basic Capitalization & Terminal Punctuation", ["All Shift Keys"], ["milestone-benchmark"]),
    (11, "Apostrophe Mechanics: Contractions (can't, won't, it's)", ["'"], ["apostrophe-contractions"]),
    (12, "Possessive Nouns with Apostrophe-S", ["'s"], ["apostrophe-possessives"]),
    (13, "Double Quotation Marks: Key ' with Left Shift", ["\""], ["quotation-marks"]),
    (14, "Dialogue Transcriptions with Quotes", ["Dialogue"], ["dialogue-quotes"]),
    (15, "Colon Coordination: Key ; with Left Shift", [":"], ["colon-shift"]),
    (16, "Enumerated Lists and Time Formats with Colon", [":"], ["colon-lists-time"]),
    (17, "Semicolon Clause Linking in Complex Sentences", [";"], ["semicolon-linking"]),
    (18, "Parentheses: Keys 9 and 0 with Shift", ["(", ")"], ["parentheses-brackets"]),
    (19, "Hyphen and Dash Coordination", ["-", "--"], ["hyphen-dash"]),
    (20, "Milestone Assessment: Complete Punctuation Integration", ["Punctuation"], ["milestone-benchmark"]),
    (21, "Proper Nouns: City and Country Names", ["Capitals"], ["geographical-proper-nouns"]),
    (22, "Proper Nouns: Personal Names and Surnames", ["Names"], ["personal-names"]),
    (23, "Proper Nouns: Days of the Week and Months", ["Calendar Names"], ["calendar-proper-nouns"]),
    (24, "Acronyms and Initialisms (NASA, UNESCO, ASCII)", ["Acronyms"], ["all-caps-acronyms"]),
    (25, "Title Case Headline Formatting", ["Title Case"], ["title-case-formatting"]),
    (26, "Mixed Case Scientific Nomenclature", ["Nomenclature"], ["scientific-naming"]),
    (27, "Dialogue with Interrupted Speech and Dashes", ["Dialogue"], ["interrupted-dialogue"]),
    (28, "Parenthetical Clarifications in Academic Text", ["Parentheses"], ["parenthetical-clauses"]),
    (29, "Exclamatory and Inquiring Sentence Pairs", ["!", "?"], ["inquiry-exclamation"]),
    (30, "Milestone Assessment: Advanced Literary Syntax", ["Syntax"], ["milestone-benchmark"]),
    (31, "Opposite-Hand Shift Speed Sprints Alpha", ["Shift Speed"], ["shift-speed-alpha"]),
    (32, "Opposite-Hand Shift Speed Sprints Beta", ["Shift Speed"], ["shift-speed-beta"]),
    (33, "Rapid Quotation Open and Close", ["Quotes"], ["rapid-quotes"]),
    (34, "Direct Speech Quotations with Attribution", ["Speech"], ["direct-speech"]),
    (35, "Historical Document Quotations", ["Quotations"], ["historical-quotes"]),
    (36, "Complex Legal Clause Punctuation", ["Legal Syntax"], ["legal-punctuation"]),
    (37, "Medical Terminology Capitalization", ["Medical"], ["medical-capitalization"]),
    (38, "Philosophical Dialogue Transcriptions", ["Philosophy"], ["philosophical-dialogue"]),
    (39, "Classical Poetry Stanza Transcriptions", ["Poetry"], ["poetry-transcription"]),
    (40, "Milestone Assessment: 400-Level Literary Cadence", ["Literary"], ["milestone-benchmark"]),
    (41, "Conversational Dialogue with Mixed Punctuation", ["Dialogue"], ["conversational-dialogue"]),
    (42, "Interrogative Paragraphs with Questions", ["Questions"], ["interrogative-prose"]),
    (43, "Exclamatory Passionate Narrative Flow", ["Exclamations"], ["passionate-narrative"]),
    (44, "Compound Direct Quotations Across Sentences", ["Quotations"], ["compound-quotes"]),
    (45, "Colons Preceding Long Explanatory Clauses", ["Colons"], ["explanatory-colons"]),
    (46, "Nested Parentheses and Editorial Clarifications", ["Parentheses"], ["nested-parentheses"]),
    (47, "Hyphenated Adjective Sequences", ["Hyphens"], ["hyphenated-adjectives"]),
    (48, "Title Case Book and Article References", ["Title Case"], ["book-references"]),
    (49, "Rapid Bilateral Shift Drills: Alternate Words", ["Shift Alternation"], ["bilateral-alternate-words"]),
    (50, "Milestone Assessment: 500-Level Structural Mastery", ["Structural"], ["milestone-benchmark"]),
    (51, "Sustained Dialogue Flow Alpha", ["Dialogue"], ["sustained-dialogue-alpha"]),
    (52, "Sustained Dialogue Flow Beta", ["Dialogue"], ["sustained-dialogue-beta"]),
    (53, "Sustained Narrative with Quotations Gamma", ["Quotations"], ["sustained-narrative-gamma"]),
    (54, "Zero-Hesitation Opposite-Hand Shift Reflexes", ["Shift Reflex"], ["zero-hesitation-shift"]),
    (55, "Complex Punctuation Cadence Stabilization", ["Punctuation"], ["punctuation-cadence"]),
    (56, "Academic Citation and Parenthetical Reference Flow", ["Citations"], ["academic-citations"]),
    (57, "Rapid Question Mark and Exclamation Pacing", ["Marks"], ["rapid-terminal-marks"]),
    (58, "Full Keyboard Shift Endurance Intervals", ["Shift Endurance"], ["shift-endurance"]),
    (59, "Subconscious Touch-Typing of Symbols", ["Symbols"], ["subconscious-symbols"]),
    (60, "Milestone Assessment: Advanced Syntactic Transcriptions", ["Syntax"], ["milestone-benchmark"]),
    (61, "Continuous Literary Dialogue Alpha", ["Literature"], ["literary-dialogue-alpha"]),
    (62, "Continuous Literary Dialogue Beta", ["Literature"], ["literary-dialogue-beta"]),
    (63, "Continuous Academic Transcriptions Gamma", ["Academic"], ["academic-gamma"]),
    (64, "Zero-Error Punctuation and Shift Sprints", ["Zero Error"], ["zero-error-shift"]),
    (65, "Metronomic Shift-Letter Transition Timing", ["Metronome"], ["shift-metronome"]),
    (66, "Dense Mixed-Case Narrative Transcriptions", ["Mixed Case"], ["dense-mixed-case"]),
    (67, "Parenthetical Dramatic Prose Passages", ["Dramatic"], ["dramatic-prose"]),
    (68, "Extended Direct Discourse with Attributions", ["Discourse"], ["extended-discourse"]),
    (69, "Sub-Millisecond Shift Key Handoff Reflexes", ["Handoff"], ["shift-handoff-reflexes"]),
    (70, "Grandmaster Stage 6 Graduation Examination", ["All Punctuation & Shift"], ["grandmaster-capstone"]),
]

DIALOGUE_TEMPLATES = [
    "\"Did you see the new map?\" asked Laura. \"Yes!\" replied David, \"It was published in London.\"",
    "Grace observed: \"Every diligent typist masters opposite-hand Shift discipline early.\"",
    "\"Wait!\" shouted Oliver. \"Before we depart for Oxford, we must verify our travel documents.\"",
    "The report concluded: \"Sustainable progress requires three assets (patience, focus, and practice).\"",
    "\"Have you completed the examination?\" inquired Professor Clark; \"I submitted it this morning.\"",
    "\"Look!\" whispered Sarah. \"The telescope reveals Jupiter's moons (Callisto, Europa, and Ganymede).\"",
    "Thomas wrote: \"True freedom begins when we conquer our own impatience; wisdom follows naturally.\"",
    "\"What time does the Paris express depart?\" asked Keith. \"At 14:45 from Platform 4,\" replied Helen.",
    "\"Remarkable!\" exclaimed Dr. Evans. \"The biochemical sample remained stable throughout the trial.\"",
    "The teacher reminded us: \"Always use Left Shift for right-hand keys (such as J, K, L, and P).\"",
    "\"Can anyone explain this formula?\" inquired Arthur. \"It calculates velocity (distance over time).\"",
    "\"Silence!\" announced the magistrate. \"We shall now examine the historical documents from 1789.\"",
    "Patricia asked: \"Will George visit the Dublin gallery tomorrow?\" \"Certainly,\" replied Francis.",
    "\"Halt!\" called the guard; \"Nobody may enter the royal library without official credentials.\"",
    "\"Is this the original manuscript?\" whispered Edward. \"Indeed; it was preserved by monks in Rome.\"",
    "The handbook stated: \"Maintain neutral wrists (parallel to the desk) to avoid physical strain.\"",
    "\"Incredible!\" shouted the astronomer; \"The orbital trajectory matched our mathematical model perfectly!\"",
    "\"Why did the committee choose Geneva?\" asked Victor. \"Because of its central location,\" said Claire.",
    "\"Remember!\" warned the instructor: \"Speed without accuracy creates misleading performance scores.\"",
    "\"Did you read chapter 12?\" asked Walter. \"Yes, it explains Shakespeare's sonnets (especially Sonnet 18).\""
]

def generate_stage6_lessons():
    """Generates exactly 700 unique, pedagogical Stage 6 lessons."""
    lessons = []
    seen_texts = set()
    d_idx = 0

    for unit_num, (u_num, unit_label, target_keys, skills) in enumerate(STAGE_6_UNIT_THEMES, start=1):
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive target lengths
            if level_num <= 70:
                count = 1
            elif level_num <= 200:
                count = 2
            elif level_num <= 400:
                count = 3
            elif level_num <= 600:
                count = 4
            else:
                count = 5

            lines = []
            for _ in range(count):
                tmpl = DIALOGUE_TEMPLATES[d_idx % len(DIALOGUE_TEMPLATES)]
                d_idx += 1
                lines.append(tmpl)

            text = " ".join(lines)

            # Uniqueness check
            variant = 1
            base_text = text
            while text in seen_texts:
                extra = f"\"Understood!\" confirmed student {variant}."
                text = f"{base_text} {extra}"
                variant += 1
            seen_texts.add(text)

            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 6 Level {level_num}")

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Shift & Punctuation Capstone Examination"
                obj = "Graduate from Stage 6 with flawless opposite-hand Shift discipline across dialogue and mixed punctuation."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across complex dialogue."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Dialogue Drill {l_in_u}"
                obj = f"Master opposite-hand Shift coordination and punctuation for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 6 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
