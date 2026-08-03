# Verdocs React Quickstart

Minimal Vite + React 19 app: login route, session guard, templates dashboard. Shows how we expect `@verdocs/react-sdk` to be wired.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-quickstart-react start
```

Opens at http://localhost:5173. Defaults to the beta API (`https://stage-api.verdocs.com`).

Production or another environment:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-react start
```

## Files worth reading

| File | What it does |
| --- | --- |
| [`src/main.tsx`](src/main.tsx) | `VerdocsProvider`, stylesheet import |
| [`src/App.tsx`](src/App.tsx) | React Router routes, session guard via `useSession()` |
| [`src/routes/LoginView.tsx`](src/routes/LoginView.tsx) | `VerdocsAuth`, redirect after login |
| [`src/routes/DashboardView.tsx`](src/routes/DashboardView.tsx) | `VerdocsTemplatesList`, row-action callbacks |

Package docs: [`packages/react-sdk/README.md`](../../packages/react-sdk/README.md)
