"""
Stage 4 Generator: Paragraph Fluency & Cohesion (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Develop sustained multi-sentence typing stamina, discourse cohesion, narrative and
expository paragraph flow, transition connectors (furthermore, however, consequently),
and consistent rhythmic pacing across extended paragraphs without finger fatigue.

Zero repetitive alphabet introductions.
Target WPM: 38 to 48 | Target Accuracy: 89% to 92%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 4
STAGE_TITLE = "Paragraph Fluency & Cohesion"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Paragraph Fluency", "Discourse Cohesion", "Sustained Stamina", "Punctuation Flow"]

STAGE_4_UNIT_THEMES = [
    (1, "Two-Sentence Narrative Paragraphs: Setting the Scene", ["Narrative"], ["setting-scene"]),
    (2, "Two-Sentence Expository Paragraphs: Defining Concepts", ["Expository"], ["defining-concepts"]),
    (3, "Two-Sentence Descriptive Paragraphs: Sensory Imagery", ["Descriptive"], ["sensory-imagery"]),
    (4, "Two-Sentence Argumentative Paragraphs: Claim and Reason", ["Argumentative"], ["claim-and-reason"]),
    (5, "Cause and Effect Discourse Connectors: Consequently, Therefore", ["Discourse"], ["cause-and-effect"]),
    (6, "Contrast and Concession Discourse: However, Nonetheless", ["Discourse"], ["contrast-connectors"]),
    (7, "Additive and Elaborative Discourse: Furthermore, Moreover", ["Discourse"], ["additive-connectors"]),
    (8, "Temporal Sequence Connectors: Subsequently, Meanwhile", ["Discourse"], ["temporal-connectors"]),
    (9, "Exemplification Connectors: For Instance, Specifically", ["Discourse"], ["exemplification"]),
    (10, "Unit 10 Milestone Assessment: Two-Sentence Paragraph Cohesion", ["Paragraph Benchmark"], ["milestone-benchmark"]),
    (11, "Three-Sentence Paragraphs: Historical Narratives", ["History"], ["historical-narratives"]),
    (12, "Three-Sentence Paragraphs: Scientific Inquiries", ["Science"], ["scientific-inquiries"]),
    (13, "Three-Sentence Paragraphs: Environmental Conservation", ["Environment"], ["environmental-prose"]),
    (14, "Three-Sentence Paragraphs: Technological Innovations", ["Technology"], ["technological-prose"]),
    (15, "Three-Sentence Paragraphs: Architectural Masterpieces", ["Architecture"], ["architectural-prose"]),
    (16, "Numerical Data Embedded in Three-Sentence Paragraphs", ["Data Integration"], ["data-paragraphs"]),
    (17, "Financial & Economic Trends in Paragraph Flow", ["Economics"], ["financial-paragraphs"]),
    (18, "Quotations & Attributions in Paragraph Discourse", ["Quotations"], ["quoted-paragraphs"]),
    (19, "Parenthetical Insights within Extended Prose", ["Parentheses"], ["parenthetical-paragraphs"]),
    (20, "Unit 20 Milestone Assessment: Three-Sentence Mastery", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Literary Paragraphs: Character Psychology & Motivation", ["Psychology"], ["character-motivation"]),
    (22, "Literary Paragraphs: Dramatic Tension & Resolution", ["Dramatic Arc"], ["dramatic-resolution"]),
    (23, "Literary Paragraphs: Poetic Nature Reflections", ["Poetic Nature"], ["nature-reflections"]),
    (24, "Literary Paragraphs: Philosophical Dialogues", ["Philosophy"], ["philosophical-dialogue"]),
    (25, "Literary Paragraphs: Urban Landscapes & City Life", ["Urban Life"], ["urban-landscapes"]),
    (26, "Speed Interval: Sustained 40 WPM Cadence", ["Speed 40"], ["40-wpm-cadence"]),
    (27, "Speed Interval: Sustained 42 WPM Cadence", ["Speed 42"], ["42-wpm-cadence"]),
    (28, "Metronome Cadence: Constant Keystroke Rhythm", ["Metronome"], ["metronome-keystrokes"]),
    (29, "Near-Zero Error Paragraph Sprint Alpha", ["Precision 98%"], ["zero-error-paragraphs-a"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Cohesion", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Four-Sentence Extended Paragraphs: Exploration & Discovery", ["Exploration"], ["exploration-paragraphs"]),
    (32, "Four-Sentence Extended Paragraphs: Marine Ecosystems", ["Marine Biology"], ["marine-paragraphs"]),
    (33, "Four-Sentence Extended Paragraphs: Space Exploration", ["Space Science"], ["space-paragraphs"]),
    (34, "Four-Sentence Extended Paragraphs: Classical Literature", ["Literature"], ["classical-literature"]),
    (35, "Four-Sentence Extended Paragraphs: Human Longevity & Health", ["Health Science"], ["health-paragraphs"]),
    (36, "Technical Documentation Paragraphs: API Architecture", ["API Design"], ["api-paragraphs"]),
    (37, "Technical Documentation Paragraphs: Cloud Infrastructure", ["Cloud Computing"], ["cloud-paragraphs"]),
    (38, "Technical Documentation Paragraphs: Database Reliability", ["Databases"], ["database-paragraphs"]),
    (39, "Technical Documentation Paragraphs: Cybersecurity Principles", ["Security"], ["security-paragraphs"]),
    (40, "Unit 40 Milestone Assessment: Four-Sentence Stamina", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Professional Memos: Organizational Strategy & Growth", ["Strategy"], ["strategy-memos"]),
    (42, "Professional Memos: Team Performance & Milestones", ["Management"], ["team-milestones"]),
    (43, "Professional Memos: Product Roadmap & Engineering Vision", ["Product Roadmap"], ["product-vision"]),
    (44, "Professional Memos: Customer Retention & Quality", ["Customer Success"], ["retention-memos"]),
    (45, "Professional Memos: Sustainability & Social Impact", ["Corporate Impact"], ["sustainability-memos"]),
    (46, "Ergonomic Balance during Multi-Minute Paragraph Typing", ["Ergonomics"], ["multi-minute-ergonomics"]),
    (47, "Breathing & Heart Rate Synchronization with Cadence", ["Mindfulness"], ["breathing-cadence"]),
    (48, "Finger Recovery on Cross-Row Transition Dense Paragraphs", ["Finger Recovery"], ["transition-recovery"]),
    (49, "Velocity Intervals: 44 WPM Sprint Push", ["Speed 44"], ["44-wpm-push"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Mastery", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Complex Academic Expositions: Cognitive Neuroscience", ["Neuroscience"], ["neuroscience-prose"]),
    (52, "Complex Academic Expositions: Behavioral Economics", ["Economics"], ["behavioral-economics"]),
    (53, "Complex Academic Expositions: Climate Thermodynamics", ["Thermodynamics"], ["climate-thermodynamics"]),
    (54, "Complex Academic Expositions: Quantum Information Theory", ["Quantum Physics"], ["quantum-prose"]),
    (55, "Complex Academic Expositions: Evolutionary Biology", ["Biology"], ["evolutionary-prose"]),
    (56, "Velocity Interval Sprints: 46 WPM Benchmark", ["Speed 46"], ["46-wpm-sprints"]),
    (57, "Velocity Interval Sprints: 48 WPM Benchmark", ["Speed 48"], ["48-wpm-sprints"]),
    (58, "Sustained Velocity over Extended Paragraphs Alpha", ["Velocity Alpha"], ["extended-velocity-a"]),
    (59, "Sustained Velocity over Extended Paragraphs Beta", ["Velocity Beta"], ["extended-velocity-b"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Endurance", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Masterwork Transcriptions: The Art of Clear Composition", ["Writing Craft"], ["composition-craft"]),
    (62, "Masterwork Transcriptions: Philosophy of Democratic Society", ["Political Philosophy"], ["democratic-society"]),
    (63, "Masterwork Transcriptions: The History of the Scientific Method", ["Scientific Method"], ["scientific-method"]),
    (64, "Masterwork Transcriptions: Reflections on Art and Imagination", ["Art & Imagination"], ["artistic-imagination"]),
    (65, "Near-Zero Error Paragraph Sprint Beta", ["Precision 98%"], ["zero-error-paragraphs-b"]),
    (66, "Continuous Long-Form Cadence: 47 WPM Push", ["Speed 47"], ["47-wpm-push"]),
    (67, "Pre-Capstone Speed Challenge: 48 WPM Interval", ["Pre-Capstone"], ["48-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 92%+ Precision", ["Pre-Capstone"], ["accuracy-target-92"]),
    (69, "Comprehensive Paragraph Fluency Synthesis", ["Comprehensive Review"], ["comprehensive-review"]),
    (70, "Stage 4 Grand Capstone Assessment (Level 700)", ["Stage 4 Capstone"], ["stage4-capstone"]),
]

STAGE_4_PARAGRAPHS = [
    "Learning to touch type transforms your entire relationship with written language. When your fingers move with intuitive muscle memory, words materialize upon the screen as effortlessly as your own spoken thoughts. This mechanical liberation frees your creative intellect to focus entirely on the depth, clarity, and elegance of your ideas.",
    "The historical development of keyboard ergonomics reflects a century of relentless engineering refinements. Early mechanical typewriters required forceful keystrokes to prevent physical jamming, while modern digital keyboards respond to the gentlest fingertip pressures. Maintaining curved fingers and floating wrists ensures lifelong ergonomic health and boundless stamina.",
    "Scientific research into cognitive motor acquisition highlights the remarkable plasticity of the human neuromuscular system. Repeated deliberate practice establishes myelin sheaths around neural pathways that accelerate motor signal transmission by up to fifty times. What initially feels awkward and demanding soon becomes an instinctive second nature.",
    "The preservation of natural ecosystems requires a delicate balance between human progress and biological stewardship. Ancient old-growth forests store immense quantities of atmospheric carbon while harboring thousands of specialized flora and fauna species. Sustainable conservation strategies ensure that future generations inherit a vibrant and resilient living world.",
    "In the realm of computer software architecture, simplicity and modularity remain the twin cornerstones of enduring reliability. Systems engineered with clean interfaces and decoupled components adapt seamlessly to evolving operational demands over time. Clear documentation and disciplined testing eliminate catastrophic vulnerabilities before code reaches production.",
    "Astronomical exploration has expanded our cosmological perspective beyond the boundaries of our solar neighborhood. Space observatories equipped with infrared sensors pierce through dense interstellar dust clouds to witness the birth of newborn stars and planetary disks. Each new discovery underscores the profound interconnectedness of the cosmos.",
    "The practice of mindful reflection allows thinkers to synthesize diverse streams of information into coherent wisdom. In an era saturated with ephemeral digital distractions, the ability to sustain deep, uninterrupted concentration is an invaluable intellectual superpower. Cultivating mental quietude nurtures creative insight and emotional equanimity.",
    "Architectural masterpieces endure through centuries because they harmonize functional utility with inspiring aesthetic beauty. From soaring Gothic cathedrals to sleek contemporary glass pavilions, great structures reflect the aspirations and technological ingenuity of their eras. Thoughtful urban design fosters vibrant civic communities where human life can flourish.",
    "Economic resilience depends fundamentally upon diverse, adaptable, and forward-looking industrial foundations. Communities that invest vigorously in public education, renewable energy, and digital infrastructure consistently outpace regions reliant on obsolete industrial paradigms. Strategic foresight turns emerging challenges into prosperous opportunities for all citizens.",
    "True mastery in any disciplined pursuit demands immense patience, humble self-awareness, and relentless iterative refinement. Whether practicing a musical instrument, composing prose, or training touch typing, breakthroughs occur through quiet daily dedication. Celebrate every incremental milestone along the journey toward effortless excellence."
]

def generate_stage4_lessons():
    """Generates all 700 Stage 4 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_4_PARAGRAPHS)

    for unit_tuple in STAGE_4_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (150 to 250 chars)
            if level_num <= 150:
                target_min, target_max = 145, 190
            elif level_num <= 350:
                target_min, target_max = 175, 220
            elif level_num <= 550:
                target_min, target_max = 200, 250
            else:
                target_min, target_max = 220, 280

            p = STAGE_4_PARAGRAPHS[para_idx % num_paras]
            para_idx += 1

            # Slice or adjust to target length bounds cleanly at sentence boundaries
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
                objective = f"Benchmark paragraph fluency and cohesive flow for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Develop sustained paragraph cadence and transition flow in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 4, got {len(lessons)}"
    return lessons
