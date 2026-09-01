# ApexScout Hockey Enterprise (Pro)

An enterprise-grade, real-time scouting, recruiting, and draft analytics platform tailored specifically for **NHL front offices**, **NCAA Division I coaching staffs**, and **CHL/USHL junior recruiters**.

---

## ?? What Makes ApexScout 10x Better than Legacy Tools (RinkNet, FastModel, InStat, Elite Prospects)

| Capability | Legacy Systems (RinkNet / FastModel / Elite Prospects) | **ApexScout Hockey Enterprise** |
| :--- | :--- | :--- |
| **Interface & Performance** | Clunky 1990s desktop grids, slow sync, heavy lag on mobile | **Ultra-fast dark-mode glassmorphic web command center** with zero-latency updates |
| **Ice Rink Analytics** | Static box scores or text play-by-play | **Interactive 2D NHL regulation rink visualizer** with xG danger rings, transition vectors, & shot inspection |
| **Scout Grading System** | Inconsistent 1-5 star ratings across regional spreadsheets | **Normalized 20-80 Pro Scout Tool Scale** with dynamic spider radar overlays & NHL benchmark baselines |
| **War Room & Draft Board** | Static whiteboard photos or disconnected Excel sheets | **Interactive drag-and-drop Big Board** with real-time **Consensus Discrepancy & Outlier Detection** |
| **NCAA Portal & Compliance** | Manual tracking of transfer portal tweets & eligibility | **Live Transfer Portal Hub** with **18.0 Scholarship Calculator**, NIL valuations, & visit scheduler |
| **Organizational Depth Chart** | Disconnected from future draft capital | **3-Year Roster War Room** with automated player age/overall progression & ELC slide tracking |
| **In-Rink Note Taking** | Frustrating forms in cold rinks | **One-tap live shift logger** optimized for scouts on tablets and touchscreens |
| **AI Consensus Synthesis** | 100+ hours manually condensing regional scout notes | **Automated AI Dossier Synthesizer** generating instant GM executive briefs and draft day cards |

---

## ?? Quick Start

Ensure `uv` is available, then launch with a single command:

```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\apexscout-hockey
uv run --with fastapi --with uvicorn --with jinja2 python run.py
```

Open your browser to:
?? **`http://127.0.0.1:8050`**

---

## ?? Modules & Features

### 1. 360? Prospect Intelligence
- Full bio, verified combine biometrics (height, weight, wingspan, top skating speed in MPH).
- 20-80 Pro Scout Tool Matrix (Skating Pace, Agility/Edges, Puck Skills, Vision, Hockey IQ, Shot, Compete, Physicality, Defense).
- Video event bookmark logs (`[Transition Rush]`, `[Power Play]`, `[Forecheck Turnover]`, `[Gap Control]`).

### 2. Interactive 2D Ice Rink Visualizer
- Full regulation NHL dimensions (200ft x 85ft).
- Expected Goals (xG) color coding:
  - **Ruby Red**: High Danger Slot (xG > 0.20)
  - **Amber Gold**: Medium Danger (0.08 - 0.20)
  - **Cyan Blue**: Perimeter (< 0.08)
  - **Glowing Gold Ring**: Confirmed Goals
- Controlled zone entry vectors & exit paths.

### 3. War Room Big Board & Consensus Outlier Matrix
- Drag-and-drop tiers (Tier 1 Franchise to Tier 4 Depth).
- Automated variance detection:
  - **Scout Bull**: Highlights when a regional scout rates a player far higher than consensus.
  - **Analytics Bull**: Highlights when micro-stats model strongly favors a prospect.
  - **High Variance Caution**: Flags high disagreement across the staff.

### 4. NCAA Transfer Portal & Scholarship Optimizer
- Live portal feed with eligibility remaining and NIL bracket estimates.
- Interactive **18.0 Scholarship Unit Calculator** (adjust fractions between 1.0 full ride, 0.85, 0.75, 0.50, and walk-on).

### 5. 3-Year Depth Chart Simulator
- 4 forward lines, 3 defense pairs, 2 goalies, and junior/NCAA pipeline reserves.
- Dynamic timeline projection slider (`2026-27`, `2027-28`, `2028-29`) with age and rating development.

### 6. Live In-Rink Scout Shift Logger
- Rapid 1-tap micro-event logger (`[Controlled Entry]`, `[Entry Denial]`, `[Puck Battle Win]`, `[High Danger Pass]`, `[Slot Shot]`, `[D-Zone Turnover]`).
- Instant live stream sync with timestamps.
