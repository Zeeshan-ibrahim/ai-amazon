# Roles & Rules

Ui update - https://www.figma.com/design/pahY5OUtJU4Iyzw3g4OHe3/Untitled?node-id=74-2&t=V19UV42YL6BAgYYF-0

------------------------

## Roles

We move from two roles (`admin`, `user`) to three:

| Role          | Replaces   | App          | Scope                                                        |
| ------------- | ---------- | ------------ | ------------------------------------------------------------ |
| `super_admin` | `admin`    | Admin portal | Everything. Also manages sub-admins.                         |
| `sub_admin`   | new        | Admin portal | Only the records they created (their users, plans, etc.).    |
| `user`        | unchanged  | User app     | Simple user view, unchanged.                                 |

- Every existing `admin` becomes `super_admin` (migration renames the enum value).
- Roles stay exclusive: admin roles can't use user routes and users can't open the admin portal.

### Hierarchy

```
super-admin  >  sub-admin  >  user
```

- Each level manages and approves the level below it:
  - the super-admin approves a sub-admin's deposits and withdrawals
  - a sub-admin approves their own users' deposits and withdrawals
- The super-admin can also act on any user directly. Nobody approves the super-admin's actions.
- Only a super-admin can create a sub-admin. Public signup still only creates `user`.

------------------------

## Ownership

Records a sub-admin can create get a `created_by` column pointing to the admin who created them:

- `users` (members)
- `plans`
- `products`

Rules:
- A user created by a sub-admin belongs to that sub-admin (`created_by = sub_admin.id`).
- Users created by a super-admin, or from public signup, have `created_by = NULL` and are only visible to super-admins.
- Everything tied to a user (orders, transactions, deposits/withdrawals, plan requests, audit logs) follows the owner of that user. A sub-admin sees it only if they own the user.
- `created_by` is set by the server from the signed-in admin, never from the request body.
- If a sub-admin is deleted, their users, plans and products are reassigned to the super-admin (`created_by = NULL`). Nothing else is deleted. Deleting is refused while they hold a balance or have a pending request.
- A suspended (disabled) sub-admin can't sign in, but keeps their records, so re-enabling them restores everything. Their users can't be assigned to them while suspended.

### Plans are bi-directional

The link between a sub-admin and their users works both ways:
- A sub-admin only sees their own users.
- A user only sees the plans of the admin who owns them:
  - user owned by a sub-admin → only that sub-admin's plans
  - user owned by the super-admin (`created_by = NULL`) → only the super-admin's plans
- Users never see plans from other sub-admins, and a sub-admin's users don't see the super-admin's plans.
- A user can only request a plan that belongs to their owner. The server checks this, not just the UI.

### Products are shared one way

- The super-admin's products (`created_by = NULL`) are a shared catalog. Every sub-admin can see them and assign them to their users.
- A sub-admin can also add their own products. Only that sub-admin and the super-admin can see them.
- A sub-admin can edit or delete only their own products. Super-admin products are read-only for them.

### Moving records (super-admin only)

- **Reassign a user**: move a user from one sub-admin to another, or between a sub-admin and the super-admin. The user's orders, transactions and plan requests move with them. After the move, the user sees the new owner's plans. Active plan contracts keep running on the plan they were bought on.
- **Change role between `sub_admin` and `user`**:
  - `user` → `sub_admin`: the account loses the user app and gets the admin portal. Its own `created_by` is cleared. **The balance is kept** and becomes the sub-admin's balance (see "Sub-admin balance"). Orders and plan contracts stay in history but are no longer active.
  - `sub_admin` → `user`: the account loses the admin portal. Its users, plans and products are reassigned to the super-admin first (same as deleting a sub-admin). Then the super-admin picks which admin owns the new user.
- Every move and role change is written to the audit log.

------------------------

## SUPER-ADMIN

Full, complete access. Same as today's admin, plus:

- Views every user, plan, product, transaction and financial figure, including the ones sub-admins added.
- Sees an "Added by" column and filter on Members, and "Added by" badges on Plans and Products.
- Manages sub-admins from a dedicated **Sub-admins** page in the admin portal (see below).
- Is the only role that manages global settings: banners, wallets, support settings.

### Sub-admins page (`/admin/sub-admins`, super-admin only)

- **List**: name, username, email, status, number of members, total balance of their members, plans · products, pending requests of their own.
- **Create**: email, username, name, password. Role is fixed to `sub_admin`.
- **Detail view** (`/admin/sub-admins/:id`): their members, plans and products, member balances, own balance and pending requests.
- **Edit account**: opens their normal member page. Particulars edits profile, password, status and role; Ledger shows their own requests with approve/reject.
- **Delete**: reassigns their records to super-admin (see Ownership), then removes the account.
- Every action here is written to the audit log.

------------------------

## SUB-ADMIN

Uses the same admin portal, but every list and total is limited to what they added.

Can:
- Add users, and view / edit / manage **only their own** users (balance adjustments, orders, withdrawal limit, etc.).
- Approve or reject deposits, withdrawals and plan requests **only for their own** users.
- Create and manage **only their own** plans and products.
- View and assign the super-admin's products (read-only).
- See the overview / financials calculated **only from their own** users.
- Request deposits and withdrawals on their own balance, which the super-admin must approve first (My Balance page).

Cannot:
- See users, plans or transactions added by the super-admin or other sub-admins.
- See products added by other sub-admins, or edit the super-admin's products.
- Move users between owners.
- See platform-wide totals or financials.
- Create, view or edit admins (super-admin or sub-admin). A sub-admin can only create `user`.
- Change anyone's role.
- Manage banners, wallets or support settings (menu items are hidden).
- Open the Sub-admins page.

Access to someone else's record by URL/id returns **404** (not 403), so a sub-admin can't tell whether the record exists.

### Sub-admin balance

- A sub-admin has a balance, just like a user.
- A sub-admin can request a **deposit** (with a receipt, same flow as users) or a **withdrawal** from their balance on the **My Balance** page (`/admin/balance`).
- Every request starts as `pending`. The balance changes only after a **super-admin approves** it. If rejected, nothing changes.
- A withdrawal is checked against the balance when requested and again when approved (approval fails if the money is no longer there). Money isn't held while pending — the same as user withdrawals today.
- A sub-admin can't approve their own requests, and can't see other sub-admins' requests.
- The super-admin sees them in Financials, marked "Sub-admin · own balance request", and in the sub-admin's Ledger tab.
- When a user becomes a sub-admin, their balance carries over. When a sub-admin becomes a user, their balance carries over too.

------------------------

## USER

- Simple user view, unchanged.
- A user never sees who added them.
- A user only sees plans from the admin who owns them (see "Plans are bi-directional").

------------------------

## Implementation

Built. Where things live:

- Migration `backend/migrations/013_sub_admins.sql`: roles and `created_by`.
- Scope: `ownerIdOf(req)` in `backend/src/routes/admin.js`, passed to every admin model query.
- Sub-admins page: `backend/src/models/subAdmins.js`, `frontend/src/app/admin/sub-admins/`.
- My Balance: `/admin/balance` routes in `admin.js`, `frontend/src/app/admin/balance/`.
- Menu per role: `only` in `frontend/src/lib/nav.ts`; `AdminShell` blocks the other role's sections.
- Demo accounts: `subadmin@demo.test` owns `nora.ali@` and `sam.reed@` (`npm run db:seed`).

------------------------

## Business rules

- Only purchase a product when the previous one is sold.
