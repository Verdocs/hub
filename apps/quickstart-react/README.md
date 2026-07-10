# Verdocs React Quickstart

A minimal Vite + React 19 app showing the intended integration pattern for `@verdocs/react-sdk`: a login route and an auth-guarded dashboard hosting the templates list.

## Run it

```bash
pnpm install
pnpm --filter verdocs-quickstart-react dev
```

The app talks to the beta environment (`https://stage-api.verdocs.com`) by default. Point it elsewhere with an env var:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-react dev
```

## What to look at

- [src/main.tsx](src/main.tsx): provider setup and the one-line stylesheet import
- [src/App.tsx](src/App.tsx): React Router 7 routes with a session guard built on `useSession()`
- [src/routes/LoginView.tsx](src/routes/LoginView.tsx): `VerdocsAuth` with navigation on login
- [src/routes/DashboardView.tsx](src/routes/DashboardView.tsx): `VerdocsTemplatesList` with row-action callbacks
