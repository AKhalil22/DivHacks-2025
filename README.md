# TechSpace Backend & Frontend

TechSpace is a platform fostering inclusive, mental-health–oriented discussion spaces (“planets”) for underrepresented folks in tech. The backend is a production-grade FastAPI service integrating Firebase Auth (ID token verification) and Firestore (Native mode) for persistence.

## Stack
- **Backend**: FastAPI (Python 3.11+), Firestore, Firebase Admin
- **Auth**: Client-side Firebase email/password; server verifies ID tokens
- **Frontend**: React + Vite
- **Testing**: pytest + httpx TestClient
- **Tooling**: ruff, black, bleach (sanitization), markdown-it-py (extensible), uvicorn

## High-Level Data Model
Collections:
```
users/{uid}
threads/{threadId}
threads/{threadId}/comments/{commentId}
reports/{reportId}
blocks/{blockCompositeId}
```
`threads` store title, body (sanitized), tags[], author_uid, author_mode (public|anon), comment_count, last_activity, timestamps. `comments` store body, author_uid, author_mode, created_at, score (future ranking), timestamps handled at creation.

## Anonymity Model
- Users choose `author_mode` per thread/comment.
- Server always stores `author_uid` for accountability & moderation.
- API masks `author_uid` (returns null) when `author_mode = anon`.
- Future: add privileged moderator role to view identity.

## Rate Limiting
In-memory per-user/minute bucket (env: `RATE_LIMIT_PER_MINUTE`, default 120). Returns HTTP 429 when exceeded. For horizontal scaling, replace with Redis or Cloud Memorystore (token bucket or sliding window). Not cluster-safe as currently implemented.

## Pagination
- Threads: ordered by `last_activity desc`, opaque base64 cursor (doc id + timestamp).
- Comments: `sort=new` by `created_at desc`; `sort=top` by `(score desc, created_at desc)`; cursor includes (id, ts, score for top).

## Required Firestore Indexes
Create these composite indexes early to avoid runtime build delays:
1. Threads list filtered by tag + ordered by last_activity:
   - Collection: `threads`
   - Fields: `tags` (Array contains) + `last_activity` (Descending)
2. Comments top sorting:
   - Collection: `threads/{threadId}/comments`
   - Fields: `score` (Descending), `created_at` (Descending)

Single-field indexes (enabled by default) required: `last_activity`, `created_at`, `username_lower`, `comment_count`.

## Environment Variables (.env)
See `.env.example`:
```
FIREBASE_PROJECT_ID=<project>
FIREBASE_CREDENTIALS_JSON=./service-account.json
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_PER_MINUTE=120
```

## Local Development
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env  # set real values
uvicorn backend.main:app --reload
```
Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Key Endpoints (Summary)
- POST /profiles (create/update, 201 on first create)
- GET /threads (cursor pagination, optional tag)
- POST /threads
- GET /threads/{id}
- GET /threads/{id}/comments (sort=new|top)
- POST /threads/{id}/comments
- POST /reports (202 Accepted)
- POST /blocks (creates user block)

## Testing
Run all tests:
```bash
pytest -q
```
Test coverage includes: profile lifecycle, duplicate username conflict (409), thread & comment pagination, invalid token (401), rate limit (429), not found (404), validation (422).

## Security & Safety
- Firebase ID token must accompany all write operations.
- Sanitization via Bleach (allowlist of safe tags) prevents XSS.
- Anonymity masking applied at response layer (no raw UID for anon posts).
- Rate limiting deters spam; escalate to distributed store in production.

## Future Enhancements
- Upvotes & Wilson score to replace static score field.
- Moderation queue & toxicity scoring (Perspective API) to auto-flag content.
- Search integration (Algolia / OpenSearch) for advanced tag & full-text queries.
- WebSocket or SSE stream for real-time updates.

## License / Attribution
Internal project for DivHacks 2025. Add license file if open-sourcing.