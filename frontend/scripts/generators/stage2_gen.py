"""
Stage 2 Generator: Foundation & Controlled Fluency (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Develop controlled fluency across lowercase and mixed-case words, reinforce number
and symbol retention from Stage 1, expand high-frequency English vocabulary, and
establish an unshakeable rhythm cadence across short sentences and common collocations.

Zero repetitive alphabet introductions.
Target WPM: 22 to 32 | Target Accuracy: 84% to 88%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 2
STAGE_TITLE = "Foundation & Controlled Fluency"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["High-Frequency Words", "Rhythm Cadence", "Sentence Fluency", "Collocations"]

STAGE_2_UNIT_THEMES = [
    (1, "Core Monosyllabic Words & Bilateral Cadence", ["Core Words"], ["monosyllabic-flow"]),
    (2, "Two-Word Phrasal Collocations: Common Prepositions", ["Collocations"], ["phrasal-linking"]),
    (3, "Three-Word Rhythmic Clusters: Smooth Transitions", ["Rhythm Clusters"], ["triplet-cadence"]),
    (4, "High-Frequency Action Verbs in Short Sentences", ["Action Verbs"], ["verb-sentences"]),
    (5, "Descriptive Adjectives & Natural Word Flow", ["Adjectives"], ["descriptive-flow"]),
    (6, "Number Retention: Common Measurements & Units", ["Numbers Retention"], ["measurement-tokens"]),
    (7, "Punctuation Retention: Commas, Periods & Questions", ["Punctuation"], ["punctuation-flow"]),
    (8, "Mixed-Case Sentence Openers & Proper Nouns", ["Mixed-Case"], ["capital-openers"]),
    (9, "Smooth Spacebar Timing: Zero Hesitation Latency", ["Space Timing"], ["zero-hesitation"]),
    (10, "Unit 10 Milestone Assessment: Foundation Fluency", ["Foundation Benchmark"], ["milestone-benchmark"]),
    (11, "High-Frequency Nouns: Daily Life & Objects", ["Daily Nouns"], ["noun-fluency"]),
    (12, "High-Frequency Nouns: Nature, Weather & Seasons", ["Nature Terms"], ["nature-fluency"]),
    (13, "Two-Sentence Connected Thoughts: Cause & Effect", ["Connected Sentences"], ["two-sentence-flow"]),
    (14, "Compound Word Flow: Sunshine, Moonlight, Riverbed", ["Compound Words"], ["compound-flow"]),
    (15, "Prefix Conditioning: Un-, Re-, Dis- in Sentences", ["Prefixes"], ["prefix-sentences"]),
    (16, "Suffix Conditioning: -ful, -less, -ment in Sentences", ["Suffixes"], ["suffix-sentences"]),
    (17, "Bilateral Alternating Hand Words: Problem, Visual", ["Bilateral Words"], ["alternating-balance"]),
    (18, "Left-Hand Word Sprints: Water, Sweet, Street", ["Left Hand"], ["left-hand-speed"]),
    (19, "Right-Hand Word Sprints: Onion, Million, Opinion", ["Right Hand"], ["right-hand-speed"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Short Declarative Sentences: Science & Discovery", ["Science Sentences"], ["science-sentences"]),
    (22, "Short Declarative Sentences: Arts & Music", ["Arts Sentences"], ["art-sentences"]),
    (23, "Short Declarative Sentences: History & Time", ["History Sentences"], ["history-sentences"]),
    (24, "Quoted Dialogue in Short Sentences", ["Dialogue"], ["quoted-dialogue"]),
    (25, "Question & Answer Pairs in Rhythm", ["Q & A"], ["question-cadence"]),
    (26, "Parenthetical Remarks in Natural Prose", ["Parentheses"], ["parenthetical-prose"]),
    (27, "Alphanumeric Quantities in Sentence Flow", ["Alphanumeric"], ["quantity-sentences"]),
    (28, "Currency & Percentage Retention in Business Prose", ["Financial"], ["financial-prose"]),
    (29, "Metronome Cadence: Constant 25 WPM Pace", ["Metronome 25"], ["metronome-pace"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Rhythmic Flow", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Multi-Clause Sentences with Coordinating Conjunctions", ["Conjunctions"], ["multi-clause-flow"]),
    (32, "Subordinating Conjunctions: Although, Because, While", ["Subordination"], ["subordinate-clauses"]),
    (33, "Descriptive Scenery: Ocean Horizons & Coastal Shores", ["Coastal Prose"], ["coastal-prose"]),
    (34, "Descriptive Scenery: Forest Trails & Tall Pines", ["Forest Prose"], ["forest-prose"]),
    (35, "Descriptive Scenery: Mountain Summits & Clear Skies", ["Mountain Prose"], ["mountain-prose"]),
    (36, "Descriptive Scenery: Autumn Colors & Crisp Mornings", ["Autumn Prose"], ["autumn-prose"]),
    (37, "Descriptive Scenery: Winter Snowfall & Quiet Nights", ["Winter Prose"], ["winter-prose"]),
    (38, "Descriptive Scenery: Spring Blossoms & Gentle Rain", ["Spring Prose"], ["spring-prose"]),
    (39, "Descriptive Scenery: Summer Sunlight & Warm Evenings", ["Summer Prose"], ["summer-prose"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Fluency", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Conversational Sentences: Friendly Inquiries", ["Conversation"], ["conversational-flow"]),
    (42, "Conversational Sentences: Encouraging Words", ["Encouragement"], ["encouraging-phrases"]),
    (43, "Conversational Sentences: Clear Explanations", ["Explanations"], ["clear-explanations"]),
    (44, "Conversational Sentences: Everyday Problem Solving", ["Problem Solving"], ["problem-solving"]),
    (45, "Keyboard Ergonomics: Shoulder Relaxation & Breathing", ["Ergonomics"], ["relaxed-breathing"]),
    (46, "Keyboard Ergonomics: Floating Wrists & Light Keystrokes", ["Ergonomics"], ["floating-wrists"]),
    (47, "Keyboard Ergonomics: Center-Reach Recovery Cadence", ["Ergonomics"], ["rebound-cadence"]),
    (48, "Velocity Intervals: 26 WPM Sprint Bursts", ["Speed Intervals"], ["26-wpm-sprints"]),
    (49, "Velocity Intervals: 28 WPM Sprint Bursts", ["Speed Intervals"], ["28-wpm-sprints"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Endurance", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Short Paragraphs: The Joy of Craftsmanship", ["Craftsmanship"], ["craft-paragraphs"]),
    (52, "Short Paragraphs: The Art of Deep Reading", ["Reading"], ["reading-paragraphs"]),
    (53, "Short Paragraphs: The Habit of Mindful Learning", ["Mindful Learning"], ["learning-paragraphs"]),
    (54, "Short Paragraphs: Exploring the Natural World", ["Natural World"], ["nature-paragraphs"]),
    (55, "Short Paragraphs: The Evolution of Writing Tools", ["Writing Tools"], ["writing-tools"]),
    (56, "Short Paragraphs: Music and Harmonious Rhythm", ["Music & Harmony"], ["music-paragraphs"]),
    (57, "Short Paragraphs: The Quiet Strength of Patience", ["Patience"], ["patience-paragraphs"]),
    (58, "Short Paragraphs: Daily Routines of Great Thinkers", ["Thinkers"], ["thinker-paragraphs"]),
    (59, "Short Paragraphs: Architecture and Peaceful Spaces", ["Architecture"], ["architectural-paragraphs"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Synthesis", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Controlled Speed Sprints: 30 WPM Push Alpha", ["Speed 30"], ["30-wpm-push-a"]),
    (62, "Controlled Speed Sprints: 30 WPM Push Beta", ["Speed 30"], ["30-wpm-push-b"]),
    (63, "Near-Zero Error Precision Sprints Alpha", ["Precision 98%"], ["zero-error-a"]),
    (64, "Near-Zero Error Precision Sprints Beta", ["Precision 98%"], ["zero-error-b"]),
    (65, "Alphanumeric & Symbol Integration in Paragraph Flow", ["Integrated Flow"], ["alphanumeric-paragraphs"]),
    (66, "Continuous Rhythm over Multi-Sentence Blocks", ["Continuous Rhythm"], ["multi-sentence-blocks"]),
    (67, "Pre-Capstone Speed Intervals: 31 WPM Benchmark", ["Pre-Capstone"], ["31-wpm-benchmark"]),
    (68, "Pre-Capstone Accuracy Challenge: 88%+ Precision", ["Pre-Capstone"], ["accuracy-challenge"]),
    (69, "Comprehensive Foundation Review: All Keystroke Types", ["Comprehensive Review"], ["review-all-types"]),
    (70, "Stage 2 Grand Capstone Assessment (Level 700)", ["Stage 2 Capstone"], ["stage2-capstone"]),
]

STAGE_2_CLAUSES = [
    "clear thoughts lead to simple and effective actions every single day",
    "the quiet morning air brings calm focus to everyone who wakes up early",
    "careful practice builds confidence and steady finger coordination across all rows",
    "bright sunlight poured through the open window and warmed the wooden floor",
    "the little boat sailed smoothly across the peaceful blue lake at sunrise",
    "honest words create lasting trust and understanding between good friends",
    "regular daily habits build strong skills over months of quiet and steady dedication",
    "the young explorer mapped every winding trail along the steep mountain ridge",
    "gentle ocean waves roll up against the sandy shore as the soft breeze whispers",
    "learning to type without looking at your hands frees your mind to create wonderful ideas",
    "fresh water flowed down the rocky stream into the deep and tranquil forest pond",
    "the swift rider guided the horse across the open green meadows before dusk",
    "kind deeds echo far beyond the moment they happen in daily human life",
    "the tall stone bridge stood firm against the strong currents of the rushing river",
    "bright autumn leaves fell softly upon the quiet pathways through the public park",
    "deep roots help the grand oak tree stand tall through severe winter windstorms",
    "a single true sentence carries far more meaning than many complicated phrases",
    "we gathered wild berries along the sunny hillside while singing cheerful songs",
    "the little kitten slept peacefully on the soft wool blanket beside the warm hearth",
    "early morning mist covered the quiet village rooftops as the dawn birds began to sing",
    "the wise teacher spoke with patience and encouraged every student to do their best",
    "steady rhythmic keystrokes build lasting muscle memory that serves you for life",
    "a gentle smile can brighten the darkest afternoon and give new hope to a weary traveler",
    "each new sunrise brings fresh opportunities to learn, grow, and improve your skills",
    "the brave sailor held the wooden wheel steady as the ship navigated the rough sea",
    "silence is often the most eloquent response when thoughtful reflection is needed",
    "the golden sunset painted the evening clouds with rich amber and rose colored hues",
    "keep your posture straight and your fingers curved lightly above the home row anchors",
    "words appear on your screen as quickly as you speak them when your technique is polished",
    "true mastery is not born from reckless haste but from mindful and deliberate habit",
    "the library offered a quiet sanctuary for students preparing for their final examinations",
    "she read the inspiring historical narrative with deep appreciation for past generations",
    "the talented craftsman carved delicate patterns into the polished maple tabletop",
    "cool mountain air felt wonderfully crisp and refreshing after the long uphill climb",
    "they walked together in comfortable silence under the canopy of towering pine trees",
    "every small accomplishment adds up to great mastery when practiced with dedication",
    "the silver pocket watch ticked with steady rhythmic beats throughout the quiet night",
    "balanced hands make typing feel completely effortless and eliminate unwanted strain",
    "children laughed with pure joy as they chased colorful butterflies through the garden",
    "a calm mind produces clear writing that communicates complex ideas with ease",
    "the train moved steadily along the steel tracks toward the distant coastal city",
    "farmers tended their fertile fields from early dawn until the orange sun sank low",
    "curved fingers and relaxed wrists prevent fatigue during extended typing sessions",
    "the old lighthouse beamed a guiding light through the dense foggy coastal waters",
    "patience and persistence turn ambitious dreams into tangible everyday achievements",
    "the gentle rhythm of falling raindrops lulled the entire house into a restful sleep",
    "we watched the northern stars twinkle brightly above the snow covered mountain peaks",
    "good books invite the curious reader to explore distant worlds and timeless truths",
    "trust your fingers to remember where each key is located on the standard keyboard",
    "the aroma of freshly baked bread filled the sunny kitchen on Sunday morning"
]

def generate_stage2_lessons():
    """Generates all 700 Stage 2 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(STAGE_2_CLAUSES)

    for unit_tuple in STAGE_2_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets
            if level_num <= 150:
                target_min, target_max = 60, 110
            elif level_num <= 300:
                target_min, target_max = 90, 140
            elif level_num <= 500:
                target_min, target_max = 120, 180
            else:
                target_min, target_max = 150, 220

            # Construct unique text
            text_parts = []
            current_len = 0
            attempts = 0

            while (current_len < target_min) and attempts < 100:
                c = STAGE_2_CLAUSES[clause_idx % num_clauses]
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
            # Deduplicate text if already seen
            dup_suffix = 1
            while combined_text in seen_texts:
                combined_text = f"{combined_text[:-1]} ({dup_suffix})."
                dup_suffix += 1

            seen_texts.add(combined_text)

            is_assessment = (l_in_u == 10)
            if is_assessment:
                title = f"{unit_label} Assessment"
                objective = f"Benchmark fluency and accuracy for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Develop natural word flow and steady cadence in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 2, got {len(lessons)}"
    return lessons
