# Quick On Amazon

Amazon arbitrage trading dashboard — a Next.js frontend and an Express API.

```
.
├── backend/    Express + Node (ESM). Serves demo data, no database yet.
├── frontend/   Next.js 15 App Router + Tailwind CSS + TypeScript.
└── docs/       Architecture, API reference, and design system notes.
```

## Getting started

Two terminals — the backend must be running before the frontend can load data.

```bash
# terminal 1 — API on http://localhost:4000
cd backend
npm install
npm run dev

# terminal 2 — web on http://localhost:3000
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000. `/` redirects to `/dashboard`.

## Environment

`frontend/.env.local` (already created, copy from `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`backend/.env` is optional — `PORT` defaults to `4000`.

## Screens

| Route | Description |
| --- | --- |
| `/login`, `/signup` | Split hero / form auth screens |
| `/dashboard` | Balance, stats, tutorial, capabilities, campaigns, top earners |
| `/products` | Purchase / Sell / Completed order queues with funding checks |
| `/plans` | Partnership packages and investment contracts |
| `/history` | Full transaction ledger |
| `/settings` | Profile, credentials, language, recent ledger actions |

## Current state

Auth is not enforced — the API returns a demo token and every endpoint serves
the same in-memory user. Data lives in `backend/src/data/demo.js` and resets on
restart. See [docs/roadmap.md](docs/roadmap.md) for what a real database layer
needs to touch.

More detail: [docs/architecture.md](docs/architecture.md),
[docs/api.md](docs/api.md), [docs/design-system.md](docs/design-system.md).
