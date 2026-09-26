# Backend

Express 5 API on PostgreSQL.

```bash
npm install
cp .env.example .env         # set JWT_SECRET
createdb quick_on_amazon
npm run db:migrate           # apply pending migrations/*.sql
npm run db:seed              # dev accounts (refuses to run in production)
npm run dev                  # http://localhost:4000, restarts on change
npm start                    # no watcher
npm run db:create-admin -- --email <email> --password <password> [--username <name>]
```

- `migrations/` — numbered SQL files, applied in order and recorded in
  `schema_migrations`. Never edit a shipped migration; add a new file.
- `src/server.js` — app setup, CORS, cookies, error handling
- `src/routes/index.js` — access layers (public → any role → admin → user)
- `src/routes/{auth,account,admin,user}.js` — endpoints per audience
- `src/middleware/auth.js` — session cookie, `requireAuth`, `requireRole`
- `src/models/users.js` — user queries and `toPublicUser` (the only shape a
  user row leaves the API in)
- `src/data/demo.js` — data that hasn't moved to Postgres yet (resets on restart)

Endpoint reference: [../docs/api.md](../docs/api.md).
