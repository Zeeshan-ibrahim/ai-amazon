# API reference

Base URL: `http://localhost:4000/api`

All successful responses are `{ "success": true, "data": ... }`. The tables
below describe the `data` payload. Errors are
`{ "success": false, "message": "..." }`.

## Sessions and roles

Login and signup set an httpOnly `session` cookie (a JWT holding only the user
id, 7-day expiry). Send requests with credentials (`fetch(..., { credentials:
'include' })`). The user row — including `role` and `status` — is re-read on
every request, so a role change or suspension applies immediately.

| Section | Who | Otherwise |
| --- | --- | --- |
| Auth | anyone | — |
| Account | any signed-in role | `401` |
| Admin (`/admin/*`) | `role = super_admin` or `sub_admin` | `401` / `403` |
| Everything else | `role = user` | `401` / `403` |

A suspended account gets `403` everywhere, including login.

## Auth

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `email`, `password` (min 8), `firstName?` | `201 { user }`; `409` if the email exists |
| POST | `/auth/login` | `email`, `password` | `{ user }`; `401` on bad credentials |
| POST | `/auth/logout` | — | `{ message }`, clears the cookie |
| POST | `/auth/forgot-password` | `email` | `{ message }` (no email is sent yet) |

Signup always creates `role = user`; a `role` in the body is ignored. The
first super-admin is created with `npm run db:create-admin`; sub-admins are
created by a super-admin (`POST /admin/sub-admins`).

## Account

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/me` | — | `User` |
| PATCH | `/me` | any of `firstName`, `lastName`, `username`, `phone`, `email`, `language` | updated `User`; `409` if the username is taken |
| PUT | `/me/password` | `currentPassword`, `newPassword`, `confirmPassword`, `scope?` | `{ message }` |
| PUT | `/me/language` | `language` | `{ language }` |
| GET | `/languages` | — | `Language[]` |

`PATCH /me` ignores every other field — `role`, `balance`, `status` and the
login email cannot be changed by the owner. In `PATCH /me`, `email` is the
contact email; `loginEmail` on `User` is the sign-in email.

`/me/password` with `scope: "login"` (default) changes the sign-in password.
With `scope: "pin"` it sets the withdrawal PIN (4–6 digits): `currentPassword`
is the current PIN, or the login password if no PIN is set yet.

`User`: `{ id, role, status, firstName, lastName, displayName, username, email,
loginEmail, phone, avatar, language, balance, doubleLedgerPassword, createdAt }`.
`avatar` may be `null`; `doubleLedgerPassword` is true once a PIN is set.

## Admin

Mounted at `/admin`, for `super_admin` and `sub_admin`. Every change below
writes an `audit_logs` row in the same database transaction.

**Scope** ([roles.md](roles.md)). A super-admin sees everything. A sub-admin
only sees the traders they own (`created_by`), those traders' transactions,
orders, plan requests and audits, their own plans, and their own products plus
the shared catalog (products with no owner, read-only for them). Anything
outside that is `404`, including approving their own balance requests.
Banners, wallets, settings and sub-admins are super-admin only (`403`); My
Balance is sub-admin only (`403`).

### Members

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/members` | `?q=&addedBy=&limit=&offset=` → `{ total, items: Member[] }`. `q` matches name, username, emails, invite code. `addedBy` (super-admin only): a sub-admin's id, or `super` |
| POST | `/admin/members` | `email`, `password` + optional `firstName`, `lastName`, `username`, `phone`, `withdrawalLimit`; super-admins also `role`, `ownerId` → `201 Member`. A sub-admin's new member is always a `user` they own |
| GET | `/admin/members/:id` | `Member` |
| PATCH | `/admin/members/:id` | Any create field, plus `status` (`active`/`suspended`) for super-admins; `email` is the **login** email, `password` resets it. → `{ member, changed: string[] }`. `role`/`status`/`ownerId` from a sub-admin, or changing your own role or status, is `400` |
| GET | `/admin/members/:id/audits` | `AuditEntry[]`, newest first |

`Member` = `User` + `{ inviteCode, withdrawalLimit, lastLoginAt, hasApprovedDeposit, addedBy }`.
`addedBy` is `{ id, handle }` of the owning sub-admin, or `null` (super-admin).

`ownerId` moves a trader to another sub-admin (or `null` → the super-admin);
their history moves with them. Only `user` accounts have an owner, and it must
be an active sub-admin. Changing a `sub_admin` to another role hands their
traders, plans and products back to the super-admin in the same transaction.
Balances always stay with the account.

### Ledger

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/members/:id/transactions` | `LedgerEntry[]` (a `Transaction` plus `receiptName`, `hasReceipt`, `note`) |
| POST | `/admin/members/:id/adjustments` | `direction` (`credit`/`debit`), `amount`, `note?`. Applied immediately; `409` if a debit exceeds the balance |
| POST | `/admin/transactions/:id/approve` | Pending deposit → credits balance; pending withdrawal → debits it (`409` if short) |
| POST | `/admin/transactions/:id/reject` | `note?`. No balance change |

### Financials

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/transactions` | All members. `?type=deposit\|withdrawal&scope=active\|history&limit=&offset=` → `{ total, pending: { deposit, withdrawal }, items: FinancialRequest[] }`. Active = pending; history = completed or rejected |
| GET | `/admin/transactions/:id/receipt` | The uploaded receipt image, inline (`nosniff`, `default-src 'none'`) |

`FinancialRequest` = `LedgerEntry` + `member: { id, displayName, email, role }`.
A super-admin's queue also holds sub-admins' own requests (`member.role = sub_admin`).
`LedgerEntry` carries `coin`, `network`, `address` (deposit: the company
wallet paid into; withdrawal: the member's destination) and `hasReceipt`.

### Orders

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/members/:id/catalog` | `?q=&min=&max=&limit=&offset=` → `{ total, items: CatalogProduct[] }`. `q` matches the title, or the start of the price if numeric. `assigned` says whether this member has it open |
| POST | `/admin/members/:id/orders` | `productId` → `201`. `409` if already open for this member; `400` for admin accounts |

### Product catalog

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/products` | `?limit=&offset=` → `{ total, items: AdminProduct[] }`, active products cheapest first. Each has `addedBy` and `editable` |
| POST | `/admin/products` | `{ title, price, profitPercentage?, imageUrl?, description? }` → `201`. A super-admin's product joins the shared catalog; a sub-admin's is theirs only |
| PATCH | `/admin/products/:productId` | Any of the create fields. Open orders keep the price and profit they were assigned with |
| DELETE | `/admin/products/:productId` | Soft delete (`is_active = false`): gone from the catalog and allocation hub; existing orders are unaffected |

### Plans

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/plans` | `AdminPlan[]` (`Plan` + `addedBy`), active plans cheapest first. A sub-admin gets only their own |
| POST | `/admin/plans` | `{ name, price, tag?, description?, imageUrl? }` → `201`. `price` is in USDT. Shown only to the creator's traders |
| PATCH | `/admin/plans/:planId` | Any of the create fields. Existing contracts keep the price they were activated at |
| DELETE | `/admin/plans/:planId` | Soft delete (`is_active = false`): traders can no longer see or activate it; existing contracts are unaffected |

### Plan requests

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/plan-requests` | `?scope=active\|history&limit=&offset=` → `{ total, pending, items: PlanRequest[] }`. Active = `PENDING`, newest first; history = `ACTIVE`/`REJECTED`, most recently reviewed first. `pending` feeds the tab badge |
| POST | `/admin/plan-requests/:contractId/approve` | `PENDING` → `ACTIVE`. No balance change (the price was debited at activation) |
| POST | `/admin/plan-requests/:contractId/reject` | `PENDING` → `REJECTED` and refunds the price as an approved `plan_refund` credit. `409` if already reviewed |

### Banners

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/banners` | `Banner[]`, newest first — the same list traders get as `banners` in `GET /dashboard` |
| POST | `/admin/banners` | `{ title, description?, imageUrl?, supportNote? }` → `201`. `supportNote` pre-fills the Telegram support chat when a trader taps the banner |
| PATCH | `/admin/banners/:bannerId` | Any of the create fields |
| DELETE | `/admin/banners/:bannerId` | Permanent delete |

### Wallets & support

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/wallets` | Active `Wallet[]` — exactly what traders get from `GET /wallets` in the Deposit Center |
| POST | `/admin/wallets` | `{ coin, network, address }` → `201`; coin and network are stored uppercase. `409` if that network + address is already active. Re-adding a deleted one restores it |
| DELETE | `/admin/wallets/:walletId` | Soft delete: no longer offered for deposits (a deposit naming it gets `400`); past deposits keep their record |
| GET | `/admin/settings` | `{ telegramSupportUrl, globalWithdrawalLimit, updatedAt }` |
| PUT | `/admin/settings` | `{ telegramSupportUrl, globalWithdrawalLimit }`, both saved together. The URL must be `http(s)://…` or empty |

### Sub-admins (super-admin only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/sub-admins` | `SubAdmin[]`, newest first: `User` + `{ inviteCode, lastLoginAt, stats: { members, memberBalance, plans, products, pendingRequests } }` |
| POST | `/admin/sub-admins` | Same body as `POST /admin/members`; the role is always `sub_admin` → `201 Member` |
| GET | `/admin/sub-admins/:id` | `{ subAdmin, members: { total, items }, plans, products: { total, items } }` |
| DELETE | `/admin/sub-admins/:id` | Hands their traders, plans and products to the super-admin, then deletes the account → `{ id, handedBack: { users, plans, products } }`. `409` while they hold a balance or a pending request |

Profile, password, status and role changes go through `PATCH /admin/members/:id`.

### My balance (sub-admin only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/balance` | `{ balance, transactions: Transaction[], wallets: Wallet[] }` |
| POST | `/admin/balance/deposits` | Same multipart body as a trader's `POST /deposits` → `201` pending |
| POST | `/admin/balance/withdrawals` | `{ amount, address }` → `201` pending (USDT TRC20). `400` above the balance |

Both wait for a super-admin in Financials; the balance moves only on approval.

### Overview

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/overview` | `{ members, activeProducts, pendingDeposits, pendingWithdrawals, totalVolume, approvedDeposits, diagnostics, generatedAt }` for My Acc. `members` counts `user` accounts; for a sub-admin every figure covers only their own traders, and a super-admin's pending counts include sub-admins' own requests. `totalVolume` is the sum of member balances right now (equal to their approved ledger, so every deposit, withdrawal, adjustment, order and plan moves it); `approvedDeposits` is the all-time deposit total. `diagnostics` = `{ admin: { role, username, email }, database: { connected, latencyMs }, schema: { version, appliedAt } }` |

## Business rules

- **Assigned orders are hidden until the trader has an approved deposit.**
  `GET /products` returns no items and `meta.depositRequired: true` until
  then. Admin balance adjustments don't count as deposits.
- Deposits and withdrawals are requests. Only admin approval moves the balance.
- The per-withdrawal limit is the member's own `withdrawalLimit` when it's
  above 0, otherwise the global limit from settings; `0` there means no limit.
- Purchasing an order debits its price and moves it to the Sell tab.
  Selling credits price + profit (`totalReturn`) and moves it to Completed.
  Each is recorded as an approved `order_purchase` / `order_sale` ledger row
  linked by `order_id`, committed together with the status change.
- An order copies the product's price and profit % at assignment time.
- Activating a plan debits its current price immediately and records a
  `PENDING` contract plus an approved `plan_activation` ledger row linked by
  `plan_contract_id`, all in one transaction. A member can have only one
  pending contract per plan. Admin approval makes it `ACTIVE`; rejection makes
  it `REJECTED` and refunds the price as a `plan_refund` credit.

## Trader endpoints (`role = user`)

Balances below come from the signed-in user's row.

### Dashboard

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/dashboard` | `{ user, stats, balance, tutorial, capabilities, banners, supportUrl, topEarners }` — `banners` is the admin-managed list; `supportUrl` is the Telegram support link from settings (banners open it, pre-filling their support note on `t.me` links) |
| GET | `/deposits/live` | `LiveDeposit[]` — powers the ticker |

### Products

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/products` | The trader's orders. Optional `?tab=purchase\|sell\|completed` and `?state=assigned\|completed`. Returns `{ meta, items, counts }`; empty with `meta.depositRequired` until a deposit is approved |
| POST | `/products/:id/purchase` | `402` when the balance is short, with `data: { required, current, missing }` |
| POST | `/products/:id/sell` | Purchased → completed, credits `totalReturn`. `409` if not yet purchased or already sold |

### Plans

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/plans` | `{ meta, items: Plan[], contracts: Contract[] }` — `items` is only the plans of the admin who owns this trader (their sub-admin, or the super-admin) |
| POST | `/plans/:id/activate` | Debits the price and creates a `PENDING` contract → `201`. `402` with `data: { required, current, missing }` when the balance is short, `409` if this plan already has a pending request, `404` if the plan was removed or belongs to another admin |

### Ledger

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/transactions` | The trader's own ledger, newest first. Optional `?limit=5` and `?type=deposit\|withdrawal\|adjustment\|order_purchase\|order_sale\|plan_activation\|plan_refund` (`400` otherwise). Each row carries `type`, `coin`, `network`, `address`, `reviewedAt` |
| GET | `/faq` | `{ id, question, answer }[]` for Help & Platform FAQ |
| GET | `/wallets` | Active company wallets: `{ id, coin, network, address }[]` |
| POST | `/deposits` | **multipart/form-data**: `amount` (min 10), `walletId`, `receipt` (JPG/PNG/WEBP, max 5MB, checked by file signature) → `201` pending |
| POST | `/withdrawals` | `amount`, `address`, `pin` → `201` pending (recorded as USDT TRC20). `400` without a PIN set, with a wrong PIN, above the balance or above the withdrawal limit (member's own, else global) |

Neither moves the balance; an admin approves or rejects it. `status` reads
`PENDING`, then `COMPLETED` (approved) or `REJECTED`.

## Misc

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/health` | `{ status: "ok" }` (not under `/api`, no auth) |

## Example

```bash
curl -s -c jar -X POST localhost:4000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"trader@demo.test","password":"password123"}' > /dev/null
curl -s -b jar localhost:4000/api/plans | jq '.data.items[0]'
```

```json
{
  "id": "silver",
  "index": "01",
  "name": "Silver",
  "partner": "Amazon Partner",
  "cycleDays": 7,
  "investment": 50,
  "dailyYield": 4,
  "estimatedYield": 2,
  "totalPayout": 52,
  "description": "Entry-level trading package backed by high-demand Amazon consumer products."
}
```
