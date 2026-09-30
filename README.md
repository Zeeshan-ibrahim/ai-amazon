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
| `admin@demo.test` | `password123` | `super_admin` | `/admin` — everything |
| `subadmin@demo.test` | `password123` | `sub_admin` | `/admin` — only their own members, plans and products |
| `nora.ali@demo.test` | `password123` | `user` | `/dashboard` — owned by the sub-admin, sees only their plans |

`npm run db:seed` also adds more members, a 30-product catalog and four
placeholder deposit wallets.

Create the first super-admin with
`npm run db:create-admin -- --email you@example.com --password '...' --username admin`.
Sub-admins are created by a super-admin at `/admin/sub-admins`. Signup can only
ever create `user` accounts.

## Environment

`frontend/.env.local` (already created, copy from `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`backend/.env` — see `backend/.env.example`: `DATABASE_URL`, `JWT_SECRET`,
`CLIENT_ORIGIN` (the frontend origin allowed to send the session cookie),
`UPLOAD_DIR` (receipt screenshots; defaults to `backend/uploads`).

In production the database and receipts live in Supabase: point `DATABASE_URL`
at the Transaction pooler (port 6543) and set `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_BUCKET` (a private bucket, default
`receipts`). Without `SUPABASE_URL`, receipts are written to `UPLOAD_DIR`.

Production deploys run `npm run db:migrate` as the backend's Vercel build step
(`vercel.json`), so pending migrations apply before the new code goes live and a
failing migration fails the deploy. Preview deploys skip it.

## Screens

| Route | Description |
| --- | --- |
| `/login`, `/signup` | Split hero / form auth screens |
| `/dashboard` | Balance, stats, tutorial, capabilities, admin banners, top earners |
| `/products` | Purchase / Sell / Completed order queues with funding checks |
| `/plans` | Admin-managed plans — activate one from your balance; your contracts |
| `/history` | Full transaction ledger |
| `/settings` | Profile, credentials, language, recent ledger actions |
| `/admin/members` | Member list, search, add member |
| `/admin/members/:id` | Particulars, ledger (approve deposits, adjust balance), orders (assign contracts), audits |
| `/admin/financials` | Deposit and withdrawal requests from all members — approve, reject, view receipt |
| `/admin/plans` | Create, edit and delete the plans traders see on `/plans` |
| `/admin/plan-requests` | Plan activations from all members — approve, or reject and refund; history |
| `/admin/banners` | Create, edit and delete the banners shown on every member's dashboard |
| `/admin/analytics` | Same overview as My Acc |
| `/admin/account` | My Acc: group overview — members, products, pending requests, total volume, system diagnostics |
| `/admin/wallets` | Deposit wallets (the only ones traders can pay into), Telegram support link, global withdrawal limit |
| `/admin/sub-admins` | Super-admin only: sub-admins, what each owns, create / delete |
| `/admin/balance` | Sub-admin only: their own balance, deposit and withdrawal requests (approved by a super-admin) |
| `/admin/*` | Other admin sections — placeholders |

## Roles

Two apps, one login. `user` accounts get the trading app (`/dashboard`,
`/products`, …); `super_admin` and `sub_admin` accounts get `/admin`. Each side
redirects the other role to its own home, and the API enforces the same split —
admins get `403` on trader endpoints and vice versa.

A super-admin sees everything. A sub-admin sees only the members, plans and
products they created (plus the shared catalog), and a member only sees their
owner's plans. The full rules are in [docs/roles.md](docs/roles.md).

## Current state

Users, the product catalog, orders, transactions and the audit log live in
Postgres. Plans, contracts and dashboard content are still in-memory demo data
in `backend/src/data/demo.js`, until their rules are defined. See [docs/roadmap.md](docs/roadmap.md) for what a real database layer
needs to touch.

More detail: [docs/architecture.md](docs/architecture.md),
[docs/api.md](docs/api.md), [docs/design-system.md](docs/design-system.md).
