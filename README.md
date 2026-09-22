# Operator AI

Personal AI "chief of staff" — a single web app that gives you one chat interface over your email, calendar, drive, tasks, and CRM, plus the usual pages (inbox, calendar, kanban board, notes, contacts) for when you'd rather click than type.

## Features

- **Auth** — email/password and Google OAuth, JWT access/refresh tokens, password reset via email.
- **Email** — real Gmail: list/read/send/reply/star/archive/delete.
- **Calendar** — real Google Calendar: list/create/delete events.
- **Drive** — real Google Drive: list/star/trash (metadata only, no file content access).
- **Tasks** — a self-contained kanban board (own Postgres table, not a real Jira/Atlassian integration).
- **CRM** — contacts (create/search/edit/delete).
- **Notes** — simple notes with auto-save.
- **Chat AI** — Google Gemini with function calling over all of the above (email, calendar, drive, tasks, contacts, notes), with persistent chat history.

## Stack

- **Backend**: Node.js, Express 5, TypeScript, PostgreSQL (raw `pg`, no ORM).
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query.
- **Tests**: Vitest on both sides (backend: services/middleware/schemas with a mocked DB; frontend: hooks/lib with jsdom + React Testing Library).

## Project structure

```
backend/   Express API (src/, migrations/, tests/)
frontend/  Next.js app (src/, tests/)
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or reachable)
- A Google Cloud project with OAuth credentials (Gmail/Calendar/Drive scopes) if you want those features working
- A Gemini API key if you want the chat AI to work

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DB_*, JWT_*_SECRET, GOOGLE_CLIENT_*, GEMINI_API_KEY, SMTP_* (optional)
```

Create the database and apply the SQL migrations in `backend/migrations/` in order (001 → 010) — there's no migration runner, they're plain idempotent SQL files (`create table if not exists` / `create index if not exists`), so they're safe to (re-)apply against your Postgres instance with `psql` or any client.

```bash
npm run dev          # starts the API on :5000 (ts-node via nodemon)
npm run test          # run the test suite
npm run typecheck     # type-check src/ and tests/
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev            # starts the app on :3000
npm run test            # run the test suite
npm run typecheck       # type-check
npm run build            # production build
```

## Environment variables

### `backend/.env`

| Variable | Purpose |
|---|---|
| `NODE_ENV` | set to `production` when deployed — switches the refresh-token cookie to `secure` + `sameSite=none` for cross-site (frontend/backend on different domains) |
| `PORT` | API port (default 5000) |
| `FRONTEND_URL` | used for CORS + OAuth/reset-link redirects |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Postgres connection |
| `DB_SSL` | set to `true` when `DB_HOST` is a managed provider (Supabase, Neon, ...) that requires SSL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | JWT signing secrets |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth (Gmail/Calendar/Drive) |
| `GEMINI_API_KEY` | Google Gemini API key for the chat AI |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | outgoing mail for password reset (optional — without it, reset tokens are still generated, just not emailed) |

### `frontend/.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | base URL of the backend API |

## Deployment

- **Database**: managed Postgres (Supabase/Neon) — set `DB_*` + `DB_SSL=true`.
- **Backend**: any Node host (Render, Railway, ...) — build with `npm run build`, run with `npm run start`, set `NODE_ENV=production` plus all vars above.
- **Frontend**: Vercel — root directory `frontend`, set `NEXT_PUBLIC_API_URL` to the deployed backend's URL.
- Remember to update `GOOGLE_CALLBACK_URL` (backend env) and the authorized redirect URI in Google Cloud Console to the deployed backend's `/auth/google-callback` URL, and `FRONTEND_URL` (backend env) to the deployed frontend's URL.

## Notes

- Not a real Atlassian Jira integration — "Tasks" is a self-contained kanban board in the app's own database.
- Drive access is metadata-only (no scope for reading/writing file contents).
- The Gemini free tier is small (a few requests/minute) — expect occasional 429/503 responses from the chat AI under real usage.
