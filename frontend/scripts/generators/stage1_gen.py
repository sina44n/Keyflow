"""
Stage 1 Generator: Complete Essential Keyboard Education & Foundational Practice
Architecture: 70 Units x 10 Levels = Exactly 700 Levels (S01-L001 to S01-L700)

Exact Curriculum Sections (User Directive):
- Section A: Lowercase Introduction (60 levels, Units 1-6)
  - Levels 1-6 strictly: f, j, fj, d, k, fdjk
  - 13 two-key cycles (39 levels) + 21 row review levels
- Section B: Lowercase Reinforcement (70 levels, Units 7-13)
- Section C: Uppercase Introduction (60 levels, Units 14-19) - Always mixed with lowercase!
- Section D: Mixed-Case Reinforcement (60 levels, Units 20-25)
- Section E: Numbers Introduction 1-0 (45 levels, Units 26-30a)
- Section F: Numbers + Letters Practice (35 levels, Units 30b-33)
- Section G: Symbols Introduction (100 levels, Units 34-43) - All US QWERTY printable symbols
- Section H: Symbols with Real Text (70 levels, Units 44-50) - Emails, URLs, prices, dates, code
- Section I: Functional Keyboard Keys (45 levels, Units 51-55a) - Enter, Shift, Tab, Backspace, Caps, Space
- Section J: Complete Keyboard Integration (55 levels, Units 55b-60)
- Section K: Foundational Accuracy & Finger Mastery (50 levels, Units 61-65)
- Section L: Beginner Speed Foundation (50 levels, Units 66-70)
TOTAL = 700 Levels
"""

import sys
import os
from .curriculum_builder import build_lesson, FINGER_MAP

STAGE_ID = 1
STAGE_TITLE = "Complete Keyboard Education & Foundation"
HOME_KEYS = ["F", "J"]

def generate_stage1_lessons():
    lessons = []
    
    # -------------------------------------------------------------
    # SECTION A: LOWERCASE INTRODUCTION (Levels 1 to 60, Units 1 to 6)
    # -------------------------------------------------------------
    
    # Levels 1 to 30 from validated prototype
    from .stage1_prototype import STAGE_1_FIRST_30_SPEC
    for spec in STAGE_1_FIRST_30_SPEC:
        lvl = spec["level"]
        u_num = spec["unit"]
        u_labels = {
            1: "Tactile Anchors: Index & Middle Fingers",
            2: "Home Row Completion & Central Reaches",
            3: "Vowels & Upper Diagonal Reaches"
        }
        u_label = u_labels[u_num]
        l_in_u = ((lvl - 1) % 10) + 1
        lesson = build_lesson(
            stage_id=STAGE_ID,
            stage_title=STAGE_TITLE,
            level_num=lvl,
            unit_num=u_num,
            unit_label=u_label,
            lesson_in_unit=l_in_u,
            title=spec["title"],
            objective=spec["objective"],
            text=spec["text"],
            target_keys=spec["targetKeys"],
            home_keys=HOME_KEYS,
            skills=spec["skills"]
        )
        lessons.append(lesson)

    # Unit 4: P, V, M, C, X, N (Levels 31 to 40)
    unit4_specs = [
        # L31: P (Right pinky upward)
        (31, "Right Pinky Upward Reach: Key P", "Extend right pinky finger upward to key P and recover to home.",
         "p pp ppp p p pp lp pl pl lp lppl lp pl p p pp", ["P"], ["right-pinky-reach", "p-key", "l-recovery"]),
        # L32: V (Left index downward)
        (32, "Left Index Downward Reach: Key V", "Curl left index finger downward to key V and recover to F.",
         "v vv vvv v v vv fv vf vf fv fvvf fv vf v v vv", ["V"], ["left-index-reach", "v-key", "f-recovery"]),
        # L33: P + V cumulative
        (33, "Cumulative Pairing: Keys P + V", "Combine P and V into fluid words with unlocked keys.",
         "pv vp pave drop live pure keep park prove view pave help", ["P", "V"], ["p-v-words", "reach-recovery"]),
        # L34: M (Right index downward)
        (34, "Right Index Downward Reach: Key M", "Curl right index finger downward to key M and recover to J.",
         "m mm mmm m m mm jm mj mj jm jmmj jm mj m m mm", ["M"], ["right-index-reach", "m-key", "j-recovery"]),
        # L35: C (Left middle downward)
        (35, "Left Middle Downward Reach: Key C", "Curl left middle finger downward to key C and recover to D.",
         "c cc ccc c c cc dc cd cd dc dccd dc cd c c cc", ["C"], ["left-middle-reach", "c-key", "d-recovery"]),
        # L36: M + C cumulative
        (36, "Cumulative Pairing: Keys M + C", "Form core English vocabulary using M and C with unlocked keys.",
         "mc cm calm much come make camp mica came lock mark claim", ["M", "C"], ["m-c-words", "curl-mechanics"]),
        # L37: X (Left ring downward)
        (37, "Left Ring Downward Reach: Key X", "Curl left ring finger downward to key X and recover to S.",
         "x xx xxx x x xx sx xs xs sx sxxs sx xs x x xx", ["X"], ["left-ring-reach", "x-key", "s-recovery"]),
        # L38: N (Right index downward reach)
        (38, "Right Index Downward Reach: Key N", "Stretch right index finger downward-inward to key N and recover to J.",
         "n nn nnn n n nn jn nj nj jn jnnj jn nj n n nn", ["N"], ["right-index-reach", "n-key", "j-recovery"]),
        # L39: X + N cumulative
        (39, "Cumulative Pairing: Keys X + N", "Form words and phrases containing X and N with previously learned keys.",
         "xn nx next plan down hand turn next lawn open mean fix six", ["X", "N"], ["x-n-words", "reach-balance"]),
        # L40: Unit 4 Assessment
        (40, "Unit 4 Assessment: Bottom-Row Reach Fluency", "Benchmark fluid transitions across P, V, M, C, X, N.",
         "the open camp saw six quiet men walk down the river", ["P", "V", "M", "C", "X", "N"], ["unit-assessment", "bottom-row-flow"]),
    ]
    for lvl, title, obj, txt, tgts, sks in unit4_specs:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=4,
            unit_label="Bottom-Row Reaches & Lateral Extensions", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # Unit 5: B, Z & Full Alphabet Completion (Levels 41 to 50)
    unit5_specs = [
        # L41: B (Left index reach)
        (41, "Left Index Lateral Downward Reach: Key B", "Reach left index finger downward-inward to key B and recover to F.",
         "b bb bbb b b bb fb bf bf fb fbbf fb bf b b bb", ["B"], ["left-index-reach", "b-key", "f-recovery"]),
        # L42: Z (Left pinky downward)
        (42, "Left Pinky Downward Reach: Key Z", "Curl left pinky downward to key Z and recover to A.",
         "z zz zzz z z zz az za za az azza az za z z zz", ["Z"], ["left-pinky-reach", "z-key", "a-recovery"]),
        # L43: B + Z cumulative - All 26 letters unlocked!
        (43, "Cumulative Pairing: Keys B + Z (All 26 Letters Unlocked!)", "Celebrate unlocking all 26 lowercase alphabet keys.",
         "bz zb buzz zoom zero bird back blast blaze zone prize bulk", ["B", "Z"], ["b-z-words", "26-keys-unlocked"]),
        # L44: Home row consolidation
        (44, "Home Row Consolidation: Flow & Recovery", "Consolidate all ten home-row keys with light tactile relaxation.",
         "asdfg hjkl asdfg hjkl gfdsa lkjh all lads shall ask dad for a flag", ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["home-row-flow"]),
        # L45: Top row consolidation
        (45, "Top Row Consolidation: Upward Reaches", "Flow cleanly across top row reaches without looking down.",
         "qwerty uiop qwerty uiop your quick route were quite popular", ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["top-row-flow"]),
        # L46: Bottom row consolidation
        (46, "Bottom Row Consolidation: Downward Curls", "Master downward curls across all seven bottom-row letters.",
         "zxcvbnm zxcvbnm zinc cave menu back move next calm jump blaze", ["Z", "X", "C", "V", "B", "N", "M"], ["bottom-row-flow"]),
        # L47: Cross-row transitions
        (47, "Cross-Row Vertical Transitions", "Transition between top row, home row, and bottom row smoothly.",
         "jump over quick wave calm sky river flight brave gold stone", ["All Rows"], ["cross-row-transitions"]),
        # L48: Left hand coordination
        (48, "Left Hand Dexterity & Balance", "Exercise left-hand independence across pinky, ring, middle, and index.",
         "extra great craft sweet trade water treat brave after craft", ["Left Hand"], ["left-hand-balance"]),
        # L49: Right hand coordination
        (49, "Right Hand Dexterity & Balance", "Exercise right-hand independence across index, middle, ring, and pinky.",
         "jump look join million onion humor opinion pillow moon jump", ["Right Hand"], ["right-hand-balance"]),
        # L50: Unit 5 Milestone Assessment
        (50, "Unit 5 Milestone Assessment: Full Alphabet Integration", "Milestone benchmark testing all 26 lowercase letters across all three rows.",
         "the quick brown fox jumps over the lazy dog near a calm stream", ["All 26 Letters"], ["milestone-assessment", "pangram-benchmark"]),
    ]
    for lvl, title, obj, txt, tgts, sks in unit5_specs:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=5,
            unit_label="Alphabet Completion & Row Symmetry", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # Unit 6: Lowercase Mastery & Real Pangrams (Levels 51 to 60)
    unit6_specs = [
        (51, "High-Frequency Digrams: th, he, in, er", "Type common two-letter English patterns with automatic reflex.",
         "th he in er the then her here into ever weather father mother other", ["T", "H", "E", "I", "N", "R"], ["digrams-th-he"]),
        (52, "High-Frequency Digrams: an, on, re, at", "Flow across smooth vowel-consonant transitions.",
         "an on re at and stand only return water great planet plant plate", ["A", "N", "O", "R", "E", "T"], ["digrams-an-on"]),
        (53, "High-Frequency Trigrams: the, ing, and, ion", "Type fluent three-letter word components without pause.",
         "the ing and ion thing thinking standing action nation motion spring", ["T", "H", "E", "I", "N", "G", "A", "O"], ["trigrams-ing-ion"]),
        (54, "Common Prefixes: un, re, dis, pre", "Master rapid prefix keystrokes before word roots.",
         "un re dis pre undo return replay discover prepare preview rebuild", ["U", "N", "R", "E", "D", "I", "S", "P"], ["prefixes"]),
        (55, "Common Suffixes: ly, ed, ment, ful", "Attach grammatical endings with unbroken typing rhythm.",
         "ly ed ment ful fully walked movement hopeful quiet helpful slowly", ["L", "Y", "E", "D", "M", "N", "T", "F", "U"], ["suffixes"]),
        (56, "Pangram Rhythm: Pack My Box", "Type the classic short 26-letter pangram with steady cadence.",
         "pack my box with five dozen liquor jugs every single day", ["All 26 Letters"], ["pangram-rhythm"]),
        (57, "Pangram Velocity: Sphinx of Black Quartz", "Type this rich consonant pangram with clean finger independence.",
         "sphinx of black quartz judge my vow with honest pride", ["All 26 Letters"], ["pangram-velocity"]),
        (58, "Pangram Flow: How Razorback-Jumping Frogs", "Flow smoothly across cross-row jumps and varied syllables.",
         "how razorback jumping frogs can level six piqued gymnasts", ["All 26 Letters"], ["pangram-flow"]),
        (59, "Full Alphabet Speed Burst", "Sprint across diverse vocabulary exercising every single letter.",
         "bright clouds sail over the quiet green valleys while birds sing songs", ["All 26 Letters"], ["speed-burst"]),
        (60, "Unit 6 Assessment: Section A Lowercase Capstone", "Comprehensive graduation benchmark verifying mastery of all 26 lowercase letters.",
         "the quick brown fox jumps over the lazy dog and runs through five quiet groves", ["All 26 Letters"], ["unit-assessment", "section-capstone"]),
    ]
    for lvl, title, obj, txt, tgts, sks in unit6_specs:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=6,
            unit_label="Lowercase Pangrams & Structural Patterns", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION B: LOWERCASE REINFORCEMENT (Levels 61 to 130, Units 7 to 13)
    # -------------------------------------------------------------
    section_b_units = [
        (7, "Core High-Frequency 3-Letter Vocabulary", [
            ("The, And, For Core Trios", "the and for the and for the and for the and for"),
            ("You, Can, Out Word Flow", "you can out you can out you can out you can out"),
            ("Day, Get, Way Cadence", "day get way day get way day get way day get way"),
            ("Man, New, Now Rhythm", "man new now man new now man new now man new now"),
            ("See, Two, Who Alternation", "see two who see two who see two who see two who"),
            ("Boy, Did, Its Strides", "boy did its boy did its boy did its boy did its"),
            ("Let, Put, Say Transitions", "let put say let put say let put say let put say"),
            ("She, Too, Use Handoffs", "she too use she too use she too use she too use"),
            ("Mixed Three-Letter Sprints", "the boy did see two men who can put out the new way"),
            ("Unit 7 Assessment: Core 3-Letter Words", "you and the boy can see two new ways to get out for the day"),
        ]),
        (8, "Four-Letter Words & Consonant Blends", [
            ("Time, Year, Good Cadence", "time year good time year good time year good"),
            ("Work, Life, Hand Rhythm", "work life hand work life hand work life hand"),
            ("Part, Place, Small Flow", "part place small part place small part place small"),
            ("Water, River, Stone Words", "water river stone water river stone water river"),
            ("Wind, Rain, Fire Elements", "wind rain fire wind rain fire wind rain fire wind"),
            ("Open, Door, Room Spaces", "open door room open door room open door room open"),
            ("Calm, Blue, Warm Colors", "calm blue warm calm blue warm calm blue warm calm"),
            ("Dark, Cold, Soft Textures", "dark cold soft dark cold soft dark cold soft dark"),
            ("Four-Letter Fluid Phrasing", "good work over time will make life open each door with a warm calm hand"),
            ("Unit 8 Assessment: 4-Letter Word Mastery", "take your time to make good work every year and keep your life calm and open"),
        ]),
        (9, "Five & Six-Letter Expanded Vocabulary", [
            ("Water, Earth, Sound Elements", "water earth sound water earth sound water earth sound"),
            ("Light, House, World Centers", "light house world light house world light house world"),
            ("Build, Plant, Learn Actions", "build plant learn build plant learn build plant learn"),
            ("Point, Right, Think Reflexes", "point right think point right think point right think"),
            ("Never, Every, Under Adverbs", "never every under never every under never every under"),
            ("Strong, Little, Simple Forms", "strong little simple strong little simple strong little"),
            ("Always, Follow, Change Paths", "always follow change always follow change always follow"),
            ("People, Family, Friend Bonds", "people family friend people family friend people family"),
            ("Expanded Word Combination Sprints", "strong people build simple houses and learn to follow the right sound"),
            ("Unit 9 Assessment: Expanded Word Flow", "every family will learn to follow light through the world and build strong bonds"),
        ]),
        (10, "Unit 10 Milestone Assessment: Lowercase Vocabulary Sprint", [
            ("Speed Intervals: Two-Word Collocations", "in time on earth right away new life good work calm water"),
            ("Alternating Hand Reflexes", "build things with great care and never turn back from good plans"),
            ("Rhythm Cadence Metronome", "steady hands make clean strokes across each row of the keyboard"),
            ("Consonant Cluster Dexterity", "spring streams flow through green grass near silent stone bridges"),
            ("Rapid Syllable Pacing", "simple thoughts often bring clear answers to complex questions"),
            ("Endurance Building Run", "learning to type without looking at your hands creates lasting muscle memory"),
            ("Cross-Hand Word Balances", "keep your wrists level and your fingers light over the resting keys"),
            ("Near-Zero Error Run", "smooth accuracy leads naturally to high speed with zero wasted motion"),
            ("Vocabulary Sprints on Core Nouns", "water light earth plant river forest mountain valley cloud breeze"),
            ("Unit 10 Milestone Assessment: Vocabulary Sprint", "practice every day to build a calm and confident typing rhythm that flows with ease"),
        ]),
        (11, "Two-to-Three Word Cadence & Phrasing", [
            ("Core Phrasing: in the, on the", "in the on the in the on the into the over the across the"),
            ("Action Phrasing: to make, to do", "to make to do to see to know to feel to find to give to take"),
            ("Descriptive Phrasing: a good way", "a good way a calm mind a long path a small step a bright star"),
            ("Temporal Phrasing: all day long", "all day long for a while after some time before you go right now"),
            ("Spatial Phrasing: around the world", "around the world down the street near the river under the tree"),
            ("Connecting Phrasing: and then we", "and then we but you can so that they because we know while it is"),
            ("Triple-Word Rhythm Chains", "one by one step by step hand in hand day after day out of the blue"),
            ("Natural Speech Cadence", "it is easy to see that you can do this when you keep your focus"),
            ("Phrasal Velocity Drills", "give yourself time to make real progress with every single lesson"),
            ("Unit 11 Assessment: Cadence & Phrasing", "take it step by step and you will find that typing feels natural and smooth"),
        ]),
        (12, "Short Lowercase Declarative Sentences", [
            ("Declarative Flow: Simple Observations", "the sun warms the cool morning air as the gentle breeze blows"),
            ("Declarative Flow: River Currents", "clear water flows down the rocky stream into the quiet lake"),
            ("Declarative Flow: Forest Trails", "tall green trees grow along the silent path through the woods"),
            ("Declarative Flow: Daily Habits", "good habits build strong skills when practiced with quiet patience"),
            ("Declarative Flow: Morning Routine", "birds sing their early morning songs before the busy world wakes up"),
            ("Declarative Flow: Craft & Study", "read each book with care and write your thoughts with clear focus"),
            ("Declarative Flow: Walking Journeys", "we walked through the open fields until the orange sunset faded"),
            ("Declarative Flow: Skill Progression", "every small lesson adds up to great mastery over weeks of steady work"),
            ("Declarative Velocity Drills", "keep your mind calm and let your fingers dance across the keys naturally"),
            ("Unit 12 Assessment: Declarative Sentences", "regular practice helps you type faster and with fewer mistakes every single day"),
        ]),
        (13, "Continuous Lowercase Sentences & Paragraph Flow", [
            ("Two-Sentence Sustained Prose", "the quiet library provides a peaceful refuge for deep study. many students gather here every afternoon to prepare their work."),
            ("Two-Sentence Environmental Flow", "gentle rain fell softly upon the dry autumn leaves outside. a cool breeze swept through the tall open windows of the house."),
            ("Three-Sentence Narrative Flow", "early morning light broke across the distant green hills. the sleepy village slowly began to stir with quiet purpose. farmers walked out toward the wide open fields."),
            ("Three-Sentence Analytical Flow", "touch typing is an essential modern skill for everyone. when you stop looking down at the keyboard you think faster. words appear on your screen as quickly as you speak them."),
            ("Four-Sentence Focus Prose", "keep your posture straight and your wrists relaxed at all times. do not strike the keys too hard because a light touch is faster. let your eyes remain fixed upon the screen before you. trust your fingers to remember where each key is placed."),
            ("Paragraph Rhythm: The Artisan", "a skilled craftsman respects their tools and practices their craft daily. with patient repetition difficult motions become effortless and precise. mastery is not born from haste but from mindful and deliberate habit. every keystroke is an opportunity to refine your natural technique."),
            ("Paragraph Speed: The Open Road", "the long open road stretched toward the distant horizon under blue skies. travelers moved forward with hopeful hearts and steady steps through every mile. no matter how long the journey may seem each forward pace brings you closer to your destination. persistence always turns ambitious dreams into real achievements."),
            ("Paragraph Endurance: Mountain Trails", "climbing a high mountain requires steady pacing rather than sudden exhausting bursts. experienced hikers watch their footing and maintain an even breathing cadence. in the same manner a skilled typist balances velocity with unwavering accuracy across long passages. haste invites avoidable errors while calm rhythm carries you forward effortlessly."),
            ("Paragraph Mastery: The Typing Journey", "learning to type well is a gift that serves you for your entire lifetime. it allows your creative thoughts to flow directly into written form without mechanical friction. when the keyboard disappears beneath your fingertips your mind is completely free to create explore and express."),
            ("Unit 13 Assessment: Section B Lowercase Capstone", "congratulations on completing the comprehensive lowercase typing foundation. your fingers now navigate all twenty six letters with fluid coordination and balanced speed. you are thoroughly prepared to master capitalization and the complete keyboard."),
        ]),
    ]
    
    for u_num, u_label, drills in section_b_units:
        for idx, (title, txt) in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=f"Develop lowercase typing performance: {title}.", text=txt,
                target_keys=["Lowercase Letters"], home_keys=HOME_KEYS,
                skills=["lowercase-reinforcement", "fluency", "real-words"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION C: UPPERCASE INTRODUCTION (Levels 131 to 190, Units 14 to 19)
    # Always mixed with lowercase! (a -> A -> aA -> Aa)
    # -------------------------------------------------------------
    section_c_units = [
        (14, "Shift Mechanics & Keys A through F Uppercase", [
            ("Opposite-Hand Shift Mechanics", "a A aA Aa a A aA Aa a A aA Aa a A aA Aa"),
            ("Right Shift for Left-Hand A: Apple, Art", "Apple Art Area Atlas April Amber Apple Art"),
            ("Key B Uppercase Integration: b -> B -> bB", "b B bB Bb Brave Blue Bright Build Brown"),
            ("Key C Uppercase Integration: c -> C -> cC", "c C cC Cc Clear Calm Cloud Clean Care"),
            ("Key D Uppercase Integration: d -> D -> dD", "d D dD Dd Daily Dark Deep Dream David"),
            ("Key E Uppercase Integration: e -> E -> eE", "e E eE Ee Earth Early East Echo Emma"),
            ("Key F Uppercase Integration: f -> F -> fF", "f F fF Ff Fast Fine Flow Free Frank"),
            ("Mixed Uppercase Trio: A, B, C Names", "Alice Bob Charlie Alice Bob Charlie Alice Bob"),
            ("Mixed Uppercase Trio: D, E, F Names", "David Emma Frank David Emma Frank David Emma"),
            ("Unit 14 Assessment: A through F Uppercase", "Alice and Bob visited David and Emma in April"),
        ]),
        (15, "Keys G through L Uppercase Integration", [
            ("Key G Uppercase Integration: g -> G -> gG", "g G gG Gg Green Gold Great Grace George"),
            ("Left Shift for Right-Hand H: h -> H -> hH", "h H hH Hh Happy Hope High Home Henry"),
            ("Key I Uppercase Integration: i -> I -> iI", "i I iI Ii India Island Iron Insight Ian"),
            ("Key J Uppercase Integration: j -> J -> jJ", "j J jJ Jj June July Jump Justice John"),
            ("Key K Uppercase Integration: k -> K -> kK", "k K kK Kk King Keen Kind Knight Kevin"),
            ("Key L Uppercase Integration: l -> L -> lL", "l L lL Ll Light Lake Land Learn Laura"),
            ("Opposite-Hand Shift Coordination: G, H, I", "George and Henry explored India in July"),
            ("Opposite-Hand Shift Coordination: J, K, L", "John and Kevin visited Lake Tahoe with Laura"),
            ("Cumulative A through L Mixed Capitals", "Alice Bob Charlie David Emma Frank George Henry Ian John Kevin Laura"),
            ("Unit 15 Assessment: G through L Uppercase", "Grace and Henry joined John and Laura on a great trip to London"),
        ]),
        (16, "Keys M through R Uppercase Integration", [
            ("Key M Uppercase Integration: m -> M -> mM", "m M mM Mm Moon Mountain March Music Mary"),
            ("Key N Uppercase Integration: n -> N -> nN", "n N nN Nn North Nature Night Noble Noah"),
            ("Key O Uppercase Integration: o -> O -> oO", "o O oO Oo Ocean Open Orange Order Oliver"),
            ("Key P Uppercase Integration: p -> P -> pP", "p P pP Pp Peace Power Plant Path Peter"),
            ("Key Q Uppercase Integration: q -> Q -> qQ", "q Q qQ Qq Queen Quick Quest Quiet Quinn"),
            ("Key R Uppercase Integration: r -> R -> rR", "r R rR Rr River Rose Royal Right Rachel"),
            ("Mixed Capitals: M, N, O Places", "Montreal Norway Ohio Ontario Madrid Oslo"),
            ("Mixed Capitals: P, Q, R Names", "Peter Quinn Rachel Paris Quebec Rome"),
            ("Cumulative Capital Flow M through R", "Mary and Noah visited Oliver and Peter in Paris near Quebec"),
            ("Unit 16 Assessment: M through R Uppercase", "Rachel and Mary joined Oliver on a quiet quest down the Peace River"),
        ]),
        (17, "Keys S through X Uppercase Integration", [
            ("Key S Uppercase Integration: s -> S -> sS", "s S sS Ss Sun Star Silver Spring Sarah"),
            ("Key T Uppercase Integration: t -> T -> tT", "t T tT Tt Time True Trust Travel Thomas"),
            ("Key U Uppercase Integration: u -> U -> uU", "u U uU Uu Union Unity Unique Urban Utah"),
            ("Key V Uppercase Integration: v -> V -> vV", "v V vV Vv Valley Voice View Victor Victoria"),
            ("Key W Uppercase Integration: w -> W -> wW", "w W wW Ww Wind Water World West William"),
            ("Key X Uppercase Integration: x -> X -> xX", "x X xX Xx Xray Xerox Xenon Xavier Xander"),
            ("Mixed Capitals: S, T, U Sentences", "Sarah and Thomas traveled to Utah this summer"),
            ("Mixed Capitals: V, W, X Sentences", "Victor and William examined the Xerox machine with Xavier"),
            ("Cumulative S through X Mixed Phrasing", "Sarah Thomas Victor William and Xavier built unique models"),
            ("Unit 17 Assessment: S through X Uppercase", "Thomas and William walked through Victoria Valley with Sarah under the stars"),
        ]),
        (18, "Keys Y, Z & Standard Acronyms", [
            ("Key Y Uppercase Integration: y -> Y -> yY", "y Y yY Yy Year Youth Yellow Yield York"),
            ("Key Z Uppercase Integration: z -> Z -> zZ", "z Z zZ Zz Zero Zone Zenith Zeal Zachary"),
            ("Two-Letter Acronyms: US, UK, EU, AI", "US UK EU AI UI UX OS IP IT ID AI UI UX"),
            ("Three-Letter Acronyms: API, CPU, RAM", "API CPU RAM GPU URL CSS DOM API CPU RAM"),
            ("Four-Letter Acronyms: NASA, HTML, JSON", "NASA HTML JSON HTTP REST YAML NASA HTML"),
            ("Mixed Case Software Terms", "JavaScript TypeScript React Next Node Python"),
            ("Mixed Case Web Technologies", "HTML5 CSS3 WebGL RESTful OpenID OAuth"),
            ("Sentences with Technical Acronyms", "The NASA API sends JSON data over HTTP to our UI"),
            ("Sentences with Global Organizations", "The UN and UNESCO promote education across the US and UK"),
            ("Unit 18 Assessment: Y, Z & Acronyms", "Zachary and York studied the NASA API using HTML and JSON with Ian"),
        ]),
        (19, "Full A-Z Capitalization & Title Casing", [
            ("Alphabetical Capital Pairs A-G", "Apple Banana Cherry Date Elderberry Fig Grape"),
            ("Alphabetical Capital Pairs H-N", "Hazelnut Iris Juniper Kiwi Lemon Mango Nectarine"),
            ("Alphabetical Capital Pairs O-U", "Orange Peach Quince Raspberry Strawberry Tangerine Ugli"),
            ("Alphabetical Capital Pairs V-Z", "Vanilla Walnut Xigua Yuzu Zucchini"),
            ("Book & Movie Title Casing", "The Great Gatsby and To Kill A Mockingbird"),
            ("Formal Document Heading Casing", "Executive Summary and Project Implementation Plan"),
            ("Geographical City & Country Casing", "Tokyo Japan London England Toronto Canada"),
            ("Natural Mixed-Case Sentences", "Every Saturday Morning Alice And David Walk Through Central Park"),
            ("Sustained Capitalized Prose", "Good Morning Sinan Welcome To Keyflow Academy Where Typists Flourish"),
            ("Unit 19 Assessment: Section C Uppercase Capstone", "Congratulations To Every Dedicated Typist Who Has Mastered Both Left And Right Shift Keys"),
        ]),
    ]
    for u_num, u_label, drills in section_c_units:
        for idx, (title, txt) in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=f"Master uppercase shift mechanics: {title}.", text=txt,
                target_keys=["Shift", "Uppercase Letters"], home_keys=HOME_KEYS,
                skills=["uppercase-integration", "shift-discipline", "mixed-case"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION D: MIXED-CASE REINFORCEMENT (Levels 191 to 250, Units 20 to 25)
    # Real meaningful sentences: "Hello", "Apple", "My name is Sinan.", etc.
    # -------------------------------------------------------------
    section_d_units = [
        (20, "Unit 20 Milestone: Natural Mixed-Case Typing", [
            ("Greeting Sentences", "Hello world and welcome to KEYFLOW Academy today"),
            ("Self Introduction Phrasing", "My name is Sinan and I am learning touch typing"),
            ("Web Development Frameworks", "React and Next are popular JavaScript frontend frameworks"),
            ("Backend Architecture Roles", "Full Stack Developer builds modern Django applications"),
            ("Software Industry Careers", "Senior Software Engineer designs scalable distributed systems"),
            ("Educational Milestones", "Completing Unit Twenty demonstrates outstanding personal dedication"),
            ("Literary Mixed-Case Sentence", "The early bird catches the worm said Grandma Wilson with a smile"),
            ("Historical Perspective Sentence", "Albert Einstein and Isaac Newton transformed modern physics forever"),
            ("Motivational Mixed-Case Phrasing", "Practice with patience and your fingers will unlock true creative speed"),
            ("Unit 20 Milestone Assessment: Mixed-Case Benchmark", "Welcome to KEYFLOW Academy where dedicated practice transforms daily typing into an effortless art"),
        ]),
        (21, "Global Geography & Proper Nouns", [
            ("Major World Capitals", "Paris France London United Kingdom Tokyo Japan Rome Italy"),
            ("American Cities & States", "New York City California Texas Florida Washington Illinois"),
            ("Famous Rivers & Oceans", "The Amazon River The Nile River The Pacific Ocean The Atlantic Ocean"),
            ("Mountain Ranges of the World", "The Rocky Mountains The Swiss Alps Mount Everest Mount Fuji"),
            ("Continental Exploration", "Europe Asia Africa North America South America Australia Antarctica"),
            ("Historic Landmarks", "The Great Wall of China The Taj Mahal The Colosseum Machu Picchu"),
            ("Island Nations", "New Zealand Iceland Madagascar Ireland Singapore Japan"),
            ("Geographical Prose", "Many travelers dream of sailing across the Mediterranean Sea toward Greece"),
            ("World Travel Narrative", "Alice flew from San Francisco to Tokyo before continuing to Sydney"),
            ("Unit 21 Assessment: Proper Noun Fluency", "Traveling across North America and Europe gives explorers deep appreciation for diverse cultures"),
        ]),
        (22, "Tech Terms, Tools & Brand Names", [
            ("Popular Programming Languages", "Python JavaScript TypeScript Rust Go C Plus Plus Java Ruby"),
            ("Modern Frontend Libraries", "React Vue Angular Svelte Tailwind CSS Redux Vite"),
            ("Backend Databases & Systems", "PostgreSQL MongoDB Redis Docker Kubernetes Linux Ubuntu"),
            ("Major Tech Companies", "Google Microsoft Apple Amazon Meta Netflix Intel NVIDIA"),
            ("Open Source Platforms", "GitHub GitLab Stack Overflow Mozilla Wikipedia Linux Foundation"),
            ("Web Architecture Terminology", "Single Page Application and Representational State Transfer APIs"),
            ("Developer Productivity Tools", "Visual Studio Code Terminal Postman Figma Chrome DevTools"),
            ("Modern Technical Sentences", "Developers write clean Python code and test APIs using Docker containers"),
            ("Frontend Engineering Workflow", "Our team builds fast user interfaces using React Vite and Tailwind CSS"),
            ("Unit 22 Assessment: Tech Industry Terminology", "Modern Full Stack Engineers build reliable web applications using React Vite Python and PostgreSQL"),
        ]),
        (23, "Mixed-Case Formal & Business Communications", [
            ("Formal Email Salutations", "Dear Professor Davis I hope this message finds you well today"),
            ("Business Project Updates", "The quarterly progress report has been submitted to the executive board"),
            ("Meeting Scheduling Requests", "Please join our team standup meeting this Thursday at ten in the morning"),
            ("Product Release Notes", "Version Two of the KEYFLOW typing engine is now live in production"),
            ("Client Appreciation Letters", "Thank you for your continued partnership with our software organization"),
            ("Project Milestone Announcements", "Our engineering division has successfully achieved all primary targets"),
            ("Formal Academic Proposals", "This research paper investigates human motor learning and keyboard ergonomics"),
            ("Customer Support Responses", "Our technical support team has resolved the issue with your account"),
            ("Professional Executive Summaries", "Strategic investments in digital infrastructure generate substantial productivity gains"),
            ("Unit 23 Assessment: Professional Communication", "Dear Members of the Executive Committee please review the attached Project Blueprint before Monday"),
        ]),
        (24, "Literary Dialogue & Quoted Speech", [
            ("Classic Narrative Opening", "It was the best of times it was the worst of times wrote Charles Dickens"),
            ("Philosophical Reflection", "The unexamined life is not worth living observed Socrates in ancient Athens"),
            ("Poetic Sentence Structure", "Two roads diverged in a yellow wood wrote the American poet Robert Frost"),
            ("Scientific Discovery Quote", "Somewhere something incredible is waiting to be known said Carl Sagan"),
            ("Inspirational Wisdom", "The journey of a thousand miles begins with a single step taught Lao Tzu"),
            ("Literary Adventure Sentence", "Call me Ishmael begins the epic nineteenth century tale of Moby Dick"),
            ("Modern Motivational Quote", "Stay hungry stay foolish advised Steve Jobs during his commencement address"),
            ("Reflective Prose Passage", "Silence is sometimes the most eloquent answer that any wise person can offer"),
            ("Dialogue Rhythm Exercise", "Good morning said Arthur with genuine warmth as the sunrise filled the room"),
            ("Unit 24 Assessment: Literary Mixed-Case", "In three words I can sum up everything I have learned about life it goes on wrote Robert Frost"),
        ]),
        (25, "Section D Capstone: Natural Fluent Sentences", [
            ("Descriptive Nature Passage", "Autumn leaves of crimson and amber drifted slowly through the quiet morning breeze"),
            ("Architecture & City Life", "Skyscrapers of glass and steel reflected the warm golden hues of the setting sun"),
            ("Scientific Exploration Passage", "Astronomers using the James Webb Space Telescope study distant galaxies with wonder"),
            ("Music & Artistic Performance", "The philharmonic orchestra performed Beethoven Symphony with breathtaking grace"),
            ("Health & Mindful Living", "Regular physical exercise and balanced nutrition support mental clarity and longevity"),
            ("History of Touch Typing", "Touch typing transformed global commerce by allowing clerks to record thoughts at speaking speed"),
            ("Software Craftsmanship", "Writing clean code is like composing good literature both require clarity rhythm and intent"),
            ("The Philosophy of Flow", "When you achieve flow state your fingers move without conscious effort across the keys"),
            ("Dedication to Mastery", "Mastery is the quiet result of hundreds of focused practice sessions done with patience"),
            ("Unit 25 Assessment: Section D Mixed-Case Capstone", "You have built strong mixed case fluency and your fingers now execute Shift keystrokes with natural bimanual grace"),
        ]),
    ]
    for u_num, u_label, drills in section_d_units:
        for idx, (title, txt) in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=f"Reinforce mixed-case typing: {title}.", text=txt,
                target_keys=["Mixed-Case"], home_keys=HOME_KEYS,
                skills=["mixed-case-reinforcement", "natural-sentences", "fluency"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION E: NUMBERS INTRODUCTION 1-0 (Levels 251 to 295, Units 26 to 30a)
    # Progressive introduction of 1 2 3 4 5 6 7 8 9 0
    # -------------------------------------------------------------
    section_e_levels = [
        # Unit 26: Numbers 1 and 2 (Left pinky and ring)
        (251, 26, "Number 1 Introduction: Left Pinky Reach", "Reach left pinky upward to number 1 and recover to A.",
         "1 11 111 1 1 11 a1 1a 11 aa a1 1a 1 11 111", ["1"], ["number-1", "left-pinky-reach"]),
        (252, 26, "Number 2 Introduction: Left Ring Reach", "Reach left ring upward to number 2 and recover to S.",
         "2 22 222 2 2 22 s2 2s 22 ss s2 2s 2 22 222", ["2"], ["number-2", "left-ring-reach"]),
        (253, 26, "Cumulative Pairing: Numbers 1 and 2", "Combine digits 1 and 2 in alternating pairs.",
         "12 21 112 221 12 21 121 212 11 22 12 21", ["1", "2"], ["1-2-pairing", "number-rhythm"]),
        (254, 26, "Numbers 1 and 2 with Letters", "Type digits 1 and 2 alongside home row letters.",
         "a1 s2 a1 s2 1a 2s 12 as 21 sa a1 s2 12", ["1", "2"], ["1-2-letters"]),
        (255, 26, "Number 1 Repetition Cadence", "Condition confident left pinky extension to 1.",
         "1 1 11 111 1 11 1 111 1 1 11 1 11 111", ["1"], ["number-1-cadence"]),
        (256, 26, "Number 2 Repetition Cadence", "Condition confident left ring extension to 2.",
         "2 2 22 222 2 22 2 222 2 2 22 2 22 222", ["2"], ["number-2-cadence"]),
        (257, 26, "Alternating 1 and 2 Sequences", "Alternate between 1 and 2 without glancing down.",
         "12 12 21 21 112 221 121 212 12 21 12", ["1", "2"], ["1-2-alternation"]),
        (258, 26, "Doublets of 1 and 2", "Type crisp double taps on 1 and 2.",
         "11 22 11 22 1122 2211 11 22 11 22", ["1", "2"], ["1-2-doublets"]),
        (259, 26, "Short Numbers 1 and 2 Drills", "Type short digit strings composed of 1 and 2.",
         "12 21 11 22 121 212 112 221 122 211", ["1", "2"], ["1-2-drills"]),
        (260, 26, "Unit 26 Assessment: Numbers 1 and 2", "Benchmark finger reaches to digits 1 and 2.",
         "1 2 12 21 11 22 121 212 112 221 12 21", ["1", "2"], ["unit-assessment"]),

        # Unit 27: Numbers 3 and 4 (Left middle and index)
        (261, 27, "Number 3 Introduction: Left Middle Reach", "Reach left middle upward to number 3 and recover to D.",
         "3 33 333 3 3 33 d3 3d 33 dd d3 3d 3 33 333", ["3"], ["number-3", "left-middle-reach"]),
        (262, 27, "Number 4 Introduction: Left Index Reach", "Reach left index upward to number 4 and recover to F.",
         "4 44 444 4 4 44 f4 4f 44 ff f4 4f 4 44 444", ["4"], ["number-4", "left-index-reach"]),
        (263, 27, "Cumulative Pairing: Numbers 3 and 4", "Combine digits 3 and 4 with balanced cadence.",
         "34 43 334 443 34 43 343 434 33 44 34 43", ["3", "4"], ["3-4-pairing"]),
        (264, 27, "Four Left-Hand Digits: 1, 2, 3, 4", "Integrate all four left-hand digits across pinky to index.",
         "1234 4321 14 23 32 41 1234 4321 13 24 31 42", ["1", "2", "3", "4"], ["left-hand-numbers"]),
        (265, 27, "Digit 3 Fluid Recovery", "Strengthen 3 reach and D anchor recovery.",
         "d3 3d d3 3d 33 dd 13 23 31 32 33 3d d3", ["3"], ["number-3-recovery"]),
        (266, 27, "Digit 4 Fluid Recovery", "Strengthen 4 reach and F anchor recovery.",
         "f4 4f f4 4f 44 ff 14 24 34 41 42 43 44", ["4"], ["number-4-recovery"]),
        (267, 27, "Left Hand Number Cascades", "Cascade across 1, 2, 3, and 4 in rising and falling waves.",
         "1234 2341 3412 4321 3214 2143 1234 4321", ["1", "2", "3", "4"], ["number-cascades"]),
        (268, 27, "Left-Hand Digits with Anchor Letters", "Mix left-hand numbers with anchor letters a, s, d, f.",
         "a1 s2 d3 f4 f4 d3 s2 a1 1a 2s 3d 4f", ["1", "2", "3", "4"], ["numbers-and-anchors"]),
        (269, 27, "Randomized 4-Digit Sequences", "Type varied four-digit combinations using 1, 2, 3, 4.",
         "1423 3142 2413 4231 1324 4132 2314 3421", ["1", "2", "3", "4"], ["random-numbers"]),
        (270, 27, "Unit 27 Assessment: Left-Hand Numbers 1-4", "Benchmark accuracy across left-hand digits 1, 2, 3, 4.",
         "1234 4321 1324 4231 1423 3241 1122 3344", ["1", "2", "3", "4"], ["unit-assessment"]),

        # Unit 28: Numbers 5 and 6 (Left and right index stretches)
        (271, 28, "Number 5 Introduction: Left Index Inward Stretch", "Stretch left index upward-inward to key 5 and recover to F.",
         "5 55 555 5 5 55 f5 5f 55 ff f5 5f 5 55 555", ["5"], ["number-5", "left-index-stretch"]),
        (272, 28, "Number 6 Introduction: Right Index Inward Stretch", "Stretch right index upward-inward to key 6 and recover to J.",
         "6 66 666 6 6 66 j6 6j 66 jj j6 6j 6 66 666", ["6"], ["number-6", "right-index-stretch"]),
        (273, 28, "Cumulative Pairing: Numbers 5 and 6", "Master the central number gap between 5 and 6.",
         "56 65 556 665 56 65 565 656 55 66 56 65", ["5", "6"], ["5-6-pairing"]),
        (274, 28, "Digits 1 through 6 Integration", "Flow across numbers 1 through 6 across both hands.",
         "123456 654321 16 25 34 43 52 61 123 456", ["1", "2", "3", "4", "5", "6"], ["1-to-6-flow"]),
        (275, 28, "Index Finger Number Symmetry", "Alternate between index finger numbers 4, 5, and 6.",
         "45 56 65 54 456 654 45 56 65 54 46 64", ["4", "5", "6"], ["index-numbers"]),
        (276, 28, "Number 5 and F Rebound Reflex", "Practice rapid tap on 5 and instant snapback to home key F.",
         "f5f 5f5 f5 f5 f5f 5f5 f5f 5f5 ff 55 f5", ["5"], ["5-rebound"]),
        (277, 28, "Number 6 and J Rebound Reflex", "Practice rapid tap on 6 and instant snapback to home key J.",
         "j6j 6j6 j6 j6 j6j 6j6 j6j 6j6 jj 66 j6", ["6"], ["6-rebound"]),
        (278, 28, "Six-Digit Cascade Intervals", "Cascade across all six unlocked digits with steady tempo.",
         "123456 654321 135 246 642 531 123456", ["1", "2", "3", "4", "5", "6"], ["six-digit-cascade"]),
        (279, 28, "Alternating Odd and Even Digits", "Type odd and even digit sequences across 1 to 6.",
         "135 246 135 246 153 264 351 462 135 246", ["1", "2", "3", "4", "5", "6"], ["odd-even-digits"]),
        (280, 28, "Unit 28 Assessment: Numbers 1 through 6", "Benchmark reach precision across numbers 1 through 6.",
         "123456 654321 16 25 34 43 52 61 15 26 35 46", ["1", "2", "3", "4", "5", "6"], ["unit-assessment"]),

        # Unit 29: Numbers 7 and 8 (Right index and middle reaches)
        (281, 29, "Number 7 Introduction: Right Index Reach", "Reach right index upward to number 7 and recover to J.",
         "7 77 777 7 7 77 j7 7j 77 jj j7 7j 7 77 777", ["7"], ["number-7", "right-index-reach"]),
        (282, 29, "Number 8 Introduction: Right Middle Reach", "Reach right middle upward to number 8 and recover to K.",
         "8 88 888 8 8 88 k8 8k 88 kk k8 8k 8 88 888", ["8"], ["number-8", "right-middle-reach"]),
        (283, 29, "Cumulative Pairing: Numbers 7 and 8", "Combine digits 7 and 8 with balanced bilateral tempo.",
         "78 87 778 887 78 87 787 878 77 88 78 87", ["7", "8"], ["7-8-pairing"]),
        (284, 29, "Digits 1 through 8 Integration", "Flow across numbers 1 through 8 spanning both hands.",
         "12345678 87654321 18 27 36 45 54 63 72 81", ["1", "2", "3", "4", "5", "6", "7", "8"], ["1-to-8-flow"]),
        (285, 29, "Right-Hand Central Digits: 6, 7, 8", "Coordinate right-hand digits 6, 7, and 8.",
         "678 876 68 78 86 76 678 876 67 78 87 76", ["6", "7", "8"], ["right-hand-digits"]),
        (286, 29, "Number 7 and J Rebound Reflex", "Strengthen 7 reach and J anchor recovery.",
         "j7j 7j7 j7 7j j7j 7j7 jj 77 j7 7j j7j", ["7"], ["7-rebound"]),
        (287, 29, "Number 8 and K Rebound Reflex", "Strengthen 8 reach and K anchor recovery.",
         "k8k 8k8 k8 8k k8k 8k8 kk 88 k8 8k k8k", ["8"], ["8-rebound"]),
        (288, 29, "Eight-Digit Alternating Pairs", "Pair opposite-hand numbers from outer keys inward.",
         "18 27 36 45 54 63 72 81 18 27 36 45", ["1", "2", "3", "4", "5", "6", "7", "8"], ["eight-digit-pairs"]),
        (289, 29, "Mixed Digit Sprints 1 to 8", "Type random four-digit groups across 1 through 8.",
         "1847 2635 7384 1526 8472 3615 2847 1358", ["1", "2", "3", "4", "5", "6", "7", "8"], ["digit-sprints"]),
        (290, 29, "Unit 29 Assessment: Numbers 1 through 8", "Benchmark speed and accuracy across numbers 1 through 8.",
         "12345678 87654321 18 27 36 45 1357 2468", ["1", "2", "3", "4", "5", "6", "7", "8"], ["unit-assessment"]),

        # Unit 30 (Levels 291 to 295): Numbers 9 and 0
        (291, 30, "Number 9 Introduction: Right Ring Reach", "Reach right ring upward to number 9 and recover to L.",
         "9 99 999 9 9 99 l9 9l 99 ll l9 9l 9 99 999", ["9"], ["number-9", "right-ring-reach"]),
        (292, 30, "Number 0 Introduction: Right Pinky Reach", "Reach right pinky upward to number 0 and recover to semicolon.",
         "0 00 000 0 0 00 ;0 0; 00 ;; ;0 0; 0 00 000", ["0"], ["number-0", "right-pinky-reach"]),
        (293, 30, "Cumulative Pairing: Numbers 9 and 0", "Combine final digits 9 and 0 with smooth pinky-ring cadence.",
         "90 09 990 009 90 09 909 090 99 00 90 09", ["9", "0"], ["9-0-pairing"]),
        (294, 30, "All Ten Digits: 1 2 3 4 5 6 7 8 9 0", "Execute the complete number row sequence from 1 to 0.",
         "1234567890 0987654321 10 29 38 47 56 65 74 83 92 01", ["All 10 Digits"], ["all-ten-digits"]),
        (295, 30, "Ten-Digit Symmetry & Balance", "Alternate between left-hand and right-hand numbers across all ten digits.",
         "10 29 38 47 56 12345 67890 54321 09876 1234567890", ["All 10 Digits"], ["ten-digit-symmetry"]),
    ]

    for lvl, u_num, title, obj, txt, tgts, sks in section_e_levels:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
            unit_label="Number Row Mastery: Digits 1 through 0", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION F: NUMBERS + LETTERS PRACTICE (Levels 296 to 330, Units 30b to 33)
    # Practical tokens: user123, KEYFLOW2026, Room 204, Level 10, etc.
    # -------------------------------------------------------------
    section_f_levels = [
        # Unit 30 remaining levels (296 to 300)
        (296, 30, "Basic Alphanumeric Identifiers", "Combine letters and numbers into natural username patterns.",
         "user123 user456 user789 test10 admin20 user123", ["Alphanumeric"], ["usernames"]),
        (297, 30, "Room Numbers & Floor Levels", "Type real-world building locations and room identifiers.",
         "Room 101 Room 204 Room 305 Room 408 Floor 12", ["Alphanumeric"], ["room-numbers"]),
        (298, 30, "Calendar Years & Modern Dates", "Type four-digit historical and modern calendar years.",
         "Year 1995 Year 2000 Year 2020 Year 2025 Year 2026", ["Alphanumeric"], ["years"]),
        (299, 30, "Curriculum Levels & Units", "Type progress milestones within KEYFLOW Academy.",
         "Level 10 Level 25 Level 50 Unit 30 Stage 1", ["Alphanumeric"], ["level-tokens"]),
        (300, 30, "Unit 30 Milestone Assessment: Alphanumeric Benchmark", "Milestone verification integrating all 10 digits with letters.",
         "user123 completed Level 25 in Room 204 for the KEYFLOW2026 milestone", ["All 10 Digits", "Letters"], ["milestone-assessment", "alphanumeric-capstone"]),

        # Unit 31: Codes, Serial Numbers & Models (Levels 301 to 310)
        (301, 31, "Flight Numbers & Airline Codes", "Type standard airline flight designations.",
         "Flight AA102 Flight UA405 Flight DL789 Flight BA204", ["Alphanumeric"], ["flight-codes"]),
        (302, 31, "Product Serial Numbers", "Type alphanumeric product serials with mixed case.",
         "Serial SN1024 SN2048 SN4096 Model X7 Model Y3", ["Alphanumeric"], ["serial-numbers"]),
        (303, 31, "Standard License Plate Formats", "Type common automotive license plate patterns.",
         "Plate 7XYZ123 4ABC567 2KEY456 9FLOW890", ["Alphanumeric"], ["license-plates"]),
        (304, 31, "Software Release Tags", "Type modern semantic version tags and release names.",
         "Release v1 v2 v10 v25 build 1024 build 2048", ["Alphanumeric"], ["release-tags"]),
        (305, 31, "Postal & Zip Code Patterns", "Type standard 5-digit postal zip codes.",
         "Zip 90210 Zip 10001 Zip 94102 Zip 30301 Zip 75001", ["Alphanumeric"], ["zip-codes"]),
        (306, 31, "Course & Class Catalog Codes", "Type university curriculum course identifiers.",
         "CS101 CS201 MATH301 ENG102 PHYS204 BIO105", ["Alphanumeric"], ["course-codes"]),
        (307, 31, "Highway & Route Designations", "Type interstate and state route numbers.",
         "Route 66 Interstate 95 Highway 101 Interstate 80", ["Alphanumeric"], ["highway-routes"]),
        (308, 31, "Chemical & Molecular Formulas", "Type alphanumeric elemental molecules.",
         "H2O CO2 O2 CH4 C6H12O6 NaCl H2SO4", ["Alphanumeric"], ["chemical-formulas"]),
        (309, 31, "Hardware Chip & Socket Codes", "Type microprocessor and memory module standards.",
         "Intel i7 13700K Ryzen 7 7800X DDR5 6000 RTX 4090", ["Alphanumeric"], ["hardware-codes"]),
        (310, 31, "Unit 31 Assessment: Technical Codes", "Benchmark flight codes serials and tech hardware identifiers.",
         "Flight UA405 landed at Terminal 2 with cargo box SN1024 and chip i7", ["Alphanumeric"], ["unit-assessment"]),

        # Unit 32: Quantities, Measurements & Timestamps (Levels 311 to 320)
        (311, 32, "Clock Times with AM and PM", "Type standard 12-hour clock timestamps.",
         "8 AM 9 AM 10 AM 12 PM 3 PM 5 PM 8 PM 11 PM", ["Alphanumeric"], ["clock-times"]),
        (312, 32, "Distance & Metric Measurements", "Type metric distance units with numbers.",
         "10 meters 50 kilometers 100 meters 400 meters 5 kilometers", ["Alphanumeric"], ["metric-distances"]),
        (313, 32, "Weight & Mass Quantities", "Type common weight and mass values.",
         "5 kilograms 10 pounds 25 grams 500 milligrams 100 tons", ["Alphanumeric"], ["weight-units"]),
        (314, 32, "Volume & Liquid Capacity", "Type liquid volume measurements.",
         "2 liters 500 milliliters 1 gallon 4 quarts 8 ounces", ["Alphanumeric"], ["volume-units"]),
        (315, 32, "Speed & Velocity Metrics", "Type speed and velocity measurements.",
         "30 MPH 60 MPH 100 KMH 25 knots 120 FPS", ["Alphanumeric"], ["speed-metrics"]),
        (316, 32, "Data Storage Capacity Units", "Type digital storage byte quantities.",
         "16 GB 32 GB 64 GB 128 GB 256 GB 512 GB 1 TB 2 TB", ["Alphanumeric"], ["storage-units"]),
        (317, 32, "Percentage & Count Values", "Type whole number percentages and unit counts.",
         "10 percent 25 percent 50 percent 75 percent 100 percent", ["Alphanumeric"], ["percentage-words"]),
        (318, 32, "Day & Month Date Expressions", "Type calendar month dates.",
         "January 15 February 20 March 30 April 12 May 25 July 4", ["Alphanumeric"], ["calendar-dates"]),
        (319, 32, "Century & Decade Historical Terms", "Type historical centuries and decades.",
         "The 1920s The 1960s The 1980s The 1990s The 21st Century", ["Alphanumeric"], ["historical-decades"]),
        (320, 32, "Unit 32 Assessment: Quantities & Measures", "Benchmark numbers embedded in real-world measurements.",
         "The marathon runner completed 42 kilometers in 2 hours and 58 minutes", ["Alphanumeric"], ["unit-assessment"]),

        # Unit 33: Mixed Alphanumeric Sentences (Levels 321 to 330)
        (321, 33, "Workstation Performance Sentences", "Type authentic typing workstation session metrics.",
         "I completed 25 lessons today with 95 percent accuracy", ["Alphanumeric"], ["workstation-sentences"]),
        (322, 33, "Event Scheduling Sentences", "Type real event schedule descriptions.",
         "The conference begins on March 15 in Hall 4 with 250 guests", ["Alphanumeric"], ["scheduling-sentences"]),
        (323, 33, "Technology Specification Sentences", "Type hardware specification descriptions.",
         "The laptop has 32 GB of memory and a 1 TB solid state drive", ["Alphanumeric"], ["tech-sentences"]),
        (324, 33, "Travel Itinerary Sentences", "Type detailed flight itinerary statements.",
         "Our flight departs at 7 AM from Gate 14 and arrives by 11 AM", ["Alphanumeric"], ["travel-sentences"]),
        (325, 33, "Academic Course Sentences", "Type college curriculum course schedule lines.",
         "Students in CS101 must complete 10 lab assignments before May 1", ["Alphanumeric"], ["academic-sentences"]),
        (326, 33, "Library Catalog Records", "Type library book catalog identifiers.",
         "The library archived 500 historical manuscripts from 1850 to 1900", ["Alphanumeric"], ["catalog-sentences"]),
        (327, 33, "Business Financial Summaries", "Type commercial sales count descriptions.",
         "The retail branch sold 450 units in Q1 and 620 units in Q2", ["Alphanumeric"], ["sales-sentences"]),
        (328, 33, "Athletic Track Results", "Type sporting event finish time records.",
         "The sprinter ran 100 meters in 9 seconds and won 1 gold medal", ["Alphanumeric"], ["sports-sentences"]),
        (329, 33, "Scientific Exploration Statements", "Type space exploration mission records.",
         "Apollo 11 launched on July 16 1969 with 3 astronauts on board", ["Alphanumeric"], ["space-sentences"]),
        (330, 33, "Unit 33 Assessment: Section F Alphanumeric Capstone", "Comprehensive graduation benchmark for all numbers combined with mixed-case prose.",
         "In 2026 over 1000 students in 50 countries joined KEYFLOW Academy to master touch typing", ["Alphanumeric"], ["unit-assessment", "section-capstone"]),
    ]

    for lvl, u_num, title, obj, txt, tgts, sks in section_f_levels:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
            unit_label="Alphanumeric Integration & Practical Tokens", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION G: SYMBOLS INTRODUCTION (Levels 331 to 430, Units 34 to 43)
    # 100 Levels teaching all printable US QWERTY symbols
    # -------------------------------------------------------------
    section_g_units = [
        (34, "Punctuation Anchors: Period, Comma, Angle Brackets", [
            ("Key Period (.) Introduction", ". .. ... . . .. l. .l .. ll l. .l . . .. ..."),
            ("Key Comma (,) Introduction", ", ,, ,,, , , ,, k, ,k ,, kk k, ,k , , ,, ,,,"),
            ("Period and Comma Alternation", "., ,. .., ,,. ., ,. .,, ,.. ., ,. .., ,,."),
            ("Left Shift for Less-Than (<)", "< << <<< < < << k< <k << kk k< <k < << <<<"),
            ("Left Shift for Greater-Than (>)", "> >> >>> > > >> l> >l >> ll l> >l > >> >>>"),
            ("Angle Bracket Pairs (< >)", "< > <> >< << >> <<>> >><< < > <> ><"),
            ("Comma and Period with Words", "one, two, three. four, five, six. seven, eight."),
            ("Angle Brackets in Code Tags", "<html> <head> <body> <div> <span> <p>"),
            ("Comparative Operators (< and >)", "a < b and c > d and x < y and max > min"),
            ("Unit 34 Assessment: Punctuation Anchors", "first, second, and third. keep count where x < 10 and y > 20."),
        ]),
        (35, "Semicolon and Colon Integration", [
            ("Key Semicolon (;) Base Position", "; ;; ;;; ; ; ;; l; ;l ;; ll l; ;l ; ;; ;;;"),
            ("Left Shift for Colon (:)", ": :: ::: : : :: l: :l :: ll l: :l : :: :::"),
            ("Semicolon and Colon Alternation", ";: :; ;;: ::; ;: :; ;:: :;; ;: :; ;;: ::;"),
            ("Semicolon Between Independent Clauses", "we studied hard; our results were outstanding."),
            ("Colon Introducing a List", "bring three tools: a pen, a notebook, and focus."),
            ("Colon in Digital Clock Times", "08:30 09:45 12:00 14:15 17:30 20:00 23:59"),
            ("Colon in Key-Value Pairs", "name: Alice, age: 25, city: London, role: Dev"),
            ("Semicolons in Code Statements", "let x = 10; let y = 20; return x + y;"),
            ("Colon in Proportional Ratios", "the ratio was 2:1 and the team won 4:2 in extra time"),
            ("Unit 35 Assessment: Semicolon & Colon", "time: 09:30; task: complete lesson; result: verified."),
        ]),
        (36, "Hyphen, Underscore, Equals, Plus", [
            ("Key Hyphen (-) Right Pinky Reach", "- -- --- - - -- p- -p -- pp p- -p - -- ---"),
            ("Left Shift for Underscore (_)", "_ __ ___ _ _ __ p_ _p __ pp p_ _p _ __ ___"),
            ("Hyphen in Compound Words", "well-known part-time full-time high-speed top-tier"),
            ("Underscore in Snake Case Identifiers", "user_id first_name last_name created_at is_active"),
            ("Key Equals (=) Right Pinky Reach", "= == === = = == p= =p == pp p= =p = == ==="),
            ("Left Shift for Plus (+)", "+ ++ +++ + + ++ p+ +p ++ pp p+ +p + ++ +++"),
            ("Mathematical Addition (+ and =)", "1 + 1 = 2 and 2 + 2 = 4 and 5 + 5 = 10"),
            ("Equality Comparisons (== and ===)", "if x == y and a === b then status = true;"),
            ("Arithmetic Formulas with + - =", "x + y = 10; a - b = 5; total = base + tax;"),
            ("Unit 36 Assessment: Arithmetic Operators", "let count_total = initial_value + delta_rate - offset_base = 100;"),
        ]),
        (37, "Slash, Question Mark, Backslash, Pipe", [
            ("Key Slash (/) Right Pinky Reach", "/ // /// / / // ;/ /; // ;; ;/ /; / // ///"),
            ("Left Shift for Question Mark (?)", "? ?? ??? ? ? ?? ;? ?; ?? ;; ;? ?; ? ?? ???"),
            ("Question Sentences with (?)", "Who are you? What is this? Where are we going?"),
            ("Key Backslash (\\) Reach", "\\ \\\\ \\\\\\ \\ \\ \\\\ p\\ \\p \\\\ pp p\\ \\p \\ \\\\"),
            ("Left Shift for Pipe (|)", "| || ||| | | || p| |p || pp p| |p | || |||"),
            ("Slash in Web URLs and Dates", "https://keyflow.dev/academy and 2026/11/08"),
            ("Pipe in Logical OR and Terminal", "cat file.txt | grep error and true || false"),
            ("Backslash in File Paths", "C:\\Users\\KEYFLOW\\Documents\\project\\main.py"),
            ("Question Mark and Slash Cadence", "Is it true? / Is it false? / Can we verify?"),
            ("Unit 37 Assessment: Slash, Question, Pipe", "Can you run `ls | grep .js`? Check C:\\app\\index.js / OK?"),
        ]),
        (38, "Single and Double Quotation Marks", [
            ("Key Single Quote (') Right Pinky Reach", "' '' ''' ' ' '' ;' '; '' ;; ;' '; ' '' '''"),
            ("Left Shift for Double Quote (\")", "\" \"\" \"\"\" \" \" \"\" ;\" \"; \"\" ;; ;\" \"; \" \"\" \"\"\""),
            ("Single Quotes in Contractions", "it's don't can't won't shouldn't couldn't I'm"),
            ("Double Quotes for Direct Dialogue", "\"Welcome to KEYFLOW,\" said the teacher kindly."),
            ("Single Quotes in Programming Strings", "let mode = 'active'; let role = 'admin';"),
            ("Double Quotes in JSON Keys and Values", "{\"id\": 101, \"title\": \"Lesson\", \"status\": \"done\"}"),
            ("Mixed Quotes within Sentences", "\"Don't give up,\" she said, \"it's nearly finished.\""),
            ("Nested Quotes in Formal Prose", "\"He shouted, 'Watch out!' before jumping,\" noted John."),
            ("Quoted Technical Configuration", "export const ENV = \"production\"; const KEY = 'secret';"),
            ("Unit 38 Assessment: Single & Double Quotes", "\"Don't worry,\" said Alice, \"the JSON key 'username' is valid.\""),
        ]),
        (39, "Parentheses and Square Brackets", [
            ("Left Shift for Open Parenthesis (()", "( (( ((( ( ( (( 9( (9 (( 99 9( (9 ( (( ((("),
            ("Left Shift for Close Parenthesis ())", ") )) ))) ) ) )) 0) )0 )) 00 0) )0 ) )) )))"),
            ("Parenthesis Pairs: ( )", "( ) () )( (()) ()() ( ) () )( (()) ()()"),
            ("Square Bracket Open ([)", "[ [[ [[[ [ [ [[ p[ [p [[ pp p[ [p [ [[ [[["),
            ("Square Bracket Close (])", "] ]] ]]] ] ] ]] [] ][ [[]] [][] [] ][ [[]] [][]"),
            ("Square Bracket Pairs: [ ]", "[ ] [] ][ [[]] [][] [ ] [] ][ [[]] [][]"),
            ("Parentheses in Mathematical Equations", "(2 + 3) * (4 + 5) = 45 and (10 - 2) / 4 = 2"),
            ("Parentheses in Function Calls", "console.log(\"Hello\"); Math.max(10, 20); init();"),
            ("Square Brackets in Array Lists", "const primes = [2, 3, 5, 7, 11, 13, 17, 19];"),
            ("Unit 39 Assessment: Parentheses & Brackets", "const matrix = [(1 + 2), (3 + 4), [5, 6]]; calculate(matrix);"),
        ]),
        (40, "Unit 40 Milestone: Curly Braces & Mathematical Operators", [
            ("Left Shift for Open Curly Brace ({)", "{ {{ {{{ { { {{ p{ {p {{ pp p{ {p { {{ {{{"),
            ("Left Shift for Close Curly Brace (})", "} }} }}} } } }} p} }p }} pp p} }p } }} }}}"),
            ("Curly Brace Pairs: { }", "{ } {} }{ {{}} {}{} { } {} }{ {{}} {}{}"),
            ("Left Shift for Asterisk (*)", "* ** *** * * ** 8* *8 ** 88 8* *8 * ** ***"),
            ("Multiplication with Asterisk (*)", "3 * 4 = 12 and 6 * 7 = 42 and 8 * 9 = 72"),
            ("Curly Braces in JSON and Code Blocks", "{ \"user\": \"Alice\", \"active\": true, \"level\": 40 }"),
            ("Code Functions with Braces and Parens", "function square(x) { return x * x; }"),
            ("Complex Math Expressions with All Delimiters", "result = { x: (a + b) * (c - d), y: [1, 2, 3] };"),
            ("Object Destructuring with Braces", "const { id, title, rating } = response.data;"),
            ("Unit 40 Milestone Assessment: Braces & Math Benchmark", "function evaluate(a, b) { return { sum: (a + b), product: (a * b) }; }"),
        ]),
        (41, "Financial Currency, Percent & Ampersand", [
            ("Left Shift for Dollar Sign ($)", "$ $$ $$$ $ $ $$ 4$ $4 $$ 44 4$ $4 $ $$ $$$"),
            ("Dollar Amounts in Prices", "$5.00 $10.50 $25.00 $49.99 $99.00 $250.00 $1000.00"),
            ("Left Shift for Percent Sign (%)", "% %% %%% % % %% 5% %5 %% 55 5% %5 % %% %%%"),
            ("Percentages in Statistics", "50% 75% 85% 90% 95% 99% 99.9% 100% discount"),
            ("Left Shift for Ampersand (&)", "& && &&& & & && 7& &7 && 77 7& &7 & && &&&"),
            ("Ampersand in Titles and Logic", "Barnes & Noble, AT&T, R&D, if (ready && valid)"),
            ("Left Shift for Hash / Pound (#)", "# ## ### # # ## 3# #3 ## 33 3# #3 # ## ###"),
            ("Hash in Hex Colors and Issue Numbers", "#A1B2C3 #3A5F7D #FF5733 #1024 #2048 Issue #42"),
            ("Financial Statement Sentences", "The price dropped 20% to $79.99 & shipping was free #deal"),
            ("Unit 41 Assessment: Currency, Percent & Hash", "Item #102: Total price is $149.99 with a 15% discount & tax included."),
        ]),
        (42, "Exclamation, At, Caret, Tilde, Backtick", [
            ("Left Shift for Exclamation Mark (!)", "! !! !!! ! ! !! 1! !1 !! 11 1! !1 ! !! !!!"),
            ("Exclamatory Sentences", "Watch out! Fantastic job! Welcome to KEYFLOW!"),
            ("Left Shift for At Sign (@)", "@ @@ @@@ @ @ @@ 2@ @2 @@ 22 2@ @2 @ @@ @@@"),
            ("At Sign in Handles and Rates", "@sinan @keyflow 10 units @ $5.00 each"),
            ("Left Shift for Caret (^)", "^ ^^ ^^^ ^ ^ ^^ 6^ ^6 ^^ 66 6^ ^6 ^ ^^ ^^^"),
            ("Caret in Exponents and RegEx", "2^8 = 256 and 2^10 = 1024 and regex /^start/"),
            ("Key Backtick (`) Left Pinky Reach", "` `` ``` ` ` `` ~` `~ `` ~~ ` `` ```"),
            ("Left Shift for Tilde (~)", "~ ~~ ~~~ ~ ~ ~~ `~ ~` ~~ `` `~ ~` ~ ~~ ~~~"),
            ("Template Literals with Backtick", "const greeting = `Hello, ${user.name}!`;"),
            ("Unit 42 Assessment: Exclamation, At & Backtick", "Bravo! Ping @sinan for ~10 minutes to review `config.json`!"),
        ]),
        (43, "Complete Symbol Matrix Integration", [
            ("Top Row Symbols (! @ # $ % ^ & * ( ))", "! @ # $ % ^ & * ( ) !@#$ %^&*()"),
            ("Punctuation Symbols (- _ = + [ ] { })", "- _ = + [ ] { } -_=+ [{]}"),
            ("Terminal Symbols (\\ | ; : ' \" , < . > / ?)", "\\ | ; : ' \" , < . > / ?"),
            ("Keyboard Top Shift Sprints", "!@#$ %^&* ()_+ ~`"),
            ("Keyboard Right Shift Sprints", "< > ? : \" { } | _ +"),
            ("Arithmetic and Logic Chains", "if (x >= 10 && y <= 20 || z != 0) { return true; }"),
            ("Regular Expression Patterns", "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/"),
            ("Command Line Tool Flags", "curl -X POST https://api.com -H \"Auth: Bearer $KEY\" -d '{\"v\": 1}'"),
            ("Dense Symbol Sentence Sprints", "[Note: Price = $49.99 (tax ~8.5%); Status = \"READY\" & active!]"),
            ("Unit 43 Assessment: Section G Complete Symbol Capstone", "Congratulations! All printable symbols: ~!@#$%^&*()_+`-={}|[]\\:\";'<>?,./ are mastered!"),
        ]),
    ]
    for u_num, u_label, drills in section_g_units:
        for idx, (title, txt) in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=f"Master keyboard symbols: {title}.", text=txt,
                target_keys=["Printable Symbols"], home_keys=HOME_KEYS,
                skills=["symbols-mastery", "shift-coordination", "special-characters"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION H: SYMBOLS WITH REAL TEXT (Levels 431 to 500, Units 44 to 50)
    # Emails, URLs, prices, dates, percentages, quotes, etc.
    # -------------------------------------------------------------
    section_h_units = [
        (44, "Email Addresses & Web URLs", [
            ("Standard Corporate Emails", "Contact support@example.com or info@keyflow.dev for inquiries."),
            ("Academic & Government Emails", "Send transcripts to admissions@stanford.edu or office@nasa.gov."),
            ("Developer & GitHub Handles", "Email sinan44n@users.noreply.github.com or dev@typescript.org."),
            ("Standard HTTP Web URLs", "Visit http://example.org and http://info.cern.ch to read history."),
            ("Secure HTTPS Web URLs", "Navigate to https://keyflow-typing.vercel.app/ for live practice."),
            ("Deep Link URLs with Paths", "Read docs at https://developer.mozilla.org/en-US/docs/Web/JavaScript."),
            ("Query Parameter URLs", "Search https://www.google.com/search?q=touch+typing+academy&hl=en."),
            ("Repository URLs with Branches", "Clone https://github.com/sina44n/Keyflow/tree/main for source code."),
            ("Mixed Emails and URLs Passage", "Visit https://keyflow.dev or write to hello@keyflow.dev today!"),
            ("Unit 44 Assessment: Emails & URLs", "Reach out via support@keyflow.dev or browse https://keyflow-typing.vercel.app/academy!"),
        ]),
        (45, "Financial Prices, Currency & Percentages", [
            ("Standard Retail Prices", "The book costs $14.99 and the journal is priced at $8.50."),
            ("High-Value Financial Amounts", "The project received $250,000.00 in initial seed funding."),
            ("Discount & Sale Percentages", "Save 25% on annual plans or receive a 50% student discount."),
            ("Interest Rates & Metrics", "The mortgage fixed interest rate remained steady at 5.75%."),
            ("Currency Conversions ($ and EUR)", "Exchange rate: $1.00 USD equals approximately 0.92 EUR."),
            ("Invoice Billing Statements", "Invoice #1042: Subtotal $120.00 + 8.5% Sales Tax ($10.20) = $130.20."),
            ("Statistical Growth Percentages", "Typing accuracy improved from 82.4% to 96.8% over thirty days."),
            ("Stock Market Quotes", "Tech shares rose 3.45% ($4.20) to close at $126.85 per share."),
            ("Complete Financial Sentence", "Order #409: 3 items @ $49.99 each = $149.97 minus 10% coupon = $134.97."),
            ("Unit 45 Assessment: Prices & Percentages", "Total cost: $450.00 with 12.5% tax added brings the invoice to $506.25."),
        ]),
        (46, "Dates, Timestamps & Formatted Phone Numbers", [
            ("ISO 8601 Calendar Dates", "Project launch date: 2026-11-08; deadline: 2026-12-31."),
            ("Traditional Written Dates", "Born on July 4, 1776 in Philadelphia, Pennsylvania."),
            ("Timestamps with Minutes & Seconds", "The server started at 09:30:15 AM and completed at 11:45:00 AM."),
            ("North American Phone Numbers", "Call customer service at (800) 555-0199 or (212) 555-0142."),
            ("International Phone Numbers", "Dial +1-415-555-2671 (US) or +44-20-7946-0912 (UK) for support."),
            ("Mixed Date and Time Records", "Scheduled maintenance on 2026-05-15 from 02:00 UTC to 04:00 UTC."),
            ("Flight Departure Schedules", "Flight AA-402 departs 2026-08-20 at 14:35 and arrives at 18:20."),
            ("Historic Event Timelines", "The treaty was signed on November 11, 1918 at 11:00 AM."),
            ("Comprehensive Contact Block", "Date: 2026-11-08 | Time: 10:15 AM | Phone: +1 (555) 019-2834."),
            ("Unit 46 Assessment: Dates & Phone Numbers", "Event on 2026-10-14 at 09:00 AM; RSVP via phone at +1 (800) 555-0199."),
        ]),
        (47, "Quotations, Dialogue & Parenthetical Clauses", [
            ("Short Literary Quotation", "\"The only true wisdom is knowing you know nothing,\" wrote Plato."),
            ("Parenthetical Clarification", "Keyflow (developed by Sinan) emphasizes relaxed tactile posture."),
            ("Dialogue with Attribution", "\"Have you tried the new lesson?\" asked Emma. \"Yes, it's brilliant!\""),
            ("Direct Quotes with Commas", "\"To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment,\" said Emerson."),
            ("Nested Parenthetical Context", "Our server cluster (located in Frankfurt [eu-central-1]) is fully operational."),
            ("Quoted Technical Terminology", "The algorithm uses \"breadth-first search\" (BFS) to find optimal routes."),
            ("Exclamatory Dialogue in Fiction", "\"Stop!\" shouted the guard. \"Who goes there? Identify yourself!\""),
            ("Parenthetical Number Annotations", "The survey revealed three major factors: (1) speed, (2) accuracy, and (3) rhythm."),
            ("Complex Literary Prose Passage", "\"Life,\" wrote Samuel Butler, \"is the art of drawing sufficient conclusions from insufficient premises.\""),
            ("Unit 47 Assessment: Quotations & Parentheses", "\"Always remember,\" stated the instructor, \"proper posture (curved fingers) prevents fatigue!\""),
        ]),
        (48, "Mathematical, Logical & Relational Expressions", [
            ("Basic Algebraic Equality", "Solve for x: 2x + 5 = 15; therefore, 2x = 10 and x = 5."),
            ("Inequality Comparisons", "Valid ranges: 0 <= score <= 100 and threshold > 75.5."),
            ("Multiplication & Division Math", "Calculate area: width * height = 12 * 8 = 96 sq units; 96 / 2 = 48."),
            ("Exponentiation and Roots", "The formula is y = x^2 + 3x - 4; when x = 3, y = 9 + 9 - 4 = 14."),
            ("Boolean Logic Statements", "is_valid = (user.is_authenticated && user.has_perm('edit'));"),
            ("Set Notation and Brackets", "Set S = {1, 2, 3, 4, 5}; subset A = {2, 4}; A subset S."),
            ("Scientific Measurement Formula", "Velocity formula: v = d / t (where d = 100m, t = 9.58s, v ~ 10.44 m/s)."),
            ("Compound Logical Predicate", "if (age >= 18 && (country == 'US' || country == 'CA')) { approve(); }"),
            ("Matrix Dimension Description", "Matrix M[3][3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; det(M) = 1."),
            ("Unit 48 Assessment: Math & Logic Benchmark", "Equation: f(x) = (x + 2) * (x - 3); roots are x = -2 and x = 3; verify f(0) = -6."),
        ]),
        (49, "Technical Data Strings, JSON & Configuration", [
            ("Single-Line JSON Object", "{\"id\": 101, \"name\": \"Alice\", \"role\": \"admin\", \"active\": true}"),
            ("CSS Style Rule Declaration", ".card { padding: 16px; border-radius: 8px; background: #1a1a2e; }"),
            ("Environment Variable Assignments", "DATABASE_URL=\"postgresql://user:pass@localhost:5432/keyflow_db\""),
            ("Terminal CLI Shell Command", "docker run -d -p 8000:8000 --name keyflow-backend keyflow:latest"),
            ("Git Commit Command", "git commit -m \"feat(curriculum): implement complete 7000-level engine\""),
            ("HTML Anchor Tag Structure", "<a href=\"https://keyflow.dev\" target=\"_blank\">KEYFLOW Academy</a>"),
            ("YAML Configuration Snippet", "version: '3.8'\nservices:\n  web:\n    image: node:20\n    ports: ['3000:3000']"),
            ("SQL Query Statement", "SELECT user_id, wpm, accuracy FROM practice_sessions WHERE wpm > 60;"),
            ("TypeScript Interface Definition", "interface UserProfile { id: string; email: string; totalStars: number; }"),
            ("Unit 49 Assessment: Configuration Syntax", "const config = { port: 8080, host: '0.0.0.0', debug: false, tags: ['v2', 'prod'] };"),
        ]),
        (50, "Unit 50 Milestone: Real-Text Symbol Benchmark", [
            ("E-Commerce Order Receipt", "Order #8492 confirmed on 2026-11-08 for $89.50; tracking: https://track.co/8492."),
            ("Developer Bug Ticket Report", "Bug #404: NullPointerException in authService.js:42 when user.email is null."),
            ("Academic Research Citation", "Knuth, D. E. (1984). Literate Programming. The Computer Journal, 27(2), 97-111."),
            ("Server Health Diagnostic", "STATUS: 200 OK | CPU: 14.2% | RAM: 3.8/16 GB | Uptime: 45 days, 08:24:12."),
            ("Customer Feedback Excerpt", "\"KEYFLOW increased my speed by +25 WPM (now typing ~70 WPM at 98% accuracy)!\""),
            ("Mathematics Exam Problem", "If f(x) = 3x^2 - 4x + 1, find f'(x) = 6x - 4; evaluate f'(2) = 8."),
            ("API Endpoint Documentation", "POST /api/v1/lessons/{id}/complete HTTP/1.1\nContent-Type: application/json"),
            ("Cryptographic Hash Representation", "SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
            ("Executive KPI Metric Summary", "Revenue: $1,250,000 (+15.4% YoY) | NPS Score: 78 | Retention: 94.2%."),
            ("Unit 50 Milestone Assessment: Real-Text Capstone", "Milestone 50 Achieved: You type emails, URLs, dates, prices ($49.99), and code with complete fluency!"),
        ]),
    ]
    for u_num, u_label, drills in section_h_units:
        for idx, (title, txt) in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=f"Practice symbols in authentic text: {title}.", text=txt,
                target_keys=["Contextual Symbols"], home_keys=HOME_KEYS,
                skills=["real-text-symbols", "contextual-typing", "practical-tokens"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION I: FUNCTIONAL KEYBOARD KEYS (Levels 501 to 545, Units 51 to 55a)
    # Real interactive tasks: Enter, Shift, Tab, Backspace, Caps, Space, Arrows
    # -------------------------------------------------------------
    section_i_levels = [
        # Unit 51: Spacebar & Enter Key Mechanics (Levels 501 to 510)
        (501, 51, "Spacebar Cadence & Thumb Independence", "Strike spacebar with dominant thumb without lifting index fingers.",
         "word space word space word space word space word space", ["Spacebar"], ["spacebar-cadence", "thumb-independence"]),
        (502, 51, "Multi-Word Space Rhythm", "Maintain steady metronomic timing between words and spacebar strikes.",
         "the quick brown fox jumped high over the sleeping guard dog", ["Spacebar"], ["space-rhythm"]),
        (503, 51, "Enter Key Right Pinky Reach", "Reach right pinky outward to Enter key to start a new paragraph.",
         "Line one.\nLine two.\nLine three.\nLine four.", ["Enter"], ["enter-key", "newline-reach"]),
        (504, 51, "Poetic Stanza Break with Enter", "Format verse stanzas using the Enter key for newline breaks.",
         "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both.", ["Enter"], ["stanza-breaks"]),
        (505, 51, "Numbered List Formatting with Enter", "Create structured list items separated by Enter keypresses.",
         "1. First step.\n2. Second step.\n3. Third step.", ["Enter"], ["numbered-lists"]),
        (506, 51, "Dialogue Line Breaks with Enter", "Format dramatic dialogue with alternate speaker lines.",
         "\"Hello,\" said Alice.\n\"Good morning,\" replied Bob.", ["Enter"], ["dialogue-formatting"]),
        (507, 51, "Code Block Multi-Line with Enter", "Write multi-line programming statements separated by newlines.",
         "let x = 10;\nlet y = 20;\nlet sum = x + y;", ["Enter"], ["code-newlines"]),
        (508, 51, "Double Enter for Paragraph Separation", "Insert double Enter keypresses to separate prose paragraphs.",
         "First paragraph introduces the topic.\n\nSecond paragraph develops the main idea.", ["Enter"], ["double-enter"]),
        (509, 51, "Address Block Formatting with Enter", "Format mailing address blocks using Enter line breaks.",
         "KEYFLOW Technologies\n100 Innovation Way\nSan Francisco, CA 94105", ["Enter"], ["address-blocks"]),
        (510, 51, "Unit 51 Assessment: Spacebar & Enter Discipline", "Benchmark clean execution of spacebar and Enter newline breaks.",
         "Title: Executive Summary\n\nPoint 1: Steady cadence wins.\nPoint 2: Clean form prevents fatigue.", ["Spacebar", "Enter"], ["unit-assessment"]),

        # Unit 52: Left & Right Shift Discipline (Levels 511 to 520)
        (511, 52, "Right Shift for Left-Hand Keys (Q, W, E, R, T, A, S, D, F, G)", "Hold Right Shift with right pinky while left hand strikes capital letter.",
         "Queen Water Earth River Time Apple Sun Dark Fast Green", ["Right Shift"], ["right-shift-discipline"]),
        (512, 52, "Left Shift for Right-Hand Keys (Y, U, I, O, P, H, J, K, L)", "Hold Left Shift with left pinky while right hand strikes capital letter.",
         "Youth Union Island Ocean Peace Hope Joy King Light", ["Left Shift"], ["left-shift-discipline"]),
        (513, 52, "Alternating Bilateral Shift Transitions", "Alternate smoothly between Left Shift and Right Shift across words.",
         "Alice in Japan, Bob in France, Charlie in Spain, David in Italy", ["Shift"], ["bilateral-shift-coordination"]),
        (514, 52, "Shift with Number Row Symbols (! @ # $ %)", "Hold Right Shift to type symbols above left-hand numbers.",
         "! @ # $ % ! @ # $ % $100 #1 %50 @home !yes", ["Right Shift"], ["left-symbols"]),
        (515, 52, "Shift with Number Row Symbols (^ & * ( ))", "Hold Left Shift to type symbols above right-hand numbers.",
         "^ & * ( ) ^ & * ( ) (sum * 2) & more ^top", ["Left Shift"], ["right-symbols"]),
        (516, 52, "Mixed Shift Symbol Strings", "Alternate Shift hands across complex symbol combinations.",
         "(!$#) (%&*) (!&*) (#%^) (@*$) (!#%&)", ["Shift"], ["mixed-shift-symbols"]),
        (517, 52, "Title Capitalization Precision", "Capitalize formal document headings without releasing Shift prematurely.",
         "Principles Of Neuromuscular Keyboard Mastery", ["Shift"], ["title-capitalization"]),
        (518, 52, "Shift-Hold Duration Training", "Condition fingers to release Shift immediately after letter impact.",
         "The King And The Queen Met At The Grand Palace", ["Shift"], ["shift-release-timing"]),
        (519, 52, "All-Caps Acronym Burst Timing", "Type uppercase acronyms using alternate Shift holds without Caps Lock.",
         "NASA, HTML, JSON, HTTP, REST, CPU, GPU, RAM, USA, UK", ["Shift"], ["acronym-bursts"]),
        (520, 52, "Unit 52 Assessment: Bimanual Shift Discipline", "Benchmark opposite-hand Shift precision across diverse sentences.",
         "Queen Victoria Traveled From London To Paris With Prince Albert In June 1855", ["Shift"], ["unit-assessment"]),

        # Unit 53: Tab Key Indentation & Form Alignment (Levels 521 to 530)
        (521, 53, "Tab Key Left Pinky Reach", "Reach left pinky upward-left to Tab key for text indentation.",
         "Start line.\n\tIndented line with Tab.\n\tAnother indented line.", ["Tab"], ["tab-key", "left-pinky-reach"]),
        (522, 53, "Paragraph First-Line Indentation", "Format traditional formal paragraphs with leading Tab indentation.",
         "\tOnce upon a time in a tranquil valley surrounded by towering peaks.", ["Tab"], ["first-line-indent"]),
        (523, 53, "Two-Level Code Indentation with Tab", "Indents nested programming blocks using single and double tabs.",
         "function processData() {\n\tlet result = 0;\n\treturn result;\n}", ["Tab"], ["code-indentation"]),
        (524, 53, "Nested Control Flow Indentation", "Structure nested if-statements and loops using Tab spacing.",
         "if (isValid) {\n\tfor (let i = 0; i < 10; i++) {\n\t\ttotal += i;\n\t}\n}", ["Tab"], ["nested-indentation"]),
        (525, 53, "Tabular Data Alignment with Tab", "Align multi-column data records cleanly using Tab stops.",
         "Name\tAge\tCity\nAlice\t25\tLondon\nBob\t30\tParis", ["Tab"], ["tabular-data"]),
        (526, 53, "Product Catalog Tab Alignment", "Format product item tables with name, quantity, and price columns.",
         "Item\tQty\tPrice\nApples\t10\t$2.50\nOranges\t5\t$3.00", ["Tab"], ["product-table"]),
        (527, 53, "Tab Key Navigation in Form Inputs", "Simulate tabbing between form fields and data entry cells.",
         "First Name\tLast Name\tEmail Address\tPhone Number", ["Tab"], ["form-navigation"]),
        (528, 53, "Python-Style Significant Whitespace", "Type clean Python code blocks requiring precise Tab indentation.",
         "def calculate_total(items):\n\ttotal = 0\n\tfor item in items:\n\t\ttotal += item.price\n\treturn total", ["Tab"], ["python-indentation"]),
        (529, 53, "Multi-Column Financial Ledger", "Format accounting balances with tab-separated columns.",
         "Date\tAccount\tDebit\tCredit\n2026-11-08\tCash\t$500.00\t$0.00", ["Tab"], ["ledger-table"]),
        (530, 53, "Unit 53 Assessment: Tab Indentation & Alignment", "Benchmark clean execution of Tab indents and columnar text.",
         "class Student:\n\tdef __init__(self, name):\n\t\tself.name = name\n\t\tself.grade = 100", ["Tab"], ["unit-assessment"]),

        # Unit 54: Backspace Error Correction Discipline (Levels 531 to 540)
        (531, 54, "Backspace Right Pinky Reach & Recovery", "Reach right pinky upward-right to Backspace and snap back to home.",
         "Correct your mistakes immediately when a typo occurs.", ["Backspace"], ["backspace-reach", "homing-recovery"]),
        (532, 54, "Immediate Correction Reflex", "Train instant backspace tap upon feeling a mistyped key.",
         "The correct spelling is necessary for high quality writing.", ["Backspace"], ["immediate-correction"]),
        (533, 54, "Single-Stroke Backspace Precision", "Avoid overshooting: tap Backspace exactly once per corrected letter.",
         "Precision in typing means fewer corrections and higher net speed.", ["Backspace"], ["single-stroke-backspace"]),
        (534, 54, "Double-Stroke Backspace Discipline", "Tap Backspace cleanly twice to fix a transposed two-letter digram.",
         "Careful observation prevents recurring errors across complex words.", ["Backspace"], ["double-stroke-backspace"]),
        (535, 54, "Word-Level Error Recovery", "Correct an entire mistyped word and retype with smooth rhythm.",
         "When a mistake happens, stay calm and continue with confidence.", ["Backspace"], ["word-recovery"]),
        (536, 54, "Punctuation Backspace Correction", "Correct misplaced punctuation marks cleanly.",
         "Wait; let us verify the facts before we draw any hasty conclusions.", ["Backspace"], ["punctuation-correction"]),
        (537, 54, "Shift-Mistake Backspace Correction", "Correct unintended capitalization with single backspace.",
         "Keyflow teaches proper touch typing without glancing at keys.", ["Backspace"], ["shift-correction"]),
        (538, 54, "Eliminating Hesitation After Backspace", "Resume fluent typing cadence immediately after a correction.",
         "Smooth recovery after error correction is the mark of a skilled typist.", ["Backspace"], ["cadence-resumption"]),
        (539, 54, "Near-Zero Error Sprint with Backspace Buffer", "Prioritize getting it right first time to minimize backspace reliance.",
         "The best typists do not type fast by erasing; they type accurately first.", ["Backspace"], ["error-minimization"]),
        (540, 54, "Unit 54 Assessment: Error Correction Benchmark", "Benchmark clean and controlled error recovery without losing flow.",
         "Make every keystroke intentional; correct errors promptly and continue with steady rhythm.", ["Backspace"], ["unit-assessment"]),

        # Unit 55 (Levels 541 to 545): Caps Lock & Navigation Keys
        (541, 55, "Caps Lock Left Pinky Toggle", "Toggle Caps Lock for sustained uppercase words and toggle off promptly.",
         "WARNING: SYSTEM REBOOT IN PROGRESS. PLEASE SAVE ALL ACTIVE FILES.", ["Caps Lock"], ["caps-lock-toggle"]),
        (542, 55, "Caps Lock in Legal & Contract Headers", "Type legal contract titles using Caps Lock discipline.",
         "TERMS AND CONDITIONS OF SERVICE AND PRIVACY POLICY AGREEMENT", ["Caps Lock"], ["legal-caps"]),
        (543, 55, "Caps Lock in SQL Keywords", "Type standard uppercase SQL queries with lowercase identifiers.",
         "SELECT user_id, email FROM users WHERE is_active = TRUE ORDER BY created_at DESC;", ["Caps Lock"], ["sql-caps"]),
        (544, 55, "Arrow Keys Navigation (Up, Down, Left, Right)", "Navigate text cursor using directional arrow keys without lifting wrists.",
         "Navigate upward, step downward, jump leftward, and proceed rightward smoothly.", ["Arrow Keys"], ["arrow-navigation"]),
        (545, 55, "Escape Key Left Pinky Reach", "Reach left pinky upward-left to Escape key to dismiss modals or exit modes.",
         "Press Escape to cancel the dialog, close the menu, or return to editor mode.", ["Escape"], ["escape-key"]),
    ]

    for lvl, u_num, title, obj, txt, tgts, sks in section_i_levels:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
            unit_label="Functional Keyboard Keys: Actions & Formatting", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION J: COMPLETE KEYBOARD INTEGRATION (Levels 546 to 600, Units 55b to 60)
    # Unified real-world sentences, code, emails, prices, markdown
    # -------------------------------------------------------------
    section_j_levels = [
        # Unit 55 remaining levels (546 to 550)
        (546, 55, "Unified Keyboard Test: Lower, Upper & Numbers", "Combine lowercase, uppercase, and numbers into a fluid sentence.",
         "In 2026, Alice and Bob completed 100 levels at KEYFLOW Academy with 98% accuracy.", ["All Keys"], ["unified-keys"]),
        (547, 55, "Unified Keyboard Test: Symbols & Email", "Combine symbols, quotes, and web URLs in business correspondence.",
         "Please send your feedback to \"support@keyflow.dev\" or check https://keyflow.dev!", ["All Keys"], ["unified-email-url"]),
        (548, 55, "Unified Keyboard Test: Pricing & Quantities", "Type financial transaction records with diverse currency and metrics.",
         "Invoice #5021: 4 licenses @ $79.99 = $319.96 (including 8.5% sales tax).", ["All Keys"], ["unified-prices"]),
        (549, 55, "Unified Keyboard Test: Multi-Line Code Block", "Type formatted multi-line code with braces, parens, and semicolons.",
         "const getUser = async (id) => {\n\tconst res = await fetch(`/api/users/${id}`);\n\treturn res.json();\n};", ["All Keys"], ["unified-code"]),
        (550, 55, "Unit 55 Milestone Assessment: Functional Keys & Integration", "Milestone benchmark testing complete functional keys and initial full integration.",
         "KEYFLOW Academy V2.0 launched on 2026-11-08: Complete touch typing education for all 7,000 levels!", ["All Keys"], ["milestone-assessment", "functional-capstone"]),

        # Unit 56: Multi-Element Sentences (Levels 551 to 560)
        (551, 56, "Full Sentence: News & Media Report", "Type news report prose integrating names, dates, quotes, and percentages.",
         "On October 12, 2025, Dr. Elena Rostova announced: \"Our new solar panel achieves 28.4% efficiency!\"", ["All Keys"], ["news-report"]),
        (552, 56, "Full Sentence: E-Commerce Order Confirmation", "Type order confirmation statements with order numbers and email links.",
         "Order #9824 confirmed! Total: $149.50 paid via Visa (ending in 4821). Tracking: https://track.co/9824.", ["All Keys"], ["order-confirmation"]),
        (553, 56, "Full Sentence: Academic Paper Abstract", "Type scientific abstract sentences with statistics and citations.",
         "Studies show that touch typists type ~65 WPM (p < 0.001) with significantly lower ergonomic strain.", ["All Keys"], ["academic-abstract"]),
        (554, 56, "Full Sentence: Customer Service Log", "Type customer support tickets with timestamps and status indicators.",
         "[2026-11-08 14:22:05] User @sinan requested password reset; ticket #4082 marked \"RESOLVED\".", ["All Keys"], ["support-ticket"]),
        (555, 56, "Full Sentence: Software Development Issue", "Type GitHub issue descriptions with branch names and commit hashes.",
         "Fix issue #128 in branch `feature/auth-repair`: Update Clerk JWT verification in api/auth.py.", ["All Keys"], ["github-issue"]),
        (556, 56, "Full Sentence: Travel Booking Confirmation", "Type comprehensive airline ticket booking details.",
         "Flight DL-204 departs JFK at 08:30 AM (Terminal 4, Gate B22) on 2026-09-15 for London Heathrow.", ["All Keys"], ["travel-booking"]),
        (557, 56, "Full Sentence: Financial Market Analysis", "Type Wall Street market index summaries with percentage changes.",
         "The S&P 500 rose +1.25% (+62.40 pts) to 5,024.10, while NASDAQ climbed +1.80% led by tech stocks.", ["All Keys"], ["market-analysis"]),
        (558, 56, "Full Sentence: Real Estate Listing", "Type property descriptions with dimensions, prices, and features.",
         "For Sale: 3-bedroom home at 742 Evergreen Terrace for $485,000 (approx. 2,100 sq ft; built 1998).", ["All Keys"], ["real-estate"]),
        (559, 56, "Full Sentence: Medical Prescription Record", "Type pharmacy prescription guidelines with dosages.",
         "Rx #749201: Amoxicillin 500mg capsules; take 1 capsule every 8 hours for 10 days with water.", ["All Keys"], ["medical-rx"]),
        (560, 56, "Unit 56 Assessment: Multi-Element Sentences", "Benchmark fluid typing of complex sentences containing all character types.",
         "At 09:15 AM on 2026-04-12, Agent Smith verified account #994 ($12,450.00) via https://bank.com/verify.", ["All Keys"], ["unit-assessment"]),

        # Unit 57: Real-World Markdown Documentation (Levels 561 to 570)
        (571 - 10, 57, "Markdown Header & Bold Formatting", "Type markdown headings and bold text syntax.",
         "# Getting Started with KEYFLOW\n\n**Note:** Proper finger placement is essential for success.", ["All Keys"], ["markdown-headers"]),
        (572 - 10, 57, "Markdown Bullet List with Links", "Type markdown bullet points containing hypertext links.",
         "- [Documentation](https://keyflow.dev/docs)\n- [Community Forum](https://keyflow.dev/forum)", ["All Keys"], ["markdown-links"]),
        (573 - 10, 57, "Markdown Inline Code & Italic", "Type inline code spans and italicized emphasis.",
         "Use `git status` to inspect *uncommitted changes* before running `git commit`.", ["All Keys"], ["markdown-inline-code"]),
        (574 - 10, 57, "Markdown Blockquote Syntax", "Type multi-line blockquotes with author attribution.",
         "> \"Simplicity is prerequisite for reliability.\"\n> — Edsger W. Dijkstra (1970)", ["All Keys"], ["markdown-blockquotes"]),
        (575 - 10, 57, "Markdown Code Block with Language Tag", "Type fenced code blocks specifying language identifiers.",
         "```python\ndef greet(name: str) -> str:\n    return f\"Hello, {name}!\"\n```", ["All Keys"], ["markdown-code-blocks"]),
        (576 - 10, 57, "Markdown Table Structure", "Type markdown tabular data with header separators.",
         "| Stage | Levels | Target WPM |\n| :--- | :--- | :--- |\n| Stage 1 | 700 | 12 - 24 WPM |", ["All Keys"], ["markdown-tables"]),
        (577 - 10, 57, "Markdown Task List Syntax", "Type interactive GitHub-flavored markdown task lists.",
         "- [x] Install dependencies (`npm install`)\n- [x] Run test suite (`npm test`)\n- [ ] Deploy to production", ["All Keys"], ["markdown-tasks"]),
        (578 - 10, 57, "Markdown Footnotes and Reference Links", "Type markdown footnote annotations and reference definitions.",
         "Touch typing increases productivity[^1].\n\n[^1]: See research at https://keyflow.dev/research.", ["All Keys"], ["markdown-footnotes"]),
        (579 - 10, 57, "Markdown Horizontal Rules and Sections", "Type divider rules and multi-section documentation.",
         "---\n\n## Section 2: Neuromuscular Learning Principles\n\nCurved fingers reduce wrist strain.", ["All Keys"], ["markdown-dividers"]),
        (580 - 10, 57, "Unit 57 Assessment: Markdown Mastery", "Benchmark formatting complete markdown technical documentation.",
         "# Release Notes v2.1.0\n\n- Improved accuracy algorithm (**98%+**)\n- Resolved issue #402 (`auth.js`)", ["All Keys"], ["unit-assessment"]),

        # Unit 58: Code Syntax & Configuration Blocks (Levels 571 to 580)
        (571, 58, "JavaScript Async Function", "Type standard asynchronous JavaScript functions with error handling.",
         "async function fetchData(url) {\n\ttry {\n\t\tconst res = await fetch(url);\n\t\treturn await res.json();\n\t} catch (err) {\n\t\tconsole.error(err);\n\t}\n}", ["All Keys"], ["js-async"]),
        (572, 58, "Python Class Definition", "Type Python object-oriented class syntax with methods and docstrings.",
         "class Typist:\n\t\"\"\"Represents a KEYFLOW learner.\"\"\"\n\tdef __init__(self, username: str):\n\t\tself.username = username\n\t\tself.stars = 0", ["All Keys"], ["python-class"]),
        (573, 58, "HTML5 Form Element", "Type semantic HTML form fields with attributes.",
         "<form action=\"/api/login\" method=\"POST\">\n\t<input type=\"email\" name=\"email\" required />\n\t<button type=\"submit\">Sign In</button>\n</form>", ["All Keys"], ["html-form"]),
        (574, 58, "CSS Flexbox Navigation Bar", "Type modern responsive CSS stylesheet rules.",
         ".navbar {\n\tdisplay: flex;\n\tjustify-content: space-between;\n\talign-items: center;\n\tpadding: 1rem 2rem;\n}", ["All Keys"], ["css-flexbox"]),
        (575, 58, "SQL Relational Join Query", "Type relational database queries with joins and filters.",
         "SELECT u.username, p.wpm, p.accuracy\nFROM users u\nJOIN practice_sessions p ON u.id = p.user_id\nWHERE p.wpm >= 60\nORDER BY p.wpm DESC;", ["All Keys"], ["sql-query"]),
        (576, 58, "TypeScript Interface & Generic", "Type advanced TypeScript types and generic interfaces.",
         "export interface ApiResponse<T> {\n\tstatus: 'success' | 'error';\n\tdata: T;\n\ttimestamp: string;\n}", ["All Keys"], ["ts-generic"]),
        (577, 58, "JSON API Payload Structure", "Type nested JSON object data structures.",
         "{\n\t\"status\": 200,\n\t\"message\": \"OK\",\n\t\"payload\": {\n\t\t\"userId\": 1024,\n\t\t\"active\": true\n\t}\n}", ["All Keys"], ["json-payload"]),
        (578, 58, "Bash Terminal Shell Scripting", "Type Unix shell script conditionals and loops.",
         "#!/usr/bin/env bash\nfor file in *.log; do\n\tif [ -f \"$file\" ]; then\n\t\techo \"Processing $file...\"\n\tfi\ndone", ["All Keys"], ["bash-script"]),
        (579, 58, "React Hook Component Structure", "Type modern React functional components using hooks.",
         "function Timer({ seconds }) {\n\tconst [timeLeft, setTimeLeft] = useState(seconds);\n\treturn <div>Time: {timeLeft}s</div>;\n}", ["All Keys"], ["react-hook"]),
        (580, 58, "Unit 58 Assessment: Code Syntax Benchmark", "Benchmark clean typing across diverse programming languages.",
         "const calculateWpm = (chars, seconds) => Math.round((chars / 5) / (seconds / 60));", ["All Keys"], ["unit-assessment"]),

        # Unit 59: Complex Business & Professional Communication (Levels 581 to 590)
        (581, 59, "Executive Memo: Strategy Update", "Type formal corporate memorandums with financial projections.",
         "MEMORANDUM | To: Executive Team | From: CTO | Date: 2026-11-08 | Subject: Infrastructure Scalability", ["All Keys"], ["executive-memo"]),
        (582, 59, "Legal Non-Disclosure Summary", "Type formal contractual provisions with definitions.",
         "Confidential Information includes all proprietary software code, customer records, and trade secrets.", ["All Keys"], ["nda-summary"]),
        (583, 59, "Customer Service SLA Policy", "Type service level agreement commitments and metrics.",
         "Our team guarantees 99.9% system availability and a maximum response time of < 15 minutes.", ["All Keys"], ["sla-policy"]),
        (584, 59, "Medical Research Trial Summary", "Type medical clinical trial outcome summaries.",
         "The double-blind study enrolled 1,200 participants across 8 medical centers (Phase III trial).", ["All Keys"], ["medical-trial"]),
        (585, 59, "Financial Earnings Release", "Type quarterly public company earnings reports.",
         "Q3 Total Revenue reached $4.2B (+18% YoY), driven by strong cloud adoption and 92% renewal rates.", ["All Keys"], ["earnings-release"]),
        (586, 59, "Academic Grant Proposal", "Type research grant budget and timeline proposals.",
         "Grant Award #NSF-2026-89: Allocated funding of $750,000 for neural motor research over 36 months.", ["All Keys"], ["grant-proposal"]),
        (587, 59, "Technical Patent Abstract", "Type patent application abstracts describing inventions.",
         "A computer-implemented method for real-time keystroke rhythm analysis comprising adaptive feedback.", ["All Keys"], ["patent-abstract"]),
        (588, 59, "Security Incident Advisory", "Type cybersecurity vulnerability notifications (CVE).",
         "Security Advisory CVE-2026-1049: Severity 8.2 (High); patch applied to all production clusters.", ["All Keys"], ["security-advisory"]),
        (589, 59, "Press Release Announcement", "Type public press release distributions.",
         "FOR IMMEDIATE RELEASE: KEYFLOW Technologies announces revolutionary 7,000-level typing curriculum.", ["All Keys"], ["press-release"]),
        (590, 59, "Unit 59 Assessment: Professional Documentation", "Benchmark typing formal enterprise documentation with complete precision.",
         "Project Phoenix achieved 100% test coverage with zero critical vulnerabilities prior to deployment on 2026-11-08.", ["All Keys"], ["unit-assessment"]),

        # Unit 60: Unit 60 Milestone: Comprehensive Keyboard Certification (Levels 591 to 600)
        (591, 60, "Milestone Sprint: Mixed Alpha, Numeric & Symbols", "Sprint across an intensive mix of letters, numbers, and symbols.",
         "The user 'sinan_dev' achieved 25 WPM (accuracy: 98.5%) on Level 600 at https://keyflow.dev!", ["All Keys"], ["milestone-sprint-1"]),
        (592, 60, "Milestone Sprint: Financial & Code Snippet", "Type financial data embedded inside software configuration.",
         "const invoice = { id: 7401, subtotal: $249.00, discount: '15%', total: $211.65, paid: true };", ["All Keys"], ["milestone-sprint-2"]),
        (593, 60, "Milestone Sprint: Dialogue with Technical Specifics", "Type dialogue discussing real technical specifications.",
         "\"Did you review the PR #42?\" asked Maria. \"Yes, all 138 backend tests passed in 65.1s!\"", ["All Keys"], ["milestone-sprint-3"]),
        (594, 60, "Milestone Sprint: Classical Literary Prose", "Type rich classical literature exercising all punctuation and rhythm.",
         "\"All that is gold does not glitter, not all those who wander are lost,\" wrote J. R. R. Tolkien.", ["All Keys"], ["milestone-sprint-4"]),
        (595, 60, "Milestone Sprint: Scientific Constant Formulations", "Type physical formulas with units, exponents, and symbols.",
         "Speed of light c = 2.998 * 10^8 m/s; Planck's constant h = 6.626 * 10^-34 J*s; E = mc^2.", ["All Keys"], ["milestone-sprint-5"]),
        (596, 60, "Milestone Sprint: Multi-Language Database Line", "Type multilingual database migration statements.",
         "ALTER TABLE practice_record ADD COLUMN gross_wpm INTEGER NOT NULL DEFAULT 0; -- version 2.0", ["All Keys"], ["milestone-sprint-6"]),
        (597, 60, "Milestone Sprint: Full Keyboard Pangram with Numbers", "Type the ultimate full keyboard pangram exercising every key.",
         "Pack my box with five dozen liquor jugs! ($120.00 each for 10 boxes @ 2026-11-08).", ["All Keys"], ["milestone-sprint-7"]),
        (598, 60, "Milestone Sprint: Complex Technical URL String", "Type complex API query URLs with tokens and encoded parameters.",
         "GET https://api.keyflow.dev/v2/telemetry?user_id=usr_1024&since=2026-01-01&format=json HTTP/1.1", ["All Keys"], ["milestone-sprint-8"]),
        (599, 60, "Milestone Sprint: The Master Keyboard Oath", "Type the complete typist's commitment to posture and flow.",
         "I promise to keep my wrists elevated, my fingers curved over F and J, and my eyes upon the screen.", ["All Keys"], ["milestone-sprint-9"]),
        (600, 60, "Unit 60 Milestone Assessment: Comprehensive Keyboard Certification", "Milestone 60 verification certifying complete essential keyboard mastery across all 47 keys.",
         "Congratulations! You have completed the essential keyboard curriculum: lowercase, uppercase, numbers, and symbols are now second nature!", ["All Keys"], ["milestone-assessment", "section-capstone"]),
    ]

    for lvl, u_num, title, obj, txt, tgts, sks in section_j_levels:
        lesson = build_lesson(
            stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
            unit_label="Complete Keyboard Integration: Real-World Mastery", lesson_in_unit=((lvl - 1) % 10) + 1,
            title=title, objective=obj, text=txt, target_keys=tgts, home_keys=HOME_KEYS, skills=sks
        )
        lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION K: FOUNDATIONAL ACCURACY & FINGER MASTERY (Levels 601 to 650, Units 61 to 65)
    # Pinky & ring isolation, center reaches, weak key strengthening
    # -------------------------------------------------------------
    section_k_units = [
        (61, "Pinky Finger Dexterity & Reach Stabilization", [
            ("Left Pinky Isolation: A, Q, Z", "Strengthen left pinky across all three rows without wrist twist.",
             "a q z a q z aqua quiz zero apex zoom quote azure antique"),
            ("Right Pinky Isolation: P, Semicolon, Slash", "Strengthen right pinky across all three rows with featherweight touch.",
             "p ; / p ; / pop paper page open hope pure point speed wrap"),
            ("Bilateral Pinky Coordination", "Coordinate simultaneous pinky strikes across both hands.",
             "plaza equip quartz equal topaz plaque opaque sequel pique"),
            ("Pinky Shift Precision Drill", "Condition crisp pinky Shift presses with zero forearm tension.",
             "Quick Amazon Zebras Jump Past Peaceful Rivers Under Moonlight"),
            ("Pinky Punctuation Fluency", "Master outer punctuation keys assigned to right pinky.",
             "plan; proceed; finalize. \"Quality first,\" repeated the team."),
            ("Pinky Reach Snapback Reflex", "Train immediate return to home position after pinky reaches.",
             "zoom quickly past zero; apply quotes properly; keep rhythm steady."),
            ("Pinky Double-Tap Speed Drills", "Execute rapid double taps on pinky keys.",
             "apply happy puppet pizza puzzle buzz fuzzy dizzy apple sapphire"),
            ("Pinky Endurance Challenge", "Sustain balanced pinky keystrokes across diverse sentences.",
             "a quiet zebra quickly approached the peaceful mountain plateau"),
            ("Near-Zero Error Pinky Trial", "Prioritize 98%+ accuracy on dense pinky vocabulary.",
             "the unique quiz required equal parts patience and quiet poise"),
            ("Unit 61 Assessment: Pinky Finger Mastery", "Benchmark outer pinky reach independence and lightweight snapback recovery.",
             "queen zoe praised the quick puzzle solutions presented by Philip"),
        ]),
        (62, "Ring Finger Independence & Coordination", [
            ("Left Ring Isolation: S, W, X", "Condition left ring finger independently of adjacent middle and pinky.",
             "s w x s w x sweet slow extra switch wax swift six mix stay"),
            ("Right Ring Isolation: L, O, Period", "Condition right ring finger independently of adjacent fingers.",
             "l o . l o . look slow cold lion color roll solid hold folio"),
            ("Bilateral Ring Finger Alternation", "Alternate between left and right ring fingers in steady rhythm.",
             "slow low swallow willow willow slow wall low wool willow"),
            ("Ring-to-Index Cross-Hand Strides", "Stride between ring fingers and index fingers across hands.",
             "flow work solid world swift flight wild storm bold silver"),
            ("Ring Finger Trill Conditioning", "Execute alternating two-finger rolls involving ring fingers.",
             "slowly flowing water shows willow shadows over wooden walls"),
            ("Ring Finger Number Reaches (2 and 9)", "Reinforce ring finger reaches upward to numbers 2 and 9.",
             "29 92 229 992 292 929 room 209 level 29 section 92 code 29"),
            ("Ring Finger Doublet Sprints", "Execute clean double taps with ring fingers.",
             "follow yellow hollow swallow pillow wall fall call willow"),
            ("Ring Finger Fatigue Prevention", "Maintain relaxed hand arch while typing ring-dense words.",
             "two wise wolves walked slowly toward the old wooden bridge"),
            ("Ring Finger Velocity Intervals", "Accelerate cadence on familiar ring finger vocabulary.",
             "we will swim while the warm summer wind blows across the lake"),
            ("Unit 62 Assessment: Ring Finger Mastery", "Benchmark ring finger independence, tactile speed, and zero error rate.",
             "william wrote two slow letters while the soft winter snow fell silently outside"),
        ]),
        (63, "Center-Reach Rebound Mechanics (G, H, T, Y, 5, 6)", [
            ("Left Index Center Reaches: G and T", "Reach inward to G and upward-inward to T with immediate F snapback.",
             "fg gf ft tf fight great gather target giant tough gift trust"),
            ("Right Index Center Reaches: H and Y", "Reach inward to H and upward-inward to Y with immediate J snapback.",
             "jh hj jy yj happy youth rhythm honey yield history hurry year"),
            ("Bilateral Center Handoffs: G-H and T-Y", "Alternate between central reaches across both hands.",
             "gh hg ty yt light thought through bright height weight flight"),
            ("Central Number Reaches: 5 and 6", "Master reaches to numbers 5 and 6 while preserving home anchor rest.",
             "f5 j6 56 65 556 665 565 656 level 56 year 1956 count 56"),
            ("Rapid Center Rebound Drills", "Strike central keys featherweight and snap fingers back to F and J.",
             "together rhythm they gather their thoughtful journey tonight"),
            ("Center-Key Dense Velocity Sprint", "Accelerate across sentences rich in G, H, T, and Y reaches.",
             "they thought that high heights might frighten thirty young hikers"),
            ("Lightweight Central Impact Training", "Avoid heavy thumping on center keys; maintain light finger touch.",
             "the bright morning light illuminated the gentle green valleys"),
            ("Central Transition Cadence", "Smooth out pauses between central strikes and outer letters.",
             "healthy thoughts bring lighthearted energy throughout the day"),
            ("Zero-Hesitation Center Test", "Eliminate micro-delays when leaping between G, H, T, and Y.",
             "eighty mighty heroes gathered together through the stormy night"),
            ("Unit 63 Assessment: Center-Reach Mastery", "Benchmark featherweight touch and immediate home snapback on central keys.",
             "they thoughtfully navigated thirty eight high mountain highways through heavy weather"),
        ]),
        (64, "Bilateral Hand Coordination & Alternating Cadence", [
            ("Alternating Keystrokes: Left-Right-Left-Right", "Type words where every letter alternates strictly between hands.",
             "visual problem formal signal toxic panic visitor authentic"),
            ("Left-Hand Monologue Drills", "Type words typed exclusively with the left hand with balanced speed.",
             "state water street secret craft trade defeat reserve create"),
            ("Right-Hand Monologue Drills", "Type words typed exclusively with the right hand with balanced speed.",
             "million opinion monopoly lollipop union million jump pillow"),
            ("Bilateral Alternating Hand Sprints", "Alternate hands in rapid succession across fluent words.",
             "the visual problem became quite apparent to both formal visitors"),
            ("Hand Balance Metronome Test", "Maintain identical keystroke duration between left and right hands.",
             "balanced hands make typing effortless and eliminate muscle strain"),
            ("Cross-Hand Word Bridges", "Bridge smoothly between left-hand clusters and right-hand clusters.",
             "springtime weather brings wonderful flowers across the hillside"),
            ("Rhythm Stabilization under Speed", "Sustain perfectly even timing without rushing or stuttering.",
             "keep an even tempo like a quiet clock ticking through the room"),
            ("Bilateral Coordination Endurance", "Sustain hand balance across continuous two-sentence prose.",
             "every dedicated student discovers that patience transforms difficulty into natural grace"),
            ("Cross-Hand Symphony: Alternating Clauses", "Coordinate alternating left and right hand keystrokes across balanced clauses.",
             "when hands cooperate with quiet precision words flow across the page without delay"),
            ("Unit 64 Assessment: Bilateral Coordination", "Benchmark equal keystroke weight and metronomic alternation across hands.",
             "formal visitors noticed that authentic cooperation solved the difficult visual problem easily"),
        ]),
        (65, "Near-Zero Error Precision Benchmarks", [
            ("Absolute Precision Drill 1", "Type at a deliberate pace focusing 100% on zero mistakes.",
             "accuracy comes first because speed without precision is merely wasted motion"),
            ("Absolute Precision Drill 2", "Maintain perfect form across diverse capitalization and punctuation.",
             "Patience and persistence are the two greatest virtues of any skilled typist."),
            ("Absolute Precision Drill 3", "Type numbers and symbols without glancing down at the keyboard.",
             "The order #4081 totaled $149.50 with a 15% discount for 25 items."),
            ("Absolute Precision Drill 4", "Execute complex sentence structures with uninterrupted focus.",
             "When the mind is calm, the fingers move with instinctive clarity and effortless speed."),
            ("Absolute Precision Drill 5", "Balance speed and accuracy across classical literary quotations.",
             "\"To know oneself is the beginning of all wisdom,\" observed the philosopher."),
            ("Absolute Precision Drill 6", "Type technical programming syntax with 98%+ precision.",
             "function isValid(score) { return score >= 75 && score <= 100; }"),
            ("Absolute Precision Drill 7", "Navigate mixed alphanumeric tokens with zero corrections.",
             "Flight AA-104 arrived at Gate 24 on 2026-11-08 at 09:30 AM sharp."),
            ("Absolute Precision Drill 8", "Sustain flawless touch typing across a full multi-sentence block.",
             "Do not rush the keyboard. Allow your muscle memory to guide each keystroke smoothly and quietly."),
            ("Absolute Precision Drill 9: Zero-Error Trial", "A complete paragraph executed with calm deliberation and zero backspaces.",
             "True keyboard mastery is not about dramatic bursts of raw speed. It is the quiet confidence that every single keystroke will land cleanly and accurately without looking down."),
            ("Unit 65 Assessment: Section K Accuracy Capstone", "Comprehensive benchmark verifying 95%+ foundational accuracy across all keyboard regions.",
             "You have achieved foundational accuracy: your fingers strike every key with relaxed confidence, balanced weight, and exceptional precision!"),
        ]),
    ]
    for u_num, u_label, drills in section_k_units:
        for idx, item in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            if len(item) == 2:
                title, txt = item
                obj = f"Strengthen finger mastery: {title}."
            else:
                title, obj, txt = item
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=obj, text=txt,
                target_keys=["Finger Mastery"], home_keys=HOME_KEYS,
                skills=["finger-dexterity", "accuracy-discipline", "muscle-isolation"]
            )
            lessons.append(lesson)

    # -------------------------------------------------------------
    # SECTION L: BEGINNER SPEED FOUNDATION (Levels 651 to 700, Units 66 to 70)
    # Controlled speed intervals, gentle acceleration (15 to 24 WPM), capstone
    # -------------------------------------------------------------
    section_l_units = [
        (66, "Controlled Speed Acceleration (15 to 18 WPM)", [
            ("Gentle Pacing Interval 1", "Start at your natural comfortable pace without forcing artificial speed."),
            ("Gentle Pacing Interval 2", "Let your breathing remain slow and deep as your fingers find their rhythm."),
            ("Short Sprint: High-Frequency Words", "the and for you that was with they have this from word one have"),
            ("Short Sprint: Common Word Flow", "time year good water river light world earth sound plant build"),
            ("Short Sprint: Simple Declarative Phrasing", "the morning sun rose above the distant mountains in the east"),
            ("Cadence Boost: 16 WPM Benchmark", "steady typing with curved fingers builds strong neural pathways"),
            ("Cadence Boost: Alternating Phrasing", "walk through the open fields and listen to the gentle breeze"),
            ("Cadence Boost: Clean Transitions", "learning to type without looking at your hands is a great life skill"),
            ("Cadence Boost: Balanced Sentences", "read each sentence carefully before you type to anticipate every word"),
            ("Unit 66 Assessment: 16 WPM Speed Benchmark", "Demonstrate comfortable 16 WPM speed with 80%+ accuracy across continuous prose.",
             "regular daily practice helps you type with confidence and natural rhythm every day"),
        ]),
        (67, "Rhythm Metronome Pacing (18 to 20 WPM)", [
            ("Metronome Cadence: Constant Keystroke Tempo", "type each letter with uniform timing like the steady ticking of a clock"),
            ("Metronome Cadence: Eliminating Hesitation", "smooth out any awkward pauses between words and keep moving forward"),
            ("Metronome Cadence: Three-Letter Chains", "one two three four five six seven eight nine ten once upon a time"),
            ("Metronome Cadence: Continuous Word Flow", "great rivers begin as tiny mountain springs and journey to the sea"),
            ("Rhythm Acceleration: 18 WPM Sprint", "a relaxed posture and curved fingers allow your hands to move faster"),
            ("Rhythm Acceleration: Sentence Sprint", "every dedicated student discovers that patience leads directly to success"),
            ("Rhythm Acceleration: Mixed-Case Rhythm", "Early Morning Practice Clears The Mind And Prepares You For Great Work"),
            ("Rhythm Acceleration: Punctuation Flow", "steady hands, quiet focus, and regular practice: these three habits build mastery."),
            ("Rhythm Acceleration: Number Pacing", "The project team completed 25 tasks in 10 days with 95% overall quality."),
            ("Unit 67 Assessment: 18 WPM Speed Benchmark", "Demonstrate fluid 18 WPM cadence with 82%+ accuracy across structured sentences.",
             "when you trust your muscle memory your fingers fly across the keys with effortless grace"),
        ]),
        (68, "Sprint Intervals & Burst Timing (20 to 22 WPM)", [
            ("Speed Burst Interval 1", "speed is the natural fruit of relaxed accuracy and consistent technique"),
            ("Speed Burst Interval 2", "eliminate tension in your shoulders and wrists to unlock greater velocity"),
            ("Sprint Passage: The Mountain Stream", "crystal clear water rushed over smooth river pebbles toward the green valley below"),
            ("Sprint Passage: The Forest Path", "tall pine trees stood like silent sentinels along the peaceful woodland trail"),
            ("Sprint Passage: The Starlit Night", "thousands of brilliant stars glittered in the deep velvet sky above the quiet camp"),
            ("Sprint Passage: The Artisan Workshop", "the skilled woodworker carved delicate wooden bowls with quiet and steady hands"),
            ("Sprint Passage: Technology & Learning", "modern computers empower creative minds to build wonderful tools for humanity"),
            ("Sprint Passage: The Joy of Reading", "reading great books opens golden doorways into distant lands and timeless ideas"),
            ("Sprint Passage: The Typist in Flow", "when your fingers move in harmony with your thoughts typing becomes pure music"),
            ("Unit 68 Assessment: 20 WPM Speed Benchmark", "Demonstrate confident 20 WPM burst velocity with 84%+ accuracy across narrative text.",
             "practice with joyful dedication and watch your typing speed climb naturally week after week"),
        ]),
        (69, "Sustained Consistency & Stamina (22 to 24 WPM)", [
            ("Sustained Stamina: Paragraph Flow 1", "Touch typing is an investment in your future that pays dividends every single day. Whether writing emails, composing code, or drafting essays, typing effortlessly frees your mind to focus entirely on the quality of your ideas."),
            ("Sustained Stamina: Paragraph Flow 2", "In the early stages of learning, progress may feel gradual, but each lesson permanently strengthens the neural pathways in your brain. Trust the process, celebrate small wins, and maintain your gentle daily commitment."),
            ("Sustained Stamina: Paragraph Flow 3", "Ergonomics plays an essential role in lifelong typing health. Keep your back straight, your feet flat on the floor, and your wrists floating lightly above the desk surface without resting heavily upon sharp edges."),
            ("Sustained Stamina: Paragraph Flow 4", "The keyboard is no longer a collection of strange plastic buttons. It has become an extension of your own hands, with every character ready to respond instantly to the gentlest touch of your curved fingertips."),
            ("Sustained Stamina: Paragraph Flow 5", "Notice how little effort is required when your fingers remain close to their home row anchors. The bumps on F and J provide an ever-present tactile compass that keeps your hands centered without needing to look."),
            ("Sustained Stamina: Paragraph Flow 6", "Speed without accuracy is like driving fast in the wrong direction. By prioritizing clean precision throughout Stage 1, you have built the unshakeable foundation that will carry you to 60, 80, and even 100 WPM in future stages."),
            ("Sustained Stamina: Paragraph Flow 7", "Every great writer, programmer, and scholar began as a beginner typing their first humble keystrokes. Through patience and focused repetition, what once felt awkward has now become second nature."),
            ("Sustained Stamina: Paragraph Flow 8", "As you complete the final levels of this foundational stage, take pride in your remarkable journey. You have learned all twenty six letters, numbers, symbols, and functional keys through authentic practice."),
            ("Sustained Stamina: Paragraph Flow 9", "Your fingers now possess true keyboard literacy. You are ready to enter Stage 2, where we leave basic introductions behind and dedicate ourselves entirely to building world-class speed, fluency, and endurance."),
            ("Unit 69 Assessment: 22 WPM Speed Benchmark", "Demonstrate sustained 22 WPM velocity with 85%+ accuracy across long-form prose.",
             "congratulations on sustaining high accuracy and balanced speed through demanding multi-sentence typing passages"),
        ]),
        (70, "Unit 70 Milestone / Stage 1 Grand Capstone (Level 700)", [
            ("Stage 1 Grand Review: Lowercase & Uppercase", "The quick brown fox jumps over the lazy dog while five quiet men watch."),
            ("Stage 1 Grand Review: Numbers & Alphanumeric", "Flight 1024 departed Terminal 3 on 2026-11-08 with 250 passengers on board."),
            ("Stage 1 Grand Review: Symbols & Prices", "Invoice #4082: Subtotal $149.99 - 10% coupon = $134.99 + 8.5% tax ($11.47) = $146.46."),
            ("Stage 1 Grand Review: Code & Technical Formatting", "const calculateScore = (wpm, acc) => (wpm >= 20 && acc >= 85) ? 'PASS' : 'RETRY';"),
            ("Stage 1 Grand Review: Internet URLs & Email", "Visit https://keyflow.dev or email support@keyflow.dev for your official certification!"),
            ("Stage 1 Grand Review: Punctuation & Quotes", "\"Success isn't always about greatness,\" noted the coach, \"it's about consistency.\""),
            ("Stage 1 Grand Review: Full Keyboard Integration", "Order #99: 2 laptops @ $899.00 each = $1,798.00; tracking: https://track.co/99 (OK!)."),
            ("Stage 1 Grand Review: Stamina Benchmark", "Touch typing transformed my daily work: my fingers flow across all forty seven keys without hesitation."),
            ("Stage 1 Grand Review: The Typist's Creed", "I type with curved fingers, level wrists, and eyes fixed upon the horizon of my thoughts."),
            ("Unit 70 Milestone Assessment: Stage 1 Grand Capstone (Level 700)", "The ultimate Stage 1 graduation assessment certifying complete keyboard education across all 700 levels.",
             "Congratulations! You have completed all 700 levels of Stage 1 at KEYFLOW Academy! You have mastered the entire essential keyboard with authentic technique, relaxed posture, and genuine skill. Welcome to the path of typing mastery!"),
        ]),
    ]
    for u_num, u_label, drills in section_l_units:
        for idx, item in enumerate(drills):
            lvl = (u_num - 1) * 10 + (idx + 1)
            if len(item) == 2:
                title, txt = item
                obj = f"Develop beginner speed foundation: {title}."
            else:
                title, obj, txt = item
            lesson = build_lesson(
                stage_id=STAGE_ID, stage_title=STAGE_TITLE, level_num=lvl, unit_num=u_num,
                unit_label=u_label, lesson_in_unit=idx + 1,
                title=title, objective=obj, text=txt,
                target_keys=["Speed Foundation"], home_keys=HOME_KEYS,
                skills=["speed-intervals", "pace-control", "capstone"]
            )
            lessons.append(lesson)

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 1, got {len(lessons)}"
    return lessons
