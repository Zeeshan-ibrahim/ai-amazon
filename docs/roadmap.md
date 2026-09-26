# Roadmap

What is deliberately unfinished, and what each piece will touch.

## 1. Database

In Postgres: `users`, `products` (catalog), `orders` (per-member assignments),
`transactions` (ledger) and `audit_logs`. `backend/src/data/demo.js` is the
seam for the rest — each export becomes a table:

| Export | Table | Notes |
| --- | --- | --- |
| `plans` | `plans` | Static catalog; admin-editable later |
| `myContracts` | `contracts` | `user_id`, `plan_id`, `status`, accrual dates |
| `liveDeposits` | derived | A view over recent verified deposits |
| `depositAssets`, `languages` | config tables | |

Route handlers already isolate every read and write, so swapping in a query
layer should not change `routes/index.js` structure or any response shape — and
therefore should not touch the frontend.

## 2. Authentication

Done: bcrypt hashes, httpOnly JWT cookie, `requireAuth` + `requireRole`,
role-gated frontend apps. Still open:

- Password reset — `/auth/forgot-password` responds but sends nothing.
- Changing the password does not sign out other sessions (would need a
  per-user token version checked in `requireAuth`).
- No login rate limiting.
- Withdrawals don't verify the PIN yet.

## 3. Admin panel

Built: **Members** (list, add, particulars, ledger, orders, audits) and
**Financials** (deposit/withdrawal review queue with receipts). Still
placeholders: analytics, products (catalog CRUD), plans, plan requests,
banners, wallets (the `wallets` table exists and is seeded; there's no admin
screen to manage it yet), my account.

Built without reference screenshots — search the frontend for
`PicturesNeeded` to find them: the member **Ledger** and **Audits** tabs and
the **Add member** modal.

## 4. Balance movement

Deposits and withdrawals are approved per member in the admin Ledger tab,
which moves the balance. Still to build:

- Settlement: what purchasing and selling an order do to the balance, and how
  an order reaches `completed`. Today purchase only moves it to the Sell tab.
- Receipts are stored on local disk (`UPLOAD_DIR`). Move to object storage
  before running more than one API instance.
- Withdrawals are always recorded as USDT TRC20 — the withdraw modal has no
  coin/network picker yet.

- Contract yield accrual on a schedule.

## 5. Smaller gaps

- `/terms`, `/privacy`, `/contact` are linked from the auth footer but not built.
- `/forgot-password` has an endpoint and a link, but no page.
- Language selection persists to the API but nothing is translated yet — no i18n
  layer is wired up.
- Profile picture upload is UI-only.
- The products page shows one active order at a time; pagination through the
  queue is not built.
- The trader Products page's "Awaiting" filter has no matching order status;
  it's always empty until its meaning is defined.
- Unassigning an order isn't supported.
- No tests yet.
