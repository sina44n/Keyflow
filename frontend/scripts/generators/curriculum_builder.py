"""
Curriculum Builder Utilities for KEYFLOW 4,200 Masterpiece Curriculum
Provides shared helpers, validation, and length scaling across all 7 stages.
"""

# Standard ANSI finger map
FINGER_MAP = {
    '`': 'left-pinky', '~': 'left-pinky', '1': 'left-pinky', '!': 'left-pinky',
    'q': 'left-pinky', 'Q': 'left-pinky', 'a': 'left-pinky', 'A': 'left-pinky',
    'z': 'left-pinky', 'Z': 'left-pinky',
    '2': 'left-ring', '@': 'left-ring', 'w': 'left-ring', 'W': 'left-ring',
    's': 'left-ring', 'S': 'left-ring', 'x': 'left-ring', 'X': 'left-ring',
    '3': 'left-middle', '#': 'left-middle', 'e': 'left-middle', 'E': 'left-middle',
    'd': 'left-middle', 'D': 'left-middle', 'c': 'left-middle', 'C': 'left-middle',
    '4': 'left-index', '$': 'left-index', '5': 'left-index', '%': 'left-index',
    'r': 'left-index', 'R': 'left-index', 't': 'left-index', 'T': 'left-index',
    'f': 'left-index', 'F': 'left-index', 'g': 'left-index', 'G': 'left-index',
    'v': 'left-index', 'V': 'left-index', 'b': 'left-index', 'B': 'left-index',
    ' ': 'thumb',
    '6': 'right-index', '^': 'right-index', '7': 'right-index', '&': 'right-index',
    'y': 'right-index', 'Y': 'right-index', 'u': 'right-index', 'U': 'right-index',
    'h': 'right-index', 'H': 'right-index', 'j': 'right-index', 'J': 'right-index',
    'n': 'right-index', 'N': 'right-index', 'm': 'right-index', 'M': 'right-index',
    '8': 'right-middle', '*': 'right-middle', 'i': 'right-middle', 'I': 'right-middle',
    'k': 'right-middle', 'K': 'right-middle', ',': 'right-middle', '<': 'right-middle',
    '9': 'right-ring', '(': 'right-ring', 'o': 'right-ring', 'O': 'right-ring',
    'l': 'right-ring', 'L': 'right-ring', '.': 'right-ring', '>': 'right-ring',
    '0': 'right-pinky', ')': 'right-pinky', '-': 'right-pinky', '_': 'right-pinky',
    '=': 'right-pinky', '+': 'right-pinky', 'p': 'right-pinky', 'P': 'right-pinky',
    '[': 'right-pinky', '{': 'right-pinky', ']': 'right-pinky', '}': 'right-pinky',
    '\\': 'right-pinky', '|': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky',
    "'": 'right-pinky', '"': 'right-pinky', '/': 'right-pinky', '?': 'right-pinky',
}

def get_target_wpm(stage_id, level_num):
    """Calculates progressive target WPM from beginner to master."""
    base_wpms = {
        1: 20,
        2: 26,
        3: 32,
        4: 38,
        5: 46,
        6: 52,
        7: 60,
    }
    max_wpms = {
        1: 28,
        2: 36,
        3: 42,
        4: 50,
        5: 58,
        6: 64,
        7: 72,
    }
    base = base_wpms.get(stage_id, 20)
    top = max_wpms.get(stage_id, 30)
    # Smooth progression over 600 levels
    progress = (level_num - 1) / 599.0
    return int(round(base + (top - base) * progress))

def get_target_accuracy(stage_id, level_num):
    """Calculates progressive target accuracy."""
    base_acc = {
        1: 92,
        2: 93,
        3: 93,
        4: 94,
        5: 95,
        6: 95,
        7: 96,
    }
    max_acc = {
        1: 94,
        2: 95,
        3: 95,
        4: 96,
        5: 96,
        6: 97,
        7: 98,
    }
    base = base_acc.get(stage_id, 92)
    top = max_acc.get(stage_id, 96)
    progress = (level_num - 1) / 599.0
    return int(round(base + (top - base) * progress))

def get_difficulty(stage_id, level_num):
    """Returns pedagogical difficulty level."""
    if stage_id == 1:
        return 'beginner' if level_num <= 400 else 'intermediate'
    elif stage_id in [2, 3]:
        return 'intermediate' if level_num <= 500 else 'advanced'
    elif stage_id in [4, 5]:
        return 'intermediate' if level_num <= 200 else ('advanced' if level_num <= 500 else 'expert')
    elif stage_id == 6:
        return 'advanced' if level_num <= 400 else 'expert'
    else:
        return 'advanced' if level_num <= 200 else 'expert'

def extract_finger_map(text):
    """Extracts finger mappings for all characters in the text."""
    mapping = {}
    for char in text:
        if char in FINGER_MAP:
            mapping[char] = FINGER_MAP[char]
        elif char.lower() in FINGER_MAP:
            mapping[char] = FINGER_MAP[char.lower()]
    return mapping

def build_lesson(stage_id, stage_title, level_num, unit_num, unit_label, lesson_in_unit,
                 title, objective, text, target_keys, home_keys, skills):
    """Constructs a fully populated, standard Lesson dictionary."""
    is_assessment = (lesson_in_unit == 20)
    is_milestone = is_assessment and (unit_num in [5, 10, 15, 20, 25, 30])
    wpm = get_target_wpm(stage_id, level_num)
    acc = get_target_accuracy(stage_id, level_num)
    diff = get_difficulty(stage_id, level_num)
    
    # Calculate estimated seconds (assume words per minute typing pace + buffer)
    word_count = max(1, len(text.split()))
    estimated_seconds = max(30, int(round((word_count / max(10, wpm * 0.7)) * 60)))
    
    stable_id = f"S{stage_id}-L{str(level_num).zfill(3)}"
    prereq_level = level_num - 1 if level_num > 1 else None
    prereq_id = f"S{stage_id}-L{str(level_num - 1).zfill(3)}" if level_num > 1 else (f"S{stage_id - 1}-L600" if stage_id > 1 else None)
    
    guidance = (
        f"Stage {stage_id} — Unit {str(unit_num).zfill(2)}: {unit_label}. "
        f"{objective} Maintain {acc}%+ accuracy and target {wpm} WPM. "
        f"Keep fingers curved lightly over tactile anchors {' and '.join(home_keys)}."
    )
    
    return {
        "id": stable_id,
        "stageId": stage_id,
        "stageTitle": stage_title,
        "levelNumber": level_num,
        "lessonNum": level_num,
        "unitNumber": unit_num,
        "unitLabel": unit_label,
        "lessonInUnit": lesson_in_unit,
        "title": title,
        "objective": objective,
        "skills": skills,
        "targetKeys": target_keys,
        "homeKeys": home_keys,
        "prerequisiteLevel": prereq_level,
        "prerequisiteId": prereq_id,
        "exerciseText": text,
        "difficulty": diff,
        "targetWpm": wpm,
        "targetAccuracy": acc,
        "estimatedSeconds": estimated_seconds,
        "isAssessment": is_assessment,
        "isMilestone": is_milestone,
        "guidance": guidance,
        "fingerMap": extract_finger_map(text),
    }
