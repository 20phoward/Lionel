# Lionel - CLAUDE.md

## Project Overview
Cross-functional issue management platform for tracking complex compliance/audit findings. Multiple teams (legal, IT, audit, external vendors) collaborate to resolve issues, each with their own workstreams and tasks.

## Tech Stack
- **Backend:** Python 3 / FastAPI / SQLAlchemy / SQLite / python-jose / passlib
- **Frontend:** React 18 / Vite / Tailwind CSS / Recharts / Axios

## Project Structure
```
Lionel/
├── backend/
│   ├── main.py            # FastAPI app, CORS, routers
│   ├── config.py          # Environment config
│   ├── database.py        # SQLAlchemy engine + models
│   ├── auth.py            # Password hashing + JWT utils
│   ├── dependencies.py    # FastAPI deps (get_db, auth, roles)
│   ├── models/schemas.py  # Pydantic request/response schemas
│   ├── routers/           # API route handlers
│   └── tests/             # pytest tests
└── frontend/
    ├── src/
    │   ├── App.jsx         # Router + layout
    │   ├── api/client.js   # Axios API wrapper
    │   ├── contexts/       # React contexts (auth)
    │   └── components/     # React components
    ├── vite.config.js
    └── package.json
```

## Running the App

### Backend (WSL)
```bash
source ~/workspace/lionel-venv/bin/activate
cd /mnt/c/Users/ticta/workspace2/Lionel/backend
uvicorn main:app --reload  # http://localhost:8000
```

### Frontend (WSL, separate terminal)
```bash
cd ~/workspace/lionel-frontend
npx vite --host  # http://localhost:5173
```

### First-time setup
```bash
# Python venv (must be on Linux filesystem)
python3 -m venv ~/workspace/lionel-venv
source ~/workspace/lionel-venv/bin/activate
pip install -r /mnt/c/Users/ticta/workspace2/Lionel/backend/requirements.txt

# Frontend (must be on Linux filesystem)
cp -r /mnt/c/Users/ticta/workspace2/Lionel/frontend ~/workspace/lionel-frontend
cd ~/workspace/lionel-frontend && npm install

# Backend .env
echo "SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" > backend/.env
```

### System deps: `sudo apt install nodejs npm python3.12-venv`

## Key Conventions
- **API prefix:** All endpoints under `/api/`
- **Auth:** JWT tokens (access 30min + refresh 7 days)
- **Roles:** admin, team_lead, member, external
- **First registered user automatically becomes admin**
- **Issue priorities:** critical, high, medium, low
- **Issue statuses:** open, in_progress, blocked, resolved, closed

## Environment Variables
```
SECRET_KEY=<change-in-production>
DATABASE_URL=sqlite:///./lionel.db
```

## When Making Changes
- Backend schemas live in `models/schemas.py`
- New API routes go in `routers/` and get registered in `main.py`
- Auth dependencies in `dependencies.py` — use `require_admin` or `require_admin_or_team_lead`
- Frontend API calls go through `api/client.js`
- Tailwind classes for styling — no separate CSS files

## Current Status
- Phase 1 (foundation) in progress
- 23 backend tests passing (pytest)
- See ROADMAP.md and docs/plans/ for upcoming phases
