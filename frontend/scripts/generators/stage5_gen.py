"""
Stage 5 Generator: Number Row Mastery & Ten-Key Dexterity (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Keys: Numbers [0123456789], lowercase alphabet [a-z], comma, period, hyphen, space.
Zero uppercase (Shift not introduced until Stage 6).
Target WPM: 42 to 50 | Target Accuracy: 90% to 92%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 5
STAGE_TITLE = "Number Row Mastery & Ten-Key Dexterity"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
ALLOWED = set("abcdefghijklmnopqrstuvwxyz0123456789,.;- ")

STAGE_5_UNIT_THEMES = [
    (1, "Index Finger Number Reaches: Keys 4 and 7", ["4", "7"], ["index-numbers-4-7"]),
    (2, "Index Finger Extension: Keys 5 and 6", ["5", "6"], ["index-numbers-5-6"]),
    (3, "Four-Key Central Number Cluster: 4, 5, 6, 7", ["4", "5", "6", "7"], ["central-number-cluster"]),
    (4, "Home-to-Number Recovery Reflex: F to 4, J to 7", ["4", "7", "F", "J"], ["homing-recovery-index"]),
    (5, "Middle Finger Number Reaches: Keys 3 and 8", ["3", "8"], ["middle-numbers-3-8"]),
    (6, "Six-Key Numeric Dexterity: 3, 4, 5, 6, 7, 8", ["3", "4", "5", "6", "7", "8"], ["six-key-numeric"]),
    (7, "Ring Finger Number Reaches: Keys 2 and 9", ["2", "9"], ["ring-numbers-2-9"]),
    (8, "Eight-Key Numeric Coordination: 2 to 9", ["2", "3", "4", "5", "6", "7", "8", "9"], ["eight-key-numeric"]),
    (9, "Outer Pinky Number Reaches: Keys 1 and 0", ["1", "0"], ["pinky-numbers-1-0"]),
    (10, "Milestone Assessment: Complete Top Number Row", ["All Numbers"], ["milestone-benchmark"]),
    (11, "Two-Digit Number Pairs: 10 to 99", ["Number Pairs"], ["two-digit-pairs"]),
    (12, "Three-Digit Sequence Cadence: 100 to 999", ["Three-Digit"], ["three-digit-sequences"]),
    (13, "Four-Digit Year Formats: 1990 to 2030", ["Years"], ["four-digit-years"]),
    (14, "Calendar Dates: Month and Day Numbers", ["Dates"], ["calendar-dates"]),
    (15, "Clock Times and Duration Quantities", ["Times"], ["clock-times"]),
    (16, "Street Addresses and Building Numbers", ["Addresses"], ["street-addresses"]),
    (17, "Postal Codes and Regional Route Numbers", ["Postal Codes"], ["postal-codes"]),
    (18, "Telephone Number Sequences", ["Phone Numbers"], ["phone-numbers"]),
    (19, "Sequential Number Counting: 1 to 50", ["Sequences"], ["sequential-counting"]),
    (20, "Milestone Assessment: Practical Real-World Numbers", ["Real Numbers"], ["milestone-benchmark"]),
    (21, "Metric Units: Grams, Meters, and Liters", ["Metrics"], ["metric-units"]),
    (22, "Physical Dimensions: Length, Width, and Height", ["Dimensions"], ["physical-dimensions"]),
    (23, "Temperatures and Degree Quantities", ["Temperatures"], ["temperature-metrics"]),
    (24, "Percentages and Proportional Figures", ["Percentages"], ["percentage-figures"]),
    (25, "Monetary Quantities: Cents and Dollars", ["Currency"], ["monetary-figures"]),
    (26, "Speed Limits and Distance Figures", ["Distances"], ["distance-figures"]),
    (27, "Page Numbers and Index References", ["Page Numbers"], ["page-references"]),
    (28, "Catalog Serial Identifiers", ["Serials"], ["catalog-serials"]),
    (29, "Inventory Counts and Stock Totals", ["Inventory"], ["inventory-counts"]),
    (30, "Milestone Assessment: Scientific and Commercial Figures", ["Commercial Figures"], ["milestone-benchmark"]),
    (31, "Alternating Letters and Numbers Flow", ["Alpha-Numeric"], ["alternating-alpha-numeric"]),
    (32, "Homing Recovery: Letters to Numbers to Letters", ["Homing"], ["homing-recovery"]),
    (33, "Rapid Single-Digit Injections", ["Injections"], ["single-digit-injections"]),
    (34, "Double-Digit Word Integrations", ["Word Integration"], ["double-digit-words"]),
    (35, "Statistical Research Observations", ["Statistics"], ["statistical-observations"]),
    (36, "Laboratory Experiment Measurement Logs", ["Lab Logs"], ["laboratory-measurements"]),
    (37, "Meteorological Climate Records", ["Climate"], ["climate-records"]),
    (38, "Astronomical Planetary Distance Data", ["Astronomy"], ["astronomical-distances"]),
    (39, "Geological Rock Stratum Ages", ["Geology"], ["geological-ages"]),
    (40, "Milestone Assessment: Quantitative Scientific Prose", ["Scientific Prose"], ["milestone-benchmark"]),
    (41, "Financial Balance Sheets and Revenues", ["Financials"], ["financial-sheets"]),
    (42, "Quarterly Earnings and Growth Rates", ["Earnings"], ["quarterly-earnings"]),
    (43, "Demographic Population Statistics", ["Demographics"], ["population-statistics"]),
    (44, "Architectural Blueprint Dimensions", ["Blueprints"], ["blueprint-dimensions"]),
    (45, "Engineering Tolerances and Clearances", ["Tolerances"], ["engineering-tolerances"]),
    (46, "Aviation Flight and Altitude Figures", ["Aviation"], ["aviation-figures"]),
    (47, "Maritime Coordinates and Nautical Data", ["Maritime"], ["maritime-coordinates"]),
    (48, "Computer Hardware Specifications", ["Hardware Specs"], ["hardware-specifications"]),
    (49, "Network Bandwidth and Latency Figures", ["Bandwidth"], ["bandwidth-figures"]),
    (50, "Milestone Assessment: Technical Systems Data", ["Systems Data"], ["milestone-benchmark"]),
    (51, "High-Density Number Burst Intervals Alpha", ["Number Bursts"], ["bursts-alpha"]),
    (52, "High-Density Number Burst Intervals Beta", ["Number Bursts"], ["bursts-beta"]),
    (53, "High-Density Number Burst Intervals Gamma", ["Number Bursts"], ["bursts-gamma"]),
    (54, "Ten-Key Dexterity Cadence Stabilization", ["Ten-Key"], ["cadence-stabilization"]),
    (55, "Sustained Numeric Transcription Alpha", ["Numeric Prose"], ["sustained-alpha"]),
    (56, "Sustained Numeric Transcription Beta", ["Numeric Prose"], ["sustained-beta"]),
    (57, "Rapid Numeric Reflex Drills", ["Reflexes"], ["numeric-reflexes"]),
    (58, "Zero-Hesitation Top Row Extensions", ["Extensions"], ["zero-hesitation"]),
    (59, "Fluid Transition: Number to Spacebar", ["Spacebar Transition"], ["number-spacebar"]),
    (60, "Milestone Assessment: Advanced Numerical Stamina", ["Numerical Stamina"], ["milestone-benchmark"]),
    (61, "Continuous Industrial Specification Alpha", ["Industrial Specs"], ["industrial-alpha"]),
    (62, "Continuous Industrial Specification Beta", ["Industrial Specs"], ["industrial-beta"]),
    (63, "Continuous Industrial Specification Gamma", ["Industrial Specs"], ["industrial-gamma"]),
    (64, "Zero-Error Quantitative Transcriptions", ["Zero Error"], ["zero-error-quant"]),
    (65, "Subconscious Top Number Touch-Typing", ["Subconscious Touch"], ["subconscious-top"]),
    (66, "Metronomic Alpha-Numeric Cadence", ["Metronome"], ["alpha-numeric-metronome"]),
    (67, "Dense Tabular Numeric Reports", ["Tabular Data"], ["dense-tabular"]),
    (68, "Extended Mathematical Observation Sentences", ["Mathematical"], ["math-observations"]),
    (69, "Sub-Millisecond Number Rebound Conditioning", ["Rebound"], ["number-rebound"]),
    (70, "Grandmaster Stage 5 Graduation Examination", ["Full Number Row"], ["grandmaster-capstone"]),
]

NUMERIC_TEMPLATES = [
    "room {n1} contains {n2} verified artifacts cataloged under section {n3}",
    "flight {n1} departed from gate {n2} carrying {n3} passengers after {n4} minutes",
    "route {n1} extends across {n2} kilometers connecting station {n3} with depot {n4}",
    "order {n1} delivered {n2} units to warehouse {n3} within {n4} working hours",
    "the team recorded {n1} observations in room {n2} across {n3} consecutive days",
    "batch {n1} produced {n2} precision items on day {n3} of month {n4}",
    "file {n1} holds {n2} records detailing {n3} separate transactions from year {n4}",
    "station {n1} serviced {n2} regional trains carrying {n3} tons of supplies across {n4} tracks",
    "sample {n1} demonstrated {n2} percent stability after {n3} minutes at {n4} degrees",
    "building {n1} accommodates {n2} residents across {n3} floors near avenue {n4}",
    "survey {n1} gathered {n2} responses across {n3} districts during week {n4}",
    "engine {n1} generated {n2} units of power over {n3} hours with {n4} percent efficiency",
    "line {n1} transported {n2} containers from pier {n3} to terminal {n4}",
    "packet {n1} traveled through {n2} network nodes with {n3} milliseconds latency on port {n4}",
    "desk {n1} processed {n2} applications from hall {n3} across {n4} scheduled shifts",
    "experiment {n1} analyzed {n2} chemical compounds in sector {n3} within {n4} trials",
    "bus {n1} stops at street {n2} every {n3} minutes between hours {n4} and nine",
    "archive {n1} stores {n2} historical documents from epoch {n3} in cabinet {n4}",
    "sensor {n1} detected {n2} micro fluctuations across {n3} channels after {n4} seconds",
    "chapter {n1} explains {n2} core principles across {n3} pages with {n4} diagram references"
]

def generate_stage5_lessons():
    """Generates exactly 700 unique, pedagogical Stage 5 lessons."""
    lessons = []
    seen_texts = set()
    t_idx = 0
    num_seed = 100

    for unit_num, (u_num, unit_label, target_keys, skills) in enumerate(STAGE_5_UNIT_THEMES, start=1):
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive target lengths
            if level_num <= 70:
                sentences_count = 1
            elif level_num <= 200:
                sentences_count = 2
            elif level_num <= 400:
                sentences_count = 3
            elif level_num <= 600:
                sentences_count = 4
            else:
                sentences_count = 5

            sentences = []
            for _ in range(sentences_count):
                tmpl = NUMERIC_TEMPLATES[t_idx % len(NUMERIC_TEMPLATES)]
                t_idx += 1
                n1 = (num_seed * 3 + 17) % 900 + 100
                n2 = (num_seed * 7 + 23) % 90 + 10
                n3 = (num_seed * 11 + 31) % 800 + 200
                n4 = (num_seed * 13 + 5) % 50 + 10
                num_seed += 1
                sent = tmpl.format(n1=n1, n2=n2, n3=n3, n4=n4)
                sentences.append(sent)

            text = ". ".join(sentences) + "."

            # Uniqueness check
            variant = 1
            base_text = text
            while text in seen_texts:
                extra = f"reference code {num_seed + variant} verified on line {(variant % 8) + 1}."
                text = f"{base_text[:-1]} and {extra}"
                variant += 1
            seen_texts.add(text)

            for ch in text:
                if ch not in ALLOWED:
                    raise ValueError(f"Illegal character '{ch}' in Stage 5 Level {level_num}")

            is_assessment = (l_in_u == 10)
            is_milestone = is_assessment and (unit_num % 10 == 0)

            if level_num == 700:
                title = "Level 700: Grandmaster Number Row Capstone Examination"
                obj = "Graduate from Stage 5 demonstrating flawless top number reaches without looking."
            elif is_milestone:
                title = f"Unit {unit_num} Milestone: {unit_label} Examination"
                obj = f"Comprehensive milestone verification of {unit_label.lower()} across numeric prose."
            elif is_assessment:
                title = f"Unit {unit_num} Assessment: {unit_label} Benchmark"
                obj = f"Verify consistent cadence and accuracy across {unit_label.lower()}."
            else:
                title = f"{unit_label}: Precision Drill {l_in_u}"
                obj = f"Master upward number reaches and homing recovery for {', '.join(target_keys)}."

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

    assert len(lessons) == 700, f"Stage 5 must have exactly 700 lessons, got {len(lessons)}"
    return lessons
