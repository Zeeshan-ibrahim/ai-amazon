# Backend

Express API serving demo data. No database yet — see
[../docs/roadmap.md](../docs/roadmap.md).

```bash
npm install
npm run dev     # http://localhost:4000, restarts on change
npm start       # no watcher
```

- `src/server.js` — app setup and error handling
- `src/routes/index.js` — all endpoints
- `src/data/demo.js` — the dataset (resets on restart)

Endpoint reference: [../docs/api.md](../docs/api.md).
