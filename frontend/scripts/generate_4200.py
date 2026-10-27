"""
Master Compiler for KEYFLOW 4,200 Masterpiece Academy Curriculum
(7 Stages x 600 Levels = 4,200 Real, Pedagogical Lessons)

Validates and writes:
- frontend/src/data/curriculum/stage1Data.js
- frontend/src/data/curriculum/stage2Data.js
- frontend/src/data/curriculum/stage3Data.js
- frontend/src/data/curriculum/stage4Data.js
- frontend/src/data/curriculum/stage5Data.js
- frontend/src/data/curriculum/stage6Data.js
- frontend/src/data/curriculum/stage7Data.js
- frontend/scripts/audit_4200_report.json
"""
import json
import os
import re
import sys

from generators.stage1_gen import generate_stage1_lessons
from generators.stage2_gen import generate_stage2_lessons
from generators.stage3_gen import generate_stage3_lessons
from generators.stage4_gen import generate_stage4_lessons
from generators.stage5_gen import generate_stage5_lessons
from generators.stage6_gen import generate_stage6_lessons
from generators.stage7_gen import generate_stage7_lessons
from generators.curriculum_builder import FINGER_MAP

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "curriculum")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print("=" * 65)
    print("KEYFLOW ACADEMY: COMPILING 4,200 MASTERPIECE LESSONS (7 x 600)")
    print("=" * 65)
    
    stages = [
        (1, "stage1Data.js", "STAGE_1_LESSONS", generate_stage1_lessons),
        (2, "stage2Data.js", "STAGE_2_LESSONS", generate_stage2_lessons),
        (3, "stage3Data.js", "STAGE_3_LESSONS", generate_stage3_lessons),
        (4, "stage4Data.js", "STAGE_4_LESSONS", generate_stage4_lessons),
        (5, "stage5Data.js", "STAGE_5_LESSONS", generate_stage5_lessons),
        (6, "stage6Data.js", "STAGE_6_LESSONS", generate_stage6_lessons),
        (7, "stage7Data.js", "STAGE_7_LESSONS", generate_stage7_lessons),
    ]
    
    total_lessons = 0
    all_seen_ids = set()
    audit_report = {
        "totalStages": 7,
        "totalLessons": 0,
        "stages": {}
    }
    
    for stage_id, filename, var_name, generator_fn in stages:
        print(f"\n[Stage {stage_id}] Generating 600 lessons...")
        lessons = generator_fn()
        assert len(lessons) == 600, f"Stage {stage_id} must have exactly 600 lessons, got {len(lessons)}"
        
        # Verify IDs and sequencing
        seen_stage_ids = set()
        seen_stage_texts = set()
        lengths = []
        wpms = []
        accuracies = []
        
        for idx, l in enumerate(lessons, start=1):
            assert l["levelNumber"] == idx, f"Stage {stage_id} Level {l['levelNumber']} out of order (expected {idx})"
            assert l["stageId"] == stage_id, f"Stage ID mismatch: {l['stageId']} vs {stage_id}"
            
            # Check ID
            expected_id = f"S{stage_id}-L{str(idx).zfill(3)}"
            assert l["id"] == expected_id, f"Invalid ID format: {l['id']} (expected {expected_id})"
            assert l["id"] not in all_seen_ids, f"Global duplicate ID: {l['id']}"
            all_seen_ids.add(l["id"])
            seen_stage_ids.add(l["id"])
            
            # Check Text
            text = l["exerciseText"]
            assert len(text) >= 20, f"Text too short in {l['id']}: '{text}'"
            assert text not in seen_stage_texts, f"Duplicate text in Stage {stage_id}: {l['id']}"
            seen_stage_texts.add(text)
            
            # Check spam
            spam = re.search(r"([a-zA-Z0-9;.,])\1{4,}", text)
            assert not spam, f"Character spam detected in {l['id']}: {spam.group(0)}"
            
            # Check keys
            for ch in text:
                assert ch in FINGER_MAP or ch.lower() in FINGER_MAP, f"Unmapped ANSI character '{ch}' in {l['id']}"
                
            lengths.append(len(text))
            wpms.append(l["targetWpm"])
            accuracies.append(l["targetAccuracy"])
            
        stage_stats = {
            "stageId": stage_id,
            "stageTitle": lessons[0]["stageTitle"],
            "lessonCount": len(lessons),
            "minLength": min(lengths),
            "maxLength": max(lengths),
            "avgLength": round(sum(lengths) / len(lengths), 1),
            "minWpm": min(wpms),
            "maxWpm": max(wpms),
            "minAccuracy": min(accuracies),
            "maxAccuracy": max(accuracies),
            "bands": {
                "L1-L50_avgLen": round(sum(lengths[:50]) / 50, 1),
                "L51-L150_avgLen": round(sum(lengths[50:150]) / 100, 1),
                "L151-L300_avgLen": round(sum(lengths[150:300]) / 150, 1),
                "L301-L450_avgLen": round(sum(lengths[300:450]) / 150, 1),
                "L451-L580_avgLen": round(sum(lengths[450:580]) / 130, 1),
                "L581-L600_avgLen": round(sum(lengths[580:600]) / 20, 1),
            }
        }
        audit_report["stages"][stage_id] = stage_stats
        total_lessons += len(lessons)
        
        print(f"  [OK] Verified 600 unique lessons: length {min(lengths)} -> {max(lengths)} chars (avg: {stage_stats['avgLength']})")
        print(f"  [OK] Target metrics: {min(wpms)} -> {max(wpms)} WPM, {min(accuracies)}% -> {max(accuracies)}% accuracy")
        
        # Write JavaScript file
        out_path = os.path.join(OUTPUT_DIR, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(f"/**\n * KEYFLOW Academy — Stage {stage_id}: {lessons[0]['stageTitle']}\n")
            f.write(f" * Exactly 600 sequential levels (S{stage_id}-L001 to S{stage_id}-L600).\n */\n\n")
            f.write(f"export const {var_name} = ")
            json.dump(lessons, f, indent=2, ensure_ascii=False)
            f.write(";\n")
        print(f"  [OK] Saved {out_path} ({round(os.path.getsize(out_path) / 1024, 1)} KB)")

    audit_report["totalLessons"] = total_lessons
    report_path = os.path.join(os.path.dirname(__file__), "audit_4200_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)
        
    print("\n" + "=" * 65)
    print(f"SUCCESS: ALL {total_lessons} LESSONS GENERATED & VALIDATED (7 STAGES x 600)")
    print(f"Audit report saved to: {report_path}")
    print("=" * 65)

if __name__ == "__main__":
    main()
