"""
Stage 1 Generator: Home Row Foundations (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: A, S, D, F, G, H, J, K, L, ; and Spacebar
All 700 lessons strictly use home row characters: [asdfghjkl; ]
Zero untaught keys in beginner units.
Target WPM: 15 to 24 | Target Accuracy: 75% to 85%
"""
from .curriculum_builder import build_lesson

STAGE_ID = 1
STAGE_TITLE = "Home Row Foundations"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "Space"]

# Units 1 through 10 explicit foundational drills (10 levels each = 100 levels)
FOUNDATION_DRILLS = [
    # Unit 1: Tactile Anchors F, J & Spacebar (Levels 1-10)
    (1, "Tactile Anchors: Keys F & J Initial Homing", "Locate the raised bumps on F and J with index fingers.", "f j f j ff jj fj jf f j ff jj", ["F", "J"], ["tactile-bumps", "index-rest"]),
    (2, "Index Burst Timing: F & J Cadence", "Condition index finger independence with controlled double strokes.", "ff jj fj jf ff jj fj jf f j fj jf", ["F", "J"], ["index-bursts", "rhythm"]),
    (3, "Spacebar Integration with Dominant Thumb", "Coordinate thumb spacebar strikes without moving index fingers off anchors.", "f j f j ff jj f j fj jf ff jj f j", ["F", "J", "Space"], ["spacebar-thumb", "anchor-hold"]),
    (4, "Index Cadence Alternation", "Establish a smooth left-right metronome cadence across index fingers.", "fjf jfj ff jj fjf jfj f j fj jf", ["F", "J"], ["cadence", "alternation"]),
    (5, "Index Precision Rhythm", "Maintain steady timing on alternating index keystrokes.", "f j f j ff jj fff jjj jf fj ff jj", ["F", "J"], ["precision-rhythm"]),
    (6, "Alternating Index Triplets", "Execute relaxed three-stroke index bursts.", "fff jjj fff jjj fj fj jf jf ff jj", ["F", "J"], ["triplets", "finger-cadence"]),
    (7, "Thumb Spacebar Handoffs", "Combine spacebar cadence with alternating index strokes.", "f j f j ff jj f j f j ff jj fj jf", ["F", "J", "Space"], ["spacebar-handoff"]),
    (8, "Index Velocity Control", "Maintain uniform keystroke weight between left and right index.", "fj jf ff jj fjf jfj ff jj f j fj", ["F", "J"], ["velocity-control"]),
    (9, "Anchor Recovery Check", "Confirm index fingers remain anchored lightly on F and J.", "f j ff jj fff jjj fj jf ff jj f j", ["F", "J"], ["anchor-recovery"]),
    (10, "Unit 1 Assessment: F and J Anchor Benchmark", "Demonstrate relaxed index anchor mastery.", "f j f j ff jj fj jf ff jj fff jjj fj jf", ["F", "J"], ["unit-assessment"]),

    # Unit 2: Middle Fingers D & K (Levels 11-20)
    (11, "Middle Fingers: Keys D & K Muscle Conditioning", "Position middle fingers on D and K while resting index on F and J.", "d k dk kd dd kk fd jk df kj dd kk", ["D", "K"], ["middle-finger", "d-k-reach"]),
    (12, "Coordination: Index and Middle Finger Handoffs", "Transition smoothly between middle and index finger strikes.", "df jk fd kj ddkk ffjj dffj kddf dk fj", ["D", "K", "F", "J"], ["middle-index-handoff"]),
    (13, "Four-Finger Symmetry: D, F, J, K Rhythms", "Build fluid four-finger motor memory across central home row.", "dfj kdf fkd jdf ddf kjk fdd jkk df jk", ["D", "F", "J", "K"], ["four-finger-symmetry"]),
    (14, "Alternating Inward Steps: K-D-J-F Cadence", "Alternate strikes between left and right hand middle and index fingers.", "fjd kdf jfd kfd dfj kfd djk fkj df jk", ["D", "F", "J", "K"], ["inward-steps", "rhythm"]),
    (15, "Middle Finger Double Strikes", "Execute crisp double strikes with middle fingers.", "dd kk ddkk dfjk kjfd dd kk dk kd", ["D", "K"], ["middle-doubles"]),
    (16, "Four-Key Cascade Drills", "Cascade across D, F, J, K without lifting palms.", "dfjk kjfd dfjk kjfd dk fj fd jk", ["D", "F", "J", "K"], ["four-key-cascade"]),
    (17, "Cross-Hand Middle Finger Sync", "Synchronize bilateral middle finger movements.", "dk kd ddfk kkjd df jk dk kd df jk", ["D", "K", "F", "J"], ["cross-hand-sync"]),
    (18, "Inward Rolling Motion", "Roll fingers smoothly from D to F and K to J.", "df kj fd jk df kj dffj kddf df kj", ["D", "F", "J", "K"], ["inward-rolling"]),
    (19, "Middle Finger Precision Sprint", "Sustain balanced speed across middle and index fingers.", "dfjk kjfd dfjk kjfd dd kk ff jj dk kd", ["D", "F", "J", "K"], ["precision-sprint"]),
    (20, "Unit 2 Assessment: Four-Finger Central Cluster", "Verify four-finger central home row coordination.", "df jk fd kj dfjk kjfd ddkk ffjj dk kd", ["D", "F", "J", "K"], ["unit-assessment"]),

    # Unit 3: Ring Fingers S & L (Levels 21-30)
    (21, "Ring Fingers: Keys S & L Muscle Isolation", "Rest left ring finger on S and right ring finger on L.", "s l sl ls ss ll sd lk ds kl sf jl", ["S", "L"], ["ring-finger", "s-l-isolation"]),
    (22, "Three-Finger Rolls: S-D-F and J-K-L", "Roll smoothly from ring to index across both hands.", "sdf jkl fds lkj sld ksf dfl sks lsl", ["S", "D", "F", "J", "K", "L"], ["three-finger-roll"]),
    (23, "Six-Finger Coordination", "Sustain equal keystroke velocity across six active fingers.", "sfd lkj sdf jkl fsd ljk sld kfs s l", ["S", "D", "F", "J", "K", "L"], ["six-finger-coordination"]),
    (24, "Cross-Hand Ring to Middle Transitions", "Master cross-hand steps skipping between adjacent fingers.", "sdfl jksd flds kjfs sldf kjls sd lk", ["S", "D", "F", "J", "K", "L"], ["cross-hand-strides"]),
    (25, "Ring Finger Independence", "Prevent sympathetic pinky movement when typing S and L.", "ss ll sl ls ssd lkk dsf jkl ss ll sl", ["S", "L"], ["ring-independence"]),
    (26, "Outward Three-Finger Rolls", "Roll fingers outward from index to ring.", "fds lkj fds lkj sdf jkl sdf jkl sd lk", ["S", "D", "F", "J", "K", "L"], ["outward-rolls"]),
    (27, "Bilateral Ring Finger Symmetry", "Alternate between left ring and right ring.", "sl ls ss ll sdf jkl fds lkj sl ls", ["S", "L"], ["bilateral-symmetry"]),
    (28, "Six-Finger Wave Cascades", "Cascade fluidly across all six resting fingers.", "sdf jkl fds lkj sldf kjls sdf jkl", ["S", "D", "F", "J", "K", "L"], ["wave-cascades"]),
    (29, "Ring Finger Speed Intervals", "Elevate ring finger response speed.", "sd lk sf jl sl ls sdf jkl ss ll sd lk", ["S", "D", "F", "J", "K", "L"], ["speed-intervals"]),
    (30, "Unit 3 Assessment: Six-Finger Balance", "Benchmark coordination across S, D, F, J, K, L.", "sdf jkl fds lkj sdfl kjfs ss ll dd kk ff jj", ["S", "D", "F", "J", "K", "L"], ["unit-assessment"]),

    # Unit 4: Pinky Fingers A & Semicolon (Levels 31-40)
    (31, "Pinky Anchors: Keys A & Semicolon Precision", "Align left pinky on A and right pinky on semicolon.", "a ; a; ;a aa ;; as l; sa ;l da k;", ["A", ";"], ["pinky-anchors", "outer-rest"]),
    (32, "Eight-Finger Roll: Full Row Symmetry", "Flow seamlessly across all eight primary home row keys.", "asdf jkl; asdf jkl; fdsa ;lkj asdf jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["eight-finger-roll"]),
    (33, "Right Pinky Semicolon Discipline", "Touch-type semicolon cleanly with right pinky.", "a; s; d; f; j; k; l; ;; asdf; jkl;", [";", "A", "L"], ["semicolon-discipline"]),
    (34, "Inward & Outward Eight-Key Cascades", "Execute rapid cascades from outer pinkies inward.", "asdf ;lkj fdsa jkl; afsd ;jlk asdf ;lkj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["cascades"]),
    (35, "Pinky Isolation Drill", "Strengthen pinky strikes without wrist twist.", "aa ;; a; ;a as l; sa ;l aa ;; asdf", ["A", ";"], ["pinky-isolation"]),
    (36, "Eight-Finger Wave Motion", "Flow from left pinky through to right pinky.", "asdf jkl; fdsa ;lkj asdf jkl; asdf ;lkj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["wave-motion"]),
    (37, "Alternating Bilateral Finger Pairs", "Pair opposite-hand fingers from pinkies inward.", "aj sk dl f; fa sd jk l; af sd jk l;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["bilateral-pairs"]),
    (38, "Eight-Key Doublet Precision Sprints", "Execute crisp double-taps on every home row key.", "aa ss dd ff jj kk ll ;; asdf jkl; ff jj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["doublets"]),
    (39, "Semicolon Cadence in Strings", "Integrate semicolon into rhythmic typing bursts.", "asdf; jkl; fdsa; ;lkj; asdf; jkl; aa ;; ff jj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["semicolon-cadence"]),
    (40, "Unit 4 Assessment: Complete Eight-Key Foundation", "Demonstrate mastery of initial eight home row keys.", "asdf jkl; fdsa ;lkj asdf; jkl; asdf jkl; fdsa ;lkj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["unit-assessment"]),

    # Unit 5: Milestone Anchor Mastery (Levels 41-50)
    (41, "Anchor Row Fluidity Check", "Verify effortless eight-finger keystroke cadence.", "asdf ;lkj asdf ;lkj fdsa jkl; fdsa jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["anchor-fluidity"]),
    (42, "Speed Intervals: Four-Finger Left and Right", "Alternate rapid four-finger left and right bursts.", "asdf asdf jkl; jkl; asdf jkl; fdsa ;lkj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["speed-intervals"]),
    (43, "Even-Weight Keystroke Distribution", "Ensure pinky strikes carry equal weight to index strikes.", "aa ss dd ff jj kk ll ;; asdf jkl; fdsa ;lkj", ["A", "S", "D", "F", "J", "K", "L", ";"], ["even-weight"]),
    (44, "Bilateral Rhythm Metronome", "Type to a steady cadence across all eight fingers.", "asdf jkl; asdf jkl; asdf ;lkj fdsa jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["bilateral-rhythm"]),
    (45, "Pinky to Index Wave Sprints", "Sprint from pinkies to index and back.", "asdf jkl; fdsa ;lkj afsd jlk; asdf jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["wave-sprints"]),
    (46, "Spacebar Cadence Synchronization", "Insert spacebar cleanly after four-letter patterns.", "asdf jkl; fdsa ;lkj asdf jkl; asdf jkl; fdsa", ["A", "S", "D", "F", "J", "K", "L", ";", "Space"], ["spacebar-cadence"]),
    (47, "Semicolon Spacing Accuracy", "Coordinate semicolon followed by spacebar.", "a; s; d; f; j; k; l; ;; asdf; jkl; a; l; s; k;", [";", "A", "L", "Space"], ["semicolon-spacing"]),
    (48, "Cross-Row Anchor Endurance", "Sustain eight-finger coordination over continuous drills.", "asdf jkl; fdsa ;lkj asdf jkl; fdsa ;lkj asdf", ["A", "S", "D", "F", "J", "K", "L", ";"], ["anchor-endurance"]),
    (49, "Near-Zero Error Anchor Trial", "Prioritize zero errors over raw speed on eight keys.", "asdf jkl; fdsa ;lkj asdf; jkl; asdf jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["zero-error-trial"]),
    (50, "Unit 5 Milestone Assessment: Anchor Mastery Capstone", "Comprehensive milestone verification of eight home row anchors.", "asdf jkl; fdsa ;lkj asdf; jkl; asdf jkl; fdsa ;lkj asdf; jkl;", ["A", "S", "D", "F", "J", "K", "L", ";"], ["milestone-assessment"]),

    # Unit 6: Lateral Reaches G & H (Levels 51-60)
    (51, "Center Lateral Reaches: Keys G & H", "Reach inward with left index to G and right index to H, snapping back to F and J.", "g h gh hg gg hh fg jh gf hj fgh jhg fg jh", ["G", "H"], ["lateral-reach", "g-h-stretch"]),
    (52, "Ten-Key Full Home Row Handoffs", "Incorporate G and H into fluid passes across all ten home row keys.", "asdfg hjkl; asdfg hjkl; gfdsa hjkl; fgh jhg", ["G", "H", "F", "J"], ["ten-key-handoff"]),
    (53, "Central Index Rebound Reflex", "Train index fingers to strike G and H featherweight and rebound to rest.", "fgh jhg asdfg hjkl; gfdsa ;lkjh fghj fghj", ["G", "H", "F", "J"], ["rebound-reflex"]),
    (54, "Full Home Row Symmetry Benchmark", "Confirm balanced accuracy across all 10 home row letter keys.", "asdfg hjkl; gfdsa ;lkjh asdfg ;lkjh fghj", ["All Home Row Keys"], ["full-row-symmetry"]),
    (55, "G-Key Stretch and Snapback", "Practice left index stretch to G without wrist movement.", "fg gf fggf fg gf asdfg asdfg gfdsa", ["G", "F"], ["g-stretch"]),
    (56, "H-Key Stretch and Snapback", "Practice right index stretch to H without wrist movement.", "jh hj jhhj jh hj hjkl; hjkl; ;lkjh", ["H", "J"], ["h-stretch"]),
    (57, "Bilateral G and H Inward Strides", "Alternate between G and H across hands.", "gh hg gghh ghfg hjfg asdfg hjkl; gh hg", ["G", "H"], ["bilateral-inward"]),
    (58, "Ten-Key Inward Cascades", "Cascade from pinkies through G and H.", "asdfg ;lkjh gfdsa hjkl; asdfg hjkl;", ["All Home Row Keys"], ["ten-key-cascades"]),
    (59, "Center Reaches under Speed Pressure", "Accelerate G and H reaches while preserving bump recovery.", "fghj jhg fgh jhg asdfg hjkl; fgh jhg", ["G", "H", "F", "J"], ["speed-pressure"]),
    (60, "Unit 6 Assessment: Ten-Key Home Row Benchmark", "Benchmark full 10-key home row finger reach accuracy.", "asdfg hjkl; gfdsa ;lkjh fgh jhg asdfg hjkl;", ["All Home Row Keys"], ["unit-assessment"]),

    # Unit 7: First English Words (Levels 61-70)
    (61, "First English Words: A, As, Ask, All", "Type genuine English words constructed entirely from unlocked home row keys.", "a as ask all a as ask all a as ask all ask", ["A", "S", "K", "L"], ["first-words", "real-words"]),
    (62, "First English Words: Dad, Had, Has, Lad", "Strengthen left-to-right hand transitions across common short words.", "dad had has lad dad had has lad dad had lad", ["D", "A", "H", "S", "L"], ["word-building"]),
    (63, "First English Words: Sad, Fad, Fall, Hall", "Reinforce double-L endings and bilateral consonant-vowel flows.", "sad fad fall hall sad fad fall hall fall hall", ["S", "F", "A", "L", "H"], ["double-l", "word-flow"]),
    (64, "First English Words: Glad, Glass, Flag, Flask", "Type consonant blends (gl-, fl-) using home row index and ring fingers.", "glad glass flag flask glad glass flag flask", ["G", "L", "A", "D", "F", "S", "K"], ["consonant-blends"]),
    (65, "Word Practice: Half, Flash, Salad, Sash", "Type multiletter home row vocabulary words.", "half flash salad sash half flash salad sash", ["H", "A", "L", "F", "S", "D"], ["multiletter-words"]),
    (66, "Word Drill: Gala, Shall, Lads, Falls", "Reinforce words with repeating vowels and double consonants.", "gala shall lads falls gala shall lads falls", ["G", "A", "L", "S", "H", "F"], ["double-consonants"]),
    (67, "Alternating Hand Vocabulary", "Type words that naturally alternate between left and right hands.", "ask dad had a salad; all lads had a flag", ["All Home Row Keys"], ["alternating-vocabulary"]),
    (68, "Speed Burst on Familiar Words", "Accelerate typing on familiar three- and four-letter home words.", "dad has a flag; a glad lad has a glass flask", ["All Home Row Keys"], ["speed-burst"]),
    (69, "Zero-Error Word Consistency", "Maintain 95%+ accuracy on diverse home row vocabulary.", "all lads shall ask dad; a sad lad had a fall", ["All Home Row Keys"], ["word-consistency"]),
    (70, "Unit 7 Assessment: Home Row Vocabulary Benchmark", "Demonstrate fluency on all core home row English words.", "a glad lad had a flag; dad has half a salad; all lads ask dad", ["All Home Row Keys"], ["unit-assessment"]),

    # Unit 8: First Short Phrases (Levels 71-80)
    (71, "First Phrases: A Sad Lad and Dad Had a Flag", "Combine home row words into rhythmic, meaningful multi-word phrases.", "a sad lad; dad had a flag; a sad lad had a flag", ["A", "S", "D", "L", "F", "G", "H", ";"], ["first-phrases"]),
    (72, "First Phrases: A Glad Lad Had a Glass", "Maintain relaxed wrist posture while typing fluid everyday home row expressions.", "a glad lad had a glass; a glad lad has a glass", ["G", "L", "A", "D", "H", "S", ";"], ["fluid-expressions"]),
    (73, "First Phrases: All Lads Shall Ask Dad", "Master double-L rhythm in 'all' and 'shall' across alternating hand handoffs.", "all lads shall ask dad; all lads shall ask dad", ["A", "L", "D", "S", "H", "K", ";"], ["double-letter-cadence"]),
    (74, "First Phrases: Dad Has Half a Salad", "Practice rapid transitions between half and salad.", "dad has half a salad; a lad had a salad", ["D", "A", "H", "S", "L", "F", ";"], ["word-transitions"]),
    (75, "First Phrases: A Flag Falls as a Gala Hall Falls", "Blend falls with gala and hall with balanced strikes.", "a flag falls as a gala falls; a glass flask falls", ["F", "L", "A", "G", "S", "H", ";"], ["phrase-symmetry"]),
    (76, "First Phrases: A Glad Dad Had a Flask", "Type complete grammatical clauses using purely home row vocabulary.", "a glad dad had a flask; a glad dad has a flask", ["G", "L", "A", "D", "H", "F", "S", "K", ";"], ["grammatical-clauses"]),
    (77, "First Phrases: A Sad Dad Had a Dash", "Coordinate dash and sash strokes with uniform finger impact.", "a sad dad had a dash; a shah had a sash", ["S", "A", "D", "H", ";"], ["uniform-impact"]),
    (78, "Phrases: Dad Asks All Lads as All Lads Add a Salad", "Sustain continuous finger movement without pausing between words.", "all lads shall ask dad as dad has a salad; a lad has a salad", ["A", "L", "D", "S", "H", "K", "F", ";"], ["continuous-movement"]),
    (79, "Phrases: Dad Asks a Glad Lad", "Simulate dialogue exchanges using semicolon punctuation markers.", "dad asks a glad lad; a glad lad had a glass flask", ["D", "A", "S", "K", "G", "L", "H", "F", ";"], ["dialogue"]),
    (80, "Unit 8 Assessment: Home Row Phrasing Benchmark", "Benchmark fluency across connected multi-word phrases.", "a glad lad had a flag; dad has half a salad; all lads shall ask a glad dad", ["All Home Row Keys"], ["unit-assessment"]),

    # Unit 9: Natural Home Row Sentences (Levels 81-90)
    (81, "Sentences: All Lads Had a Glass Flask", "Type complete home row sentences with natural space cadence.", "all lads had a glass flask; dad had a salad; a sad lad had a fall", ["All Home Row Keys"], ["natural-sentences"]),
    (82, "Sentences: Dad Has a Glass Flask as All Lads Dash", "Maintain steady typing flow across compound sentence structures.", "dad has a glass flask as all lads dash; a glad lad has a glass", ["All Home Row Keys"], ["compound-sentences"]),
    (83, "Sentences: A Gala Shall Add Half a Salad", "Type complex home row clauses without breaking rhythm.", "a gala shall add half a salad as all lads ask; dad had a gala hall", ["All Home Row Keys"], ["complex-clauses"]),
    (84, "Sentences: All Lads Had a Sash as a Glad Dad Had a Flask", "Practice longer sentence constructions.", "all lads had a sash as a glad dad had a flask; a lad had a dash", ["All Home Row Keys"], ["longer-sentences"]),
    (85, "Sentences: A Glad Lass Had a Flag as All Lads Had Salads", "Balance left-hand and right-hand strikes.", "a glad lass had a flag as all lads had salads; dad shall ask a glad lad", ["All Home Row Keys"], ["balanced-strikes"]),
    (86, "Sentences: Shall Dad Ask a Glad Lad as a Glass Flask Falls", "Coordinate question-style word structures.", "shall dad ask a glad lad as a glass flask falls; all lads had a flag", ["All Home Row Keys"], ["question-flow"]),
    (87, "Sentences: A Shah Asks All Lads as All Lads Dash", "Type rhythmic multi-clause sentences.", "a shah asks all lads as all lads dash; a sad lad had a glass flask", ["All Home Row Keys"], ["rhythmic-clauses"]),
    (88, "Sentences: All Lads Shall Dash as a Flag Falls", "Execute rapid sentence typing with zero hesitation.", "all lads shall dash as a flag falls; dad had a glad lad ask", ["All Home Row Keys"], ["rapid-sentence"]),
    (89, "Sentences: A Flash Has a Flag Fall as a Gala Falls", "Reinforce double-consonant and vowel transitions in prose.", "a flash has a flag fall as a gala falls; all lads had salads", ["All Home Row Keys"], ["prose-transitions"]),
    (90, "Unit 9 Assessment: Sentence Fluency Benchmark", "Demonstrate fluid typing across full grammatical home row sentences.", "a glad lad had a flag; dad had a salad; all lads shall ask dad as a glass flask falls", ["All Home Row Keys"], ["unit-assessment"]),

    # Unit 10: Milestone Assessment (Levels 91-100)
    (91, "Cadence Sprint: Home Row Velocity Burst", "Sprint at 20+ WPM across familiar home row vocabulary.", "a glad lad had a flag; all lads had salads; dad has a flask", ["All Home Row Keys"], ["velocity-burst"]),
    (92, "Accuracy Trial: Flawless Keystroke Discipline", "Achieve 98%+ accuracy across compound sentences.", "all lads shall ask a glad dad; a sad lad had half a salad", ["All Home Row Keys"], ["accuracy-trial"]),
    (93, "Endurance Passage: Sustained Flow Alpha", "Type connected home row sentences without pause.", "dad has a glass flask; all lads shall ask dad as a flag falls", ["All Home Row Keys"], ["endurance-passage"]),
    (94, "Alternating Hand Velocity", "Maximize speed on alternating left-right words.", "a glad lad had a gala; dad had half a salad as all lads ask", ["All Home Row Keys"], ["alternating-velocity"]),
    (95, "Semicolon Rhythm Integration", "Type complex prose with natural semicolon cadence.", "a glad lad had a flag; dad had a salad; all lads had a glass flask", ["All Home Row Keys"], ["semicolon-rhythm"]),
    (96, "Weak-Finger Pinky and Ring Test", "Test accuracy on A, S, L, and semicolon under pressure.", "asdf ;lkj a; s; d; f; a sad lad had a sash as a flag falls", ["All Home Row Keys"], ["weak-finger-test"]),
    (97, "Home Row Speed Sprint Beta", "Target 22+ WPM on mixed home row vocabulary.", "dad shall ask all lads as all lads add a salad; a glad lad has a glass", ["All Home Row Keys"], ["speed-sprint"]),
    (98, "High-Accuracy Multi-Clause Prose", "Maintain high precision on extended compound clauses.", "all lads had a sash as a glad dad had a flask; a shah had a gala hall", ["All Home Row Keys"], ["multi-clause-prose"]),
    (99, "Pre-Capstone Benchmark Drill", "Final readiness check before Unit 10 milestone.", "all lads had a sash as a glad dad had a flask; a lad had a salad", ["All Home Row Keys"], ["pre-capstone"]),
    (100, "Unit 10 Milestone Assessment: 100-Level Foundation Capstone", "Complete the comprehensive 100-level home row foundation milestone.", "a glad lad had a flag; dad had a salad; all lads had a glass flask; dad has a sash; a sad lad had a fall", ["All Home Row Keys"], ["milestone-capstone"]),
]

# Verified authentic home row clauses for Units 11 to 70
HOME_ROW_CLAUSES = [
    "a glad lad had a flag",
    "dad had a salad",
    "all lads had a glass flask",
    "dad has a sash",
    "a sad lad had a fall",
    "dad had half a salad",
    "dad shall ask all lads",
    "a glad lad had a gala",
    "all lads ask dad as a glad dad asks",
    "a glass flask falls",
    "a glad dad had a flask",
    "a sad dad had a dash",
    "a shah had a sash",
    "a glad lad has a glass",
    "all lads shall ask dad",
    "dad has half a salad",
    "a flag falls as a gala falls",
    "all lads had salads",
    "a glad lad has a flask",
    "a sad lad had a sash",
    "dad had a gala hall",
    "all glass flasks had a flash",
    "a lad had a dash",
    "dad shall ask a glad lad",
    "all lads had a flag",
    "a glad dad has a glass flask",
    "a sad lad asks dad as a flag falls",
    "all lads shall fall as a flag falls",
    "dad has a glass flask as all lads dash",
    "a gala shall add half a salad as all lads ask",
    "ask a glad dad as all lads shall fall",
    "all lads had a sash as a glad dad had a flask",
    "dad asks all lads as all lads add a salad",
    "a glad lass had a flag as all lads had salads",
    "shall dad ask a glad lad as a glass flask falls",
    "a shah asks all lads as all lads dash",
    "a sad lad had a glass flask as a flag falls",
    "all lads shall dash as a flag falls",
    "dad had a glad lad ask as a glass flask falls",
    "a flash has a flag fall as a gala falls"
]

UNIT_THEMES_11_TO_70 = [
    (11, "Left-Hand Home Row Concentration", ["A", "S", "D", "F", "G"], ["left-hand-drill"]),
    (12, "Right-Hand Home Row Concentration", ["J", "K", "L", ";"], ["right-hand-drill"]),
    (13, "Alternating Bilateral Digrams", ["A", "S", "J", "K"], ["bilateral-rhythm"]),
    (14, "Home Row Consonant Clusters", ["S", "H", "F", "L"], ["consonant-clusters"]),
    (15, "Double-Letter Motor Memory", ["L", "S", "D", "F"], ["double-letters"]),
    (16, "Semicolon Syntax & Punctuation Rhythm", [";", "L", "A"], ["pinky-articulation"]),
    (17, "Finger Independence & Tactile Precision", ["F", "J", "D", "K"], ["metronome-tempo"]),
    (18, "Metronome Cadence & Steady Pacing", ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["phrase-construction"]),
    (19, "Dual-Hand Alternation Drills", ["D", "K", "S", "L"], ["dual-hand-balance"]),
    (20, "Milestone Assessment: Home Row Flow", ["All Home Row Keys"], ["milestone-benchmark"]),
    (21, "High-Frequency Home Row Collocations", ["A", "L", "D", "S"], ["collocations"]),
    (22, "Extended Bilateral Cadence", ["F", "G", "H", "J"], ["extended-cadence"]),
    (23, "Left-Hand Dominant Balance", ["A", "S", "D", "F", "G"], ["left-hand-stamina"]),
    (24, "Right-Hand Dominant Balance", ["H", "J", "K", "L", ";"], ["right-hand-stamina"]),
    (25, "Continuous Multi-Word Flow", ["A", "S", "D", "F", "J", "K", "L"], ["continuous-flow"]),
    (26, "Home Row Speed Intervals", ["D", "F", "J", "K"], ["speed-intervals"]),
    (27, "Semicolon Complex Phrasing", [";", "A", "L"], ["complex-phrasing"]),
    (28, "Home Row Stamina Sprint Alpha", ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["stamina-sprint"]),
    (29, "Precision Cadence Control", ["All Home Row Keys"], ["precision-control"]),
    (30, "Milestone Assessment: 300-Level Balance", ["All Home Row Keys"], ["milestone-benchmark"]),
    (31, "Complex Pattern Recovery", ["A", "G", "H", ";"], ["pattern-recovery"]),
    (32, "Rapid Alternation Cycles", ["F", "J", "S", "L"], ["rapid-cycles"]),
    (33, "Extended Home Row Prose", ["All Home Row Keys"], ["extended-prose"]),
    (34, "Weak-Finger Pinky Reinforcement", ["A", ";"], ["pinky-reinforcement"]),
    (35, "Rapid-Fire Word Sequences", ["A", "S", "D", "F", "J", "K", "L"], ["rapid-fire"]),
    (36, "Advanced Home Row Fluidity", ["All Home Row Keys"], ["advanced-fluidity"]),
    (37, "High-Velocity Cadence Sprints", ["F", "J", "D", "K"], ["high-velocity"]),
    (38, "Sustained Home Row Endurance", ["All Home Row Keys"], ["sustained-endurance"]),
    (39, "Near-Zero Error Accuracy Drills", ["All Home Row Keys"], ["flawless-accuracy"]),
    (40, "Milestone Assessment: 400-Level Fluency", ["All Home Row Keys"], ["milestone-benchmark"]),
    (41, "Rhythm Acceleration Intervals", ["A", "D", "F", "J", "K", "L"], ["rhythm-acceleration"]),
    (42, "Double-Letter Stamina", ["L", "S", "D", "F"], ["double-letter-stamina"]),
    (43, "Multi-Clause Compound Flow", ["All Home Row Keys"], ["compound-flow"]),
    (44, "Lateral Stretch Stamina", ["G", "H", "F", "J"], ["lateral-stamina"]),
    (45, "Pinky Velocity Burst Drills", ["A", ";"], ["pinky-burst"]),
    (46, "Even Cadence Multi-Paragraph Drills", ["All Home Row Keys"], ["multi-paragraph"]),
    (47, "High-Speed Semicolon Transitioning", [";", "L", "A"], ["semicolon-transitioning"]),
    (48, "Rhythmic Home Row Passages", ["All Home Row Keys"], ["rhythmic-passages"]),
    (49, "Speed Sprint Marathon", ["All Home Row Keys"], ["speed-marathon"]),
    (50, "Milestone Assessment: 500-Level Endurance", ["All Home Row Keys"], ["milestone-benchmark"]),
    (51, "Reflex Conditioning Drills", ["F", "J", "D", "K"], ["reflex-conditioning"]),
    (52, "Long-Form Sentence Cadence", ["All Home Row Keys"], ["long-form-cadence"]),
    (53, "Advanced Bilateral Alternation", ["A", "S", "D", "J", "K", "L"], ["advanced-bilateral"]),
    (54, "Consonant Blend Stamina", ["G", "L", "F", "L", "S", "H"], ["blend-stamina"]),
    (55, "Metronome Strict Accuracy", ["All Home Row Keys"], ["strict-accuracy"]),
    (56, "Rapid Word Formation", ["All Home Row Keys"], ["rapid-word-formation"]),
    (57, "Burst Speed Sprints Alpha", ["All Home Row Keys"], ["burst-alpha"]),
    (58, "Burst Speed Sprints Beta", ["All Home Row Keys"], ["burst-beta"]),
    (59, "Sustained Velocity Trial", ["All Home Row Keys"], ["sustained-velocity"]),
    (60, "Milestone Assessment: 600-Level Mastery", ["All Home Row Keys"], ["milestone-benchmark"]),
    (61, "Grandmaster Velocity Drills", ["All Home Row Keys"], ["grandmaster-velocity"]),
    (62, "Elite Tactile Precision", ["All Home Row Keys"], ["tactile-precision"]),
    (63, "Extended Multi-Clause Prose Alpha", ["All Home Row Keys"], ["extended-prose-alpha"]),
    (64, "Extended Multi-Clause Prose Beta", ["All Home Row Keys"], ["extended-prose-beta"]),
    (65, "Zero-Hesitation Flow Sprints", ["All Home Row Keys"], ["zero-hesitation"]),
    (66, "Grandmaster Endurance Alpha", ["All Home Row Keys"], ["grandmaster-endurance"]),
    (67, "Grandmaster Endurance Beta", ["All Home Row Keys"], ["grandmaster-endurance-beta"]),
    (68, "Precision Perfection Trial", ["All Home Row Keys"], ["precision-perfection"]),
    (69, "Pre-Capstone Comprehensive Review", ["All Home Row Keys"], ["pre-capstone-review"]),
    (70, "Stage 1 Grandmaster Home Row Capstone Examination", ["All Home Row Keys"], ["grandmaster-capstone"]),
]

def generate_stage1_lessons():
    """Generates all 700 Stage 1 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()

    # Units 1 through 10 (Levels 1-100)
    for l_num, title, obj, text, target_keys, skills in FOUNDATION_DRILLS:
        unit_num = (l_num - 1) // 10 + 1
        l_in_u = ((l_num - 1) % 10) + 1
        unit_labels = [
            "Tactile Anchors & Initial Homing",
            "Middle Fingers D & K Conditioning",
            "Ring Fingers S & L Muscle Isolation",
            "Pinky Anchors A & Semicolon Precision",
            "Milestone Anchor Row Mastery",
            "Center Stretch Keys G & H",
            "First Real English Words",
            "First Short Phrases & Cadence",
            "Natural Simple Sentences",
            "100-Level Foundation Capstone",
        ]
        unit_label = unit_labels[unit_num - 1]
        
        lesson = build_lesson(
            stage_id=STAGE_ID,
            stage_title=STAGE_TITLE,
            level_num=l_num,
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
        seen_texts.add(text)

    # Units 11 through 70 (Levels 101-700)
    clause_idx = 0
    num_clauses = len(HOME_ROW_CLAUSES)

    for unit_tuple in UNIT_THEMES_11_TO_70:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets scaling up to 700 levels
            if level_num <= 150:
                target_min, target_max = 50, 95
            elif level_num <= 250:
                target_min, target_max = 95, 160
            elif level_num <= 350:
                target_min, target_max = 160, 240
            elif level_num <= 450:
                target_min, target_max = 240, 340
            elif level_num <= 550:
                target_min, target_max = 340, 460
            elif level_num <= 650:
                target_min, target_max = 460, 580
            else:
                target_min, target_max = 580, 800

            # Construct unique authentic clause sequences
            clauses_used = []
            curr_len = 0
            while curr_len < target_min or len(clauses_used) < 2:
                cl = HOME_ROW_CLAUSES[clause_idx % num_clauses]
                clause_idx += 1
                if cl not in clauses_used:
                    clauses_used.append(cl)
                    curr_len = sum(len(c) for c in clauses_used) + (len(clauses_used) - 1) * 2

            text = "; ".join(clauses_used)

            # Ensure uniqueness
            variant = 1
            base_text = text
            while text in seen_texts:
                extra_clause = HOME_ROW_CLAUSES[(clause_idx + variant) % num_clauses]
                text = f"{base_text}; {extra_clause}"
                variant += 1
            seen_texts.add(text)

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Home Row Capstone Examination"
                obj = "Graduate from Stage 1 by sustaining flawless touch-typing speed and accuracy across extended home row prose."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across multi-clause home row text."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Progressive Flow Drill {l_in_u}"
                obj = f"Develop muscle memory and relaxed stroke cadence for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 1 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
