# Architecture

## Overview

A two-process setup. The frontend never talks to a database directly; every
piece of data on screen arrives from the Express API.

```
Browser ──> Next.js (3000) ──fetch──> Express API (4000) ──> demo.js (in-memory)
```

## Backend

`backend/` is deliberately minimal — four files do the whole job.

| Path | Role |
| --- | --- |
| `src/server.js` | App setup: CORS, JSON body parsing, `/health`, 404 + error handlers |
| `src/routes/index.js` | Every endpoint, grouped by domain with section comments |
| `src/data/demo.js` | The in-memory dataset — one export per future table |

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
│       └── settings/
├── components/
│   ├── ui/                   Primitives: Button, Card, Input, Modal, Tabs, Badge, States, Icons
│   ├── layout/               Sidebar, MobileTabBar, Topbar, DepositTicker, AppShell, SessionProvider
│   ├── ledger/               DepositModal, WithdrawModal (shared by dashboard + settings)
│   ├── auth/                 AuthLayout, AuthHero
│   ├── dashboard/  products/  plans/  history/  settings/
├── hooks/                    useApi, useCopy
└── lib/                      api.ts, types.ts, format.ts, cn.ts, nav.ts
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

### Session

`SessionProvider` loads `/api/me` once for the whole `(app)` group and exposes
`{ user, loading, refresh, setUser }` via `useSession()`. The sidebar, topbar,
and settings page all read from it instead of fetching the user separately.

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
