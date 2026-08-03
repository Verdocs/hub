# Verdocs Web Components Quickstart

Minimal Vite + TypeScript app with no UI framework: hash router, login, templates dashboard. Shows how `@verdocs/wc-sdk` fits together with a default `VerdocsEndpoint`.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-quickstart-wc start
```

Opens at http://localhost:5175. Defaults to the beta API. `start` builds `@verdocs/react-sdk` and `@verdocs/wc-sdk` before Vite comes up.

Another environment:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-wc start
```

## Files worth reading

| File | What it does |
| --- | --- |
| [`src/main.ts`](src/main.ts) | Stylesheet import, element registration, default endpoint |
| [`src/router.ts`](src/router.ts) | `#/login` and `#/dashboard`, session guard via `onSessionChanged` |
| [`src/views/login.ts`](src/views/login.ts) | `<vdocs-auth>` |
| [`src/views/dashboard.ts`](src/views/dashboard.ts) | `<vdocs-templates-list>`, typed custom events |

Package docs: [`packages/wc-sdk/README.md`](../../packages/wc-sdk/README.md)
