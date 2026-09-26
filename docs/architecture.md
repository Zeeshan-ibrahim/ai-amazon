# Architecture

## Overview

A two-process setup. The frontend never talks to a database directly; every
piece of data on screen arrives from the Express API.

```
Browser ──> Next.js (3000) ──fetch──> Express API (4000) ──> PostgreSQL (users)
                                                        └──> demo.js (everything else, in-memory)
```

## Backend

| Path | Role |
| --- | --- |
| `migrations/*.sql` | Schema, applied in order by `src/db/migrate.js` |
| `src/server.js` | App setup: credentialed CORS, JSON + cookie parsing, `/health`, 404 + error handlers |
| `src/routes/index.js` | Access layers — which router sits behind which role check |
| `src/routes/auth.js` | Public: signup, login, logout |
| `src/routes/account.js` | Any signed-in role: `/me`, password/PIN, language |
| `src/routes/admin.js` | `admin` only, mounted at `/api/admin` |
| `src/routes/user.js` | `user` only: dashboard, products, plans, ledger |
| `src/middleware/auth.js` | Session cookie, `requireAuth`, `requireRole` |
| `src/models/users.js` | User queries, hashing, `toPublicUser` |
| `src/data/demo.js` | Data not yet in Postgres — one export per future table |

### Roles

`users.role` is a Postgres enum: `user` or `admin`. Roles are exclusive — an
admin is not a superset of a user. The trader app and the admin panel are
separate products, so `requireRole('user')` guards trader endpoints and
`requireRole('admin')` guards `/api/admin`. `/me` and friends are the only
endpoints both roles share.

The session JWT carries only the user id. `requireAuth` loads the row on every
request, so role changes and suspensions take effect on the next request
rather than when the token expires.

Only two paths write `role`: signup (always `user`) and the
`db:create-admin` script. `PATCH /me` whitelists its fields, so a user cannot
promote themselves or edit their balance.

Every successful response is wrapped in an envelope so the client has one
shape to unwrap:

```json
{ "success": true, "data": { } }
```

Failures return `{ "success": false, "message": "..." }` with a matching HTTP
status. `402` is used specifically for "insufficient balance", and carries a
`data` object with `required` / `current` / `missing` so the UI can render the
funding gap without recalculating it.

## Frontend

Next.js App Router, all pages client components because every screen is
data-driven and interactive.

```
src/
├── app/
│   ├── layout.tsx            Root layout, font, metadata
│   ├── login/, signup/       Auth screens (no app chrome)
│   └── (app)/
│       ├── layout.tsx        SessionProvider + AppShell
│       ├── dashboard/
│       ├── products/
│       ├── plans/
│       ├── history/
│       └── settings/         Account hub ("Mine"): menu → profile/, deposits/,
│                             withdrawals/, security/, help/
│   └── admin/
│       ├── layout.tsx        SessionProvider(role="admin") + AdminShell
│       └── [section]/        Placeholder per admin nav item until built
├── components/
│   ├── ui/                   Primitives: Button, Card, Input, Modal, Tabs, Badge, States, Icons
│   ├── layout/               Sidebar, MobileTabBar, Topbar, DepositTicker, AppShell, SessionProvider
│   ├── admin/                AdminShell, AdminSidebar
│   ├── ledger/               DepositModal, WithdrawModal (shared by dashboard + settings)
│   ├── auth/                 AuthLayout, AuthHero
│   ├── dashboard/  products/  plans/  history/  settings/
├── hooks/                    useApi, useCopy
└── lib/                      api.ts, auth.ts, types.ts, format.ts, cn.ts, nav.ts
```

### Route groups

`(app)` is a route group — it adds the shell (sidebar, ticker, tab bar) without
appearing in URLs. `/login` and `/signup` sit outside it, so they render
full-bleed with no chrome.

### Data fetching

`lib/api.ts` is a thin `fetch` wrapper that unwraps the envelope and throws
`ApiError` on failure. `hooks/useApi.ts` wraps it for components and returns
`{ data, loading, error, refetch }`.

The `fetcher` passed to `useApi` **must be stable** — it is in the effect's
dependency list. Define it at module scope and wrap with `useCallback`:

```tsx
const fetchPlans = () => api.plans() as Promise<PlansPayload>;

const fetcher = useCallback(fetchPlans, []);
const { data, loading, error, refetch } = useApi<PlansPayload>(fetcher);
```

After a mutation (purchase, deposit, plan activation) call `refetch()` rather
than patching local state, so the server stays the source of truth.

### Session and role gating

`SessionProvider` takes a `role` and wraps each app: `(app)/layout.tsx` uses
`role="user"`, `admin/layout.tsx` uses `role="admin"`. It loads `/api/me` once
and then:

- no session → `/login`
- wrong role → that role's home (`homeFor` in `lib/auth.ts`)
- API unreachable → error state with retry

Children render only once the role matches, so neither app flashes for the
wrong person. This is UX; the API is the actual boundary.

It exposes `{ user, loading, refresh, setUser, logout }` via `useSession()`.
The sidebars, topbar and settings page all read from it instead of fetching
the user separately.

`lib/api.ts` sends cookies with every request and hard-redirects to `/login`
on any `401` outside `/auth/*`, which covers sessions expiring mid-use.

Admin sections live at `/admin/<slug>`, listed in `adminNavItems`
(`lib/nav.ts`). Until a section has its own `app/admin/<slug>/page.tsx`, the
`[section]` route renders a placeholder; slugs not in the list are a 404.

### Types

`lib/types.ts` mirrors the shapes in `backend/src/data/demo.js` one to one.
When a field changes on the backend, change it here in the same commit.

## Responsive strategy

Tailwind's `lg` breakpoint (1024px) is the single switch between the mobile and
desktop layouts:

- **Below `lg`** — ticker sticks to the top, bottom tab bar navigates, content
  is a single column, modals slide up from the bottom edge.
- **At `lg` and above** — fixed 276px dark sidebar, topbar, multi-column grids.

Where the designs order sections differently between breakpoints (the dashboard
puts balance above stats on mobile, stats first on desktop), the markup follows
the mobile order and `order-*` utilities rearrange it on desktop. That keeps the
DOM order sensible for screen readers on the smaller layout.
