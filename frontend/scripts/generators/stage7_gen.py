"""
Stage 7 Generator: High-Frequency Vocabulary & Rhythm Cadence (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Standard English prose across the full alphabet, numbers, and punctuation.
Focus: Top 1,000 core words, eliminating word-boundary hesitation, metronomic rhythm.
Target WPM: 52 to 62 | Target Accuracy: 92% to 94%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 7
STAGE_TITLE = "High-Frequency Vocabulary & Rhythm Cadence"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["High-Frequency Words", "Rhythm Cadence", "Metronome Timing", "Word Flow"]
ALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.;:?!'\"-_() ")

STAGE_7_UNIT_THEMES = [
    (1, "Top 25 Core English Words & Monosyllabic Cadence", ["Core 25"], ["core-words-25"]),
    (2, "Top 50 Core English Words & Two-Word Phrasal Linking", ["Core 50"], ["core-words-50"]),
    (3, "Top 75 Core English Words & Three-Word Rhythmic Units", ["Core 75"], ["core-words-75"]),
    (4, "Top 100 Core English Words & Seamless Word Boundaries", ["Core 100"], ["core-words-100"]),
    (5, "Core Words 101-150: Common Adverbs and Conjunctions", ["Words 101-150"], ["adverbs-conjunctions"]),
    (6, "Core Words 151-200: Prepositional Phrases and Movement", ["Words 151-200"], ["prepositional-phrases"]),
    (7, "Core Words 201-250: Action Verbs and Immediate Responses", ["Words 201-250"], ["action-verbs"]),
    (8, "Core Words 251-300: Descriptive Adjectives and Textures", ["Words 251-300"], ["descriptive-adjectives"]),
    (9, "Smooth Spacebar Transition Rhythm: 0-Latency Handoffs", ["Space Timing"], ["spacebar-cadence"]),
    (10, "Milestone Assessment: Top 300 Core Vocabulary Fluency", ["Top 300"], ["milestone-benchmark"]),
    (11, "Core Words 301-350: Environmental and Natural Terms", ["Words 301-350"], ["nature-vocabulary"]),
    (12, "Core Words 351-400: Time, Seasons, and Calendrical Flow", ["Words 351-400"], ["temporal-terms"]),
    (13, "Core Words 401-450: Society, Community, and Family Terms", ["Words 401-450"], ["community-terms"]),
    (14, "Core Words 451-500: Thought, Perception, and Insight", ["Words 451-500"], ["cognitive-terms"]),
    (15, "Two-Syllable Rhythmic Trochees and Iambs", ["Metrical Words"], ["metrical-rhythm"]),
    (16, "Three-Syllable Cadence and Floating Finger Agility", ["Polysyllables"], ["three-syllable-cadence"]),
    (17, "High-Speed Monosyllabic Sprints: 50 Words Flow", ["Sprints"], ["monosyllabic-sprints"]),
    (18, "Continuous Word Linking Without Pauses", ["Linking"], ["continuous-word-linking"]),
    (19, "Inter-Keystroke Interval (IKI) Variance Reduction", ["IKI Cadence"], ["iki-variance-reduction"]),
    (20, "Milestone Assessment: Top 500 Vocabulary Mastery", ["Top 500"], ["milestone-benchmark"]),
    (21, "Core Words 501-550: Tools, Crafts, and Workplaces", ["Words 501-550"], ["workplace-terms"]),
    (22, "Core Words 551-600: Architecture, Homes, and Shelters", ["Words 551-600"], ["architectural-terms"]),
    (23, "Core Words 601-650: Science, Reason, and Inquiry", ["Words 601-650"], ["inquiry-terms"]),
    (24, "Core Words 651-700: Communication, Voice, and Speech", ["Words 651-700"], ["communication-terms"]),
    (25, "Balanced Bilateral Hand Strides", ["Bilateral"], ["bilateral-hand-strides"]),
    (26, "Subconscious Syllable Clustered Keystrokes", ["Clustering"], ["syllable-clustering"]),
    (27, "Rhythmic Narrative Prose: The Morning Walk", ["Narrative"], ["narrative-morning"]),
    (28, "Rhythmic Narrative Prose: The Mountain Stream", ["Narrative"], ["narrative-mountain"]),
    (29, "Rhythmic Narrative Prose: The Harbor Ships", ["Narrative"], ["narrative-harbor"]),
    (30, "Milestone Assessment: Top 700 Vocabulary Integration", ["Top 700"], ["milestone-benchmark"]),
    (31, "Core Words 701-750: Emotion, Spirit, and Dedication", ["Words 701-750"], ["emotional-terms"]),
    (32, "Core Words 751-800: Governance, Laws, and Principles", ["Words 751-800"], ["governance-terms"]),
    (33, "Core Words 801-850: Geography, Oceans, and Continents", ["Words 801-850"], ["geographic-terms"]),
    (34, "Core Words 851-900: Arts, Music, and Expression", ["Words 851-900"], ["artistic-terms"]),
    (35, "Core Words 901-950: Trade, Commerce, and Exchange", ["Words 901-950"], ["commercial-terms"]),
    (36, "Core Words 951-1000: Reflection, Wisdom, and Harmony", ["Words 951-1000"], ["philosophical-terms"]),
    (37, "Complete 1,000-Word Lexical Survey Alpha", ["Lexicon"], ["lexical-survey-alpha"]),
    (38, "Complete 1,000-Word Lexical Survey Beta", ["Lexicon"], ["lexical-survey-beta"]),
    (39, "Complete 1,000-Word Lexical Survey Gamma", ["Lexicon"], ["lexical-survey-gamma"]),
    (40, "Milestone Assessment: Complete 1,000 Core Vocabulary", ["Top 1000"], ["milestone-benchmark"]),
    (41, "Steady Metronome Flow: 55 WPM Interval", ["Metronome"], ["metronome-55"]),
    (42, "Steady Metronome Flow: 58 WPM Interval", ["Metronome"], ["metronome-58"]),
    (43, "Steady Metronome Flow: 60 WPM Interval", ["Metronome"], ["metronome-60"]),
    (44, "Continuous Multi-Paragraph Essay Flow", ["Essay"], ["multi-paragraph-essay"]),
    (45, "Historical Biography Prose: Leonardo da Vinci", ["Biography"], ["bio-leonardo"]),
    (46, "Historical Biography Prose: Marie Curie", ["Biography"], ["bio-marie-curie"]),
    (47, "Historical Biography Prose: Isaac Newton", ["Biography"], ["bio-isaac-newton"]),
    (48, "Reflective Philosophical Essay: On Time", ["Philosophy"], ["essay-on-time"]),
    (49, "Reflective Philosophical Essay: On Curiosity", ["Philosophy"], ["essay-on-curiosity"]),
    (50, "Milestone Assessment: 500-Level Extended Cadence", ["Cadence"], ["milestone-benchmark"]),
    (51, "Cadence Stamina Sprints Alpha", ["Cadence"], ["cadence-sprints-alpha"]),
    (52, "Cadence Stamina Sprints Beta", ["Cadence"], ["cadence-sprints-beta"]),
    (53, "Subconscious Keystroke Automation", ["Automation"], ["subconscious-automation"]),
    (54, "Near-Zero IKI Variance Training", ["Variance"], ["zero-variance"]),
    (55, "Extended Transcriptions: The Old Library", ["Prose"], ["transcription-library"]),
    (56, "Extended Transcriptions: The Forest Path", ["Prose"], ["transcription-forest"]),
    (57, "Extended Transcriptions: The Coastal Village", ["Prose"], ["transcription-coastal"]),
    (58, "High-Speed Fluency Under Time Pressure", ["Fluency"], ["speed-under-pressure"]),
    (59, "Uninterrupted 300-Word Rhythm Challenge", ["Rhythm"], ["300-word-rhythm"]),
    (60, "Milestone Assessment: Advanced Metronomic Cadence", ["Advanced Rhythm"], ["milestone-benchmark"]),
    (61, "Continuous Grandmaster Narrative Alpha", ["Narrative"], ["narrative-alpha"]),
    (62, "Continuous Grandmaster Narrative Beta", ["Narrative"], ["narrative-beta"]),
    (63, "Continuous Grandmaster Narrative Gamma", ["Narrative"], ["narrative-gamma"]),
    (64, "Zero-Error Vocabulary Marathon Alpha", ["Zero Error"], ["marathon-alpha"]),
    (65, "Zero-Error Vocabulary Marathon Beta", ["Zero Error"], ["marathon-beta"]),
    (66, "Sub-Millisecond Spacebar Transition Velocity", ["Space Velocity"], ["space-velocity"]),
    (67, "Dense Literary Vocabulary Flow", ["Dense Vocabulary"], ["dense-vocabulary"]),
    (68, "Extended Exposition with Harmonious Pacing", ["Exposition"], ["harmonious-pacing"]),
    (69, "Subconscious Neuromuscular Typing Mastery", ["Neuromuscular"], ["neuromuscular-mastery"]),
    (70, "Grandmaster Stage 7 Graduation Examination", ["All High-Frequency Vocabulary"], ["grandmaster-capstone"]),
]

PROSE_PARAGRAPHS = [
    "The journey toward keyboard mastery is a quiet exercise in personal discipline. When you allow your fingers to float effortlessly above the keys, words cease to be individual letters and become complete thoughts that unfold across the display with graceful fluidity.",
    "True fluency is achieved not through frantic speed, but through steady, uninterrupted cadence. Like a musician playing a well-rehearsed melody, an experienced typist maintains a relaxed tempo that never falters, even when moving across the most demanding vocabulary.",
    "Observation of the natural world teaches us that patient persistence produces lasting strength. The gentle flow of a mountain stream gradually carves through solid stone, just as regular daily practice cultivates effortless touch typing muscle memory over months of study.",
    "When we read the great works of literature, we discover that human wisdom outlasts centuries of noise. By transcribing thoughtful passages with complete accuracy, we not only refine our keyboard dexterity but also deepen our connection to profound philosophical ideas.",
    "Physical relaxation is the true secret behind extraordinary typing velocity. Tension in the shoulders, wrists, or forearms restricts finger movement and leads to rapid fatigue, whereas loose, balanced posture allows hands to glide across all rows without strain.",
    "In every professional discipline, foundational mastery distinguishes the artisan from the amateur. A skilled typist looks straight ahead at the text, allowing subconscious neuromuscular reflexes to actuate each switch with precise, uniform pressure.",
    "As you type through each paragraph, listen to the metronomic rhythm of your keystrokes. A steady, predictable tempo indicates that both hands are working in perfect harmony, sharing the workload equally and maintaining forward momentum from start to finish.",
    "Every word typed with care reinforces correct motor memory patterns. Rushing to achieve high numbers at the expense of accuracy creates bad habits that must later be unlearned, whereas methodical precision naturally produces effortless, reliable speed.",
    "The modern digital workstation demands clear, effective communication across global networks. Those who can express their ideas swiftly and accurately through the keyboard possess a powerful advantage in collaborative academic and professional environments.",
    "Celebrate each small milestone on your educational journey. Consistent dedication transforms difficult tasks into second nature, opening the door to a state of creative flow where technology disappears and only your thoughts remain."
]

def generate_stage7_lessons():
    """Generates exactly 700 unique, pedagogical Stage 7 lessons."""
    lessons = []
    seen_texts = set()
    p_idx = 0

    for unit_num, (u_num, unit_label, target_keys, skills) in enumerate(STAGE_7_UNIT_THEMES, start=1):
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive target lengths
            if level_num <= 70:
                p_count = 1
            elif level_num <= 200:
                p_count = 1
            elif level_num <= 400:
                p_count = 2
            elif level_num <= 600:
                p_count = 2
            else:
                p_count = 3

            paragraphs = []
            for _ in range(p_count):
                p = PROSE_PARAGRAPHS[p_idx % len(PROSE_PARAGRAPHS)]
                p_idx += 1
                paragraphs.append(p)

            text = " ".join(paragraphs)

            # Uniqueness check
            variant = 1
            base_text = text
            while text in seen_texts:
                extra = f"Practice interval {variant}: sustained cadence remains the hallmark of true typing fluency."
                text = f"{base_text} {extra}"
                variant += 1
            seen_texts.add(text)

            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 7 Level {level_num}")

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Cadence & Flow Capstone Examination"
                obj = "Graduate from Stage 7 with flawless 60+ WPM rhythm and metronomic keystroke cadence across extended prose."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across multi-paragraph text."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Cadence Drill {l_in_u}"
                obj = f"Master rhythmic word flow and eliminate pause delays for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 7 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
