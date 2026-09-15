# Roadmap

What is deliberately unfinished, and what each piece will touch.

## 1. Database

`backend/src/data/demo.js` is the seam. Each export becomes a table:

| Export | Table | Notes |
| --- | --- | --- |
| `user` | `users` | Needs `password_hash`, `withdrawal_pin_hash`, timestamps |
| `products` | `products` + `orders` | Split the catalog item from the per-user assignment (`state`, `tab`, `assignedDate` belong to the order) |
| `plans` | `plans` | Static catalog; admin-editable later |
| `myContracts` | `contracts` | `user_id`, `plan_id`, `status`, accrual dates |
| `transactions` | `transactions` | `user_id`, `type`, `amount`, `status` |
| `liveDeposits` | derived | A view over recent verified deposits |
| `depositAssets`, `languages` | config tables | |

Route handlers already isolate every read and write, so swapping in a query
layer should not change `routes/index.js` structure or any response shape — and
therefore should not touch the frontend.

## 2. Authentication

Currently `/auth/login` accepts any non-empty credentials and returns a fixed
demo token, and no route checks it. Needed:

- Hash passwords (bcrypt/argon2) and verify on login.
- Issue a real session — httpOnly cookie preferred over storing a token in
  `localStorage`.
- Auth middleware on every `/api` route except the `/auth/*` group.
- Frontend: send credentials with requests (`credentials: 'include'` in
  `lib/api.ts`) and redirect to `/login` on a `401`.

## 3. Balance movement

Deposits and withdrawals record a `PENDING` transaction but never change the
balance — that is intentional, since both need admin auditing. Still to build:

- An admin approval flow that settles a transaction and adjusts the balance.
- Receipt upload: the deposit modal collects the file but only sends its name.
  Needs multipart handling and object storage.
- Contract yield accrual on a schedule.

## 4. Smaller gaps

- `/terms`, `/privacy`, `/contact` are linked from the auth footer but not built.
- `/forgot-password` has an endpoint and a link, but no page.
- Language selection persists to the API but nothing is translated yet — no i18n
  layer is wired up.
- Profile picture upload is UI-only.
- The products page shows one active order at a time; pagination through the
  queue is not built.
- No tests yet.
