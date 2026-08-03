# Verdocs Vue Quickstart

Minimal Vite + Vue 3 app: login route, session guard, templates dashboard.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-quickstart-vue start
```

Opens at http://localhost:5174 (React quickstart uses 5173). Defaults to the beta API.

Another environment:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-vue start
```

## Files worth reading

| File | What it does |
| --- | --- |
| [`src/main.ts`](src/main.ts) | App bootstrap, stylesheet import |
| [`src/App.vue`](src/App.vue) | `VerdocsProvider` around the router view |
| [`src/router.ts`](src/router.ts) | Routes; dashboard behind a guard |
| [`src/routes/RequireSession.vue`](src/routes/RequireSession.vue) | Session guard via `useSession()` |
| [`src/routes/LoginView.vue`](src/routes/LoginView.vue) | `VerdocsAuth` |
| [`src/routes/DashboardView.vue`](src/routes/DashboardView.vue) | `VerdocsTemplatesList` |

Package docs: [`packages/vue-sdk/README.md`](../../packages/vue-sdk/README.md)
