# Open Lingo — Handoff / Setup Guide

Quick reference for getting set up and oriented. For detailed specs, see `lingo/docs/`.

---

## Project structure

```
open-lingo/
├── lingo/          # Frontend — React, Vite, TypeScript
├── lingo-core/     # Backend API — FastAPI, Python
├── HANDOFF.md      # This file
└── ...
```

---

## Version requirements

| Tool       | Version     |
|------------|-------------|
| Node.js    | 18+         |
| npm        | 9+          |
| Python     | 3.13+       |
| pnpm       | optional    |

---

## Quick start

### 1. Frontend (lingo)

```bash
cd lingo
npm install
npm run dev
```

- App runs at **http://localhost:5173**
- Build: `npm run build`
- Preview prod build: `npm run preview`

### 2. Backend (lingo-core)

```bash
cd lingo-core
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env        # Edit Auth0 and other vars
uvicorn app.main:app --reload
```

- API runs at **http://localhost:8000**
- API docs at **http://localhost:8000/docs**

---

## Environment

### lingo (frontend)

Copy from existing `.env` or create from example. Required vars:

- `VITE_AUTH0_DOMAIN` — Auth0 tenant
- `VITE_AUTH0_CLIENT_ID` — Auth0 app client ID
- `VITE_AUTH0_AUDIENCE` — Auth0 API audience (optional)
- `VITE_API_BASE_URL` — Backend URL (default `http://localhost:8000`)

### lingo-core (backend)

Copy `.env.example` to `.env`. Key vars:

- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` — Auth0 config
- `DB_BACKEND` — `sqlite` (local) or `dynamodb` (prod)
- `SQLITE_PATH` — Path to SQLite DB (e.g. `local.db`)
- `CORS_ORIGINS` — e.g. `["http://localhost:5173"]`
- `DEV_USER` — Auth0 user ID for unauthenticated dev requests

---

## Run both

Start both services. Typical workflow:

1. Terminal 1: `cd lingo-core && source .venv/bin/activate && uvicorn app.main:app --reload`
2. Terminal 2: `cd lingo && npm run dev`

Frontend proxies API calls to the backend; both must be running for auth and user settings.

---

## High-level architecture

- **Frontend:** React 19, Vite 6, React Router 7, Tailwind, Auth0, i18next (en + ko).
- **Backend:** FastAPI, Auth0 JWT, SQLite (dev) or DynamoDB (prod).
- **Languages:** Korean and Japanese; content (flashcards, particles, stories) is mock data.
- **Docs:** `lingo/docs/` — TODO, design, content formats, task specs.

---

## Key docs to read

| Doc                    | Purpose                                           |
|------------------------|---------------------------------------------------|
| `lingo/docs/README.md` | Doc index and `src/` structure                    |
| `lingo/docs/TODO.md`   | Current todos and what’s left                     |
| `lingo/docs/DESIGN.md` | Architecture, folder structure, conventions       |
| `lingo/docs/CONTENT-DESIGN.md` | Course vs community, versioning          |
| `lingo/docs/FLASHCARD-DATA.md` | Vocab manifest, card unlock flow        |
| `lingo-core/README.md` | API structure, DB, routes                         |

---

## Common commands

| Command              | Where    | Description                 |
|----------------------|----------|-----------------------------|
| `npm run dev`        | lingo    | Start dev server            |
| `npm run build`      | lingo    | Production build            |
| `uvicorn app.main:app --reload` | lingo-core | Start API with reload |
| `pytest`             | lingo-core | Run tests                 |

---

## Gotchas

- Frontend expects backend at `http://localhost:8000` by default.
- Auth0 config must match between frontend and backend.
- With `DB_BACKEND=sqlite`, tables are created on first run; data lives in `local.db`.
- Learning language is stored in user settings (API); UI language is in Settings (en/ko).
