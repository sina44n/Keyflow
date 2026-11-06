"""
KEYFLOW — Master 7,000-Level Curriculum Generator & Comprehensive Auditor
========================================================================
Generates all 10 Stages x 70 Units x 10 Levels = Exactly 7,000 Real Levels.
Writes frontend curriculum files: stage1Data.js to stage10Data.js.
Performs rigorous automated validation and outputs audit_7000_report.json.
"""

import os
import sys
import json
import time

# Ensure generators package can be imported
sys.path.insert(0, os.path.dirname(__file__))

from generators.stage1_gen import generate_stage1_lessons
from generators.stage2_gen import generate_stage2_lessons
from generators.stage3_gen import generate_stage3_lessons
from generators.stage4_gen import generate_stage4_lessons
from generators.stage5_gen import generate_stage5_lessons
from generators.stage6_gen import generate_stage6_lessons
from generators.stage7_gen import generate_stage7_lessons
from generators.stage8_gen import generate_stage8_lessons
from generators.stage9_gen import generate_stage9_lessons
from generators.stage10_gen import generate_stage10_lessons

STAGE_GENERATORS = [
    (1, "Home Row Foundations", generate_stage1_lessons),
    (2, "Top Row Control", generate_stage2_lessons),
    (3, "Bottom Row Control", generate_stage3_lessons),
    (4, "Full Alphabet Mastery & Cross-Row Transitions", generate_stage4_lessons),
    (5, "Number Row Mastery & Ten-Key Dexterity", generate_stage5_lessons),
    (6, "Shift Discipline, Punctuation & Common Symbols", generate_stage6_lessons),
    (7, "High-Frequency Vocabulary & Rhythm Cadence", generate_stage7_lessons),
    (8, "Speed & Endurance Building", generate_stage8_lessons),
    (9, "Technical, Numeric & Professional Fluency", generate_stage9_lessons),
    (10, "Master Typist & Specialization", generate_stage10_lessons),
]

REQUIRED_FIELDS = [
    "id", "stageId", "stageTitle", "levelNumber", "unitNumber", "unitLabel",
    "lessonInUnit", "title", "objective", "skills", "targetKeys", "homeKeys",
    "exerciseText", "difficulty", "targetWpm", "targetAccuracy", "estimatedSeconds",
    "isAssessment", "isMilestone", "guidance", "fingerMap"
]

STAGE_ALLOWED_KEYS = {
    1: set("asdfghjkl; "),
    2: set("abcdefghijklmnopqrstuvwxyz; "),
    3: set("abcdefghijklmnopqrstuvwxyz,.;/ "),
    4: set("abcdefghijklmnopqrstuvwxyz,.;- "),
    5: set("abcdefghijklmnopqrstuvwxyz0123456789,.;- "),
}

def generate_and_audit():
    print("=" * 70)
    print("KEYFLOW 7,000-LEVEL MASTERPIECE CURRICULUM GENERATION & AUDIT")
    print("=" * 70)
    start_time = time.time()

    curriculum_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data", "curriculum")
    os.makedirs(curriculum_dir, exist_ok=True)

    all_7000_lessons = []
    stage_summaries = {}
    all_logical_ids = set()
    all_exercise_texts = set()
    duplicate_ids = []
    duplicate_texts = []
    key_violations = []
    missing_fields = []
    missing_finger_mappings = {}

    for stage_id, stage_title, gen_func in STAGE_GENERATORS:
        print(f"\nGenerating Stage {stage_id:02d}: {stage_title} (700 Levels)...")
        stage_start = time.time()
        stage_lessons = gen_func()
        stage_elapsed = time.time() - stage_start

        assert len(stage_lessons) == 700, f"Stage {stage_id} must have exactly 700 lessons, got {len(stage_lessons)}"
        print(f"  Generated {len(stage_lessons)} levels in {stage_elapsed:.2f}s")

        # Write frontend stage file
        stage_file_path = os.path.join(curriculum_dir, f"stage{stage_id}Data.js")
        with open(stage_file_path, "w", encoding="utf-8") as f:
            f.write(f"/**\n * KEYFLOW Academy — Stage {stage_id}: {stage_title}\n")
            f.write(f" * Exactly 700 sequential levels (S{stage_id:02d}-L001 to S{stage_id:02d}-L700).\n")
            f.write(f" * 70 Units x 10 Levels = 700 Levels.\n */\n\n")
            f.write(f"export const STAGE_{stage_id}_LESSONS = ")
            json.dump(stage_lessons, f, indent=2, ensure_ascii=False)
            f.write(";\n")

        print(f"  Saved to: {os.path.basename(stage_file_path)} ({os.path.getsize(stage_file_path)} bytes)")

        # Validate stage lessons
        stage_wpms = [l["targetWpm"] for l in stage_lessons]
        stage_accs = [l["targetAccuracy"] for l in stage_lessons]
        stage_units = len(set(l["unitNumber"] for l in stage_lessons))
        stage_assessments = sum(1 for l in stage_lessons if l["isAssessment"])
        stage_milestones = sum(1 for l in stage_lessons if l["isMilestone"])

        stage_summaries[stage_id] = {
            "title": stage_title,
            "total_levels": len(stage_lessons),
            "total_units": stage_units,
            "assessment_count": stage_assessments,
            "milestone_count": stage_milestones,
            "wpm_range": f"{min(stage_wpms)} - {max(stage_wpms)}",
            "accuracy_range": f"{min(stage_accs)}% - {max(stage_accs)}%",
            "difficulty": stage_lessons[0]["difficulty"]
        }

        # Global audit aggregation
        allowed_set = STAGE_ALLOWED_KEYS.get(stage_id)
        for l in stage_lessons:
            lid = l["id"]
            txt = l["exerciseText"]

            # Unique IDs
            if lid in all_logical_ids:
                duplicate_ids.append(lid)
            all_logical_ids.add(lid)

            # Unique Texts
            if txt in all_exercise_texts:
                duplicate_texts.append((lid, txt[:40]))
            all_exercise_texts.add(txt)

            # Required fields
            for rf in REQUIRED_FIELDS:
                if rf not in l:
                    missing_fields.append((lid, rf))

            # Strict Key restrictions
            if allowed_set:
                invalid_chars = [c for c in txt if c not in allowed_set]
                if invalid_chars:
                    key_violations.append((lid, set(invalid_chars)))

            # Finger map completeness
            fmap = l.get("fingerMap", {})
            for c in txt:
                if c not in fmap and c.lower() not in fmap and c != "\n" and c != "\r":
                    missing_finger_mappings[c] = missing_finger_mappings.get(c, 0) + 1

            all_7000_lessons.append(l)

    # Save compact seed manifest for Django backend
    manifest_path = os.path.join(curriculum_dir, "curriculum7000Manifest.json")
    print(f"\nWriting full 7,000-level manifest to {os.path.basename(manifest_path)}...")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(all_7000_lessons, f, indent=2, ensure_ascii=False)
    print(f"Manifest written successfully: {os.path.getsize(manifest_path)} bytes")

    # Generate Audit Report
    total_elapsed = time.time() - start_time
    audit_report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_stages": len(STAGE_GENERATORS),
        "total_units": sum(s["total_units"] for s in stage_summaries.values()),
        "total_levels": len(all_7000_lessons),
        "expected_levels": 7000,
        "unique_level_ids": len(all_logical_ids),
        "duplicate_ids_count": len(duplicate_ids),
        "unique_exercise_texts": len(all_exercise_texts),
        "duplicate_texts_count": len(duplicate_texts),
        "key_violations_count": len(key_violations),
        "missing_fields_count": len(missing_fields),
        "missing_finger_mappings": missing_finger_mappings,
        "generation_elapsed_seconds": round(total_elapsed, 2),
        "overall_status": "PASS" if (
            len(all_7000_lessons) == 7000 and
            len(duplicate_ids) == 0 and
            len(duplicate_texts) == 0 and
            len(key_violations) == 0 and
            len(missing_fields) == 0 and
            len(missing_finger_mappings) == 0
        ) else "FAIL",
        "stages": stage_summaries,
    }

    report_path = os.path.join(os.path.dirname(__file__), "audit_7000_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print("\n" + "=" * 70)
    print("FINAL 7,000-LEVEL AUDIT VERIFICATION REPORT")
    print("=" * 70)
    print(f"Total Stages Generated: {audit_report['total_stages']} / 10")
    print(f"Total Units Generated:  {audit_report['total_units']} / 700")
    print(f"Total Levels Generated: {audit_report['total_levels']} / 7,000")
    print(f"Unique Level IDs:       {audit_report['unique_level_ids']} (Duplicates: {audit_report['duplicate_ids_count']})")
    print(f"Unique Exercise Texts:  {audit_report['unique_exercise_texts']} (Duplicates: {audit_report['duplicate_texts_count']})")
    print(f"Key Restrictions Violations: {audit_report['key_violations_count']}")
    print(f"Missing Required Fields:     {audit_report['missing_fields_count']}")
    print(f"Missing ANSI Finger Mappings: {len(missing_finger_mappings)}")
    print(f"Generation & Audit Runtime:  {total_elapsed:.2f} seconds")
    print(f"OVERALL AUDIT VERDICT:       {audit_report['overall_status']}")
    print("=" * 70)

    if audit_report["overall_status"] != "PASS":
        if duplicate_ids:
            print(f"First 5 duplicate IDs: {duplicate_ids[:5]}")
        if duplicate_texts:
            print(f"First 5 duplicate texts: {duplicate_texts[:5]}")
        if key_violations:
            print(f"First 5 key violations: {key_violations[:5]}")
        if missing_finger_mappings:
            print(f"Missing finger mapping keys: {list(missing_finger_mappings.keys())[:10]}")
        sys.exit(1)

    return audit_report

if __name__ == "__main__":
    generate_and_audit()
