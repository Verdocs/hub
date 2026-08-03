# Verdocs Angular Quickstart

Minimal Angular app (standalone components, zoneless): login route, session guard, templates dashboard.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter @verdocs/angular-sdk build
pnpm --filter verdocs-quickstart-angular start
```

Opens at http://localhost:4200. API base URL is in [`src/environments/environment.ts`](src/environments/environment.ts) (defaults to beta). Use `fileReplacements` in `angular.json` for per-environment builds.

## Files worth reading

| File | What it does |
| --- | --- |
| [`src/main.ts`](src/main.ts) | `provideVerdocs()`, zoneless bootstrap |
| [`src/app/auth.guard.ts`](src/app/auth.guard.ts) | Route guard on `VerdocsSessionService` signals |
| [`src/app/login.component.ts`](src/app/login.component.ts) | `<verdocs-auth>` |
| [`src/app/dashboard.component.ts`](src/app/dashboard.component.ts) | `<verdocs-templates-list>` |

Package docs: [`packages/angular-sdk/README.md`](../../packages/angular-sdk/README.md)
