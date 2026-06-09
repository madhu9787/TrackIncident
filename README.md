# 🔍 Release → Incident Correlator (RIC)

> **Hackathon-ready**: Automatically correlates production incidents to git commits using time-window correlation + Llama 3 diff analysis.

---

## Architecture Decision: Why diff > commit message alone

| Signal | What it tells you | Limitation |
|--------|------------------|------------|
| Commit message | Developer's intent | "fix bug" tells you nothing |
| Files changed | Which component was touched | No detail on *what* changed |
| **Diff hunks** | **Exact code that changed** | Needs `git log -p` |

**This tool uses all three.** The correlation engine narrows candidates by time window, then Llama 3 reads the actual diff to determine whether the changed code path could have caused the incident.

---

## Architecture Flow

```
incidents.csv          commits.json (git log -p)
     │                       │
     └──────────┬────────────┘
                ▼
    ┌─────────────────────┐
    │  Time-window filter  │  ← Commits in [T-6h, T] before incident
    └──────────┬──────────┘
               ▼
    ┌─────────────────────┐
    │  Top-3 candidates   │  ← Ranked by proximity to incident
    └──────────┬──────────┘
               ▼
    ┌─────────────────────┐
    │    Ollama Llama 3   │  ← Reads: incident desc + commit msg + diff
    │   (or heuristic)    │  ← Scores: confidence %, blast radius
    └──────────┬──────────┘
               ▼
    ┌─────────────────────┐
    │   SQLite storage    │  ← Persists analyses for history
    └──────────┬──────────┘
               ▼
      React Dashboard + HTML Report
```

---

## Project Structure

```
release-incident-correlator/
├── backend/
│   ├── main.py              # FastAPI app (upload, correlate, analyze)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Layout + routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # File upload + analyze trigger
│   │   │   ├── Analysis.jsx   # AI results display
│   │   │   └── History.jsx    # Past analyses table
│   │   └── services/api.js    # Axios service layer
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── data/
│   ├── incidents.csv        # Sample: 8 realistic incidents
│   └── commits.json         # Sample: 9 commits with real diffs
├── generate_report.py       # Standalone HTML report (no server needed)
└── README.md
```

---

## Quick Start

### Option A: Full Stack (React + FastAPI)

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Option B: Standalone HTML Report (no server)

```bash
# Heuristic mode (no Ollama needed)
python generate_report.py \
  --incidents data/incidents.csv \
  --commits data/commits.json \
  --output report.html

# With Ollama (better accuracy)
python generate_report.py \
  --incidents data/incidents.csv \
  --commits data/commits.json \
  --output report.html \
  --ollama http://localhost:11434 \
  --model llama3
```

### Option C: Install Ollama for AI mode

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull Llama 3
ollama pull llama3

# Verify
ollama run llama3 "Say hi"
```

---

## Data Formats

### incidents.csv
```csv
id,title,description,timestamp,severity
INC-001,Login 500 errors,"Auth endpoint crashing",2024-01-15T14:32:00Z,critical
```

### commits.json (from `git log -p`)
```json
[{
  "commit_id": "abc123f",
  "author": "Jane Dev",
  "message": "refactor: migrate auth to new JWT lib",
  "timestamp": "2024-01-15T13:55:00Z",
  "files_changed": ["src/auth/TokenValidator.java"],
  "diff": "diff --git a/src/auth/TokenValidator.java..."
}]
```

### Generate from real repo
```bash
git log --no-merges \
  --format='{"commit_id":"%H","author":"%an","message":"%s","timestamp":"%aI"}' \
  -p HEAD~50..HEAD | \
  python3 -c "
import sys, json, re
# Parse git log -p output into JSON array
# (see docs/git-to-json.sh for full script)
" > commits.json
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/incidents` | Upload incidents.csv |
| POST | `/upload/commits` | Upload commits.json |
| POST | `/analyze` | Run correlation + AI analysis |
| GET | `/analyses` | Fetch stored analysis history |
| GET | `/stats` | Dashboard statistics |
| GET | `/health` | Server + Ollama status |

---

## How Confidence Scoring Works

### With Ollama (AI mode)
Llama 3 reads the full diff and answers: *"Given this code change deployed N minutes before this incident, what's the probability it caused it?"*

### Without Ollama (Heuristic mode)
Rule-based scoring:
- **+35 pts**: Keyword overlap between incident title and changed files/diff
- **+15 pts**: Commit deployed <30 min before incident
- **+8 pts**: Commit deployed 30–120 min before incident  
- **+5 pts per occurrence**: TODO/FIXME/BUG/WARNING in diff (signals known issues)

### Blast Radius
| Score | Blast Radius |
|-------|-------------|
| ≥80% | high |
| 60–79% | medium |
| <60% | low |

---

## Environment Variables

```bash
OLLAMA_URL=http://localhost:11434   # Ollama server URL
OLLAMA_MODEL=llama3                  # Model name
TIME_WINDOW_HOURS=6                  # Correlation window in hours
VITE_API_URL=http://localhost:5173   # Frontend API base URL
```

---

## Sample Output

```
[INC-001] Login Failure
  → Commit: a3f8c21 (Sarah Chen, 37m before incident)
  → Confidence: 94%
  → Blast radius: HIGH
  → Explanation: TokenValidator.java was refactored to use new JWT
    library. The null token case was not handled (TODO comment in diff),
    causing NullPointerException at line 142 under production traffic.
  → Recommendation: Rollback a3f8c21. Add null guard before
    parser.parseClaimsJws() call in TokenValidator.validateToken().
```
