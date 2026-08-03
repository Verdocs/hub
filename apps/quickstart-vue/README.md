# Verdocs Vue Quickstart

A minimal Vite + Vue 3 app showing the intended integration pattern for `@verdocs/vue-sdk`: a login route and an auth-guarded dashboard hosting the templates list.

## Run it

```bash
pnpm install
pnpm --filter verdocs-quickstart-vue dev
```

The app runs on port 5174 (the React quickstart keeps 5173). Point it elsewhere with an env var:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-vue dev
```

## What to look at

- [src/main.ts](src/main.ts): app bootstrap and the one-line stylesheet import
- [src/App.vue](src/App.vue): `VerdocsProvider` wrapping the router view
- [src/router.ts](src/router.ts): vue-router 5 routes, with the dashboard nested under a guard component
- [src/routes/RequireSession.vue](src/routes/RequireSession.vue): the session guard built on `useSession()`
- [src/routes/LoginView.vue](src/routes/LoginView.vue): `VerdocsAuth` with navigation on login
- [src/routes/DashboardView.vue](src/routes/DashboardView.vue): `VerdocsTemplatesList` with row-action handlers

