# API reference

Base URL: `http://localhost:4000/api`

All successful responses are `{ "success": true, "data": ... }`. The tables
below describe the `data` payload. Errors are
`{ "success": false, "message": "..." }`.

## Auth

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/login` | `email`, `password` | `{ token, user }` |
| POST | `/auth/signup` | `email`, `password`, `firstName?` | `{ token, user }` |
| POST | `/auth/forgot-password` | `email` | `{ message }` |

Credentials are not verified yet — any non-empty pair succeeds.

## User

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/me` | — | `User` |
| PATCH | `/me` | partial `User` | updated `User` |
| PUT | `/me/password` | `currentPassword`, `newPassword`, `confirmPassword` | `{ message }` |
| PUT | `/me/language` | `language` | `{ language }` |

## Dashboard

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/dashboard` | `{ user, stats, balance, tutorial, capabilities, campaigns, topEarners }` |
| GET | `/deposits/live` | `LiveDeposit[]` — powers the ticker |

## Products

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/products` | Optional `?tab=purchase\|sell\|completed` and `?state=assigned\|awaiting\|completed`. Returns `{ meta, items, counts }` |
| POST | `/products/:id/purchase` | `402` when the balance is short, with `data: { required, current, missing }` |

## Plans

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/plans` | `{ meta, items, contracts }` |
| POST | `/plans/:id/activate` | Creates a `PENDING` contract, or `402` if underfunded |

## Ledger

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/transactions` | Optional `?limit=5` |
| GET | `/deposit-assets` | Supported crypto assets and custody addresses |
| POST | `/deposits` | `amount` (min 10), `assetId`, `receiptName?` |
| POST | `/withdrawals` | `amount`, `address`, `pin` |

Deposits and withdrawals append a `PENDING` transaction; they do not move the
balance, since that needs admin auditing.

## Misc

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/languages` | `Language[]` |
| GET | `/health` | `{ status: "ok" }` (not under `/api`) |

## Example

```bash
curl -s localhost:4000/api/plans | jq '.data.items[0]'
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
