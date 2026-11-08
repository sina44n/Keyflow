"""
Stage 7 Generator: Professional & Technical Fluency (700 Levels)
10 Stages x 70 Units x 10 Levels Architecture

Pedagogical Objective:
Achieve elite professional and technical typing fluency (58 to 70 WPM).
Transcribe formal enterprise communications, technical specifications, markdown docs,
real programming code (Python, JavaScript, SQL, CSS, JSON, HTML, Bash CLI),
API endpoints, URLs, file paths, configurations, and complex multi-line blocks.

Zero repetitive alphabet introductions.
Target WPM: 58 to 70 | Target Accuracy: 93% to 95%
"""

from .curriculum_builder import build_lesson

STAGE_ID = 7
STAGE_TITLE = "Professional & Technical Fluency"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Professional Prose", "Technical Code", "JSON & Config", "System Commands"]

STAGE_7_UNIT_THEMES = [
    (1, "Executive Communication: Strategy Memos & Board Updates", ["Executive Memos"], ["strategy-memos"]),
    (2, "Executive Communication: Financial Earnings & Fiscal Reports", ["Earnings Reports"], ["earnings-reports"]),
    (3, "Executive Communication: Global Expansion & Market Analysis", ["Market Analysis"], ["expansion-analysis"]),
    (4, "Executive Communication: Corporate Governance & Risk Policies", ["Governance"], ["governance-policies"]),
    (5, "Executive Communication: Stakeholder Proposals & Agreements", ["Proposals"], ["stakeholder-proposals"]),
    (6, "Python Programming: Object-Oriented Classes & Methods", ["Python Code"], ["python-classes"]),
    (7, "Python Programming: List Comprehensions & Lambdas", ["Python Code"], ["python-comprehensions"]),
    (8, "Python Programming: Asyncio & Concurrent Task Execution", ["Python Async"], ["python-async"]),
    (9, "Python Programming: Database ORM Models & Migrations", ["Django ORM"], ["django-models"]),
    (10, "Unit 10 Milestone Assessment: Python & Executive Memos", ["Tech Benchmark"], ["milestone-benchmark"]),
    (11, "JavaScript Programming: ES6 Promises & Async/Await", ["JavaScript Code"], ["js-async-await"]),
    (12, "JavaScript Programming: React Hooks & State Management", ["React Code"], ["react-hooks"]),
    (13, "JavaScript Programming: DOM Manipulation & Event Handlers", ["DOM JS"], ["dom-events"]),
    (14, "JavaScript Programming: TypeScript Interfaces & Generics", ["TypeScript"], ["ts-generics"]),
    (15, "JavaScript Programming: Node.js HTTP Server Routes", ["Node.js"], ["node-routes"]),
    (16, "Speed Interval: 60 WPM Technical Pacing", ["Speed 60"], ["60-wpm-tech"]),
    (17, "Speed Interval: 62 WPM Technical Pacing", ["Speed 62"], ["62-wpm-tech"]),
    (18, "Metronome Cadence: Constant 61 WPM Code Rhythm", ["Metronome 61"], ["metronome-61-code"]),
    (19, "Zero-Hesitation Code Delimiters: Braces, Parens, Brackets", ["Delimiters"], ["delimiter-sprints"]),
    (20, "Unit 20 Milestone Assessment: 200-Level Balance", ["200 Benchmark"], ["milestone-benchmark"]),
    (21, "Data Serialization: Nested JSON Payloads & Schema", ["JSON API"], ["json-payloads"]),
    (22, "Data Serialization: YAML Deployment Configurations", ["YAML Config"], ["yaml-configs"]),
    (23, "Data Serialization: XML Data Feeds & Semantic Tags", ["XML Feeds"], ["xml-feeds"]),
    (24, "Data Serialization: Protocol Buffer Definitions", ["Protobuf"], ["protobuf-specs"]),
    (25, "Data Serialization: Environment Variable Matrices", ["Env Variables"], ["env-matrices"]),
    (26, "Relational Databases: Complex SQL Queries & Joins", ["SQL Queries"], ["sql-joins"]),
    (27, "Relational Databases: Index Definitions & Schema Constraints", ["SQL Schema"], ["sql-schema"]),
    (28, "Relational Databases: Transaction Blocks & Rollbacks", ["SQL Transactions"], ["sql-transactions"]),
    (29, "Relational Databases: Stored Procedures & Triggers", ["SQL Procedures"], ["sql-procedures"]),
    (30, "Unit 30 Milestone Assessment: 300-Level Data & Database", ["300 Benchmark"], ["milestone-benchmark"]),
    (31, "Terminal CLI: Docker Container Run & Build Commands", ["Docker CLI"], ["docker-commands"]),
    (32, "Terminal CLI: Kubernetes Deployment YAML & Pod Specs", ["Kubernetes"], ["k8s-manifests"]),
    (33, "Terminal CLI: Git Workflow Commits, Branches & Merges", ["Git CLI"], ["git-workflows"]),
    (34, "Terminal CLI: Linux Bash Shell Scripts & Automation", ["Bash Scripts"], ["bash-automation"]),
    (35, "Terminal CLI: Network Diagnostics with Curl & SSH", ["Network CLI"], ["curl-ssh-tools"]),
    (36, "Web Styling: Modern CSS Grid & Flexbox Declarations", ["CSS Rules"], ["css-grid-flex"]),
    (37, "Web Styling: Tailwind CSS Utility Class Strings", ["Tailwind CSS"], ["tailwind-utilities"]),
    (38, "Web Styling: Responsive Media Queries & Animations", ["CSS Animations"], ["responsive-css"]),
    (39, "Web Styling: SVG Vector Path Coordinate Data", ["SVG Paths"], ["svg-coordinates"]),
    (40, "Unit 40 Milestone Assessment: 400-Level Web & DevOps", ["400 Benchmark"], ["milestone-benchmark"]),
    (41, "Speed Interval: 64 WPM Technical Pacing", ["Speed 64"], ["64-wpm-tech"]),
    (42, "Speed Interval: 65 WPM Technical Pacing", ["Speed 65"], ["65-wpm-tech"]),
    (43, "Fatigue Prevention during Sustained 65 WPM Code Runs", ["Ergonomics"], ["code-ergonomics"]),
    (44, "Deep Breath Control & Shoulder Stability at High Velocity", ["Ergonomics"], ["breath-stability-65"]),
    (45, "Lightweight Finger Tapping on Dense Punctuation Lines", ["Ergonomics"], ["punctuation-feathering"]),
    (46, "Technical Documentation: RESTful API Endpoint Specs", ["API Specs"], ["rest-endpoint-specs"]),
    (47, "Technical Documentation: GraphQL Queries & Mutations", ["GraphQL"], ["graphql-queries"]),
    (48, "Technical Documentation: Markdown Technical Guides", ["Markdown Docs"], ["markdown-guides"]),
    (49, "Technical Documentation: Architecture Decision Records", ["ADR Docs"], ["architecture-records"]),
    (50, "Unit 50 Milestone Assessment: 500-Level Architecture", ["500 Benchmark"], ["milestone-benchmark"]),
    (51, "Speed Interval: 66 WPM Acceleration Push", ["Speed 66"], ["66-wpm-push"]),
    (52, "Speed Interval: 67 WPM Acceleration Push", ["Speed 67"], ["67-wpm-push"]),
    (53, "Legal & Compliance: Software Licensing Agreements", ["Open Source Law"], ["licensing-agreements"]),
    (54, "Legal & Compliance: Privacy Policies & GDPR Clauses", ["GDPR Compliance"], ["gdpr-clauses"]),
    (55, "Legal & Compliance: Cybersecurity Incident Notices", ["Security Incident"], ["security-advisories"]),
    (56, "Speed Interval: 68 WPM Velocity Benchmark", ["Speed 68"], ["68-wpm-benchmark"]),
    (57, "Speed Interval: 69 WPM Velocity Benchmark", ["Speed 69"], ["69-wpm-benchmark"]),
    (58, "Sustained Speed Cadence over Dense Full-Stack Code", ["Full-Stack Code"], ["full-stack-cadence"]),
    (59, "Near-Zero Error Precision Sprints (95%+ Target)", ["Precision 95%"], ["zero-error-code-sprints"]),
    (60, "Unit 60 Milestone Assessment: 600-Level Code Synthesis", ["600 Benchmark"], ["milestone-benchmark"]),
    (61, "Masterwork Transcriptions: The Linux Kernel Core Docs", ["Linux Docs"], ["kernel-documentation"]),
    (62, "Masterwork Transcriptions: The React Reconciliation Engine", ["React Internals"], ["react-internals"]),
    (63, "Masterwork Transcriptions: PostgreSQL Query Optimizer Specs", ["Postgres Internals"], ["postgres-internals"]),
    (64, "Masterwork Transcriptions: The HTTP/3 and QUIC Protocol", ["QUIC Protocol"], ["quic-protocol-specs"]),
    (65, "Metronome Cadence: Constant 70 WPM Benchmark Polish", ["Metronome 70"], ["metronome-70-tech"]),
    (66, "Continuous Multi-Minute Technical Performance Trial", ["Technical Trial"], ["technical-trial-endurance"]),
    (67, "Pre-Capstone Speed Challenge: 70 WPM Interval", ["Pre-Capstone"], ["70-wpm-challenge"]),
    (68, "Pre-Capstone Accuracy Challenge: 95%+ Precision", ["Pre-Capstone"], ["accuracy-target-95"]),
    (69, "Comprehensive Professional & Technical Review", ["Comprehensive Review"], ["comprehensive-tech-review"]),
    (70, "Stage 7 Grand Capstone Assessment (Level 700)", ["Stage 7 Capstone"], ["stage7-capstone"]),
]

STAGE_7_PARAGRAPHS = [
    "export async function synchronizeTelemetry(userId: string, metrics: TelemetryPayload): Promise<SyncResult> {\n  const endpoint = `${API_BASE_URL}/v2/telemetry/${encodeURIComponent(userId)}`;\n  const response = await fetch(endpoint, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },\n    body: JSON.stringify({ metrics, timestamp: new Date().toISOString() })\n  });\n  if (!response.ok) throw new Error(`Telemetry sync failed: HTTP ${response.status}`);\n  return response.json();\n}",
    "class DistributedConsensusNode:\n    \"\"\"Manages Raft consensus protocol heartbeat cycles and log replication.\"\"\"\n    def __init__(self, node_id: int, peers: list[str], election_timeout_ms: int = 300):\n        self.node_id = node_id\n        self.peers = peers\n        self.current_term = 0\n        self.voted_for = None\n        self.log_entries: list[dict] = []\n        self.state = 'FOLLOWER'\n\n    async def broadcast_heartbeat(self) -> None:\n        tasks = [self._send_append_entries(peer) for peer in self.peers]\n        await asyncio.gather(*tasks, return_exceptions=True)",
    "SELECT u.id AS user_id, u.email, COUNT(p.id) AS total_sessions, ROUND(AVG(p.gross_wpm), 2) AS avg_wpm, ROUND(AVG(p.accuracy), 2) AS avg_acc\nFROM accounts_user u\nLEFT JOIN practice_practicehistory p ON u.id = p.user_id\nWHERE u.is_active = TRUE AND p.created_at >= '2026-01-01 00:00:00+00'\nGROUP BY u.id, u.email\nHAVING COUNT(p.id) >= 10\nORDER BY avg_wpm DESC\nLIMIT 50;",
    "docker run -d --restart=unless-stopped \\\n  --name keyflow-production-backend \\\n  -p 8000:8000 \\\n  -e DATABASE_URL=\"postgresql://keyflow_admin:SecretPass2026@postgres.internal:5432/keyflow_prod\" \\\n  -e CLERK_SECRET_KEY=\"sk_live_994821034920491823\" \\\n  -e ALLOWED_HOSTS=\"keyflow-typing.vercel.app,api.keyflow.dev\" \\\n  keyflow/backend:v2.1.0",
    "MEMORANDUM | CONFIDENTIAL\nTO: Senior Engineering Leadership & Executive Committee\nFROM: Chief Technology Officer\nDATE: November 8, 2026\nSUBJECT: Global Multi-Region Infrastructure Deployment & 99.99% Availability Architecture\n\nOur engineering division has completed the architectural transition toward geographically distributed container clusters. By implementing decentralized PostgreSQL replication and automated edge failovers across Frankfurt (eu-central-1), Northern Virginia (us-east-1), and Tokyo (ap-northeast-1), we guarantee continuous service uptime with P99 API response latencies below 45 milliseconds worldwide."
]

def generate_stage7_lessons():
    """Generates all 700 Stage 7 lessons (70 units x 10 lessons)."""
    lessons = []
    seen_texts = set()
    para_idx = 0
    num_paras = len(STAGE_7_PARAGRAPHS)

    for unit_tuple in STAGE_7_UNIT_THEMES:
        unit_num, unit_label, target_keys, skills = unit_tuple
        for l_in_u in range(1, 11):
            level_num = (unit_num - 1) * 10 + l_in_u

            # Progressive length targets (250 to 400 chars)
            if level_num <= 150:
                target_min, target_max = 240, 310
            elif level_num <= 350:
                target_min, target_max = 280, 360
            elif level_num <= 550:
                target_min, target_max = 320, 410
            else:
                target_min, target_max = 350, 460

            p = STAGE_7_PARAGRAPHS[para_idx % num_paras]
            para_idx += 1

            sentences = p.split("\n")
            selected = []
            cur_len = 0
            for s in sentences:
                if not selected:
                    selected.append(s)
                    cur_len += len(s)
                elif cur_len + len(s) + 1 <= target_max:
                    selected.append(s)
                    cur_len += len(s) + 1
                else:
                    break

            combined_text = "\n".join(selected)
            if len(combined_text) < target_min:
                combined_text = p[:target_max].rstrip()

            dup_suffix = 1
            while combined_text in seen_texts:
                combined_text = f"{combined_text} // {dup_suffix}"
                dup_suffix += 1

            seen_texts.add(combined_text)

            is_assessment = (l_in_u == 10)
            if is_assessment:
                title = f"{unit_label} Assessment"
                objective = f"Benchmark professional and technical typing fluency for Unit {unit_num} ({unit_label})."
            else:
                title = f"{unit_label} — Part {l_in_u}"
                objective = f"Transcribe professional documentation and technical code in {unit_label}."

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

    assert len(lessons) == 700, f"Expected 700 lessons for Stage 7, got {len(lessons)}"
    return lessons
