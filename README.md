<p align="center">
  <img src="frontend/public/vite.svg" alt="Logo" width="72" height="72" />
  <h1 align="center">DivHacks 2025 – TechSpace</h1>
  <p align="center">Inclusive, mental‑health–oriented discussion “planets” for underrepresented folks in tech.</p>
</p>

---

## Overview
TechSpace is a full‑stack project (FastAPI + React/Vite) created for DivHacks 2025. It enables users to create themed discussion threads (“planets”), post comments anonymously or publicly, and exercise basic moderation/reporting. The architecture emphasizes safety (sanitization, rate limiting, masked identities) and future extensibility (ranking, moderation intelligence, real‑time updates).

## Features
### Backend (FastAPI)
- Firebase ID token (Bearer) authentication integration
- Thread & comment creation with cursor pagination (opaque base64 tokens)
- Anonymity model (masking of `author_uid` when `author_mode=anon`)
- In‑memory per‑user rate limiting (configurable) with 429 responses
- Username uniqueness & immutability enforcement
- Basic moderation primitives (reports, user blocks)
- Markdown-ish body sanitization via Bleach

### Frontend (React + Vite)
- SPA served separately (dev) or from the API (single‑port mode)
- Auth context & guarded routes
- Thread list, thread detail, create thread, profile & signup flows
- Theming & planetary imagery for “galaxy” navigation metaphor

### Testing
- pytest suite covering: profiles, duplicate username conflict, pagination (threads/comments), validation (422), rate limiting (429), not found (404), invalid auth (401)
- Dummy in‑memory Firestore stand‑ins for deterministic fast tests

## Tech Stack
| Layer      | Technologies |
|------------|--------------|
| Backend    | FastAPI (Python 3.11+), Firebase Admin, Firestore (Native) |
| Auth       | Client Firebase Email/Password (tokens verified server‑side) |
| Frontend   | React, Vite |
| Tooling    | ruff, black, bleach, markdown-it-py, uvicorn |
| Testing    | pytest, httpx TestClient |

## Data Model
Collections:
```
users/{uid}
threads/{threadId}
threads/{threadId}/comments/{commentId}
reports/{reportId}
blocks/{blockCompositeId}
```
`threads`: title, body (sanitized), tags[], author_uid, author_mode (public|anon), comment_count, last_activity, timestamps.

`comments`: body, author_uid, author_mode, created_at, score (future ranking).

## Anonymity Model
- Server always stores raw `author_uid`.
- Response masks UID (returns `null`) if the content was posted with `author_mode=anon`.
- Extensible for moderator override / auditing.

## Pagination
| Entity   | Sort(s) | Cursor Payload |
|----------|---------|----------------|
| Threads  | last_activity desc | id + timestamp |
| Comments | new: created_at desc; top: score desc + created_at desc | id + ts (+ score) |

Base64‑encoded cursors keep client logic opaque & future‑proof.

## Rate Limiting
Simple in‑memory bucket keyed by user+minute. Env: `RATE_LIMIT_PER_MINUTE` (default 120). Replace with Redis / Memorystore for production multi‑instance deployments.

## Required Firestore Indexes
Composite:
1. Threads by tag + last_activity desc  
   - Collection: `threads`  
   - Fields: `tags` (Array contains), `last_activity` (Descending)
2. Comments top sort  
   - Collection: `threads/{threadId}/comments`  
   - Fields: `score` (Descending), `created_at` (Descending)

Single‑field (default): `last_activity`, `created_at`, `username_lower`, `comment_count`.

## Environment Variables
See `.env.example`:
```
FIREBASE_PROJECT_ID=<project>
FIREBASE_CREDENTIALS_JSON=./service-account.json
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_PER_MINUTE=120
```
Optional:
```
TEST_BYPASS_AUTH=1  # development/test helper (still requires Authorization header)
```

## Local Development
Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env   # fill in real values
uvicorn backend.main:app --reload
```
Frontend (separate dev server):
```bash
cd frontend
npm install
npm run dev
```

### Single Port Mode (:8000)
Build + serve React bundle from FastAPI (shared origin):
```bash
./build_frontend.sh   # vite build
./run_backend.sh      # starts uvicorn + static mount
```
Visit: http://127.0.0.1:8000

If port 8000 is busy the script aborts (does not auto-bump) to enforce same-origin semantics.

### When to Use
- Separate dev servers for active UI iteration (fast HMR)
- Single port for demos / simplified deployment

### CORS
Single origin → `ALLOWED_ORIGINS` may be omitted. Dual‑port dev → set `ALLOWED_ORIGINS=http://localhost:5173`.

## Key API Endpoints
| Method | Path | Notes |
|--------|------|-------|
| POST | /profiles | Create/update (201 on first create) |
| POST | /threads | Create thread |
| GET  | /threads | List threads (cursor) |
| GET  | /threads/{id} | Thread detail |
| POST | /threads/{id}/comments | Add comment |
| GET  | /threads/{id}/comments | List comments (sort=new|top) |
| POST | /reports | Accepts report (202) |
| POST | /blocks | Create user block |

## Testing
Run suite:
```bash
pytest -q
```
Coverage highlights: profiles lifecycle, duplicate username (409), pagination flows, auth failures (401), validation (422), rate limiting (429), not found (404).

## Security & Safety
- Bearer ID token required for write endpoints
- Bleach sanitization to mitigate XSS in user content
- UID masking for anonymous posts
- Rate limiting to reduce spam (swap in distributed store for scale)

## Future Enhancements
- Voting + Wilson score ranking
- Advanced moderation (toxicity scoring & queue)
- Full‑text & tag search (OpenSearch / Algolia)
- WebSocket or SSE live updates
- Role‑based moderator visibility of masked UIDs

## Contributing
Issues & PRs welcome. Please open an issue describing significant feature proposals before large changes.

## License / Attribution
Internal project for DivHacks 2025 hackathon. Add a LICENSE file before open‑sourcing.