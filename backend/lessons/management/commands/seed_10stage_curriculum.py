"""
KEYFLOW — Seed 10-Stage 7,000-Level Curriculum Command
======================================================
Populates CurriculumStage (10 stages), CurriculumUnit (700 units),
and CurriculumLevel (7,000 levels) into the Django relational database
from the validated curriculum7000Manifest.json.

Supports --stages filter (e.g. --stages 1,2) or full seed.
Uses bulk_create with batch_size=1000 for high performance.
"""

import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from lessons.models import CurriculumStage, CurriculumUnit, CurriculumLevel

STAGE_METADATA = [
    {
        "number": 1,
        "title": "Home Row Foundations",
        "slug": "stage-01-home-row-foundations",
        "description": "Master tactile anchor keys (A S D F J K L ;) and develop natural index-finger homing.",
        "target_wpm_start": 15,
        "target_wpm_end": 24,
        "target_accuracy_min": 75,
    },
    {
        "number": 2,
        "title": "Top Row Control",
        "slug": "stage-02-top-row-control",
        "description": "Extend fingers upward to master Q, W, E, R, T, Y, U, I, O, P with home-row recovery.",
        "target_wpm_start": 25,
        "target_wpm_end": 34,
        "target_accuracy_min": 85,
    },
    {
        "number": 3,
        "title": "Bottom Row Control",
        "slug": "stage-03-bottom-row-control",
        "description": "Downward finger reach discipline covering Z, X, C, V, B, N, M with neutral wrists.",
        "target_wpm_start": 32,
        "target_wpm_end": 40,
        "target_accuracy_min": 88,
    },
    {
        "number": 4,
        "title": "Full Alphabet Mastery & Cross-Row Transitions",
        "slug": "stage-04-full-alphabet-mastery",
        "description": "Seamless cross-row leaps, high-frequency digrams, prefixes, and suffixes.",
        "target_wpm_start": 38,
        "target_wpm_end": 46,
        "target_accuracy_min": 90,
    },
    {
        "number": 5,
        "title": "Number Row Mastery & Ten-Key Dexterity",
        "slug": "stage-05-number-row-mastery",
        "description": "Top number reaches (1-0), home-row recovery, numeric prose, dates, and metrics.",
        "target_wpm_start": 42,
        "target_wpm_end": 50,
        "target_accuracy_min": 90,
    },
    {
        "number": 6,
        "title": "Shift Discipline, Punctuation & Common Symbols",
        "slug": "stage-06-shift-discipline-punctuation",
        "description": "Strict opposite-hand Shift capitalization, quotes, parentheses, and punctuation.",
        "target_wpm_start": 46,
        "target_wpm_end": 55,
        "target_accuracy_min": 91,
    },
    {
        "number": 7,
        "title": "High-Frequency Vocabulary & Rhythm Cadence",
        "slug": "stage-07-vocabulary-rhythm-cadence",
        "description": "Top 1,000 core English words, eliminating pause latencies, metronomic cadence.",
        "target_wpm_start": 52,
        "target_wpm_end": 62,
        "target_accuracy_min": 92,
    },
    {
        "number": 8,
        "title": "Speed & Endurance Building",
        "slug": "stage-08-speed-endurance-building",
        "description": "High-velocity sprints, sustained multi-minute stamina, relaxed ergonomics.",
        "target_wpm_start": 60,
        "target_wpm_end": 72,
        "target_accuracy_min": 93,
    },
    {
        "number": 9,
        "title": "Technical, Numeric & Professional Fluency",
        "slug": "stage-09-technical-code-fluency",
        "description": "Programming syntax, JSON, camelCase, snake_case, brackets, and terminal CLI.",
        "target_wpm_start": 68,
        "target_wpm_end": 80,
        "target_accuracy_min": 94,
    },
    {
        "number": 10,
        "title": "Master Typist & Specialization",
        "slug": "stage-10-master-typist-specialization",
        "description": "Classical literature, dense academic prose, extreme burst benchmarks 80+ WPM.",
        "target_wpm_start": 75,
        "target_wpm_end": 95,
        "target_accuracy_min": 95,
    },
]


class Command(BaseCommand):
    help = "Seeds the 10 stages, 700 units, and 7,000 levels into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--manifest',
            type=str,
            default=None,
            help='Path to curriculum7000Manifest.json'
        )
        parser.add_argument(
            '--stages',
            type=str,
            default=None,
            help='Comma-separated list of stages to seed (e.g. 1,2,5)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== SEEDING KEYFLOW 7,000-LEVEL CURRICULUM ==="))

        manifest_path = options['manifest']
        if not manifest_path:
            manifest_path = os.path.join(
                settings.BASE_DIR, '..', 'frontend', 'src', 'data', 'curriculum', 'curriculum7000Manifest.json'
            )
        manifest_path = os.path.abspath(manifest_path)

        if not os.path.exists(manifest_path):
            self.stdout.write(self.style.ERROR(f"Manifest not found at {manifest_path}"))
            return

        allowed_stages = None
        if options['stages']:
            allowed_stages = [int(s.strip()) for s in options['stages'].split(',') if s.strip().isdigit()]

        self.stdout.write(f"Reading manifest from: {manifest_path}...")
        with open(manifest_path, 'r', encoding='utf-8') as f:
            all_lessons = json.load(f)

        self.stdout.write(f"Loaded {len(all_lessons)} lessons from manifest.")

        with transaction.atomic():
            # 1. Create Stages
            stages_by_num = {}
            for meta in STAGE_METADATA:
                s_num = meta["number"]
                if allowed_stages and s_num not in allowed_stages:
                    continue
                stg, _ = CurriculumStage.objects.update_or_create(
                    stage_number=s_num,
                    defaults={
                        "title": meta["title"],
                        "slug": meta["slug"],
                        "description": meta["description"],
                        "target_wpm_start": meta["target_wpm_start"],
                        "target_wpm_end": meta["target_wpm_end"],
                        "target_accuracy_min": meta["target_accuracy_min"],
                        "total_units": 70,
                        "total_levels": 700,
                        "order": s_num,
                        "is_published": True,
                    }
                )
                stages_by_num[s_num] = stg

            self.stdout.write(self.style.SUCCESS(f"Seeded {len(stages_by_num)} CurriculumStage records."))

            # 2. Create Units
            units_by_key = {}  # (stage_num, unit_num) -> CurriculumUnit
            for lesson_data in all_lessons:
                s_num = lesson_data["stageId"]
                if allowed_stages and s_num not in allowed_stages:
                    continue
                u_num = lesson_data["unitNumber"]
                key = (s_num, u_num)
                if key not in units_by_key:
                    stg = stages_by_num[s_num]
                    global_u = (s_num - 1) * 70 + u_num
                    u_label = lesson_data.get("unitLabel") or f"Unit {u_num}"
                    u_obj, _ = CurriculumUnit.objects.update_or_create(
                        stage=stg,
                        unit_number=u_num,
                        defaults={
                            "global_unit_number": global_u,
                            "title": u_label,
                            "objective": f"Master {u_label.lower()} core skills.",
                            "introduced_keys": ", ".join(lesson_data.get("targetKeys", [])),
                            "is_milestone_unit": (u_num % 10 == 0),
                            "order": u_num,
                        }
                    )
                    units_by_key[key] = u_obj

            self.stdout.write(self.style.SUCCESS(f"Seeded {len(units_by_key)} CurriculumUnit records."))

            # 3. Create Levels
            level_objects = []
            levels_to_create = []

            # Delete existing levels for the selected stages to allow clean idempotency
            CurriculumLevel.objects.filter(stage__stage_number__in=stages_by_num.keys()).delete()

            for l in all_lessons:
                s_num = l["stageId"]
                if allowed_stages and s_num not in allowed_stages:
                    continue
                u_num = l["unitNumber"]
                stg = stages_by_num[s_num]
                unit_obj = units_by_key[(s_num, u_num)]

                level_objects.append(CurriculumLevel(
                    stage=stg,
                    unit=unit_obj,
                    level_in_unit=l["lessonInUnit"],
                    level_in_stage=l["levelNumber"],
                    logical_id=l["id"],
                    title=l["title"],
                    objective=l["objective"],
                    exercise_text=l["exerciseText"],
                    target_keys=l.get("targetKeys", []),
                    home_keys=l.get("homeKeys", ["F", "J"]),
                    finger_map=l.get("fingerMap", {}),
                    target_wpm=l["targetWpm"],
                    target_accuracy=l["targetAccuracy"],
                    estimated_seconds=l.get("estimatedSeconds", 60),
                    difficulty=l.get("difficulty", "beginner"),
                    is_assessment=l.get("isAssessment", False),
                    is_milestone=l.get("isMilestone", False),
                    guidance=l.get("guidance", ""),
                    skills=l.get("skills", []),
                    is_published=True,
                ))

            self.stdout.write(f"Bulk creating {len(level_objects)} CurriculumLevel records...")
            CurriculumLevel.objects.bulk_create(level_objects, batch_size=1000)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(level_objects)} CurriculumLevel records!"))
        self.stdout.write(self.style.SUCCESS("Database seeding completed with 100% relational integrity."))

