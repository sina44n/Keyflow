"""
Stage 1 Prototype Generator & Validator (Levels 1 to 30)
Implements and rigorously validates the exact F & J First touch-typing progression:
Level 1: f
Level 2: j
Level 3: f + j
Level 4: d
Level 5: k
Level 6: f + j + d + k
Levels 7-9: s, l, cumulative review
Level 10: Unit 1 Assessment
Levels 11-20: a, g, h, r, u, e (Units 2)
Levels 21-30: i, t, y, w, o, q (Unit 3)
"""

import sys
import os

# FINGER MAP
FINGER_MAP = {
    'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
    'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
    'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
    'r': 'left-index', 'f': 'left-index', 't': 'left-index', 'g': 'left-index', 'v': 'left-index', 'b': 'left-index',
    ' ': 'thumb',
    'y': 'right-index', 'u': 'right-index', 'h': 'right-index', 'j': 'right-index', 'n': 'right-index', 'm': 'right-index',
    'i': 'right-middle', 'k': 'right-middle',
    'o': 'right-ring', 'l': 'right-ring',
    'p': 'right-pinky',
}

# Cumulative key introduction order
# L1: f
# L2: j
# L3: f, j
# L4: d
# L5: k
# L6: f, j, d, k
# L7: s
# L8: l
# L9: f, j, d, k, s, l
# L10: Unit 1 Assessment
# L11: a
# L12: g
# L13: a, g + prev
# L14: h
# L15: r
# L16: h, r + prev
# L17: u
# L18: e
# L19: u, e + prev
# L20: Unit 2 Assessment
# L21: i
# L22: t
# L23: i, t + prev
# L24: y
# L25: w
# L26: y, w + prev
# L27: o
# L28: q
# L29: o, q + prev
# L30: Unit 3 Assessment

STAGE_1_FIRST_30_SPEC = [
    # Unit 1: Index & Middle Anchors (F, J, D, K, S, L)
    {
        "level": 1, "unit": 1, "title": "Left Index Anchor: Key F",
        "objective": "Introduce left index finger on tactile homing bump F.",
        "targetKeys": ["F"], "homeKeys": ["F", "J"], "skills": ["left-index", "tactile-bump", "f-anchor"],
        "text": "f ff fff f f ff fff f f ff fff f f",
        "allowedKeys": set("f ")
    },
    {
        "level": 2, "unit": 1, "title": "Right Index Anchor: Key J",
        "objective": "Introduce right index finger on tactile homing bump J.",
        "targetKeys": ["J"], "homeKeys": ["F", "J"], "skills": ["right-index", "tactile-bump", "j-anchor"],
        "text": "j jj jjj j j jj jjj j j jj jjj j j",
        "allowedKeys": set("j ")
    },
    {
        "level": 3, "unit": 1, "title": "Index Finger Coordination: F + J",
        "objective": "Combine both index fingers in alternating and doublet patterns.",
        "targetKeys": ["F", "J"], "homeKeys": ["F", "J"], "skills": ["bilateral-index", "alternation", "rhythm"],
        "text": "fj jf ffjj jfjf fjfj f j fj jf ff jj fj jf",
        "allowedKeys": set("fj ")
    },
    {
        "level": 4, "unit": 1, "title": "Left Middle Finger: Key D",
        "objective": "Introduce left middle finger resting naturally on key D.",
        "targetKeys": ["D"], "homeKeys": ["F", "J"], "skills": ["left-middle", "d-rest", "finger-isolation"],
        "text": "d dd ddd d d dd ddd fd df d f fd df dd ff",
        "allowedKeys": set("fjd ")
    },
    {
        "level": 5, "unit": 1, "title": "Right Middle Finger: Key K",
        "objective": "Introduce right middle finger resting naturally on key K.",
        "targetKeys": ["K"], "homeKeys": ["F", "J"], "skills": ["right-middle", "k-rest", "finger-isolation"],
        "text": "k kk kkk k k kk kkk jk kj k j jk kj kk jj",
        "allowedKeys": set("fjdk ")
    },
    {
        "level": 6, "unit": 1, "title": "Four Anchor Coordination: F + J + D + K",
        "objective": "Combine all four primary central anchor keys with balanced rhythm.",
        "targetKeys": ["F", "J", "D", "K"], "homeKeys": ["F", "J"], "skills": ["quad-anchor", "inward-roll", "central-cluster"],
        "text": "fdjk fjdk jkfd fjd k fjdkfjdk dk fj fd jk ddkk ffjj",
        "allowedKeys": set("fjdk ")
    },
    {
        "level": 7, "unit": 1, "title": "Left Ring Finger: Key S",
        "objective": "Introduce left ring finger on key S with pinky relaxed.",
        "targetKeys": ["S"], "homeKeys": ["F", "J"], "skills": ["left-ring", "s-position", "independence"],
        "text": "s ss sss s s ss fs sf ds sd s d fs ds ss dd",
        "allowedKeys": set("fjdks ")
    },
    {
        "level": 8, "unit": 1, "title": "Right Ring Finger: Key L",
        "objective": "Introduce right ring finger on key L with hand stable.",
        "targetKeys": ["L"], "homeKeys": ["F", "J"], "skills": ["right-ring", "l-position", "independence"],
        "text": "l ll lll l l ll jl lj kl lk l k jl kl ll kk",
        "allowedKeys": set("fjdksl ")
    },
    {
        "level": 9, "unit": 1, "title": "Six Anchor Cumulative Review: F, J, D, K, S, L",
        "objective": "Synthesize all six core home-row anchor keys across both hands.",
        "targetKeys": ["F", "J", "D", "K", "S", "L"], "homeKeys": ["F", "J"], "skills": ["six-anchor-review", "wave-motion", "hand-balance"],
        "text": "sdf jkl fds lkj sldf kjls sd lk sf jl dksl sldk",
        "allowedKeys": set("fjdksl ")
    },
    {
        "level": 10, "unit": 1, "title": "Unit 1 Assessment: Six-Anchor Precision",
        "objective": "Benchmark relaxed accuracy across all six central home-row keys.",
        "targetKeys": ["F", "J", "D", "K", "S", "L"], "homeKeys": ["F", "J"], "skills": ["unit-assessment", "anchor-benchmark"],
        "text": "sdf jkl fds lkj sdfl kjfs ss ll dd kk ff jj fjd kls",
        "allowedKeys": set("fjdksl ")
    },

    # Unit 2: Home Row Completion & First Reach Keys (A, G, H, R, U, E)
    {
        "level": 11, "unit": 2, "title": "Left Pinky Key: A",
        "objective": "Introduce left pinky finger on home-row anchor key A.",
        "targetKeys": ["A"], "homeKeys": ["F", "J"], "skills": ["left-pinky", "a-position", "outer-anchor"],
        "text": "a aa aaa a a aa as sa ad da af fa fa da sa aa",
        "allowedKeys": set("fjdksla ")
    },
    {
        "level": 12, "unit": 2, "title": "Left Index Lateral Reach: Key G",
        "objective": "Stretch left index finger laterally to key G and recover to F.",
        "targetKeys": ["G"], "homeKeys": ["F", "J"], "skills": ["left-index-reach", "lateral-stretch", "f-recovery"],
        "text": "g gg ggg g g gg fg gf gf fg fggf fg gf g g gg",
        "allowedKeys": set("fjdkslag ")
    },
    {
        "level": 13, "unit": 2, "title": "Cumulative Pairing: Keys A + G",
        "objective": "Form first meaningful syllables and words with newly unlocked A and G.",
        "targetKeys": ["A", "G"], "homeKeys": ["F", "J"], "skills": ["word-forming", "consonant-vowel", "lateral-recovery"],
        "text": "ag ga gag fga gfa glad flag gas sad dad glass ask lad",
        "allowedKeys": set("fjdkslag ")
    },
    {
        "level": 14, "unit": 2, "title": "Right Index Lateral Reach: Key H",
        "objective": "Stretch right index finger laterally to key H and recover to J.",
        "targetKeys": ["H"], "homeKeys": ["F", "J"], "skills": ["right-index-reach", "lateral-stretch", "j-recovery"],
        "text": "h hh hhh h h hh jh hj hj jh jhhj jh hj h h hh",
        "allowedKeys": set("fjdkslagh ")
    },
    {
        "level": 15, "unit": 2, "title": "Left Index Upward Reach: Key R",
        "objective": "Extend left index finger upward-diagonally to key R and recover to F.",
        "targetKeys": ["R"], "homeKeys": ["F", "J"], "skills": ["left-index-reach", "top-row-extension", "f-recovery"],
        "text": "r rr rrr r r rr fr rf rf fr frrf fr rf r r rr",
        "allowedKeys": set("fjdkslaghr ")
    },
    {
        "level": 16, "unit": 2, "title": "Cumulative Pairing: Keys H + R",
        "objective": "Combine H and R into rich real vocabulary using unlocked keys.",
        "targetKeys": ["H", "R"], "homeKeys": ["F", "J"], "skills": ["r-h-words", "reach-recovery", "bilateral-flow"],
        "text": "hr rh had jar hard dark shark half flash rash dash lard",
        "allowedKeys": set("fjdkslaghr ")
    },
    {
        "level": 17, "unit": 2, "title": "Right Index Upward Reach: Key U",
        "objective": "Extend right index finger upward-diagonally to key U and recover to J.",
        "targetKeys": ["U"], "homeKeys": ["F", "J"], "skills": ["right-index-reach", "u-vowel", "j-recovery"],
        "text": "u uu uuu u u uu ju uj uj ju juuj ju uj u u uu",
        "allowedKeys": set("fjdkslaghru ")
    },
    {
        "level": 18, "unit": 2, "title": "Left Middle Upward Reach: Key E",
        "objective": "Extend left middle finger upward to primary vowel key E.",
        "targetKeys": ["E"], "homeKeys": ["F", "J"], "skills": ["left-middle-reach", "e-vowel", "d-recovery"],
        "text": "e ee eee e e ee de ed ed de deed de ed e e ee",
        "allowedKeys": set("fjdkslaghrue ")
    },
    {
        "level": 19, "unit": 2, "title": "Cumulative Pairing: Keys U + E",
        "objective": "Synthesize primary vowels U and E with previously mastered consonants.",
        "targetKeys": ["U", "E"], "homeKeys": ["F", "J"], "skills": ["vowel-synthesis", "fluent-words", "two-vowel-flow"],
        "text": "ue eu sue red use due her fur sure real user rush lead safe",
        "allowedKeys": set("fjdkslaghrue ")
    },
    {
        "level": 20, "unit": 2, "title": "Unit 2 Assessment: 12-Key Fluency Benchmark",
        "objective": "Benchmark speed and accuracy across all twelve mastered keys.",
        "targetKeys": ["F", "J", "D", "K", "S", "L", "A", "G", "H", "R", "U", "E"], "homeKeys": ["F", "J"], "skills": ["unit-assessment", "milestone-benchmark"],
        "text": "glad user had a red flag she asked her free guard",
        "allowedKeys": set("fjdkslaghrue ")
    },

    # Unit 3: Vowels I, O & Reaches T, Y, W, Q (I, T, Y, W, O, Q)
    {
        "level": 21, "unit": 3, "title": "Right Middle Upward Reach: Key I",
        "objective": "Extend right middle finger upward to high-frequency vowel key I.",
        "targetKeys": ["I"], "homeKeys": ["F", "J"], "skills": ["right-middle-reach", "i-vowel", "k-recovery"],
        "text": "i ii iii i i ii ki ik ik ki kiik ki ik i i ii",
        "allowedKeys": set("fjdkslaghruei ")
    },
    {
        "level": 22, "unit": 3, "title": "Left Index High Reach: Key T",
        "objective": "Extend left index finger upward-inward to key T and recover to F.",
        "targetKeys": ["T"], "homeKeys": ["F", "J"], "skills": ["left-index-reach", "t-reach", "f-recovery"],
        "text": "t tt ttt t t tt ft tf tf ft fttf ft tf t t tt",
        "allowedKeys": set("fjdkslaghrueit ")
    },
    {
        "level": 23, "unit": 3, "title": "Cumulative Pairing: Keys I + T",
        "objective": "Form essential English words with vowels I, E, U, A and consonants.",
        "targetKeys": ["I", "T"], "homeKeys": ["F", "J"], "skills": ["it-digram", "high-frequency-words", "word-flow"],
        "text": "it ti sit fit hit lit tie tile site late rate test task list",
        "allowedKeys": set("fjdkslaghrueit ")
    },
    {
        "level": 24, "unit": 3, "title": "Right Index High Reach: Key Y",
        "objective": "Extend right index finger upward-inward to key Y and recover to J.",
        "targetKeys": ["Y"], "homeKeys": ["F", "J"], "skills": ["right-index-reach", "y-reach", "j-recovery"],
        "text": "y yy yyy y y yy jy yj yj jy jyyj jy yj y y yy",
        "allowedKeys": set("fjdkslaghrueity ")
    },
    {
        "level": 25, "unit": 3, "title": "Left Ring Upward Reach: Key W",
        "objective": "Extend left ring finger upward to key W and recover to S.",
        "targetKeys": ["W"], "homeKeys": ["F", "J"], "skills": ["left-ring-reach", "w-reach", "s-recovery"],
        "text": "w ww www w w ww sw ws ws sw swws sw ws w w ww",
        "allowedKeys": set("fjdkslaghrueityw ")
    },
    {
        "level": 26, "unit": 3, "title": "Cumulative Pairing: Keys Y + W",
        "objective": "Practice words containing Y and W with cross-hand balance.",
        "targetKeys": ["Y", "W"], "homeKeys": ["F", "J"], "skills": ["w-y-words", "hand-balance", "fluid-transitions"],
        "text": "yw wy say way day wet wry wait stay walk wall year away",
        "allowedKeys": set("fjdkslaghrueityw ")
    },
    {
        "level": 27, "unit": 3, "title": "Right Ring Upward Reach: Key O",
        "objective": "Extend right ring finger upward to key O and recover to L.",
        "targetKeys": ["O"], "homeKeys": ["F", "J"], "skills": ["right-ring-reach", "o-vowel", "l-recovery"],
        "text": "o oo ooo o o oo lo ol ol lo lool lo ol o o oo",
        "allowedKeys": set("fjdkslaghrueitywo ")
    },
    {
        "level": 28, "unit": 3, "title": "Left Pinky Upward Reach: Key Q",
        "objective": "Extend left pinky finger upward to key Q and recover to A.",
        "targetKeys": ["Q"], "homeKeys": ["F", "J"], "skills": ["left-pinky-reach", "q-reach", "a-recovery"],
        "text": "q qq qqq q q qq aq qa qa aq aqqa aq qa q q qq",
        "allowedKeys": set("fjdkslaghrueitywoq ")
    },
    {
        "level": 29, "unit": 3, "title": "Cumulative Pairing: Keys O + Q",
        "objective": "Integrate O and Q into natural English vocabulary.",
        "targetKeys": ["O", "Q"], "homeKeys": ["F", "J"], "skills": ["qu-digram", "o-vowel-words", "full-top-vowels"],
        "text": "oq qo quote quit quiet slow road out old row flow query",
        "allowedKeys": set("fjdkslaghrueitywoq ")
    },
    {
        "level": 30, "unit": 3, "title": "Unit 3 Assessment: 18-Key Fluency Benchmark",
        "objective": "Benchmark multi-word sentence typing across 18 mastered letters.",
        "targetKeys": ["F", "J", "D", "K", "S", "L", "A", "G", "H", "R", "U", "E", "I", "T", "Y", "W", "O", "Q"],
        "homeKeys": ["F", "J"], "skills": ["unit-assessment", "sentence-fluency", "multi-row-balance"],
        "text": "the quiet girl saw two old horses walk away slowly",
        "allowedKeys": set("fjdkslaghrueitywoq ")
    },
]

def validate_prototype():
    print("=" * 60)
    print("VALIDATING STAGE 1 PROTOTYPE (LEVELS 1 TO 30)")
    print("=" * 60)
    
    assert len(STAGE_1_FIRST_30_SPEC) == 30, f"Expected 30 levels, got {len(STAGE_1_FIRST_30_SPEC)}"
    
    # Check exact first 6 levels
    print("\n1. Validating Mandatory First Six Levels:")
    l1 = STAGE_1_FIRST_30_SPEC[0]
    l2 = STAGE_1_FIRST_30_SPEC[1]
    l3 = STAGE_1_FIRST_30_SPEC[2]
    l4 = STAGE_1_FIRST_30_SPEC[3]
    l5 = STAGE_1_FIRST_30_SPEC[4]
    l6 = STAGE_1_FIRST_30_SPEC[5]
    
    assert l1["targetKeys"] == ["F"] and set(l1["text"].replace(" ", "")) == {"f"}, "L1 must be only 'f'"
    print("  ✓ Level 1: Key 'f' strictly isolated")
    
    assert l2["targetKeys"] == ["J"] and set(l2["text"].replace(" ", "")) == {"j"}, "L2 must be only 'j'"
    print("  ✓ Level 2: Key 'j' strictly isolated")
    
    assert set(l3["targetKeys"]) == {"F", "J"} and set(l3["text"].replace(" ", "")) == {"f", "j"}, "L3 must be 'f + j'"
    print("  ✓ Level 3: Keys 'f + j' combined")
    
    assert l4["targetKeys"] == ["D"] and set(l4["text"].replace(" ", "")).issubset({"f", "j", "d"}), "L4 must introduce 'd'"
    print("  ✓ Level 4: Key 'd' introduced with anchors")
    
    assert l5["targetKeys"] == ["K"] and set(l5["text"].replace(" ", "")).issubset({"f", "j", "d", "k"}), "L5 must introduce 'k'"
    print("  ✓ Level 5: Key 'k' introduced with anchors")
    
    assert set(l6["targetKeys"]) == {"F", "J", "D", "K"} and set(l6["text"].replace(" ", "")) == {"f", "j", "d", "k"}, "L6 must combine 'f + j + d + k'"
    print("  ✓ Level 6: Four keys 'f + j + d + k' combined")

    print("\n2. Validating Strict Key Discipline (Zero Untaught Characters):")
    for spec in STAGE_1_FIRST_30_SPEC:
        lvl = spec["level"]
        text = spec["text"]
        allowed = spec["allowedKeys"]
        violations = [c for c in text if c not in allowed]
        if violations:
            print(f"  ✗ Level {lvl} has untaught characters: {set(violations)} in text '{text}'")
            sys.exit(1)
        # Check finger map
        for c in text:
            if c != " " and c not in FINGER_MAP:
                print(f"  ✗ Character '{c}' not in FINGER_MAP!")
                sys.exit(1)
    print("  ✓ All 30 levels pass strict zero-untaught-character discipline!")

    print("\n3. Validating Unit Allocation & Milestones:")
    units = [spec["unit"] for spec in STAGE_1_FIRST_30_SPEC]
    assert units == [1]*10 + [2]*10 + [3]*10, "Units must be exactly 1-10 for U1, 11-20 for U2, 21-30 for U3"
    print("  ✓ Unit 1 (Levels 1-10), Unit 2 (Levels 11-20), Unit 3 (Levels 21-30) exactly allocated")

    print("\nPROTOTYPE VALIDATION PASSED COMPLETELY!\n")

if __name__ == "__main__":
    validate_prototype()
