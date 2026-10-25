# KEYFLOW — Premium Typing Academy & Arcade Platform

> **"Less looking. More flowing."**
> A masterclass typing education and biomechanical telemetry platform designed to rewire muscle memory, eliminate glance dependency, and build high-velocity typing fluency.

---

## 🌟 Key Features

- **Neuromuscular Academy (7 Levels):** Structured progression from Home Row tactile anchors to Top Row, Bottom Row, Shift discipline, Numbers & Symbols, Programmer Code Syntax, and High-Velocity Speed Endurance.
- **Typing Arcade (3 Games):**
  - **Key Cascade:** Dynamic falling-words waterfall defense with combo multipliers.
  - **Speed Sprint:** 60-second velocity rush with time-extension mechanics.
  - **Word Hunter:** Target radar matrix elimination for precision eye-hand coordination.
- **12 Studio Color Architectures:** Built with pure CSS custom properties for instant, zero-flash live switching:
  1. *Dark Charcoal + Lime* (Default)
  2. *Classic Black + White* (Minimal)
  3. *Burgundy + Cream* (Warm)
  4. *Midnight Blue* (Ocean)
  5. *Lavender + Purple* (Aesthetic)
  6. *Forest Green* (Calm)
  7. *Ocean Teal* (Vibrant)
  8. *Sunset Orange* (Energetic)
  9. *Rose Pink* (Neon)
  10. *Arctic Blue* (Cool)
  11. *Solarized Light* (Daytime)
  12. *Warm Sand* (Natural)
- **Real-Time Typing Engine:** Sub-millisecond keystroke capture, mechanical audio feedback, live WPM, accuracy, and error cluster detection.
- **Biomechanical Telemetry:** Ten-finger error rate tracking, latency curves, velocity sparklines, and mastery tier badges.
- **Multi-Device Authentication:** Revocable per-device token authentication powered by `django-rest-knox`.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 + Semantic CSS Custom Properties
- **Icons:** Lucide React
- **Animations & Graphs:** Framer Motion + Recharts
- **Linter:** Oxlint

### Backend
- **Language & Framework:** Python 3.14+ / Django 5.2 LTS
- **API Engine:** Django REST Framework 3.18
- **Authentication:** `django-rest-knox` (multi-session token management)
- **Database:** PostgreSQL (production & standard development); explicit opt-in SQLite for local rapid tests
- **Configuration:** `python-decouple` + `dj-database-url`

---

## 📂 Project Structure

```
KEYFLOW-typingWebsite/
├── backend/
│   ├── .env.example              # PostgreSQL & Django environment template
│   ├── .env                      # Local environment configuration
│   ├── manage.py                 # Django CLI entrypoint
│   ├── requirements.txt          # Pinned & verified Python dependencies
│   ├── keyflow/                  # Django project root (settings, urls, wsgi, asgi)
│   ├── accounts/                 # Custom User (email-based), Profile, Preferences, Auth
│   ├── lessons/                  # 7-Level Curriculum & Lesson models
│   ├── practice/                 # Timed, words, and quote practice sessions
│   ├── progress/                 # User analytics, speed records, and keystroke metrics
│   ├── achievements/             # Badges, streaks, and milestone tracking
│   ├── games/                    # Arcade game sessions (Cascade, Sprint, Hunter)
│   ├── leaderboard/              # Real-time velocity & accuracy rankings
│   └── tests/                    # Backend test suite
├── frontend/
│   ├── index.html                # Zero-flash theme hydration & typography
│   ├── package.json              # React 19, Tailwind CSS v4, Lucide dependencies
│   ├── vite.config.js            # Vite + React + Tailwind v4 plugin config
│   └── src/
│       ├── App.jsx               # Application root
│       ├── index.css             # 12-theme CSS variables & typography tokens
│       ├── context/
│       │   └── ThemeContext.jsx  # Theme persistence & switching context
│       ├── components/
│       │   ├── common/           # Button, Navbar, Footer, ThemeSwitcher
│       │   └── landing/          # Hero, Curriculum, Arcade, Themes, Telemetry, CTA
│       └── pages/
│           └── LandingPage.jsx   # Phase 1 Responsive Landing Page
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or later (Node 20+ recommended)
- **Python:** v3.12 or later (Python 3.14 verified)
- **PostgreSQL:** v14 or later (or use SQLite local opt-in)

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows PowerShell:
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Database & Environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   **PostgreSQL Setup (Recommended):**
   ```sql
   CREATE DATABASE keyflow_dev;
   CREATE USER keyflow_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE keyflow_dev TO keyflow_user;
   ```
   In `.env`:
   ```ini
   DATABASE_URL=postgresql://keyflow_user:your_secure_password@localhost:5432/keyflow_dev
   ```

   **SQLite Rapid Testing (Explicit Opt-In):**
   ```ini
   DATABASE_URL=sqlite:///./db.sqlite3
   ```

5. **Apply Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Run Backend Tests:**
   ```bash
   python manage.py test tests
   ```

7. **Start the Development API Server:**
   ```bash
   python manage.py runserver 8000
   ```
   - Health Check: `http://127.0.0.1:8000/api/`
   - Admin Panel: `http://127.0.0.1:8000/admin/`

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify Build & Linters:**
   ```bash
   npm run lint
   npm run build
   ```

4. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```
   - Access the application at: `http://localhost:5173`

---

## 🧪 Verification & Acceptance Checklist (Phase 1)

| Requirement | Status | Verification Detail |
|---|---|---|
| Project directory structure | ✅ Complete | Separate `frontend` and `backend` repositories |
| React 19 + Vite + Tailwind v4 | ✅ Complete | `@tailwindcss/vite` integrated, production bundle passes |
| Python + Django REST Framework | ✅ Complete | Django 5.2 LTS, DRF 3.18, Knox auth installed |
| PostgreSQL Required Configuration | ✅ Complete | Explicit `.env.example`, `DATABASE_URL` checked on boot |
| 12 Studio Themes Design System | ✅ Complete | Pure CSS tokens in `index.css`, live persistent switcher |
| Landing Page Foundation | ✅ Complete | Hero with live sandbox, 7 levels, 3 arcade games, telemetry |
| Reusable Layout Components | ✅ Complete | `Navbar`, `Footer`, `ThemeSwitcher`, `Button` |
| Initial Health-Check API | ✅ Complete | `GET /api/` returns 200 OK with version metadata |
| Automated Backend Tests | ✅ Complete | 7 test cases covering health, models, and 12 themes |
| Documentation & Setup Guide | ✅ Complete | Full instructions in root `README.md` |

---

## 🗺 10-Phase Roadmap

- **Phase 1: Foundation, Design System, & Scaffolding** *(Completed)*
- **Phase 2: Authentication, User Profiles, & Preferences Sync**
- **Phase 3: Core Real-Time Typing Engine & Tactile Feedback**
- **Phase 4: 7-Level Academy Curriculum & Lesson Progression**
- **Phase 5: Practice Modes & Speed/Accuracy Tests**
- **Phase 6: Typing Arcade (Cascade, Sprint, Hunter)**
- **Phase 7: Biomechanical Telemetry & Heatmap Visualizations**
- **Phase 8: Achievements, Streaks, & Badges Engine**
- **Phase 9: Real-Time Leaderboards & Social Competitions**
- **Phase 10: Production Hardening, WCAG AAA Accessibility, & Deployment**
