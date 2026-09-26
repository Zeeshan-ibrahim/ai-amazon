# Quick On Amazon

Amazon arbitrage trading dashboard — a Next.js frontend and an Express API.
<!-- here -->
```
.
├── backend/    Express 5 + Node (ESM) + PostgreSQL.
├── frontend/   Next.js 15 App Router + Tailwind CSS + TypeScript.
└── docs/       Architecture, API reference, and design system notes.
```

## Getting started

Needs Node 20.12+ and a running PostgreSQL. Two terminals — the backend must
be running before the frontend can load data.

```bash
# terminal 1 — API on http://localhost:4000
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET (openssl rand -hex 32)
createdb quick_on_amazon
npm run db:migrate
npm run db:seed             # dev accounts, see below
npm run dev

# terminal 2 — web on http://localhost:3000
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000 and sign in.

| Seeded account | Password | Role | Lands on |
| --- | --- | --- | --- |
| `trader@demo.test` | `password123` | `user` | `/dashboard` — approved deposit, sees 3 assigned orders |
| `locked@demo.test` | `password123` | `user` | `/dashboard` — deposit still pending, so orders are hidden |
| `admin@demo.test` | `password123` | `admin` | `/admin` |

`npm run db:seed` also adds two more members, a 30-product catalog and four
placeholder deposit wallets.

Create a real admin with
`npm run db:create-admin -- --email you@example.com --password '...' --username admin`.
Signup can only ever create `user` accounts.

## Environment

`frontend/.env.local` (already created, copy from `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`backend/.env` — see `backend/.env.example`: `DATABASE_URL`, `JWT_SECRET`,
`CLIENT_ORIGIN` (the frontend origin allowed to send the session cookie),
`UPLOAD_DIR` (receipt screenshots; defaults to `backend/uploads`).

## Screens

| Route | Description |
| --- | --- |
| `/login`, `/signup` | Split hero / form auth screens |
| `/dashboard` | Balance, stats, tutorial, capabilities, campaigns, top earners |
| `/products` | Purchase / Sell / Completed order queues with funding checks |
| `/plans` | Partnership packages and investment contracts |
| `/history` | Full transaction ledger |
| `/settings` | Profile, credentials, language, recent ledger actions |
| `/admin/members` | Member list, search, add member |
| `/admin/members/:id` | Particulars, ledger (approve deposits, adjust balance), orders (assign contracts), audits |
| `/admin/financials` | Deposit and withdrawal requests from all members — approve, reject, view receipt |
| `/admin/*` | Other admin sections — placeholders |

## Roles

Two apps, one login. `user` accounts get the trading app (`/dashboard`,
`/products`, …); `admin` accounts get `/admin`. Each side redirects the other
role to its own home, and the API enforces the same split — admins get `403`
on trader endpoints and vice versa.

## Current state

Users, the product catalog, orders, transactions and the audit log live in
Postgres. Plans, contracts and dashboard content are still in-memory demo data
in `backend/src/data/demo.js`, until their rules are defined. See [docs/roadmap.md](docs/roadmap.md) for what a real database layer
needs to touch.

More detail: [docs/architecture.md](docs/architecture.md),
[docs/api.md](docs/api.md), [docs/design-system.md](docs/design-system.md).
