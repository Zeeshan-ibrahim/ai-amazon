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
| Admin (`/admin/*`) | `role = admin` | `401` / `403` |
| Everything else | `role = user` | `401` / `403` |

A suspended account gets `403` everywhere, including login.

## Auth

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `email`, `password` (min 8), `firstName?` | `201 { user }`; `409` if the email exists |
| POST | `/auth/login` | `email`, `password` | `{ user }`; `401` on bad credentials |
| POST | `/auth/logout` | — | `{ message }`, clears the cookie |
| POST | `/auth/forgot-password` | `email` | `{ message }` (no email is sent yet) |

Signup always creates `role = user`; a `role` in the body is ignored. Admins
are created with `npm run db:create-admin`.

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

Mounted at `/admin`, admin only. Every change below writes an `audit_logs`
row in the same database transaction.

### Members

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/members` | `?q=&limit=&offset=` → `{ total, items: Member[] }`. `q` matches name, username, emails, invite code |
| POST | `/admin/members` | `email`, `password` + optional `firstName`, `lastName`, `username`, `phone`, `role`, `withdrawalLimit` → `201 Member` |
| GET | `/admin/members/:id` | `Member` |
| PATCH | `/admin/members/:id` | Any create field; `email` is the **login** email, `password` resets it. → `{ member, changed: string[] }`. Changing your own role is `400` |
| GET | `/admin/members/:id/audits` | `AuditEntry[]`, newest first |

`Member` = `User` + `{ inviteCode, withdrawalLimit, lastLoginAt, hasApprovedDeposit }`.

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

`FinancialRequest` = `LedgerEntry` + `member: { id, displayName, email }`.
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
| GET | `/admin/products` | `?limit=&offset=` → `{ total, items: AdminProduct[] }`, active products cheapest first |
| POST | `/admin/products` | `{ title, price, profitPercentage?, imageUrl?, description? }` → `201` |
| PATCH | `/admin/products/:productId` | Any of the create fields. Open orders keep the price and profit they were assigned with |
| DELETE | `/admin/products/:productId` | Soft delete (`is_active = false`): gone from the catalog and allocation hub; existing orders are unaffected |

## Business rules

- **Assigned orders are hidden until the trader has an approved deposit.**
  `GET /products` returns no items and `meta.depositRequired: true` until
  then. Admin balance adjustments don't count as deposits.
- Deposits and withdrawals are requests. Only admin approval moves the balance.
- `withdrawalLimit` is the maximum per withdrawal request; `0` means no limit.
- Purchasing an order debits its price and moves it to the Sell tab.
  Selling credits price + profit (`totalReturn`) and moves it to Completed.
  Each is recorded as an approved `order_purchase` / `order_sale` ledger row
  linked by `order_id`, committed together with the status change.
- An order copies the product's price and profit % at assignment time.

## Trader endpoints (`role = user`)

Balances below come from the signed-in user's row.

### Dashboard

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/dashboard` | `{ user, stats, balance, tutorial, capabilities, campaigns, topEarners }` |
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
| GET | `/plans` | `{ meta, items, contracts }` |
| POST | `/plans/:id/activate` | Creates a `PENDING` contract, or `402` if underfunded |

### Ledger

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/transactions` | The trader's own ledger, newest first. Optional `?limit=5` and `?type=deposit\|withdrawal\|adjustment\|order_purchase\|order_sale` (`400` otherwise). Each row carries `type`, `coin`, `network`, `address`, `reviewedAt` |
| GET | `/faq` | `{ id, question, answer }[]` for Help & Platform FAQ |
| GET | `/wallets` | Active company wallets: `{ id, coin, network, address }[]` |
| POST | `/deposits` | **multipart/form-data**: `amount` (min 10), `walletId`, `receipt` (JPG/PNG/WEBP, max 5MB, checked by file signature) → `201` pending |
| POST | `/withdrawals` | `amount`, `address`, `pin` → `201` pending (recorded as USDT TRC20). `400` without a PIN set, with a wrong PIN, above the balance or above the member's withdrawal limit |

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
